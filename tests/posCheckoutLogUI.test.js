const fs = require('fs');
const path = require('path');

describe('POS checkout log UI', () => {
    const html = fs.readFileSync(path.join(process.cwd(), 'pages/pos.html'), 'utf8');
    const controller = fs.readFileSync(path.join(process.cwd(), 'js/features/pos/posController.js'), 'utf8');

    test('provides a collapsible session log with clear action', () => {
        expect(html).toContain('id="posCheckoutLog"');
        expect(html).toContain('id="posCheckoutLogList"');
        expect(html).toContain('window.toggleCheckoutLog()');
        expect(html).toContain('window.clearCheckoutLog()');
    });

    test('records online and offline checkout outcomes', () => {
        expect(controller).toContain('recordCheckoutLog({ orderCode: orderPayload.orderCode || orderCode, workflow: checkoutWorkflow, cartItems: checkoutCart, status: \'offline\' });');
        expect(controller).toContain('recordCheckout: options => recordCheckoutLog(options)');
        expect(controller).toContain("summaryItems.join(' + ')");
        expect(controller).toContain('cartItems: checkoutCart');
    });
});
