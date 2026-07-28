const fs = require('fs');
const path = require('path');

describe('legacy employee authentication retirement migration', () => {
    const sql = fs.readFileSync(
        path.join(
            process.cwd(),
            'supabase',
            'migrations',
            '071_retire_legacy_employee_auth.sql'
        ),
        'utf8'
    );

    test('removes the legacy credential RPC from all client roles', () => {
        expect(sql).toMatch(
            /REVOKE EXECUTE ON FUNCTION public\.authenticate_employee_legacy\(TEXT,\s*TEXT\)\s+FROM PUBLIC,\s*anon,\s*authenticated/i
        );
    });

    test('keeps emergency server-only access without reopening a client role', () => {
        expect(sql).toMatch(
            /GRANT EXECUTE ON FUNCTION public\.authenticate_employee_legacy\(TEXT,\s*TEXT\)\s+TO service_role/i
        );
        expect(sql).not.toMatch(
            /GRANT EXECUTE[\s\S]*authenticate_employee_legacy[\s\S]*TO (anon|authenticated)/i
        );
    });
});
