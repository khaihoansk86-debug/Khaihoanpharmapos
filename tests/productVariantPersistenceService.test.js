const { execFileSync } = require('child_process');

describe('product variant persistence service', () => {
    test('saves one atomic RPC payload and returns the persisted SKU id', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                saveProductVariantAtomic
            } from './js/features/products/productVariantPersistenceService.js';

            const calls = [];
            const client = {
                async rpc(name, args) {
                    calls.push({ name, args });
                    return {
                        data: { product_id: 'sku-1' },
                        error: null
                    };
                }
            };
            const payload = {
                product_id: 'sku-1',
                variant_label: '650mg',
                product_code: 'HAP-650',
                base_cost: 700,
                base_retail: 1000,
                manage_packaging: false,
                units: [],
                batches: []
            };

            assert.equal(await saveProductVariantAtomic(client, payload), 'sku-1');
            assert.deepEqual(calls, [{
                name: 'save_product_variant_with_limits_atomic',
                args: { p_payload: payload }
            }]);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('rejects incomplete identity before making a database call', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                saveProductVariantAtomic
            } from './js/features/products/productVariantPersistenceService.js';

            let called = false;
            const client = {
                async rpc() {
                    called = true;
                    return { data: null, error: null };
                }
            };
            await assert.rejects(
                saveProductVariantAtomic(client, {
                    variant_label: '',
                    product_code: 'HAP-650'
                }),
                /tên biến thể/i
            );
            assert.equal(called, false);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });
});
