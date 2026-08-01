const fs = require('fs');
const path = require('path');

function read(relativePath) {
    return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('employee payroll period settings UI', () => {
    const controller = read('js/features/employees/employeesController.js');
    const page = read('pages/employees.html');

    test('shows the effective period source and an authorized edit action per employee', () => {
        expect(controller).toContain('resolvePayrollEmployeeForPeriod');
        expect(controller).toContain('payrollPeriodSettings.get(employee.id)');
        expect(controller).toContain('edit-payroll-setting');
        expect(controller).toContain("canAccessEmployeeView('employees')");
        expect(page).toContain('Lương theo công');
        expect(page).toContain('Thao tác');
    });

    test('provides a labeled period modal with clear VND input examples', () => {
        [
            'payrollSettingModal',
            'payrollSettingForm',
            'payrollSettingEmployeeId',
            'payrollSettingMonth',
            'payrollSettingSalary',
            'payrollSettingAllowance',
            'payrollSettingCommission',
            'payrollSettingNote'
        ].forEach(id => expect(page).toContain(`id="${id}"`));
        expect(page).toContain('Nhập 7500000 để lưu 7.500.000đ');
        expect(page).toContain('Nhập 250000 để lưu 250.000đ');
        expect(page).toContain('aria-modal="true"');
        expect(page).toContain('aria-labelledby="payrollSettingModalTitle"');
    });

    test('loads and saves month settings through the protected service', () => {
        expect(controller).toContain('fetchEmployeePayrollPeriodSettings(');
        expect(controller).toContain('saveEmployeePayrollPeriodSetting(');
        expect(controller).toContain('supabaseClient');
        expect(controller).toContain("$('payrollSettingForm').addEventListener('submit'");
    });

    test('escapes employee names before inserting payroll row markup', () => {
        expect(controller).toContain("import { escapeEmployeeHtml } from './employeePresentationRules.js';");
        expect(controller).toContain('const escapeHtml = escapeEmployeeHtml;');
        expect(controller).toContain('const escapedEmployeeName = escapeHtml(employee.name);');
        expect(controller).toContain('Chỉnh lương theo kỳ của ${escapedEmployeeName}');
    });
});
