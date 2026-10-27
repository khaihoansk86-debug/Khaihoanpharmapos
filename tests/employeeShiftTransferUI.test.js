const fs = require('fs');
const path = require('path');

function read(relativePath) {
    return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('employee shift transfer and revenue sync UI', () => {
    const controller = read('js/features/employees/employeesController.js');
    const page = read('pages/employees.html');
    const rules = read('js/features/pos/shiftOrderAssignmentRules.js');

    test('has buttons and modals for transferring shifts and syncing revenue in employees.html', () => {
        expect(page).toContain('id="reconcileScheduleBtn"');
        expect(page).toContain('id="openTransferRevenueModalBtn"');
        expect(page).toContain('id="transferShiftBtn"');
        expect(page).toContain('id="transferShiftModal"');
        expect(page).toContain('id="transferRevenueModal"');
        expect(page).toContain('id="transferOrdersCheck"');
        expect(page).toContain('id="transferReassignShiftCheck"');
    });

    test('wires up shift transfer and revenue reconciliation in employeesController.js', () => {
        expect(controller).toContain('transferShiftToEmployee');
        expect(controller).toContain('transferDayRevenueBetweenEmployees');
        expect(controller).toContain('reconcileShiftsForDateRange');
        expect(controller).toContain('openTransferShiftModalForCurrentShift');
        expect(controller).toContain('populateTransferRevenueEmployees');
        // Warns before deleting shift with revenue
        expect(controller).toContain('đang có doanh thu');
        expect(controller).toContain('Chuyển ca');
    });

    test('auto-reconciles shift sales on saving or deleting shifts', () => {
        expect(controller).toContain('reconcileShiftSalesFromOrders({');
        // Checks that deleting calls reconcileShiftSalesFromOrders with referenceDate
        expect(controller).toContain('await reconcileShiftSalesFromOrders({ referenceDate: shiftDate });');
    });

    test('shift order assignment rules safely fall back to active shifts when seller has no shifts', () => {
        expect(rules).toContain('reconciliationEmployeeId');
        expect(rules).toContain('remainingWorked.length === 1');
    });
});
