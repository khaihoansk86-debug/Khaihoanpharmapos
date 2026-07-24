const fs = require('fs');
const path = require('path');

function read(relativePath) {
    return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('Seller attribution integration', () => {
    test('captures the logged-in seller for online and offline orders', () => {
        const controller = read('js/features/pos/posController.js');

        expect(controller).toContain('sellerEmployeeId: getLoggedInEmployeeId()');
        expect(controller).toContain('sellerEmployeeId: order.orderData?.sellerEmployeeId || order.employeeId || null');
    });

    test('persists and reads seller_employee_id during reconciliation', () => {
        const orderService = read('js/features/pos/orderService.js');
        const reconciliation = read('js/features/pos/shiftRevenueReconciliationService.js');
        const migration = read('supabase/migrations/046_add_order_seller_employee.sql');

        expect(orderService).toContain('seller_employee_id: orderData.sellerEmployeeId || null');
        expect(reconciliation).toContain('order.seller_employee_id');
        expect(reconciliation).toContain('seller_employee_id');
        expect(migration).toMatch(/ADD COLUMN IF NOT EXISTS seller_employee_id UUID/i);
    });
});
