const fs = require('fs');
const path = require('path');

describe('offline return source resolution', () => {
    const service = fs.readFileSync(
        path.join(process.cwd(), 'js/features/pos/comboInvoiceLifecycleService.js'),
        'utf8'
    );
    const controller = fs.readFileSync(
        path.join(process.cwd(), 'js/features/pos/posController.js'),
        'utf8'
    );

    test('resolves an offline source order code before combo integrity checks', () => {
        expect(service).toContain(".from('orders')");
        expect(service).toContain(".eq('order_code', resolvedSourceOrder.order_code)");
        expect(service).toContain('fetchOrderDetail(sourceHeader.id)');
        expect(service).toContain('let resolvedSourceOrder');
        expect(service).toContain('assertComboOrderReversible(resolvedSourceOrder)');
    });

    test('offline return sync still passes the source reference into the integrity service', () => {
        expect(controller).toContain("createReturnOrder({ order_code: order.sourceId }");
    });

    test('exposes an explicit confirmed action for canceling a stuck offline order', () => {
        expect(controller).toContain('window.cancelOfflineOrder = async function cancelOfflineOrder');
        expect(controller).toContain('data-action="cancel-offline-order"');
        expect(controller).toContain('cancelOrderWithComboIntegrity');
        expect(controller).toContain('removeOfflineOrder(id);');
    });
});
