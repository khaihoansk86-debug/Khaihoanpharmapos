const { execFileSync } = require('child_process');

describe('POS checkout snapshot rules', () => {
    function runCheck(scriptBody) {
        execFileSync('node', ['--input-type=module', '-e', scriptBody], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('keeps ecommerce Shopee classification after mutable UI flags change', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import {
                createCheckoutSnapshot,
                getCheckoutStorageType
            } from './js/features/pos/posCheckoutSnapshotRules.js';

            const tab = { id: 'tab-1', type: 'sale', isEcommerce: true };
            const mutableModes = { isEcommerce: true };
            const cartItem = { id: 'product-1', quantity: 1 };
            const snapshot = createCheckoutSnapshot({
                tab,
                cartItems: [cartItem],
                fallbackModes: mutableModes,
                ecommercePlatform: 'Shopee'
            });

            tab.isEcommerce = false;
            mutableModes.isEcommerce = false;
            cartItem.quantity = 99;

            assert.equal(snapshot.isEcommerce, true);
            assert.equal(snapshot.ecommercePlatform, 'Shopee');
            assert.equal(getCheckoutStorageType(snapshot), 'ecommerce');
            assert.equal(snapshot.cartItems.length, 1);
            assert.equal(snapshot.cartItems[0].quantity, 1);
            assert.equal(Object.isFrozen(snapshot.cartItems[0]), true);
        `);
    });

    test('uses the active tab as authority instead of a stale global ecommerce flag', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import {
                createCheckoutSnapshot,
                getCheckoutStorageType
            } from './js/features/pos/posCheckoutSnapshotRules.js';

            const snapshot = createCheckoutSnapshot({
                tab: { id: 'tab-2', type: 'sale', isEcommerce: true },
                fallbackModes: { isEcommerce: false },
                ecommercePlatform: 'Shopee'
            });

            assert.equal(snapshot.isEcommerce, true);
            assert.equal(getCheckoutStorageType(snapshot), 'ecommerce');
        `);
    });
});
