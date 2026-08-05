const fs = require('fs');
const path = require('path');

describe('POS draft recovery UI', () => {
    const page = fs.readFileSync(path.join(process.cwd(), 'pages/pos.html'), 'utf8');
    const controller = fs.readFileSync(path.join(process.cwd(), 'js/features/pos/posController.js'), 'utf8');

    test('uses explicit restore and discard actions instead of an ambiguous browser confirm', () => {
        expect(page).toContain('id="posDraftRecoveryModal"');
        expect(page).toContain('Khôi phục bản nháp');
        expect(page).toContain('Hủy bản nháp');
        expect(controller).toContain('await requestPOSDraftRecovery(draft)');
        expect(controller).not.toContain("confirm('Hệ thống tìm thấy phiên Thu Ngân");
    });

    test('reports both recovery outcomes to the cashier', () => {
        expect(controller).toContain('Đã khôi phục bản nháp');
        expect(controller).toContain('Đã hủy bản nháp');
    });
});
