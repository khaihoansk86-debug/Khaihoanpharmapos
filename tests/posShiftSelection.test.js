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

    test('overlapping shifts prefer the shift created first regardless of logged-in employee', () => {
        runShiftSelectionCheck(`
            import assert from 'node:assert/strict';
            import { normalizeTimeToSeconds, pickShiftForPOSSync } from './js/features/pos/shiftSelection.js';

            const shifts = [
                {
                    id: 'created-later',
                    employee_id: 'login-employee',
                    start_time: '08:00:00',
                    end_time: '12:00:00',
                    status: 'worked',
                    is_closed: false,
                    created_at: '2026-07-22T01:00:00.000Z'
                },
                {
                    id: 'created-first',
                    employee_id: 'assigned-employee',
                    start_time: '07:00:00',
                    end_time: '14:00:00',
                    status: 'worked',
                    is_closed: false,
                    created_at: '2026-07-21T01:00:00.000Z'
                }
            ];

            const selected = pickShiftForPOSSync(shifts, normalizeTimeToSeconds('10:30:00'), 'login-employee');
            assert.equal(selected.id, 'created-first');
        `);
    });

    test('a gap between shifts falls back to the logged-in employee shift as out-of-shift selection', () => {
        runShiftSelectionCheck(`
            import assert from 'node:assert/strict';
            import { normalizeTimeToSeconds, pickShiftForPOSSync, pickTimeMatchedShift } from './js/features/pos/shiftSelection.js';

            const shifts = [
                {
                    id: 'morning',
                    employee_id: 'morning-employee',
                    start_time: '06:30:00',
                    end_time: '13:30:00',
                    status: 'worked',
                    is_closed: false,
                    created_at: '2026-07-20T01:00:00.000Z'
                },
                {
                    id: 'afternoon',
                    employee_id: 'login-employee',
                    start_time: '14:00:00',
                    end_time: '20:00:00',
                    status: 'worked',
                    is_closed: false,
                    created_at: '2026-07-21T01:00:00.000Z'
                }
            ];

            const currentSec = normalizeTimeToSeconds('13:45:00');
            assert.equal(pickTimeMatchedShift(shifts, currentSec, 'login-employee'), null);
            assert.equal(pickShiftForPOSSync(shifts, currentSec, 'login-employee').id, 'afternoon');
        `);
    });
});
