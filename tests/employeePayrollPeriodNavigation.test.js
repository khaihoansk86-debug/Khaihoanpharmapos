const fs = require('fs');
const path = require('path');

function read(relativePath) {
    return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('employee payroll period navigation', () => {
    test('payroll view can move to a previous month without returning to schedule', () => {
        const controller = read('js/features/employees/employeesController.js');
        const page = read('pages/employees.html');

        expect(page).toContain('id="payrollPrevMonthBtn"');
        expect(page).toContain('id="payrollNextMonthBtn"');
        expect(page).toContain('id="payrollPeriodLabel"');
        expect(page).toContain('id="editPayrollPeriodBtn"');
        expect(controller).toContain("$('payrollPrevMonthBtn').addEventListener('click'");
        expect(controller).toContain("$('payrollNextMonthBtn').addEventListener('click'");
        expect(controller).toContain("$('editPayrollPeriodBtn').addEventListener('click'");
        expect(controller).toContain('openPayrollMonthForEditing');
        expect(controller).toContain('setPayrollMonth(');
        expect(controller).toContain('const payrollRange = getPayrollMonthRange(payrollMonth)');
        expect(controller).toContain('const employeeShifts = payrollShifts.filter');
        expect(controller).toContain('getShifts({ from: payrollRange.first, to: payrollRange.last })');
    });
});
