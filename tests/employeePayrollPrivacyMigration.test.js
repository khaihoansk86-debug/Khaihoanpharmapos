const fs = require('fs');
const path = require('path');

describe('employee payroll privacy migration', () => {
    const migration = fs.readFileSync(path.join(
        process.cwd(),
        'supabase/migrations/079_restrict_employee_payroll_visibility.sql'
    ), 'utf8');

    test('limits salary-bearing employee rows to admin or the current employee', () => {
        expect(migration).toMatch(/CREATE OR REPLACE FUNCTION public\.current_employee_is_admin\(\)/i);
        expect(migration).toMatch(/ON public\.employees\s+FOR SELECT TO authenticated[\s\S]*current_employee_is_admin\(\)[\s\S]*id = public\.current_employee_id\(\)/i);
        expect(migration).toMatch(/ON public\.employees\s+FOR UPDATE TO authenticated[\s\S]*current_employee_is_admin\(\)/i);
        expect(migration).not.toMatch(/ON public\.employees FOR ALL TO authenticated\s+USING \(true\)/i);
    });

    test('keeps a safe directory RPC without compensation columns', () => {
        const rpcBlock = migration.match(/CREATE OR REPLACE FUNCTION public\.get_employee_directory\(\)[\s\S]*?\$\$;/i)?.[0] || '';
        expect(rpcBlock).toMatch(/RETURNS TABLE\s*\(\s*id UUID,\s*name TEXT,\s*status TEXT\s*\)/i);
        expect(rpcBlock).not.toMatch(/monthly_salary|monthly_allowance|commission_rate/i);
        expect(migration).toMatch(/REVOKE ALL ON FUNCTION public\.get_employee_directory\(\) FROM PUBLIC, anon/i);
        expect(migration).toMatch(/GRANT EXECUTE ON FUNCTION public\.get_employee_directory\(\) TO authenticated/i);
    });

    test('restricts period settings to admin or the matching employee', () => {
        expect(migration).toMatch(/ON public\.employee_payroll_period_settings[\s\S]*FOR SELECT TO authenticated[\s\S]*employee_id = public\.current_employee_id\(\)/i);
        expect(migration).toMatch(/FOR (INSERT|UPDATE|DELETE) TO authenticated[\s\S]*current_employee_is_admin\(\)/i);
        expect(migration).toMatch(/REVOKE ALL ON public\.employees FROM anon/i);
        expect(migration).toMatch(/REVOKE ALL ON public\.employee_shifts FROM anon/i);
    });
});
