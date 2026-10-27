const { execFileSync } = require('child_process');

describe('Shift Transfer Service', () => {
    function runServiceCheck(scriptBody) {
        execFileSync('node', ['--input-type=module', '-e', scriptBody], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('validates inputs for transferShiftToEmployee', () => {
        runServiceCheck(`
            import assert from 'node:assert/strict';
            import { transferShiftToEmployee } from './js/features/employees/shiftTransferService.js';

            await assert.rejects(
                () => transferShiftToEmployee({}),
                /Cần cung cấp ca làm việc hợp lệ/
            );

            await assert.rejects(
                () => transferShiftToEmployee({ shift: { id: 's1' } }),
                /Vui lòng chọn nhân viên tiếp nhận/
            );
        `);
    });

    test('returns immediately if target employee is already current employee', () => {
        runServiceCheck(`
            import assert from 'node:assert/strict';
            import { transferShiftToEmployee } from './js/features/employees/shiftTransferService.js';

            const shift = { id: 's1', employee_id: 'emp-1', shift_date: '2026-10-26' };
            const result = await transferShiftToEmployee({
                shift,
                targetEmployeeId: 'emp-1'
            });

            assert.equal(result.transferredOrdersCount, 0);
            assert.equal(result.shift.employee_id, 'emp-1');
        `);
    });

    test('transfers shift to target employee and updates orders', () => {
        runServiceCheck(`
            import assert from 'node:assert/strict';
            import { transferShiftToEmployee } from './js/features/employees/shiftTransferService.js';

            const savedShifts = [];
            const updatedOrdersCalls = [];
            const reconciledDates = [];

            const mockClient = {
                from(table) {
                    assert.equal(table, 'orders');
                    return {
                        update(payload) {
                            updatedOrdersCalls.push(payload);
                            return {
                                eq() { return this; },
                                or() { return this; },
                                gte() { return this; },
                                lte() { return this; },
                                select: async () => ({ data: [{ id: 'order-1' }, { id: 'order-2' }], error: null })
                            };
                        }
                    };
                }
            };

            const shift = { id: 'shift-100', employee_id: 'emp-a', shift_date: '2026-10-26', sales_amount: 500000 };
            const result = await transferShiftToEmployee({
                shift,
                targetEmployeeId: 'emp-b',
                transferOrders: true,
                client: mockClient,
                saveShiftFn: async (s) => { savedShifts.push(s); return s; },
                reconcileFn: async (args) => { reconciledDates.push(args); return { updated: [args] }; }
            });

            assert.equal(result.shift.employee_id, 'emp-b');
            assert.equal(result.transferredOrdersCount, 2);
            assert.equal(savedShifts.length, 1);
            assert.equal(savedShifts[0].employee_id, 'emp-b');
            assert.equal(updatedOrdersCalls[0].seller_employee_id, 'emp-b');
            assert.equal(reconciledDates[0].referenceDate, '2026-10-26');
            assert.equal(reconciledDates[0].employeeId, 'emp-b');
        `);
    });

    test('validates inputs for transferDayRevenueBetweenEmployees', () => {
        runServiceCheck(`
            import assert from 'node:assert/strict';
            import { transferDayRevenueBetweenEmployees } from './js/features/employees/shiftTransferService.js';

            await assert.rejects(
                () => transferDayRevenueBetweenEmployees({}),
                /Vui lòng chọn ngày/
            );

            await assert.rejects(
                () => transferDayRevenueBetweenEmployees({ shiftDate: '2026-10-26' }),
                /Vui lòng chọn cả/
            );

            await assert.rejects(
                () => transferDayRevenueBetweenEmployees({
                    shiftDate: '2026-10-26',
                    fromEmployeeId: 'emp-1',
                    toEmployeeId: 'emp-1'
                }),
                /không được trùng nhau/
            );
        `);
    });

    test('transfers day revenue and shifts between employees', () => {
        runServiceCheck(`
            import assert from 'node:assert/strict';
            import { transferDayRevenueBetweenEmployees } from './js/features/employees/shiftTransferService.js';

            const savedShifts = [];
            const mockClient = {
                from(table) {
                    assert.equal(table, 'orders');
                    return {
                        update() {
                            return {
                                eq() { return this; },
                                or() { return this; },
                                gte() { return this; },
                                lte() { return this; },
                                select: async () => ({ data: [{ id: 'o-1' }], error: null })
                            };
                        }
                    };
                }
            };

            const existingShifts = [
                { id: 's-1', shift_date: '2026-10-26', employee_id: 'emp-a' },
                { id: 's-2', shift_date: '2026-10-26', employee_id: 'emp-other' }
            ];

            const result = await transferDayRevenueBetweenEmployees({
                shiftDate: '2026-10-26',
                fromEmployeeId: 'emp-a',
                toEmployeeId: 'emp-b',
                reassignShifts: true,
                client: mockClient,
                getShiftsFn: async () => existingShifts,
                saveShiftFn: async (s) => { savedShifts.push(s); return s; },
                reconcileFn: async () => ({ updated: [] })
            });

            assert.equal(result.reassignedShiftsCount, 1);
            assert.equal(result.transferredOrdersCount, 1);
            assert.equal(savedShifts[0].employee_id, 'emp-b');
        `);
    });

    test('reconcileShiftsForDateRange handles empty date range gracefully', () => {
        runServiceCheck(`
            import assert from 'node:assert/strict';
            import { reconcileShiftsForDateRange } from './js/features/employees/shiftTransferService.js';

            const emptyResult = await reconcileShiftsForDateRange();
            assert.equal(emptyResult.updatedTotal, 0);
            assert.equal(emptyResult.daysProcessed, 0);

            const reconciledDays = [];
            const result = await reconcileShiftsForDateRange({
                fromDate: '2026-10-20',
                toDate: '2026-10-22',
                reconcileFn: async ({ referenceDate }) => {
                    reconciledDays.push(referenceDate);
                    return { updated: [1] };
                }
            });
            assert.equal(result.daysProcessed, 3);
            assert.equal(result.updatedTotal, 3);
            assert.deepEqual(reconciledDays, ['2026-10-20', '2026-10-21', '2026-10-22']);
        `);
    });
});
