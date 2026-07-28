import {
    authorizeEmployeeManager,
    createEmployeeAuthAdminClient,
    sendNoStore
} from './employee-auth-api-service.js';
import { normalizeEmployeeId } from './employee-auth-provisioning-rules.js';

export default async function handler(req, res) {
    if (req.method !== 'DELETE') {
        res.setHeader('Allow', 'DELETE');
        return sendNoStore(res, 405, { error: 'Method Not Allowed' });
    }

    const adminClient = createEmployeeAuthAdminClient();
    if (!adminClient) {
        return sendNoStore(res, 503, { error: 'Account deletion is not configured' });
    }

    let employeeId;
    try {
        employeeId = normalizeEmployeeId(req.body?.employeeId);
    } catch {
        return sendNoStore(res, 400, { error: 'Invalid employee id' });
    }

    try {
        const authorization = await authorizeEmployeeManager(adminClient, req);
        if (!authorization.authorized) {
            return sendNoStore(res, authorization.status, {
                error: authorization.status === 401 ? 'Unauthorized' : 'Forbidden'
            });
        }
        if (authorization.caller.id === employeeId) {
            return sendNoStore(res, 409, { error: 'Cannot delete current account' });
        }

        const { data: target, error: targetError } = await adminClient
            .from('employees')
            .select('id, auth_user_id, role, status')
            .eq('id', employeeId)
            .maybeSingle();
        if (targetError) throw targetError;
        if (!target) return sendNoStore(res, 404, { error: 'Employee not found' });

        if (target.role === 'admin' && target.status === 'active') {
            const { count, error: countError } = await adminClient
                .from('employees')
                .select('id', { count: 'exact', head: true })
                .eq('role', 'admin')
                .eq('status', 'active');
            if (countError) throw countError;
            if (Number(count || 0) <= 1) {
                return sendNoStore(res, 409, { error: 'Cannot delete last active admin' });
            }
        }

        if (target.auth_user_id) {
            const { error: authDeleteError } =
                await adminClient.auth.admin.deleteUser(target.auth_user_id);
            if (authDeleteError) {
                console.error('Employee Auth deletion failed:', {
                    code: authDeleteError.code
                });
                return sendNoStore(res, 502, { error: 'Unable to delete employee account' });
            }
        }

        const { data: deleted, error: deleteError } = await adminClient
            .from('employees')
            .delete()
            .eq('id', employeeId)
            .select('id')
            .maybeSingle();
        if (deleteError) throw deleteError;
        if (!deleted) return sendNoStore(res, 404, { error: 'Employee not found' });

        return sendNoStore(res, 200, { deleted: true });
    } catch (error) {
        console.error('Employee account deletion failed:', {
            message: error?.message,
            code: error?.code
        });
        return sendNoStore(res, 500, { error: 'Unable to delete employee account' });
    }
}
