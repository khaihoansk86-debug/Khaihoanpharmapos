const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

describe('employee management hardening UI', () => {
    const page = fs.readFileSync(path.join(process.cwd(), 'pages/employees.html'), 'utf8');
    const controller = fs.readFileSync(
        path.join(process.cwd(), 'js/features/employees/employeesController.js'), 'utf8'
    );

    test('uses a fixed shift selector and accessible resilient dialogs', () => {
        expect(page).toMatch(/<select id="shiftName"[^>]*>[\s\S]*Sáng[\s\S]*Chiều[\s\S]*<\/select>/);
        expect(page).toContain('id="employeePageStatus"');
        expect(page).toContain('aria-live="polite"');
        expect(page).toMatch(/id="shiftModal"[^>]*role="dialog"[^>]*aria-modal="true"/);
        expect(page).toMatch(/id="shiftTemplateModal"[^>]*role="dialog"[^>]*aria-modal="true"/);
        expect(controller).toContain('saveShiftsBulk');
        expect(controller).not.toContain('delete-employee-row');
    });

    test('does not keep sensitive employee profiles or shift templates in localStorage', () => {
        expect(controller).not.toContain('khp_shift_templates');
        expect(controller).not.toContain('khp_deleted_shift_templates');
        expect(controller).toContain('fetchEmployeeShiftTemplates');
        expect(controller).toContain('getEmployees({ allowLocalFallback: false })');
    });

    test('gives every visible form control and icon-only button an accessible name', () => {
        const document = new JSDOM(page).window.document;
        const unlabeledControls = Array.from(document.querySelectorAll(
            'input:not([type="hidden"]), select, textarea'
        )).filter(element => !(
            element.getAttribute('aria-label')
            || element.getAttribute('aria-labelledby')
            || (element.id && document.querySelector(`label[for="${element.id}"]`))
            || element.closest('label')
        ));
        const unnamedIconButtons = Array.from(document.querySelectorAll('button'))
            .filter(button => !button.textContent.trim())
            .filter(button => !button.getAttribute('aria-label') && !button.getAttribute('title'));
        expect(unlabeledControls).toEqual([]);
        expect(unnamedIconButtons).toEqual([]);
        expect(controller).toContain("event.key === 'Escape'");
        expect(controller).toContain("event.key !== 'Tab'");
    });
});
