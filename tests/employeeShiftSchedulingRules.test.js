const { execFileSync } = require('child_process');

describe('employee shift scheduling rules', () => {
    test('normalizes the two fixed shifts and builds an idempotent bounded range', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                buildEmployeeShiftRange,
                normalizeEmployeeShiftName
            } from './js/features/employees/employeeShiftSchedulingRules.js';

            assert.equal(normalizeEmployeeShiftName(' ca sáng '), 'Sáng');
            assert.equal(normalizeEmployeeShiftName('CHIỀU'), 'Chiều');
            assert.throws(() => normalizeEmployeeShiftName('Tối'), /INVALID_SHIFT_NAME/);

            const shifts = buildEmployeeShiftRange({
                employee_id: '123e4567-e89b-42d3-a456-426614174000',
                from: '2026-08-01',
                to: '2026-08-03',
                shift_name: 'Sáng',
                start_time: '06:30',
                end_time: '13:30',
                status: 'worked',
                note: 'Ca chuẩn'
            });
            assert.deepEqual(shifts.map(item => item.shift_date), [
                '2026-08-01', '2026-08-02', '2026-08-03'
            ]);
            assert.throws(() => buildEmployeeShiftRange({
                employee_id: '123e4567-e89b-42d3-a456-426614174000',
                from: '2026-01-01',
                to: '2026-04-01',
                shift_name: 'Sáng',
                start_time: '06:30',
                end_time: '13:30',
                status: 'worked'
            }), /SHIFT_RANGE_TOO_LARGE/);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });
});
