const fs = require('fs');
const path = require('path');

describe('employee profile write migration', () => {
    const sql = fs.readFileSync(path.join(
        process.cwd(), 'supabase/migrations/081_bound_employee_profile_writes.sql'
    ), 'utf8');

    test('permits the service timestamp and bounds compensation inputs', () => {
        expect(sql).toMatch(/GRANT INSERT \(updated_at\) ON public\.employees TO authenticated/i);
        expect(sql).toMatch(/employees_commission_rate_bounds[\s\S]*commission_rate >= 0[\s\S]*commission_rate <= 100/i);
        expect(sql).toMatch(/employees_monthly_salary_upper_bound/i);
        expect(sql).toMatch(/employees_monthly_allowance_upper_bound/i);
    });
});
