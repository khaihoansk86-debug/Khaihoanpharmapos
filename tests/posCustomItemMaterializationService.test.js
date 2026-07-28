const { execFileSync } = require('child_process');

describe('POS custom item materialization service', () => {
    function runCheck(scriptBody) {
        execFileSync('node', ['--input-type=module', '-e', scriptBody], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('materializes frozen custom items without mutating the checkout snapshot', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { createCheckoutSnapshot } from './js/features/pos/posCheckoutSnapshotRules.js';
            import {
                materializePosCustomItems
            } from './js/features/pos/posCustomItemMaterializationService.js';

            const snapshot = createCheckoutSnapshot({
                cartItems: [{
                    id: 'CUSTOM-TEMP',
                    cartId: 'cart-1',
                    name: 'Khăn giấy',
                    unit: 'Gói',
                    price: 12000,
                    quantity: 2,
                    isCustom: true
                }]
            });
            const calls = [];
            const client = {
                async rpc(name, args) {
                    calls.push({ name, args });
                    return {
                        data: {
                            product_id: 'product-1',
                            batch_id: 'batch-1',
                            product_code: 'CUSTOM-ABC',
                            product_name: 'Khăn giấy'
                        },
                        error: null
                    };
                }
            };

            const result = await materializePosCustomItems(client, {
                orderCode: 'HD-001',
                cartItems: snapshot.cartItems,
                context: { isEcommerce: false }
            });

            assert.equal(Object.isFrozen(snapshot.cartItems[0]), true);
            assert.equal(snapshot.cartItems[0].id, 'CUSTOM-TEMP');
            assert.equal(snapshot.cartItems[0].isCustom, true);
            assert.notEqual(result, snapshot.cartItems);
            assert.notEqual(result[0], snapshot.cartItems[0]);
            assert.deepEqual(result[0], {
                ...snapshot.cartItems[0],
                id: 'product-1',
                productId: 'product-1',
                product_code: 'CUSTOM-ABC',
                code: 'CUSTOM-ABC',
                batchId: 'batch-1',
                isCustom: false,
                name: '[CẦN CẬP NHẬT] Khăn giấy'
            });
            assert.equal(calls.length, 1);
            assert.equal(calls[0].name, 'materialize_pos_custom_item');
            assert.equal(calls[0].args.p_idempotency_key, 'HD-001:cart-1');
            assert.deepEqual(calls[0].args.p_item, {
                name: 'Khăn giấy',
                unit_name: 'Gói',
                unit_price: 12000,
                cost_price: 0,
                stock_quantity: 2
            });
        `);
    });

    test('keeps normal items unchanged and validates custom input before RPC', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import {
                materializePosCustomItems
            } from './js/features/pos/posCustomItemMaterializationService.js';

            const normalItem = { id: 'product-1', quantity: 1, isCustom: false };
            let calls = 0;
            const client = {
                async rpc() {
                    calls += 1;
                    return { data: null, error: null };
                }
            };

            const unchanged = await materializePosCustomItems(client, {
                orderCode: 'HD-002',
                cartItems: [normalItem]
            });
            assert.equal(unchanged[0], normalItem);
            assert.equal(calls, 0);

            await assert.rejects(
                materializePosCustomItems(client, {
                    orderCode: 'HD-003',
                    cartItems: [{
                        cartId: 'cart-invalid',
                        name: ' ',
                        unit: 'Cái',
                        price: 1000,
                        quantity: 1,
                        isCustom: true
                    }]
                }),
                /tên mặt hàng/i
            );
            assert.equal(calls, 0);
        `);
    });

    test('requires a stable order code and cart identity for idempotent writes', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import {
                materializePosCustomItems
            } from './js/features/pos/posCustomItemMaterializationService.js';

            const client = {
                async rpc() {
                    throw new Error('RPC must not be called');
                }
            };
            const customItem = {
                name: 'Bông gòn',
                unit: 'Gói',
                price: 5000,
                quantity: 1,
                isCustom: true
            };

            await assert.rejects(
                materializePosCustomItems(client, {
                    orderCode: '',
                    cartItems: [{ ...customItem, cartId: 'cart-1' }]
                }),
                /mã hóa đơn/i
            );
            await assert.rejects(
                materializePosCustomItems(client, {
                    orderCode: 'HD-004',
                    cartItems: [customItem]
                }),
                /định danh dòng hàng/i
            );
        `);
    });
});
