const fs = require('fs');
const path = require('path');

function read(relativePath) {
    return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('employee shift display UI', () => {
    const controller = read('js/features/employees/employeesController.js');
    const page = read('pages/employees.html');

    test('uses the two-row display rule without controls that recreate extra shift types', () => {
        expect(controller).toContain('buildEmployeeShiftDisplayTemplates');
        expect(controller).toContain('shiftBelongsToEmployeeShiftDisplay');
        expect(controller).not.toContain("$('newShiftTemplateBtn').addEventListener");
        expect(page).not.toContain('id="newShiftTemplateBtn"');
        expect(controller).not.toContain('class="delete-shift-template');
        expect(page).toContain('id="templateNameInput" class="input" readonly');
        expect(page).toContain('Chỉ chỉnh giờ bắt đầu và kết thúc');
    });
});
