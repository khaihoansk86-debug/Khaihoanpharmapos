const fs = require('fs');
const path = require('path');

describe('employee auth bridge migration', () => {
    const migration = fs.readFileSync(
        path.join(process.cwd(), 'supabase', 'migrations', '062_add_employee_auth_bridge.sql'),
        'utf8'
    );

    test('adds an optional one-to-one Supabase Auth link', () => {
        expect(migration).toMatch(/ADD COLUMN IF NOT EXISTS auth_user_id UUID/i);
        expect(migration).toMatch(/REFERENCES auth\.users\(id\) ON DELETE SET NULL/i);
        expect(migration).toMatch(/CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_auth_user_id/i);
    });

    test('moves legacy password verification behind a security-definer RPC', () => {
        expect(migration).toMatch(/FUNCTION public\.authenticate_employee_legacy/i);
        expect(migration).toMatch(/SECURITY DEFINER/i);
        expect(migration).toMatch(/p_password_hash ~ '\^\[0-9a-fA-F\]\{64\}\$'/i);
        expect(migration).toMatch(/GRANT EXECUTE[\s\S]*TO anon, authenticated/i);
        expect(migration).not.toMatch(/REVOKE SELECT ON public\.employees FROM anon/i);
    });

    test('prepares authenticated permission checks based on auth.uid()', () => {
        expect(migration).toMatch(/FUNCTION public\.current_employee_id\(\)/i);
        expect(migration).toMatch(/employee\.auth_user_id = auth\.uid\(\)/i);
        expect(migration).toMatch(/FUNCTION public\.current_employee_has_permission/i);
        expect(migration).toMatch(/\? required_permission/i);
    });
});
