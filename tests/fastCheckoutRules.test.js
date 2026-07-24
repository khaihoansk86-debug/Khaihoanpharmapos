const { execFileSync } = require('child_process');

describe('fast checkout rules', () => {
    function runCheck(body) {
        execFileSync('node', ['--input-type=module', '-e', body], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('only simple retail and ecommerce carts use the atomic fast path', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { canUseAtomicCheckout } from './js/features/pos/fastCheckoutRules.js';
            const item = {
                id: '11111111-1111-4111-8111-111111111111',
                batchId: '33333333-3333-4333-8333-333333333333',
                name: 'Paracetamol',
                quantity: 2,
                price: 10000,
                conversionRate: 1
            };
            assert.equal(canUseAtomicCheckout({ orderData: {}, cartItems: [item] }), true);
            assert.equal(canUseAtomicCheckout({ orderData: { isEcommerce: true }, cartItems: [item] }), true);
            assert.equal(canUseAtomicCheckout({ orderData: { isInternal: true }, cartItems: [item] }), false);
            assert.equal(canUseAtomicCheckout({ orderData: { isDoseCut: true }, cartItems: [item] }), false);
            assert.equal(canUseAtomicCheckout({ orderData: { customerPhone: '0900000000' }, cartItems: [item] }), false);
            assert.equal(canUseAtomicCheckout({ orderData: {}, cartItems: [{ ...item, batchId: null }] }), false);
            assert.equal(canUseAtomicCheckout({ orderData: {}, cartItems: [{ ...item, isCustom: true }] }), false);
            assert.equal(canUseAtomicCheckout({
                orderData: {},
                cartItems: [{ ...item, description: JSON.stringify({ isCombo: true, items: [] }) }]
            }), false);
            assert.equal(canUseAtomicCheckout({
                orderData: {},
                cartItems: [{ ...item, description: JSON.stringify({ is_dose_retail: true }) }]
            }), false);
        `);
    });

    test('builds a bounded RPC payload while preserving money and stock conversion', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { buildAtomicCheckoutPayload } from './js/features/pos/fastCheckoutRules.js';
            const result = buildAtomicCheckoutPayload({
                orderData: {
                    orderCode: 'HD202607240001',
                    customerName: 'Khách lẻ',
                    subtotal: 40000,
                    discount: 5000,
                    total: 35000,
                    amountReceived: 50000,
                    changeAmount: 15000,
                    paymentMethod: 'cash',
                    sellerEmployeeId: '22222222-2222-4222-8222-222222222222'
                },
                cartItems: [{
                    id: '11111111-1111-4111-8111-111111111111',
                    batchId: '33333333-3333-4333-8333-333333333333',
                    name: 'Paracetamol',
                    code: 'P001',
                    unit: 'Vỉ',
                    quantity: 2,
                    conversionRate: 10,
                    price: 20000
                }]
            });
            assert.equal(result.p_order.order_code, 'HD202607240001');
            assert.equal(result.p_order.total, 35000);
            assert.equal(result.p_order.change_amount, 15000);
            assert.equal(result.p_items[0].stock_quantity, 20);
            assert.equal(result.p_items[0].total_price, 40000);
            assert.equal(result.p_idempotency_key, 'HD202607240001');
        `);
    });

    test('uses one RPC call, falls back only when the function is not deployed, and never falls back on timeout', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { createOrderWithAtomicFastPath } from './js/features/pos/fastCheckoutService.js';
            const orderData = { orderCode: 'HD202607240001', total: 10000 };
            const cartItems = [{
                id: '11111111-1111-4111-8111-111111111111',
                batchId: '33333333-3333-4333-8333-333333333333',
                name: 'Paracetamol', quantity: 1, price: 10000
            }];

            let fallbackCount = 0;
            const success = await createOrderWithAtomicFastPath(orderData, cartItems, {
                client: { rpc: async () => ({ data: { id: 'o1', status: 'completed' }, error: null }) },
                fallback: async () => { fallbackCount++; }
            });
            assert.equal(success.id, 'o1');
            assert.equal(fallbackCount, 0);

            await createOrderWithAtomicFastPath(orderData, cartItems, {
                client: { rpc: async () => ({ data: null, error: { code: 'PGRST202', message: 'function not found' } }) },
                fallback: async () => { fallbackCount++; return { id: 'legacy' }; }
            });
            assert.equal(fallbackCount, 1);

            await assert.rejects(() => createOrderWithAtomicFastPath(orderData, cartItems, {
                client: { rpc: async () => ({ data: null, error: new Error('Failed to fetch') }) },
                fallback: async () => { fallbackCount++; }
            }), /Failed to fetch/);
            assert.equal(fallbackCount, 1);
        `);
    });
});
