import { createClient } from '@supabase/supabase-js';
import {
    buildTechnicalAuthEmail,
    canManageEmployeeCredentials,
    normalizeProvisioningInput
} from './employee-auth-provisioning-rules.js';

function send(res, status, body) {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    return res.status(status).json(body);
}

function readBearerToken(req) {
    const authorization = String(req.headers?.authorization || '');
    return authorization.startsWith('Bearer ')
        ? authorization.slice('Bearer '.length).trim()
        : '';
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return send(res, 405, { error: 'Method Not Allowed' });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
        return send(res, 503, { error: 'Account provisioning is not configured' });
    }

    const accessToken = readBearerToken(req);
    if (!accessToken) return send(res, 401, { error: 'Unauthorized' });

    let input;
    try {
        input = normalizeProvisioningInput(
            req.body && typeof req.body === 'object' && !Array.isArray(req.body)
                ? req.body
                : {}
        );
    } catch {
        return send(res, 400, { error: 'Invalid account details' });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    try {
        const { data: authData, error: authError } = await adminClient.auth.getUser(accessToken);
        if (authError || !authData?.user?.id) {
            return send(res, 401, { error: 'Unauthorized' });
        }

        const { data: caller, error: callerError } = await adminClient
            .from('employees')
            .select('id, role, permissions, status')
            .eq('auth_user_id', authData.user.id)
            .maybeSingle();
        if (callerError || !canManageEmployeeCredentials(caller)) {
            return send(res, 403, { error: 'Forbidden' });
        }

        const { data: target, error: targetError } = await adminClient
            .from('employees')
            .select('id, auth_user_id')
            .eq('id', input.employeeId)
            .maybeSingle();
        if (targetError) throw targetError;
        if (!target) return send(res, 404, { error: 'Employee not found' });

        const { data: usernameOwner, error: conflictError } = await adminClient
            .from('employees')
            .select('id')
            .ilike('username', input.username)
            .neq('id', input.employeeId)
            .maybeSingle();
        if (conflictError) throw conflictError;
        if (usernameOwner) {
            return send(res, 409, { error: 'Username is already in use' });
        }

        const email = buildTechnicalAuthEmail(input.username);
        let authUserId = target.auth_user_id;
        let createdAuthUser = false;

        if (authUserId) {
            const { error: updateAuthError } = await adminClient.auth.admin.updateUserById(
                authUserId,
                {
                    email,
                    password: input.password,
                    email_confirm: true,
                    user_metadata: { employee_id: input.employeeId }
                }
            );
            if (updateAuthError) throw updateAuthError;
        } else {
            const { data: createData, error: createAuthError } =
                await adminClient.auth.admin.createUser({
                    email,
                    password: input.password,
                    email_confirm: true,
                    user_metadata: { employee_id: input.employeeId }
                });
            if (createAuthError) throw createAuthError;
            authUserId = createData?.user?.id;
            createdAuthUser = true;
        }

        if (!authUserId) throw new Error('Auth user was not provisioned.');

        const { error: linkError } = await adminClient
            .from('employees')
            .update({
                username: input.username,
                auth_user_id: authUserId,
                auth_email: email,
                auth_migrated_at: new Date().toISOString()
            })
            .eq('id', input.employeeId);
        if (linkError) {
            if (createdAuthUser) {
                await adminClient.auth.admin.deleteUser(authUserId);
            }
            throw linkError;
        }

        return send(res, 200, { provisioned: true });
    } catch (error) {
        console.error('Employee Auth provisioning failed:', {
            message: error?.message,
            code: error?.code
        });
        return send(res, 500, { error: 'Unable to provision employee account' });
    }
}
