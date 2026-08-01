const fs = require('fs');
const path = require('path');

function read(relativePath) {
    return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('employee payroll privacy UI', () => {
    const controller = read('js/features/employees/employeesController.js');
    const posController = read('js/features/pos/posController.js');
    const page = read('pages/employees.html');

    test('filters payroll rows by the signed-in employee unless role is admin', () => {
        expect(controller).toContain('filterPayrollEmployeesForViewer');
        expect(controller).toContain('canViewAllEmployeePayroll');
        expect(controller).toContain('const payrollEmployees = filterPayrollEmployeesForViewer(');
        expect(controller).toContain('const rows = payrollEmployees.map(employee =>');
        expect(controller).toContain("if (view === 'employees') return canViewAllEmployeePayroll(getCurrentUser())");
    });

    test('uses a salary-free directory for POS and non-admin employee views', () => {
        expect(controller).toContain('fetchEmployeeDirectory(supabaseClient)');
        expect(controller).toContain('mergeEmployeeDirectoryWithProfiles');
        expect(posController).toContain('fetchEmployeeDirectory(supabaseClient)');
        expect(posController).not.toContain('allEmployees = await getEmployees()');
    });

    test('explains the private scope directly above the payroll table', () => {
        expect(page).toContain('id="payrollPrivacyNotice"');
        expect(page).toContain('id="payrollPrivacyNoticeText"');
        const payrollViewIndex = page.indexOf('id="payrollView"');
        const privacyNoticeIndex = page.indexOf('id="payrollPrivacyNotice"');
        const payrollTableIndex = page.indexOf('id="payrollTableBody"');

        expect(payrollViewIndex).toBeGreaterThanOrEqual(0);
        expect(privacyNoticeIndex).toBeGreaterThan(payrollViewIndex);
        expect(payrollTableIndex).toBeGreaterThan(privacyNoticeIndex);
        expect(page).toContain('Chỉ bạn và quản trị viên');
    });
});
