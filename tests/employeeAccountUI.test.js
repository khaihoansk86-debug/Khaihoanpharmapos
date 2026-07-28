const fs = require('fs');
const path = require('path');

describe('employee account form UI', () => {
    const page = fs.readFileSync(
        path.join(process.cwd(), 'pages', 'employees.html'),
        'utf8'
    );
    const controller = fs.readFileSync(
        path.join(process.cwd(), 'js', 'features', 'employees', 'employeesController.js'),
        'utf8'
    );

    test('provides labeled username and password controls with accessible visibility toggle', () => {
        expect(page).toContain('for="employeeUsername"');
        expect(page).toContain('id="employeeUsername"');
        expect(page).toContain('for="employeePassword"');
        expect(page).toContain('id="employeePassword"');
        expect(page).toContain('id="employeePasswordHint"');
        expect(page).toContain('id="toggleEmployeePassword"');
        expect(page).toContain('aria-pressed="false"');
    });

    test('requires credentials for a new employee and preserves existing authorization fields', () => {
        expect(controller).toContain("password.length < 6");
        expect(controller).toContain("role: existingEmp.role || 'staff'");
        expect(controller).toContain("permissions: existingEmp.permissions || []");
        expect(controller).toContain("submitButton.disabled = true");
    });
});
