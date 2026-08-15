const { execFileSync } = require('child_process');

describe('automatic POS shift account prompt', () => {
    function run(script) {
        execFileSync('node', ['--input-type=module', '-e', script], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('finds the employee assigned to the current time window', () => {
        run(`
            import assert from 'node:assert/strict';
            import { findActiveShiftForTime } from './js/features/auth/shiftSessionGuard.js';
            const shifts = [
                { id: 'morning', employee_id: 'long', shift_date: '2026-08-15', shift_name: 'Sáng', start_time: '06:30:00', end_time: '13:30:00', status: 'worked' },
                { id: 'afternoon', employee_id: 'hung', shift_date: '2026-08-15', shift_name: 'Chiều', start_time: '13:30:00', end_time: '20:00:00', status: 'worked' }
            ];
            assert.equal(findActiveShiftForTime(shifts, new Date('2026-08-15T04:30:00Z')).employee_id, 'long');
            assert.equal(findActiveShiftForTime(shifts, new Date('2026-08-15T08:00:00Z')).employee_id, 'hung');
        `);
    });

    test('prompts only when the logged-in employee differs from the active shift', () => {
        run(`
            import assert from 'node:assert/strict';
            import { shouldPromptShiftSwitch } from './js/features/auth/shiftSessionGuard.js';
            assert.equal(shouldPromptShiftSwitch({ currentEmployeeId: 'long', activeShift: { employee_id: 'long' } }), false);
            assert.equal(shouldPromptShiftSwitch({ currentEmployeeId: 'admin', activeShift: { employee_id: 'long' } }), true);
        `);
    });
});
