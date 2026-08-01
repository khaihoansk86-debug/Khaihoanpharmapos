const { execFileSync } = require('child_process');

describe('employee payroll period settings rules', () => {
    test('a saved month keeps its own compensation after the employee profile changes', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                buildPayrollPeriodSettingPayload,
                resolvePayrollEmployeeForPeriod
            } from './js/features/employees/employeePayrollPeriodSettingsRules.js';

            const profile = {
                id: '04947d90-bcc4-4232-bb63-9d21746b565d',
                name: 'Hùng',
                monthly_salary: 9000000,
                monthly_allowance: 400000,
                commission_rate: 2
            };
            const july = buildPayrollPeriodSettingPayload({
                employee_id: profile.id,
                payroll_month: '2026-07-19',
                monthly_salary: '7500000',
                monthly_allowance: '250000',
                commission_rate: '1',
                note: 'Mức áp dụng tháng 7'
            });

            assert.deepEqual(july, {
                employee_id: profile.id,
                payroll_month: '2026-07-01',
                monthly_salary: 7500000,
                monthly_allowance: 250000,
                commission_rate: 1,
                note: 'Mức áp dụng tháng 7'
            });
            assert.deepEqual(resolvePayrollEmployeeForPeriod(profile, july), {
                ...profile,
                monthly_salary: 7500000,
                monthly_allowance: 250000,
                commission_rate: 1,
                payroll_setting_source: 'period'
            });
            assert.equal(
                resolvePayrollEmployeeForPeriod(profile, null).payroll_setting_source,
                'profile'
            );
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('rejects invalid or unsafe compensation values', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import { buildPayrollPeriodSettingPayload } from './js/features/employees/employeePayrollPeriodSettingsRules.js';

            const base = {
                employee_id: '04947d90-bcc4-4232-bb63-9d21746b565d',
                payroll_month: '2026-07-01',
                monthly_salary: 7500000,
                monthly_allowance: 250000,
                commission_rate: 1
            };
            assert.throws(() => buildPayrollPeriodSettingPayload({ ...base, monthly_salary: -1 }), /lương cơ bản/i);
            assert.throws(() => buildPayrollPeriodSettingPayload({ ...base, commission_rate: 101 }), /doanh số/i);
            assert.throws(() => buildPayrollPeriodSettingPayload({ ...base, employee_id: '' }), /nhân viên/i);
            assert.throws(() => buildPayrollPeriodSettingPayload({ ...base, note: 'x'.repeat(501) }), /ghi chú/i);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });
});
