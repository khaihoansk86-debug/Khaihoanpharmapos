const fs = require('fs');
const path = require('path');

describe('employee auth helper permissions migration', () => {
    const sql = fs.readFileSync(
        path.join(
            process.cwd(),
            'supabase',
            'migrations',
            '064_lock_employee_auth_helpers.sql'
        ),
        'utf8'
    );

    test('explicitly removes anonymous access from authenticated identity helpers', () => {
        expect(sql).toMatch(
            /REVOKE ALL ON FUNCTION public\.current_employee_id\(\) FROM anon/i
        );
        expect(sql).toMatch(
            /REVOKE ALL ON FUNCTION public\.current_employee_has_permission\(TEXT\) FROM anon/i
        );
    });

    test('preserves authenticated access to both helpers', () => {
        expect(sql).toMatch(
            /GRANT EXECUTE ON FUNCTION public\.current_employee_id\(\) TO authenticated/i
        );
        expect(sql).toMatch(
            /GRANT EXECUTE ON FUNCTION public\.current_employee_has_permission\(TEXT\)[\s\S]*TO authenticated/i
        );
        expect(sql).not.toMatch(/authenticate_employee_legacy[\s\S]*FROM anon/i);
    });
});
