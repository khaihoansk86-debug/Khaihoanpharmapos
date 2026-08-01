const { execFileSync } = require('child_process');

describe('employee monthly payroll rules', () => {
    function runRuleCheck(scriptBody) {
        execFileSync('node', ['--input-type=module', '-e', scriptBody], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('uses monthly salary divided by 27 and handles one paid leave day', () => {
        runRuleCheck(`
            import assert from 'node:assert/strict';
            import { calculateEmployeePayroll } from './js/features/employees/employeePayrollRules.js';

            const monthlySalary = 8_100_000;
            const workedShifts = Array.from({ length: 26 }, (_, index) => ({
                shift_date: \`2026-07-\${String(index + 1).padStart(2, '0')}\`,
                status: 'worked',
                sales_amount: 0
            }));
            const result = calculateEmployeePayroll({
                employee: { monthly_salary: monthlySalary, commission_rate: 0 },
                shifts: [
                    ...workedShifts,
                    { shift_date: '2026-07-27', status: 'off', sales_amount: 0 }
                ]
            });

            assert.equal(result.dailyRate, 300_000);
            assert.equal(result.workedDays, 26);
            assert.equal(result.leaveDays, 1);
            assert.equal(result.paidLeaveDays, 1);
            assert.equal(result.unusedLeaveDays, 0);
            assert.equal(result.unpaidLeaveDays, 0);
            assert.equal(result.basePay, 8_100_000);
            assert.equal(result.total, 8_100_000);
        `);
    });

    test('caps Hùng at 27 standard work days plus one unused leave day', () => {
        runRuleCheck(`
            import assert from 'node:assert/strict';
            import { calculateEmployeePayroll } from './js/features/employees/employeePayrollRules.js';

            const shifts = [
                ...Array.from({ length: 28 }, (_, index) => ({
                    shift_date: \`2026-07-\${String(index + 1).padStart(2, '0')}\`,
                    status: 'worked',
                    sales_amount: index === 0 ? 66_979_990 : 0
                })),
                ...Array.from({ length: 3 }, (_, index) => ({
                    shift_date: \`2026-07-\${index + 29}\`,
                    status: 'off',
                    sales_amount: 0
                }))
            ];
            const result = calculateEmployeePayroll({
                employee: {
                    monthly_salary: 7_500_000,
                    monthly_allowance: 250_000,
                    commission_rate: 1
                },
                shifts
            });

            assert.equal(result.workedDays, 27);
            assert.equal(result.leaveDays, 0);
            assert.equal(result.unusedLeaveDays, 1);
            assert.equal(result.paidDays, 28);
            assert.equal(result.basePay, 7_777_778);
            assert.equal(result.commission, 669_800);
            assert.equal(result.total, 8_697_578);
        `);
    });

    test('keeps the same 27-day standard in 28, 29, 30 and 31-day months', () => {
        runRuleCheck(`
            import assert from 'node:assert/strict';
            import { calculateEmployeePayroll } from './js/features/employees/employeePayrollRules.js';

            const months = [
                { prefix: '2026-02', days: 28 },
                { prefix: '2024-02', days: 29 },
                { prefix: '2026-04', days: 30 },
                { prefix: '2026-07', days: 31 }
            ];

            months.forEach(({ prefix, days }) => {
                const shifts = Array.from({ length: days }, (_, index) => ({
                    shift_date: \`\${prefix}-\${String(index + 1).padStart(2, '0')}\`,
                    status: index < 27 ? 'worked' : 'off'
                }));
                const result = calculateEmployeePayroll({
                    employee: { monthly_salary: 8_100_000 },
                    shifts
                });

                assert.equal(result.workedDays, 27, prefix);
                assert.equal(result.leaveDays, 0, prefix);
                assert.equal(result.restDays, days - 27, prefix);
                assert.equal(result.unusedLeaveDays, 1, prefix);
                assert.equal(result.paidDays, 28, prefix);
                assert.equal(result.basePay, 8_400_000, prefix);
            });
        `);
    });

    test('adds an unused leave day and only deducts leave beyond the allowance', () => {
        runRuleCheck(`
            import assert from 'node:assert/strict';
            import { calculateEmployeePayroll } from './js/features/employees/employeePayrollRules.js';

            const worked27 = Array.from({ length: 27 }, (_, index) => ({
                shift_date: \`2026-07-\${String(index + 1).padStart(2, '0')}\`,
                status: 'worked'
            }));
            const noLeave = calculateEmployeePayroll({
                employee: { monthly_salary: 8_100_000 },
                shifts: worked27
            });
            assert.equal(noLeave.unusedLeaveDays, 1);
            assert.equal(noLeave.basePay, 8_400_000);

            const twoLeaveDays = calculateEmployeePayroll({
                employee: { monthly_salary: 8_100_000 },
                shifts: [
                    ...worked27.slice(0, 25),
                    { shift_date: '2026-07-26', status: 'off' },
                    { shift_date: '2026-07-27', status: 'off' }
                ]
            });
            assert.equal(twoLeaveDays.paidLeaveDays, 1);
            assert.equal(twoLeaveDays.unpaidLeaveDays, 1);
            assert.equal(twoLeaveDays.basePay, 7_800_000);
        `);
    });

    test('counts unique work days while summing revenue once per shift', () => {
        runRuleCheck(`
            import assert from 'node:assert/strict';
            import { calculateEmployeePayroll } from './js/features/employees/employeePayrollRules.js';

            const result = calculateEmployeePayroll({
                employee: {
                    monthly_salary: 8_100_000,
                    commission_rate: 1
                },
                shifts: [
                    {
                        id: 'morning',
                        shift_date: '2026-07-01',
                        status: 'worked',
                        sales_amount: 3_000_000
                    },
                    {
                        id: 'evening',
                        shift_date: '2026-07-01',
                        status: 'worked',
                        sales_amount: 2_000_000
                    }
                ]
            });

            assert.equal(result.workedDays, 1);
            assert.equal(result.sales, 5_000_000);
            assert.equal(result.commission, 50_000);
            assert.equal(result.basePay, 600_000);
            assert.equal(result.total, 650_000);
        `);
    });

    test('adds the employee monthly allowance after base pay', () => {
        runRuleCheck(`
            import assert from 'node:assert/strict';
            import { calculateEmployeePayroll } from './js/features/employees/employeePayrollRules.js';

            const result = calculateEmployeePayroll({
                employee: {
                    monthly_salary: 8_100_000,
                    monthly_allowance: 700_000,
                    commission_rate: 1
                },
                shifts: [{
                    shift_date: '2026-07-01',
                    status: 'worked',
                    sales_amount: 5_000_000
                }]
            });

            assert.equal(result.allowance, 700_000);
            assert.equal(result.basePay, 600_000);
            assert.equal(result.commission, 50_000);
            assert.equal(result.total, 1_350_000);
        `);
    });
});
