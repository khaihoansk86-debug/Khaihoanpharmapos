const fs = require('fs');
const path = require('path');

describe('receive SKU selection UI', () => {
    const receivePage = fs.readFileSync(
        path.join(process.cwd(), 'pages/receive.html'),
        'utf8'
    );
    const receiveController = fs.readFileSync(
        path.join(process.cwd(), 'js/features/receive/receiveController.js'),
        'utf8'
    );

    test('guides staff to search a physical SKU by barcode or packaging identity', () => {
        expect(receivePage).toContain('Quét barcode hoặc tìm theo tên, mã SKU, hàm lượng, quy cách');
        expect(receivePage).toContain('nhóm sản phẩm cha không được cộng tồn trực tiếp');
        expect(receiveController).toContain('buildReceiveProductCatalog');
        expect(receiveController).toContain('searchReceiveProducts');
        expect(receiveController).toContain('meta.packagingLabel');
        expect(receiveController).toContain('meta.stockLabel');
        expect(receiveController).toContain('meta.barcode');
    });

    test('shows the stock conversion before the receipt is confirmed', () => {
        expect(receivePage).toContain('SL nhập / Quy đổi');
        expect(receivePage).toContain('Giá nhập / ĐVT');
        expect(receiveController).toContain('line-receive-summary');
        expect(receiveController).toContain('line-equation');
        expect(receiveController).toContain('line-cost-base');
        expect(receiveController).toContain('refreshReceiveLineCalculation');
    });

    test('preserves product identity snapshots in inventory document lines', () => {
        expect(receiveController).toMatch(/productName:\s*line\.productName/);
        expect(receiveController).toMatch(/productCode:\s*line\.productCode/);
    });
});
