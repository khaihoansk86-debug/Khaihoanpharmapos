import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const AUTH_EMAIL_DOMAIN = 'pos.khaihoanpharma.local';

function normalizeUsername(value) {
    return String(value || '').trim();
}

function buildAuthEmail(username) {
    const identifier = createHash('sha256')
        .update(normalizeUsername(username).toLocaleLowerCase('vi-VN'), 'utf8')
        .digest('hex');
    return `${identifier}@${AUTH_EMAIL_DOMAIN}`;
}

function legacyPasswordHash(password) {
    return createHash('sha256').update(String(password || ''), 'utf8').digest('hex');
}

async function findAuthUserByEmail(adminClient, email) {
    for (let page = 1; page <= 10; page += 1) {
        const { data, error } = await adminClient.auth.admin.listUsers({
            page,
            perPage: 100
        });
        if (error) throw error;
        const user = data?.users?.find(candidate =>
            String(candidate.email || '').toLowerCase() === email.toLowerCase()
        );
        if (user) return user;
        if (!data?.users || data.users.length < 100) break;
    }
    return null;
}

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('Pragma', 'no-cache');

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
        return res.status(503).json({ error: 'Auth migration is not configured' });
    }

    const requestBody = req.body && typeof req.body === 'object' && !Array.isArray(req.body)
        ? req.body
        : {};
    const username = normalizeUsername(requestBody.username);
    const password = typeof requestBody.password === 'string'
        ? requestBody.password
        : '';
    if (!username || username.length > 100 || password.length < 6 || password.length > 128) {
        return res.status(400).json({ error: 'Invalid credentials' });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    try {
        const { data: employee, error: employeeError } = await adminClient
            .from('employees')
            .select('id, username, password_hash, status, auth_user_id')
            .ilike('username', username)
            .maybeSingle();
        const submittedHash = legacyPasswordHash(password);
        if (
            employeeError
            || !employee
            || employee.status !== 'active'
            || employee.password_hash !== submittedHash
        ) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const email = buildAuthEmail(employee.username);
        let authUser = null;
        if (employee.auth_user_id) {
            const { data, error } = await adminClient.auth.admin.getUserById(
                employee.auth_user_id
            );
            if (error) throw error;
            authUser = data?.user || null;
        } else {
            const createResult = await adminClient.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { employee_id: employee.id }
            });
            if (createResult.error) {
                authUser = await findAuthUserByEmail(adminClient, email);
                if (!authUser) throw createResult.error;
            } else {
                authUser = createResult.data?.user || null;
            }
        }

        if (!authUser?.id) throw new Error('Auth user was not created.');
        const { error: syncAuthError } = await adminClient.auth.admin.updateUserById(
            authUser.id,
            {
                email,
                password,
                email_confirm: true,
                user_metadata: { employee_id: employee.id }
            }
        );
        if (syncAuthError) throw syncAuthError;

        const { error: linkError } = await adminClient
            .from('employees')
            .update({
                auth_user_id: authUser.id,
                auth_email: email,
                auth_migrated_at: new Date().toISOString()
            })
            .eq('id', employee.id);
        if (linkError) throw linkError;

        return res.status(200).json({ migrated: true });
    } catch (error) {
        console.error('Employee auth migration failed:', {
            message: error?.message,
            code: error?.code
        });
        return res.status(500).json({ error: 'Unable to migrate authentication' });
    }
}
