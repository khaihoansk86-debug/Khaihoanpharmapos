const fs = require('fs');
const path = require('path');

function read(relativePath) {
    return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('employee payroll integration', () => {
    test('employee UI stores monthly salary and delegates payroll math to rules', () => {
        const controller = read('js/features/employees/employeesController.js');
        const page = read('pages/employees.html');

        expect(controller).toContain('calculateEmployeePayroll({');
        expect(controller).toContain("monthly_salary: $('monthlySalary').value");
        expect(controller).toContain("monthly_allowance: $('monthlyAllowance').value");
        expect(controller).toContain('renderEmployeeCompensationPreview');
        expect(controller).not.toContain('const deduction = off *');
        expect(page).toContain('id="monthlySalary"');
        expect(page).toContain('id="monthlyAllowance"');
        expect(page).toContain('id="employeeDailyRatePreview"');
        expect(page).toContain('Lương tháng / 27');
        expect(page).not.toContain('id="dailyRate"');
    });

    test('migration preserves old daily salary values as monthly contracts', () => {
        const migration = read(
            'supabase/migrations/074_add_employee_monthly_salary.sql'
        );

        expect(migration).toMatch(
            /ADD COLUMN IF NOT EXISTS monthly_salary NUMERIC NOT NULL DEFAULT 0/i
        );
        expect(migration).toMatch(
            /SET monthly_salary = GREATEST\(COALESCE\(daily_rate, 0\), 0\) \* 27/i
        );
        expect(migration).toMatch(/CHECK \(monthly_salary >= 0\)/i);
    });

    test('allowance migration is additive and keeps deployed migrations unchanged', () => {
        const migration = read(
            'supabase/migrations/075_add_employee_monthly_allowance.sql'
        );

        expect(migration).toMatch(
            /ADD COLUMN IF NOT EXISTS monthly_allowance NUMERIC NOT NULL DEFAULT 0/i
        );
        expect(migration).toMatch(/CHECK \(monthly_allowance >= 0\)/i);
    });

    test('payroll UI distinguishes conventional rest days from leave', () => {
        const controller = read('js/features/employees/employeesController.js');
        const page = read('pages/employees.html');

        expect(controller).toContain('payroll.restDays');
        expect(controller).toContain('nghỉ quy ước');
        expect(page).toContain('Ngày nghỉ/phép');
        expect(page).toContain('27 ngày công chuẩn');
    });
});
