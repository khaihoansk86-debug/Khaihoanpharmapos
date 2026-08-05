const fs = require('fs');
const path = require('path');

describe('POS accessibility and feedback UI', () => {
    const page = fs.readFileSync(path.join(process.cwd(), 'pages/pos.html'), 'utf8');
    const controller = fs.readFileSync(path.join(process.cwd(), 'js/features/pos/posController.js'), 'utf8');
    const posUI = fs.readFileSync(path.join(process.cwd(), 'js/features/pos/posUI.js'), 'utf8');

    test('does not expose raw runtime errors through injected HTML', () => {
        expect(page).not.toContain("insertAdjacentHTML('afterbegin'");
        expect(page).toContain('id="posGlobalErrorNotice"');
    });

    test('uses application feedback instead of native alert and confirm dialogs', () => {
        expect(page).toContain('id="posActionModal"');
        expect(controller).not.toMatch(/\balert\s*\(/);
        expect(controller).not.toMatch(/\bconfirm\s*\(/);
    });

    test('keeps cart controls visible, named and touch sized', () => {
        expect(posUI).not.toContain('opacity-0 group-hover:opacity-100');
        expect(posUI).toContain('aria-label="Xóa');
        expect(posUI).toContain('w-11 h-11');
        expect(posUI).not.toContain('<div onclick="window.selectProduct');
        expect(posUI).not.toContain('<div onclick="window.openCustomItemModal');
    });

    test('barcode control is functional and motion preferences are respected', () => {
        expect(page).toContain('onclick="window.focusBarcodeScanner()"');
        expect(page).toContain('@media (prefers-reduced-motion: reduce)');
        expect(page).not.toContain('id="qrFloatingBtn" onclick=');
    });
});
