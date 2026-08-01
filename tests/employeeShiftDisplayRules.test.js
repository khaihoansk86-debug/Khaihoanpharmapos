const { execFileSync } = require('child_process');

describe('employee shift display rules', () => {
    test('shows exactly the two configured business shifts', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                buildEmployeeShiftDisplayTemplates
            } from './js/features/employees/employeeShiftDisplayRules.js';

            const templates = buildEmployeeShiftDisplayTemplates([
                { id: 'legacy-morning', name: 'Sáng', start_time: '07:00', end_time: '14:00' },
                { id: 'legacy-afternoon', name: 'Chiều', start_time: '14:00', end_time: '21:00' },
                { id: 'legacy-full-day', name: 'Cả ngày', start_time: '07:00', end_time: '21:00' },
                { id: 'duplicate-morning', name: 'sáng', start_time: '06:30', end_time: '14:30' },
                { id: 'duplicate-afternoon', name: 'Chiều', start_time: '14:30', end_time: '20:00' }
            ]);

            assert.deepEqual(templates, [
                { id: 'morning', type: 'morning', name: 'Sáng', start_time: '06:30', end_time: '13:30' },
                { id: 'afternoon', type: 'afternoon', name: 'Chiều', start_time: '13:30', end_time: '20:00' }
            ]);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('keeps historical time variants in their semantic morning or afternoon row', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                shiftBelongsToEmployeeShiftDisplay
            } from './js/features/employees/employeeShiftDisplayRules.js';

            const morning = { type: 'morning' };
            const afternoon = { type: 'afternoon' };

            assert.equal(shiftBelongsToEmployeeShiftDisplay(
                { shift_name: 'sáng', start_time: '06:30', end_time: '14:30' },
                morning
            ), true);
            assert.equal(shiftBelongsToEmployeeShiftDisplay(
                { shift_name: 'SÁNG', start_time: null, end_time: null },
                morning
            ), true);
            assert.equal(shiftBelongsToEmployeeShiftDisplay(
                { shift_name: 'Chiều', start_time: '14:30', end_time: '20:00' },
                afternoon
            ), true);
            assert.equal(shiftBelongsToEmployeeShiftDisplay(
                { shift_name: 'Cả ngày', start_time: '07:00', end_time: '21:00' },
                morning
            ), false);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });
});
