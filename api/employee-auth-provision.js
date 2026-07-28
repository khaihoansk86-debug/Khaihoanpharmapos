import {
    buildTechnicalAuthEmail,
    normalizeProvisioningInput
} from './employee-auth-provisioning-rules.js';
import {
    authorizeEmployeeManager,
    createEmployeeAuthAdminClient,
    sendNoStore
} from './employee-auth-api-service.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return sendNoStore(res, 405, { error: 'Method Not Allowed' });
    }

    const adminClient = createEmployeeAuthAdminClient();
    if (!adminClient) {
        return sendNoStore(res, 503, { error: 'Account provisioning is not configured' });
    }

    let input;
    try {
        input = normalizeProvisioningInput(
            req.body && typeof req.body === 'object' && !Array.isArray(req.body)
                ? req.body
                : {}
        );
    } catch {
        return sendNoStore(res, 400, { error: 'Invalid account details' });
    }

    try {
        const authorization = await authorizeEmployeeManager(adminClient, req);
        if (!authorization.authorized) {
            return sendNoStore(res, authorization.status, {
                error: authorization.status === 401 ? 'Unauthorized' : 'Forbidden'
            });
        }

        const { data: target, error: targetError } = await adminClient
            .from('employees')
            .select('id, auth_user_id')
            .eq('id', input.employeeId)
            .maybeSingle();
        if (targetError) throw targetError;
        if (!target) return sendNoStore(res, 404, { error: 'Employee not found' });

        const { data: usernameOwner, error: conflictError } = await adminClient
            .from('employees')
            .select('id')
            .ilike('username', input.username)
            .neq('id', input.employeeId)
            .maybeSingle();
        if (conflictError) throw conflictError;
        if (usernameOwner) {
            return sendNoStore(res, 409, { error: 'Username is already in use' });
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

        return sendNoStore(res, 200, { provisioned: true });
    } catch (error) {
        console.error('Employee Auth provisioning failed:', {
            message: error?.message,
            code: error?.code
        });
        return sendNoStore(res, 500, { error: 'Unable to provision employee account' });
    }
}
