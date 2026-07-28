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

    test('keeps invoice navigation within narrow mobile viewports', () => {
        expect(html).toContain('class="invoice-header-actions flex flex-wrap');
        expect(html).toContain('class="invoice-subtabs');
        expect(html).toMatch(/@media\s*\(max-width:\s*639px\)/);
        expect(html).toMatch(/\.invoice-subtabs\s*\{[\s\S]*display:\s*grid\s*!important[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)[\s\S]*width:\s*100%\s*!important/);
        expect(html).toMatch(/#tabInvoices,[\s\S]*#tabDebts\s*\{[\s\S]*min-width:\s*0/);
    });
});
