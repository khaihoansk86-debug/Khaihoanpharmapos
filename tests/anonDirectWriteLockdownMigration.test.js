const fs = require('fs');
const path = require('path');

describe('anonymous direct-write lockdown migration', () => {
    const migrationPath = path.join(
        process.cwd(),
        'supabase',
        'migrations',
        '067_revoke_anon_direct_table_writes.sql'
    );

    test('revokes every direct table mutation privilege from anon', () => {
        const sql = fs.readFileSync(migrationPath, 'utf8');
        expect(sql).toMatch(
            /REVOKE\s+INSERT,\s*UPDATE,\s*DELETE,\s*TRUNCATE,\s*REFERENCES,\s*TRIGGER\s+ON ALL TABLES IN SCHEMA public\s+FROM anon/i
        );
        expect(sql).toMatch(
            /ALTER DEFAULT PRIVILEGES[\s\S]*REVOKE\s+INSERT,\s*UPDATE,\s*DELETE,\s*TRUNCATE,\s*REFERENCES,\s*TRIGGER[\s\S]*FROM anon/i
        );
    });

    test('keeps public reads and the staged authentication RPC available', () => {
        const sql = fs.readFileSync(migrationPath, 'utf8');
        expect(sql).not.toMatch(/REVOKE\s+SELECT[\s\S]*FROM anon/i);
        expect(sql).not.toMatch(/REVOKE[\s\S]*authenticate_employee_legacy[\s\S]*FROM anon/i);
        expect(sql).not.toMatch(/REVOKE\s+EXECUTE\s+ON ALL FUNCTIONS/i);
    });
});
