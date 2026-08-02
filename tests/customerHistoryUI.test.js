const fs = require('fs');
const path = require('path');

describe('customer history item integration', () => {
    const serviceSource = fs.readFileSync(
        path.join(__dirname, '../js/features/customers/customerService.js'),
        'utf8'
    );
    const controllerSource = fs.readFileSync(
        path.join(__dirname, '../js/features/customers/customerController.js'),
        'utf8'
    );
    const pageSource = fs.readFileSync(
        path.join(__dirname, '../pages/customers.html'),
        'utf8'
    );

    test('loads persisted order item snapshots with each customer order', () => {
        expect(serviceSource).toContain('order_items(');
        [
            'product_name',
            'product_code',
            'unit_name',
            'quantity',
            'line_type',
            'sort_index'
        ].forEach(field => expect(serviceSource).toContain(field));
    });

    test('renders compact product details and return quantities in invoice rows', () => {
        expect(controllerSource).toContain('renderCustomerHistoryItems(order.order_items)');
        expect(controllerSource).toContain('Xem thêm ${formatNumber(remainingItems.length)} mặt hàng');
        expect(controllerSource).toContain('Trả ${formatNumber(Math.abs(item.quantity))}');
        expect(controllerSource).toContain('escapeHTML(item.name)');
    });

    test('keeps the wider history table usable on small screens', () => {
        expect(pageSource).toContain('overflow-auto min-h-[300px]');
        expect(pageSource).toContain('min-w-[760px]');
        expect(pageSource).toContain('aria-label="Đóng lịch sử mua hàng"');
    });
});
