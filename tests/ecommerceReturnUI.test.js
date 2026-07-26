const fs = require('fs');
const path = require('path');

describe('ecommerce return invoice interface', () => {
    const html = fs.readFileSync(path.join(process.cwd(), 'pages/invoices.html'), 'utf8');
    const controller = fs.readFileSync(
        path.join(process.cwd(), 'js/features/pos/invoicesController.js'),
        'utf8'
    );

    test('exposes a dedicated ecommerce return list and creation form', () => {
        expect(html).toContain('id="ecommerceReturnHeaderActions"');
        expect(html).toContain('id="btnEcommerceReturns"');
        expect(html).toContain('id="ecommerceReturnsWrapper"');
        expect(html).toContain('id="ecommerceReturnModal"');
        expect(html).toContain('id="ecommerceReturnForm"');
        expect(html).toContain('id="ecommerceReturnProductSearch"');
    });

    test('controller creates, lists and cancels ecommerce return vouchers', () => {
        expect(controller).toMatch(/createEcommerceReturn/);
        expect(controller).toMatch(/fetchEcommerceReturns/);
        expect(controller).toMatch(/cancelEcommerceReturn/);
        expect(controller).toMatch(/loadEcommerceReturns/);
    });
});
