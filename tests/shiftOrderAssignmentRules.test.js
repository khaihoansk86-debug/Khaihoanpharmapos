const { execFileSync } = require('child_process');

describe('Shift order assignment rules', () => {
    function runAssignmentCheck(scriptBody) {
        execFileSync('node', ['--input-type=module', '-e', scriptBody], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('outside-shift orders keep their original seller when another employee reconciles later', () => {
        runAssignmentCheck(`
            import assert from 'node:assert/strict';
            import { pickShiftForOrderAssignment } from './js/features/pos/shiftOrderAssignmentRules.js';

            const shifts = [
                {
                    id: 'employee-a-shift',
                    employee_id: 'employee-a',
                    start_time: '14:00:00',
                    end_time: '20:00:00',
                    status: 'worked',
                    is_closed: false,
                    created_at: '2026-07-22T01:00:00.000Z'
                },
                {
                    id: 'employee-b-shift',
                    employee_id: 'employee-b',
                    start_time: '15:00:00',
                    end_time: '21:00:00',
                    status: 'worked',
                    is_closed: false,
                    created_at: '2026-07-22T02:00:00.000Z'
                }
            ];

            const result = pickShiftForOrderAssignment({
                shifts,
                orderSec: 13 * 3600 + 45 * 60,
                sellerEmployeeId: 'employee-a',
                reconciliationEmployeeId: 'employee-b'
            });

            assert.equal(result.shift.id, 'employee-a-shift');
            assert.equal(result.outOfShift, true);
        `);
    });

    test('scheduled shift wins even when another employee sold the order', () => {
        runAssignmentCheck(`
            import assert from 'node:assert/strict';
            import { pickShiftForOrderAssignment } from './js/features/pos/shiftOrderAssignmentRules.js';

            const result = pickShiftForOrderAssignment({
                shifts: [
                    {
                        id: 'morning-shift', employee_id: 'employee-a',
                        start_time: '06:00:00', end_time: '14:00:00',
                        status: 'worked', is_closed: false,
                        created_at: '2026-07-22T00:00:00.000Z'
                    },
                    {
                        id: 'seller-shift', employee_id: 'employee-b',
                        start_time: '15:00:00', end_time: '21:00:00',
                        status: 'worked', is_closed: false,
                        created_at: '2026-07-22T01:00:00.000Z'
                    }
                ],
                orderSec: 10 * 3600,
                sellerEmployeeId: 'employee-b',
                reconciliationEmployeeId: 'employee-b'
            });

            assert.equal(result.shift.id, 'morning-shift');
            assert.equal(result.outOfShift, false);
        `);
    });

    test('legacy orders without a seller keep the reconciliation employee fallback', () => {
        runAssignmentCheck(`
            import assert from 'node:assert/strict';
            import { pickShiftForOrderAssignment } from './js/features/pos/shiftOrderAssignmentRules.js';

            const result = pickShiftForOrderAssignment({
                shifts: [{
                    id: 'legacy-fallback-shift', employee_id: 'employee-b',
                    start_time: '14:00:00', end_time: '20:00:00',
                    status: 'worked', is_closed: false,
                    created_at: '2026-07-22T01:00:00.000Z'
                }],
                orderSec: 13 * 3600,
                reconciliationEmployeeId: 'employee-b'
            });

            assert.equal(result.shift.id, 'legacy-fallback-shift');
            assert.equal(result.outOfShift, true);
        `);
    });

    test('human close time ends the scheduled window before fallback assignment', () => {
        runAssignmentCheck(`
            import assert from 'node:assert/strict';
            import { pickShiftForOrderAssignment } from './js/features/pos/shiftOrderAssignmentRules.js';

            const result = pickShiftForOrderAssignment({
                shifts: [
                    {
                        id: 'closed-morning', employee_id: 'employee-a',
                        start_time: '06:00:00', end_time: '14:00:00',
                        status: 'worked', is_closed: true,
                        created_at: '2026-07-22T00:00:00.000Z'
                    },
                    {
                        id: 'seller-afternoon', employee_id: 'employee-b',
                        start_time: '13:30:00', end_time: '21:00:00',
                        status: 'worked', is_closed: false,
                        created_at: '2026-07-22T01:00:00.000Z'
                    }
                ],
                orderSec: 13 * 3600 + 20 * 60,
                sellerEmployeeId: 'employee-b',
                resolveEndSec: (shift) => shift.id === 'closed-morning'
                    ? 13 * 3600 + 15 * 60
                    : undefined
            });

            assert.equal(result.shift.id, 'seller-afternoon');
            assert.equal(result.outOfShift, true);
        `);
    });
});
