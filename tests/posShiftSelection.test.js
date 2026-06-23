const { execFileSync } = require('child_process');

describe('POS shift selection', () => {
    function runShiftSelectionCheck(scriptBody) {
        execFileSync('node', ['--input-type=module', '-e', scriptBody], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('does not sync sales into an upcoming afternoon shift while a morning shift is active', () => {
        runShiftSelectionCheck(`
            import assert from 'node:assert/strict';
            import { normalizeTimeToSeconds, pickShiftForPOSSync } from './js/features/pos/shiftSelection.js';

            const shifts = [
                {
                    id: 'morning',
                    employee_id: 'morning-employee',
                    shift_name: 'Ca sáng',
                    start_time: '07:00:00',
                    end_time: '14:00:00',
                    status: 'worked',
                    is_closed: false
                },
                {
                    id: 'afternoon',
                    employee_id: 'login-employee',
                    shift_name: 'Ca Chiều',
                    start_time: '14:00:00',
                    end_time: '21:00:00',
                    status: 'worked',
                    is_closed: false
                }
            ];

            const selected = pickShiftForPOSSync(shifts, normalizeTimeToSeconds('10:30:00'), 'login-employee');
            assert.equal(selected.id, 'morning');
        `);
    });

    test('uses the employee upcoming shift only when no shift is currently active', () => {
        runShiftSelectionCheck(`
            import assert from 'node:assert/strict';
            import { normalizeTimeToSeconds, pickShiftForPOSSync } from './js/features/pos/shiftSelection.js';

            const shifts = [
                {
                    id: 'afternoon',
                    employee_id: 'login-employee',
                    shift_name: 'Ca Chiều',
                    start_time: '14:00:00',
                    end_time: '21:00:00',
                    status: 'worked',
                    is_closed: false
                }
            ];

            const selected = pickShiftForPOSSync(shifts, normalizeTimeToSeconds('12:00:00'), 'login-employee');
            assert.equal(selected.id, 'afternoon');
        `);
    });
});
