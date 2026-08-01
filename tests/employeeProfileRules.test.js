const { execFileSync } = require('child_process');

describe('employee profile rules', () => {
    test('normalizes bounded profile input without changing the 27-day salary contract', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import { normalizeEmployeeProfileInput } from './js/features/employees/employeeProfileRules.js';
            const profile = normalizeEmployeeProfileInput({
                name: ' Hùng ', phone: ' 0901 ', monthly_salary: 7500000,
                monthly_allowance: 250000, commission_rate: 1,
                status: 'active', role: 'staff', permissions: ['access_pos']
            });
            assert.equal(profile.name, 'Hùng');
            assert.equal(profile.phone, '0901');
            assert.equal(profile.daily_rate, 7500000 / 27);
            assert.equal(profile.commission_rate, 1);
            assert.throws(() => normalizeEmployeeProfileInput({ name: '<'.repeat(151) }), /INVALID_EMPLOYEE_NAME/);
            assert.throws(() => normalizeEmployeeProfileInput({ name: 'Lan', commission_rate: 101 }), /INVALID_COMMISSION_RATE/);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });
});
