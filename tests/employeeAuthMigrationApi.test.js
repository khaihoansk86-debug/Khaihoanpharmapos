const fs = require('fs');
const path = require('path');

describe('employee auth migration API', () => {
    const apiSource = fs.readFileSync(
        path.join(process.cwd(), 'api', 'auth-migrate.js'),
        'utf8'
    );
    const migration = fs.readFileSync(
        path.join(process.cwd(), 'supabase', 'migrations', '063_add_employee_auth_email.sql'),
        'utf8'
    );

    test('requires a service-role environment variable and never falls back to anon', () => {
        expect(apiSource).toContain('process.env.SUPABASE_SERVICE_ROLE_KEY');
        expect(apiSource).not.toMatch(/serviceRoleKey\s*=\s*[^;]*ANON/i);
        expect(apiSource).toContain("return res.status(503)");
        expect(apiSource).toContain("'Cache-Control', 'no-store, max-age=0'");
    });

    test('validates the legacy credential before creating an auth user', () => {
        expect(apiSource).toContain(".select('id, username, password_hash, status, auth_user_id')");
        expect(apiSource).toContain('employee.password_hash !== submittedHash');
        expect(apiSource).toContain('admin.createUser');
        expect(apiSource).toContain('admin.updateUserById');
        expect(apiSource).toContain('email_confirm: true');
    });

    test('stores only the technical auth identity on the employee profile', () => {
        expect(migration).toMatch(/ADD COLUMN IF NOT EXISTS auth_email TEXT/i);
        expect(migration).toMatch(/CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_auth_email/i);
        expect(apiSource).toContain('auth_user_id: authUser.id');
        expect(apiSource).toContain('auth_migrated_at: new Date().toISOString()');
        expect(apiSource).not.toContain('password: password');
    });
});
