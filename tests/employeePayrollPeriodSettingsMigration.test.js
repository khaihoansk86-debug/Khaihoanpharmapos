const fs = require('fs');
const path = require('path');

describe('employee payroll period settings migration', () => {
    const sql = fs.readFileSync(
        path.join(process.cwd(), 'supabase/migrations/078_create_employee_payroll_period_settings.sql'),
        'utf8'
    );

    test('stores one protected compensation snapshot per employee and month', () => {
        expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.employee_payroll_period_settings/i);
        expect(sql).toMatch(/UNIQUE\s*\(employee_id, payroll_month\)/i);
        expect(sql).toMatch(/CHECK\s*\(payroll_month = date_trunc\('month', payroll_month\)::date\)/i);
        expect(sql).toMatch(/ENABLE ROW LEVEL SECURITY/i);
        expect(sql).toMatch(/current_employee_has_permission\('access_payroll'\)/i);
        expect(sql).toMatch(/current_employee_has_permission\('access_employees'\)/i);
        expect(sql).toMatch(/REVOKE ALL ON public\.employee_payroll_period_settings FROM anon/i);
        expect(sql).not.toMatch(/TO anon/i);
    });
});
