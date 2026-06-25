const { execFileSync } = require('child_process');

describe('Overview shift allocation', () => {
    function runOverviewShiftCheck(scriptBody) {
        execFileSync('node', ['--input-type=module', '-e', scriptBody], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('overview ignores employee shift sales_amount and allocates by order time only', () => {
        runOverviewShiftCheck(`
            import assert from 'node:assert/strict';
            import { buildOverviewShiftsByDay } from './js/features/reports/overviewShiftService.js';

            const shiftsByDay = buildOverviewShiftsByDay({
                keys: ['2026-06-23'],
                shiftData: [
                    {
                        shift_date: '2026-06-23',
                        shift_name: 'Ca sáng',
                        start_time: '06:30:00',
                        end_time: '13:30:00',
                        sales_amount: 111111,
                        status: 'worked'
                    },
                    {
                        shift_date: '2026-06-23',
                        shift_name: 'Ca Chiều',
                        start_time: '13:30:00',
                        end_time: '20:00:00',
                        sales_amount: 999999,
                        status: 'worked'
                    }
                ],
                orders: [
                    {
                        id: 'order-morning',
                        created_at: '2026-06-23T10:30:00',
                        total: 3656000,
                        status: 'completed'
                    }
                ]
            });

            const shifts = shiftsByDay.get('2026-06-23');
            assert.equal(shifts.find(s => s.name === 'Ca sáng').revenue, 3656000);
            assert.equal(shifts.find(s => s.name === 'Ca Chiều').revenue, 0);
        `);
    });

    test('overview allocates afternoon orders to afternoon shift by timestamp', () => {
        runOverviewShiftCheck(`
            import assert from 'node:assert/strict';
            import { buildOverviewShiftsByDay } from './js/features/reports/overviewShiftService.js';

            const shiftsByDay = buildOverviewShiftsByDay({
                keys: ['2026-06-23'],
                shiftData: [
                    {
                        shift_date: '2026-06-23',
                        shift_name: 'Ca sáng',
                        start_time: '06:30:00',
                        end_time: '13:30:00',
                        status: 'worked'
                    },
                    {
                        shift_date: '2026-06-23',
                        shift_name: 'Ca Chiều',
                        start_time: '13:30:00',
                        end_time: '20:00:00',
                        status: 'worked'
                    }
                ],
                orders: [
                    {
                        id: 'order-afternoon',
                        created_at: '2026-06-23T15:00:00',
                        total: 213000,
                        status: 'completed'
                    }
                ]
            });

            const shifts = shiftsByDay.get('2026-06-23');
            assert.equal(shifts.find(s => s.name === 'Ca sáng').revenue, 0);
            assert.equal(shifts.find(s => s.name === 'Ca Chiều').revenue, 213000);
        `);
    });

    test('overview stops allocating orders to a closed shift after closed_at', () => {
        runOverviewShiftCheck(`
            import assert from 'node:assert/strict';
            import { buildOverviewShiftsByDay } from './js/features/reports/overviewShiftService.js';

            const shiftsByDay = buildOverviewShiftsByDay({
                keys: ['2026-06-23'],
                shiftData: [
                    {
                        shift_date: '2026-06-23',
                        shift_name: 'Ca sang',
                        start_time: '06:30:00',
                        end_time: '13:30:00',
                        status: 'worked',
                        is_closed: true,
                        closed_at: '2026-06-23T12:00:00'
                    }
                ],
                orders: [
                    {
                        id: 'before-close',
                        created_at: '2026-06-23T11:30:00',
                        total: 120000,
                        status: 'completed'
                    },
                    {
                        id: 'after-close',
                        created_at: '2026-06-23T12:30:00',
                        total: 90000,
                        status: 'completed'
                    }
                ]
            });

            const shifts = shiftsByDay.get('2026-06-23');
            assert.equal(shifts.find(s => s.name === 'Ca sang').revenue, 120000);
        `);
    });
});
