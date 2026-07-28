const fs = require('fs');
const path = require('path');

describe('employee Auth provisioning API security', () => {
    const source = fs.readFileSync(
        path.join(process.cwd(), 'api', 'employee-auth-provision.js'),
        'utf8'
    );
    const authServiceSource = fs.readFileSync(
        path.join(process.cwd(), 'api', 'employee-auth-api-service.js'),
        'utf8'
    );

    test('requires service-role configuration and a verified bearer user', () => {
        expect(authServiceSource).toContain('process.env.SUPABASE_SERVICE_ROLE_KEY');
        expect(authServiceSource).not.toMatch(/serviceRoleKey\s*=\s*[^;]*ANON/i);
        expect(authServiceSource).toContain('adminClient.auth.getUser(accessToken)');
        expect(source).toContain('authorizeEmployeeManager(adminClient, req)');
    });

    test('checks employee-management permission before admin Auth operations', () => {
        const permissionCheck = source.indexOf('authorizeEmployeeManager(adminClient, req)');
        const createUser = source.indexOf('admin.createUser');
        const updateUser = source.indexOf('admin.updateUserById');
        expect(permissionCheck).toBeGreaterThan(-1);
        expect(createUser).toBeGreaterThan(permissionCheck);
        expect(updateUser).toBeGreaterThan(permissionCheck);
    });

    test('does not log or return submitted credentials', () => {
        expect(source).not.toMatch(/console\.(log|error)\([^)]*(password|accessToken)/i);
        expect(source).toContain("return sendNoStore(res, 200, { provisioned: true })");
    });
});
