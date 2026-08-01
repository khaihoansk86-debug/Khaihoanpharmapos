const { execFileSync } = require('child_process');

describe('employee payroll period rules', () => {
    test('moves across years and keeps exact calendar-month boundaries', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                formatPayrollMonthLabel,
                getPayrollMonthRange,
                shiftPayrollMonth
            } from './js/features/employees/employeePayrollPeriodRules.js';

            const previous = shiftPayrollMonth(new Date(2026, 0, 15), -1);
            assert.equal(previous.getFullYear(), 2025);
            assert.equal(previous.getMonth(), 11);
            assert.deepEqual(getPayrollMonthRange(previous), {
                first: '2025-12-01',
                last: '2025-12-31'
            });
            assert.deepEqual(getPayrollMonthRange(new Date(2028, 1, 10)), {
                first: '2028-02-01',
                last: '2028-02-29'
            });
            assert.equal(formatPayrollMonthLabel(previous), 'Tháng 12 / 2025');
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });
});
