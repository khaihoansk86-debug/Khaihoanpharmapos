import { createClient } from '@supabase/supabase-js';
import { canManageEmployeeCredentials } from './employee-auth-provisioning-rules.js';

export function sendNoStore(res, status, body) {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    return res.status(status).json(body);
}

export function createEmployeeAuthAdminClient() {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) return null;
    return createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
}

function readBearerToken(req) {
    const authorization = String(req.headers?.authorization || '');
    return authorization.startsWith('Bearer ')
        ? authorization.slice('Bearer '.length).trim()
        : '';
}

export async function authorizeEmployeeManager(adminClient, req) {
    const accessToken = readBearerToken(req);
    if (!accessToken) return { authorized: false, status: 401 };

    const { data: authData, error: authError } = await adminClient.auth.getUser(accessToken);
    if (authError || !authData?.user?.id) {
        return { authorized: false, status: 401 };
    }

    const { data: caller, error: callerError } = await adminClient
        .from('employees')
        .select('id, role, permissions, status')
        .eq('auth_user_id', authData.user.id)
        .maybeSingle();
    if (callerError || !canManageEmployeeCredentials(caller)) {
        return { authorized: false, status: 403 };
    }

    return { authorized: true, caller };
}
