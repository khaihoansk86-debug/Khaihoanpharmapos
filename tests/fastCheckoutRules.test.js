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

    test('includes a deterministic FEFO allocation plan when one sale spans multiple batches', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { buildAtomicCheckoutPayload } from './js/features/pos/fastCheckoutRules.js';

            const result = buildAtomicCheckoutPayload({
                orderData: {
                    orderCode: 'HD-APITIM-SPLIT',
                    subtotal: 100000,
                    total: 100000
                },
                cartItems: [{
                    id: '11111111-1111-4111-8111-111111111111',
                    batchId: '22222222-2222-4222-8222-222222222222',
                    name: 'Apitim 5',
                    code: 'SP001284',
                    unit: 'Hộp',
                    quantity: 1,
                    conversionRate: 30,
                    price: 100000,
                    batches: [
                        {
                            id: '22222222-2222-4222-8222-222222222222',
                            batch_number: '091125',
                            expiry_date: '2028-11-26',
                            stock_quantity: 20
                        },
                        {
                            id: '33333333-3333-4333-8333-333333333333',
                            batch_number: '050526',
                            expiry_date: '2029-05-08',
                            stock_quantity: 2760
                        }
                    ]
                }]
            });

            assert.deepEqual(result.p_items[0].batch_allocations, [
                {
                    batch_id: '22222222-2222-4222-8222-222222222222',
                    stock_quantity: 20
                },
                {
                    batch_id: '33333333-3333-4333-8333-333333333333',
                    stock_quantity: 10
                }
            ]);
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

    test('routes combo and mixed carts to a dedicated atomic combo payload', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import {
                buildAtomicComboCheckoutPayload,
                canUseAtomicComboCheckout
            } from './js/features/pos/comboAtomicCheckoutRules.js';

            const combo = {
                id: '11111111-1111-4111-8111-111111111111',
                name: 'Combo suc khoe',
                code: 'CB001',
                unit: 'Combo',
                quantity: 2,
                price: 50000,
                description: JSON.stringify({
                    isCombo: true,
                    items: [{
                        id: '22222222-2222-4222-8222-222222222222',
                        name: 'Thuoc A',
                        unit: 'Vien',
                        quantity: 3
                    }]
                })
            };
            const standard = {
                id: '33333333-3333-4333-8333-333333333333',
                batchId: '44444444-4444-4444-8444-444444444444',
                name: 'Thuoc B',
                unit: 'Hop',
                quantity: 1,
                conversionRate: 10,
                price: 20000
            };
            const orderData = {
                orderCode: 'HD-COMBO-001',
                subtotal: 120000,
                discount: 5000,
                total: 115000
            };

            assert.equal(canUseAtomicComboCheckout({ orderData, cartItems: [combo] }), true);
            assert.equal(canUseAtomicComboCheckout({ orderData, cartItems: [standard, combo] }), true);
            assert.equal(canUseAtomicComboCheckout({ orderData, cartItems: [standard] }), false);
            assert.equal(canUseAtomicComboCheckout({
                orderData,
                cartItems: [combo, { ...standard, batchId: null }]
            }), false);

            const payload = buildAtomicComboCheckoutPayload({
                orderData,
                cartItems: [standard, combo]
            });
            assert.equal(payload.p_idempotency_key, 'HD-COMBO-001');
            assert.equal(payload.p_items.length, 2);
            assert.equal(payload.p_items[0].line_kind, 'standard');
            assert.equal(payload.p_items[0].stock_quantity, 10);
            assert.equal(payload.p_items[1].line_kind, 'combo');
            assert.equal(payload.p_items[1].quantity, 2);
            assert.equal(payload.p_items[1].total_price, 100000);
            assert.equal('components' in payload.p_items[1], false);
        `);
    });

    test('mixed combo checkout also carries FEFO slices for standard products', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { buildAtomicComboCheckoutPayload } from './js/features/pos/comboAtomicCheckoutRules.js';

            const standard = {
                id: '11111111-1111-4111-8111-111111111111',
                batchId: '22222222-2222-4222-8222-222222222222',
                name: 'Apitim 5',
                unit: 'Hộp',
                quantity: 1,
                conversionRate: 30,
                price: 100000,
                batches: [
                    {
                        id: '22222222-2222-4222-8222-222222222222',
                        batch_number: '091125',
                        expiry_date: '2028-11-26',
                        stock_quantity: 20
                    },
                    {
                        id: '33333333-3333-4333-8333-333333333333',
                        batch_number: '050526',
                        expiry_date: '2029-05-08',
                        stock_quantity: 2760
                    }
                ]
            };
            const combo = {
                id: '44444444-4444-4444-8444-444444444444',
                name: 'Combo A',
                unit: 'Combo',
                quantity: 1,
                price: 50000,
                description: JSON.stringify({
                    isCombo: true,
                    items: [{
                        id: '55555555-5555-4555-8555-555555555555',
                        name: 'Thuốc A',
                        unit: 'Viên',
                        quantity: 1
                    }]
                })
            };

            const payload = buildAtomicComboCheckoutPayload({
                orderData: {
                    orderCode: 'HD-MIXED-SPLIT',
                    subtotal: 150000,
                    total: 150000
                },
                cartItems: [standard, combo]
            });

            assert.deepEqual(payload.p_items[0].batch_allocations, [
                {
                    batch_id: '22222222-2222-4222-8222-222222222222',
                    stock_quantity: 20
                },
                {
                    batch_id: '33333333-3333-4333-8333-333333333333',
                    stock_quantity: 10
                }
            ]);
        `);
    });

    test('combo RPC falls back only when undeployed and never on stock or validation errors', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { createOrderWithAtomicFastPath } from './js/features/pos/fastCheckoutService.js';

            const orderData = {
                orderCode: 'HD-COMBO-002',
                subtotal: 50000,
                total: 50000
            };
            const cartItems = [{
                id: '11111111-1111-4111-8111-111111111111',
                name: 'Combo A',
                unit: 'Combo',
                quantity: 1,
                price: 50000,
                description: JSON.stringify({
                    isCombo: true,
                    items: [{
                        id: '22222222-2222-4222-8222-222222222222',
                        name: 'Thuoc A',
                        unit: 'Vien',
                        quantity: 1
                    }]
                })
            }];

            let rpcName = '';
            let fallbackCount = 0;
            const success = await createOrderWithAtomicFastPath(orderData, cartItems, {
                client: {
                    rpc: async (name) => {
                        rpcName = name;
                        return { data: { id: 'combo-order', status: 'completed' }, error: null };
                    }
                },
                fallback: async () => { fallbackCount++; }
            });
            assert.equal(rpcName, 'create_pos_combo_order_atomic');
            assert.equal(success.id, 'combo-order');
            assert.equal(fallbackCount, 0);

            const legacy = await createOrderWithAtomicFastPath(orderData, cartItems, {
                client: {
                    rpc: async () => ({
                        data: null,
                        error: {
                            code: 'PGRST202',
                            message: 'Could not find create_pos_combo_order_atomic'
                        }
                    })
                },
                fallback: async () => {
                    fallbackCount++;
                    return { id: 'legacy-order' };
                }
            });
            assert.equal(legacy.id, 'legacy-order');
            assert.equal(fallbackCount, 1);

            await assert.rejects(() => createOrderWithAtomicFastPath(orderData, cartItems, {
                client: {
                    rpc: async () => ({
                        data: null,
                        error: new Error('INSUFFICIENT_COMBO_COMPONENT_STOCK')
                    })
                },
                fallback: async () => { fallbackCount++; }
            }), /INSUFFICIENT_COMBO_COMPONENT_STOCK/);
            assert.equal(fallbackCount, 1);
        `);
    });

    test('normalizes object combo descriptions before a mixed dose cart uses fallback checkout', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { createOrderWithAtomicFastPath } from './js/features/pos/fastCheckoutService.js';

            const comboDescription = {
                isCombo: true,
                items: [{
                    id: '22222222-2222-4222-8222-222222222222',
                    name: 'Thuốc thành phần',
                    unit: 'Viên',
                    quantity: 1
                }]
            };
            const combo = {
                id: '11111111-1111-4111-8111-111111111111',
                name: 'Chích viêm mũi dị ứng',
                unit: 'Combo',
                quantity: 1,
                price: 200000,
                description: comboDescription,
                batches: [],
                batchId: null
            };
            const dosePackage = {
                id: '33333333-3333-4333-8333-333333333333',
                name: 'Thuốc liều 12k',
                unit: 'Gói',
                quantity: 4,
                price: 12000,
                description: JSON.stringify({ is_dose_retail: true }),
                batchId: '44444444-4444-4444-8444-444444444444',
                batchNo: '0000'
            };

            let fallbackItems = null;
            await createOrderWithAtomicFastPath(
                { orderCode: 'HD-COMBO-DOSE', total: 248000 },
                [combo, dosePackage],
                {
                    client: { rpc: async () => { throw new Error('RPC must not run'); } },
                    fallback: async (_order, items) => {
                        fallbackItems = items;
                        return { id: 'legacy-order' };
                    }
                }
            );

            assert.equal(typeof fallbackItems[0].description, 'string');
            assert.deepEqual(JSON.parse(fallbackItems[0].description), comboDescription);
            assert.equal(fallbackItems[0].batchId, null);
            assert.equal(fallbackItems[1].batchId, null);
            assert.equal(fallbackItems[1].batchNo, null);
        `);
    });
});
