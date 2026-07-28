const fs = require('fs');
const path = require('path');

describe('employee Auth deletion API security', () => {
    const source = fs.readFileSync(
        path.join(process.cwd(), 'api', 'employee-auth-delete.js'),
        'utf8'
    );

    test('accepts only DELETE and requires the shared manager authorization service', () => {
        expect(source).toContain("req.method !== 'DELETE'");
        expect(source).toContain('authorizeEmployeeManager(adminClient, req)');
        expect(source).toContain('normalizeEmployeeId(req.body?.employeeId)');
    });

    test('prevents deleting the current account or the last active admin', () => {
        expect(source).toContain('authorization.caller.id === employeeId');
        expect(source).toContain("target.role === 'admin'");
        expect(source).toContain('Number(count || 0) <= 1');
        expect(source).toContain("return sendNoStore(res, 409");
    });

    test('deletes Auth before the profile so a failed cleanup cannot leave an orphan login', () => {
        const profileDelete = source.indexOf(".from('employees')");
        const selectedDelete = source.indexOf('.delete()', profileDelete);
        const authDelete = source.indexOf('admin.deleteUser');
        expect(selectedDelete).toBeGreaterThan(-1);
        expect(authDelete).toBeGreaterThan(-1);
        expect(authDelete).toBeLessThan(selectedDelete);
        expect(source).not.toContain('authCleanupPending');
        expect(source).toContain("return sendNoStore(res, 502");
    });

    test('does not log a bearer token or employee identity data', () => {
        expect(source).not.toMatch(/console\.(log|error)\([^)]*(accessToken|authorization|employeeId)/i);
    });
});
