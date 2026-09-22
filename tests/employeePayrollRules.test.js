const { execFileSync } = require('child_process');

function check(body) {
    execFileSync('node', ['--input-type=module', '-e', `
        import assert from 'node:assert/strict';
        import { calculateEmployeePayroll, getEmployeeMonthlySalary } from './js/features/employees/employeePayrollRules.js';
        const employee = { monthly_salary: 7_500_000, monthly_allowance: 250_000, commission_rate: 1 };
        function monthShifts(daysOff, days = 30, prefix = '2026-09') {
            return Array.from({ length: days }, (_, i) => ({
                shift_date: prefix + '-' + String(i + 1).padStart(2, '0'),
                status: i < daysOff ? 'off' : 'worked',
                sales_amount: 0
            }));
        }
        ${body}
    `], { cwd: process.cwd(), stdio: 'pipe' });
}

describe('employee monthly payroll: fixed 30 days and four paid days off', () => {
    test.each([
        [0, 8_500_000, 4, 0],
        [1, 8_250_000, 3, 0],
        [2, 8_000_000, 2, 0],
        [3, 7_750_000, 1, 0],
        [4, 7_500_000, 0, 0],
        [5, 7_250_000, 0, 1],
        [8, 6_500_000, 0, 4]
    ])('%i days off yields base pay %i', (off, expected, unused, unpaid) => {
        check(`
            const result = calculateEmployeePayroll({ employee, shifts: monthShifts(${off}) });
            assert.equal(result.dailyRate, 250_000);
            assert.equal(result.basePay, ${expected});
            assert.equal(result.unusedLeaveDays, ${unused});
            assert.equal(result.unpaidLeaveDays, ${unpaid});
            assert.equal(result.restDays, Math.min(3, ${off}));
            assert.equal(result.paidLeaveDays, Math.min(1, Math.max(0, ${off} - 3)));
            assert.equal(result.restDays + result.leaveDays, ${off});
            assert.equal(result.total, ${expected} + 250_000);
        `);
    });

    test('same days off produce the same pay in 28, 29, 30 and 31-day months', () => {
        check(`
            for (const [prefix, days] of [['2026-02',28], ['2024-02',29], ['2026-04',30], ['2026-07',31]]) {
                for (let off = 0; off <= 8; off++) {
                    const result = calculateEmployeePayroll({ employee, shifts: monthShifts(off, days, prefix) });
                    assert.equal(result.basePay, 7_500_000 + (4 - off) * 250_000, prefix);
                    assert.equal(result.workedDays, days - off, prefix);
                }
            }
        `);
    });

    test('Hùng July retains allowances and commission on top of the revised base', () => {
        check(`
            const shifts = monthShifts(3, 31, '2026-07');
            shifts[3].sales_amount = 66_979_990;
            const result = calculateEmployeePayroll({ employee, shifts });
            assert.equal(result.workedDays, 28);
            assert.equal(result.basePay, 7_750_000);
            assert.equal(result.allowance, 250_000);
            assert.equal(result.commission, 669_800);
            assert.equal(result.total, 8_669_800);
        `);
    });

    test('counts distinct days, not shifts, and a worked shift wins over off on the same day', () => {
        check(`
            const shifts = monthShifts(5);
            shifts.push({ shift_date: '2026-09-01', status: 'off' });
            shifts.push({ shift_date: '2026-09-05', status: 'worked', sales_amount: 3_000_000 });
            shifts.push({ shift_date: '2026-09-05', status: 'worked', sales_amount: 2_000_000 });
            const result = calculateEmployeePayroll({ employee, shifts });
            assert.equal(result.restDays + result.leaveDays, 4);
            assert.equal(result.workedDays, 26);
            assert.equal(result.basePay, 7_500_000);
            assert.equal(result.sales, 5_000_000);
            assert.equal(result.commission, 50_000);
            assert.equal(result.total, 7_800_000);
        `);
    });

    test('empty attendance earns no estimate; sparse attendance projects the month without inventing absences', () => {
        check(`
            for (const shifts of [[], [null, { status: 'off' }, { shift_date: '2026-09-01', status: 'scheduled' }]]) {
                const result = calculateEmployeePayroll({ employee, shifts });
                assert.equal(result.basePay, 0);
                assert.equal(result.allowance, 0);
                assert.equal(result.unusedLeaveDays, 0);
                assert.equal(result.total, 0);
            }
            const projected = calculateEmployeePayroll({ employee, shifts: [{ shift_date: '2026-09-01', status: 'worked' }] });
            assert.equal(projected.basePay, 8_500_000);
            assert.equal(projected.restDays + projected.leaveDays, 0);
        `);
    });

    test('preserves legacy monthly contract and rounds money only after calculation', () => {
        check(`
            assert.equal(getEmployeeMonthlySalary({ daily_rate: 300_000 }), 8_100_000);
            assert.equal(getEmployeeMonthlySalary({ monthly_salary: 0, daily_rate: 300_000 }), 0);
            const legacy = calculateEmployeePayroll({ employee: { daily_rate: 300_000 }, shifts: monthShifts(4) });
            assert.equal(legacy.dailyRate, 270_000);
            assert.equal(legacy.basePay, 8_100_000);
            const result = calculateEmployeePayroll({ employee: { monthly_salary: 7_000_001 }, shifts: monthShifts(3) });
            assert.equal(result.basePay, Math.round(7_000_001 * 31 / 30));
        `);
    });

    test('saved past-month compensation still overrides the current profile', () => {
        check(`
            const { resolvePayrollEmployeeForPeriod } = await import('./js/features/employees/employeePayrollPeriodSettingsRules.js');
            const effective = resolvePayrollEmployeeForPeriod({ monthly_salary: 9_000_000 }, employee);
            const result = calculateEmployeePayroll({ employee: effective, shifts: monthShifts(4) });
            assert.equal(result.basePay, 7_500_000);
            assert.equal(result.allowance, 250_000);
        `);
    });
});
