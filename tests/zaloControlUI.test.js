const fs = require('fs');
const path = require('path');

const page = fs.readFileSync(path.join(process.cwd(), 'pages/zalo.html'), 'utf8');
const layout = fs.readFileSync(path.join(process.cwd(), 'js/components/layout.js'), 'utf8');
const controller = fs.readFileSync(
    path.join(process.cwd(), 'js/features/zalo/zaloController.js'),
    'utf8'
);

describe('Zalo admin UI', () => {
    test('navigation and route are admin-only', () => {
        expect(layout).toMatch(/activeTab === 'zalo'/);
        expect(layout).toMatch(/requiresAdminRole = activeTab === 'zalo'/);
        expect(layout).toMatch(/user\.role === 'admin' \? renderTab\('zalo'/);
        expect(controller).toMatch(/isZaloAdmin\(currentUser\(\)\)/);
    });

    test('provides accessible feedback and confirmation', () => {
        expect(page).toMatch(/aria-live="polite"/);
        expect(page).toMatch(/role="dialog"/);
        expect(page).toMatch(/min-h-11/);
        expect(controller).toMatch(/openConfirmation/);
    });

    test('never accepts an arbitrary shell command or free-form script', () => {
        expect(page).not.toMatch(/textarea[^>]*(command|script|shell)/i);
        expect(controller).not.toMatch(/eval\(|new Function|powershell|child_process/i);
    });
});
