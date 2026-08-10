const { execFileSync } = require('child_process');

describe('mixed combo and standard cart UI', () => {
    test('keeps combo and standard lines as separate cart rows', async () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import { JSDOM } from 'jsdom';
            const dom = new JSDOM(\
                '<div id="cartBody"></div><div id="emptyCart"></div>' +
                '<span id="itemCount"></span><span id="totalItemsBadge"></span>' +
                '<div id="returnSection"></div><div id="returnCartBody"></div>' +
                '<span id="returnTotalDisplay"></span><span id="subtotal"></span>' +
                '<span id="discount"></span><span id="totalFinalDisplay"></span>' +
                '<span id="changeAmount"></span><input id="discountAmount" value="0">' +
                '<input id="amountReceived" value="0">'
            );
            globalThis.window = dom.window;
            globalThis.document = dom.window.document;
            const { renderCart } = await import('./js/features/pos/posUI.js?mixed-cart-ui');
            const combo = {
                cartId: 'combo-row', id: 'combo-1', productId: 'combo-1', code: 'CB001',
                name: 'Combo A', unit: 'Combo', price: 100000, quantity: 1,
                units: [{ unit_name: 'Combo', retail_price: 100000 }], batches: [],
                description: JSON.stringify({ isCombo: true, items: [{ id: 'p1', name: 'Hàng A', unit: 'Hộp', quantity: 1 }] }),
                comboAvailability: { isCombo: true, availableQuantity: 2 }
            };
            const standard = {
                cartId: 'standard-row', id: 'product-1', productId: 'product-1', code: 'SP001',
                name: 'Hàng thường', unit: 'Hộp', price: 20000, quantity: 1,
                units: [{ unit_name: 'Hộp', retail_price: 20000 }], batches: [], description: null
            };
            renderCart([combo, standard]);
            const rows = document.getElementById('cartBody').children;
            assert.equal(rows.length, 2);
            assert.match(rows[0].textContent, /Combo A/);
            assert.doesNotMatch(rows[0].textContent, /Hàng thường/);
            assert.match(rows[1].textContent, /Hàng thường/);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });
});
