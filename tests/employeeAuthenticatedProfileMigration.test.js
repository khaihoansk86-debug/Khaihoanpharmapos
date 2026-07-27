const fs = require('fs');
const path = require('path');

describe('employee authenticated profile migration', () => {
    const migrationPath = path.join(
        process.cwd(),
        'supabase',
        'migrations',
        '066_add_authenticated_employee_profile.sql'
    );

    test('loads the active employee profile from auth.uid()', () => {
        const sql = fs.readFileSync(migrationPath, 'utf8');
        expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.get_current_employee_profile\(\)/i);
        expect(sql).toMatch(/employee\.auth_user_id\s*=\s*auth\.uid\(\)/i);
        expect(sql).toMatch(/employee\.status\s*=\s*'active'/i);
    });

    test('allows only authenticated callers', () => {
        const sql = fs.readFileSync(migrationPath, 'utf8');
        expect(sql).toMatch(
            /REVOKE ALL ON FUNCTION public\.get_current_employee_profile\(\) FROM anon/i
        );
        expect(sql).toMatch(
            /GRANT EXECUTE ON FUNCTION public\.get_current_employee_profile\(\) TO authenticated/i
        );
    });
});
