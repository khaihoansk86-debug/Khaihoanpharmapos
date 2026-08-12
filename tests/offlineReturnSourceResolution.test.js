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
    const page = fs.readFileSync(
        path.join(process.cwd(), 'pages/pos.html'),
        'utf8'
    );
    const serviceWorker = fs.readFileSync(
        path.join(process.cwd(), 'sw.js'),
        'utf8'
    );

    test('resolves an offline source order code before combo integrity checks', () => {
        expect(service).toContain(".from('orders')");
        expect(service).toContain(".eq('order_code', sourceOrder.order_code)");
        expect(service).toContain('fetchOrderDetail(sourceHeader.id)');
        expect(service).toContain('const resolvedSourceOrder = await resolveFreshSourceOrder');
        expect(service).toContain('assertComboOrderReversible(resolvedSourceOrder)');
    });

    test('offline return sync still passes the source reference into the integrity service', () => {
        expect(controller).toContain('returnOrder: { order_code: order.sourceId }');
        expect(controller).toContain('returnOptions: { isOfflineSync: true }');
    });

    test('exposes an explicit confirmed action for canceling a stuck offline order', () => {
        expect(controller).toContain('window.cancelOfflineOrder = async function cancelOfflineOrder');
        expect(controller).toContain('data-action="cancel-offline-order"');
        expect(controller).toContain('cancelOrderWithComboIntegrity');
        expect(controller).toContain('removeOfflineOrder(id);');
    });

    test('keeps offline sync resilient for all transport errors', () => {
        expect(controller).toContain('isRecoverableNetworkError(err) || navigator.onLine === false');
        expect(controller).toContain('const errorCode = err?.code;');
    });

    test('refreshes restored return drafts from the source invoice after F5', () => {
        expect(controller).toContain('await loadOrderForReturn(returnTab, returnTab.cart);');
        expect(controller).toContain('const previousBySourceId = new Map');
        expect(controller).toContain('Math.min(Number(previous?.quantity || 0), Number(i.quantity || 0))');
    });

    test('reconciles stale return source ids before integrity validation', () => {
        expect(service).toContain("from './returnSourceReconciliationRules.js?v=20260812b'");
        expect(service).toContain('const reconciledCartItems = reconcileReturnSourceIds');
        expect(service).toContain('cartItems: reconciledCartItems');
    });

    test('invalidates cached POS bundles after a return workflow fix', () => {
        expect(page).not.toContain('posController.js?v=20260805a');
        expect(serviceWorker).toContain("const CACHE_NAME = 'khai-hoan-pos-v31'");
    });
});
