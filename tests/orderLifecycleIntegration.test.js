const { execFileSync } = require('child_process');

describe('POS order lifecycle integration rules', () => {
    function runCheck(scriptBody) {
        execFileSync('node', ['--input-type=module', '-e', scriptBody], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('create, return, edit, and cancel produce reversible customer metric deltas', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import {
                getCancelCustomerMetricDelta,
                getCreateCustomerMetricDelta,
                getEditCustomerMetricDelta,
                getReturnCustomerMetricDelta
            } from './js/features/pos/customerMetricRules.js';

            assert.deepEqual(getCreateCustomerMetricDelta(120000), {
                totalDelta: 120000,
                orderCountDelta: 1
            });
            assert.deepEqual(getReturnCustomerMetricDelta(-30000), {
                totalDelta: -30000,
                orderCountDelta: 0
            });
            assert.deepEqual(getEditCustomerMetricDelta(120000, 95000), {
                totalDelta: -25000,
                orderCountDelta: 0
            });
            assert.deepEqual(getCancelCustomerMetricDelta({
                order_code: 'HD202606240001',
                total: 95000
            }), {
                totalDelta: -95000,
                orderCountDelta: -1
            });
            assert.deepEqual(getCancelCustomerMetricDelta({
                order_code: 'TH202606240001',
                total: -30000
            }), {
                totalDelta: 30000,
                orderCountDelta: 0
            });
        `);
    });

    test('inventory write failure rolls back stock, items, and order in reverse-safe workflow', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { executeOrderPersistenceWorkflow } from './js/features/pos/orderPersistenceWorkflow.js';

            const events = [];
            await assert.rejects(() => executeOrderPersistenceWorkflow({
                insertItems: async () => events.push('items-inserted'),
                deductInventory: async () => {
                    events.push('stock-started');
                    const error = new Error('stock write failed');
                    error.inventoryChanges = [{ batchId: 'b1', quantity: 2 }];
                    throw error;
                },
                rollbackInventory: async changes => events.push('stock-rolled-back:' + changes.length),
                deleteItems: async () => events.push('items-deleted'),
                deleteOrder: async () => events.push('order-deleted')
            }), /stock write failed/);

            assert.deepEqual(events, [
                'items-inserted',
                'stock-started',
                'stock-rolled-back:1',
                'items-deleted',
                'order-deleted'
            ]);
        `);
    });

    test('successful create workflow writes items, inventory, then post-processing without rollback', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { executeOrderPersistenceWorkflow } from './js/features/pos/orderPersistenceWorkflow.js';

            const events = [];
            const result = await executeOrderPersistenceWorkflow({
                insertItems: async () => events.push('items-inserted'),
                deductInventory: async () => {
                    events.push('stock-deducted');
                    return [{ batchId: 'b1', quantity: 2 }];
                },
                afterInventory: async () => events.push('metrics-adjusted'),
                rollbackInventory: async () => events.push('unexpected-stock-rollback'),
                deleteItems: async () => events.push('unexpected-items-delete'),
                deleteOrder: async () => events.push('unexpected-order-delete')
            });

            assert.deepEqual(events, [
                'items-inserted',
                'stock-deducted',
                'metrics-adjusted'
            ]);
            assert.equal(result.inventoryChanges.length, 1);
        `);
    });

    test('combo order payload persists parent revenue line and zero-revenue component lines', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { buildOrderItemsPayload } from './js/features/pos/comboOrderRules.js';

            const rows = buildOrderItemsPayload({
                orderId: '11111111-1111-4111-8111-111111111111',
                payableItems: [{
                    id: '22222222-2222-4222-8222-222222222222',
                    productId: '22222222-2222-4222-8222-222222222222',
                    code: 'CB001',
                    name: 'Combo Cảm',
                    unit: 'Combo',
                    price: 50000,
                    quantity: 2,
                    description: JSON.stringify({
                        isCombo: true,
                        items: [
                            { id: '33333333-3333-4333-8333-333333333333', name: 'Paracetamol', quantity: 2, unit: 'Viên' },
                            { id: '44444444-4444-4444-8444-444444444444', name: 'Vitamin C', quantity: 1, unit: 'Viên' }
                        ]
                    })
                }],
                existingProductIds: new Set([
                    '22222222-2222-4222-8222-222222222222',
                    '33333333-3333-4333-8333-333333333333',
                    '44444444-4444-4444-8444-444444444444'
                ]),
                existingBatchIds: new Set(),
                componentMetaMap: new Map([
                    ['33333333-3333-4333-8333-333333333333', { product_code: 'PA001', base_unit_name: 'Viên' }],
                    ['44444444-4444-4444-8444-444444444444', { product_code: 'VC001', base_unit_name: 'Viên' }]
                ])
            });

            assert.equal(rows.length, 3);
            assert.equal(rows[0].line_type, 'combo_parent');
            assert.equal(rows[0].total_price, 100000);
            assert.equal(rows[1].line_type, 'combo_component');
            assert.equal(rows[1].parent_order_item_id, rows[0].id);
            assert.equal(rows[1].quantity, 4);
            assert.equal(rows[1].total_price, 0);
            assert.equal(rows[2].quantity, 2);
        `);
    });

    test('combo return payload persists negative combo parent and negative component quantities', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { buildReturnOrderItemsPayload } from './js/features/pos/comboOrderRules.js';

            const rows = buildReturnOrderItemsPayload({
                orderId: '11111111-1111-4111-8111-111111111111',
                returnItems: [{
                    sourceOrderItemId: 'aaaa1111-1111-4111-8111-111111111111',
                    id: '22222222-2222-4222-8222-222222222222',
                    productId: '22222222-2222-4222-8222-222222222222',
                    code: 'CB001',
                    name: 'Combo Cảm',
                    unit: 'Combo',
                    price: 50000,
                    quantity: 1
                }],
                newItems: [],
                sourceOrderItems: [
                    {
                        id: 'aaaa1111-1111-4111-8111-111111111111',
                        product_id: '22222222-2222-4222-8222-222222222222',
                        product_name: 'Combo Cảm',
                        product_code: 'CB001',
                        unit_name: 'Combo',
                        unit_price: 50000,
                        quantity: 2,
                        line_type: 'combo_parent'
                    },
                    {
                        id: 'bbbb1111-1111-4111-8111-111111111111',
                        product_id: '33333333-3333-4333-8333-333333333333',
                        product_name: 'Paracetamol',
                        product_code: 'PA001',
                        unit_name: 'Viên',
                        quantity: 4,
                        batch_id: '55555555-5555-4555-8555-555555555555',
                        line_type: 'combo_component',
                        parent_order_item_id: 'aaaa1111-1111-4111-8111-111111111111'
                    }
                ],
                existingProductIds: new Set([
                    '22222222-2222-4222-8222-222222222222',
                    '33333333-3333-4333-8333-333333333333'
                ]),
                existingBatchIds: new Set(['55555555-5555-4555-8555-555555555555'])
            });

            assert.equal(rows.length, 2);
            assert.equal(rows[0].line_type, 'combo_parent');
            assert.equal(rows[0].quantity, -1);
            assert.equal(rows[0].total_price, -50000);
            assert.equal(rows[1].line_type, 'combo_component');
            assert.equal(rows[1].parent_order_item_id, rows[0].id);
            assert.equal(rows[1].quantity, -2);
            assert.equal(rows[1].batch_id, '55555555-5555-4555-8555-555555555555');
        `);
    });

    test('combo batch reconciliation splits component rows by actual batch allocations', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { buildComboBatchReconciliation } from './js/features/pos/comboOrderRules.js';

            const result = buildComboBatchReconciliation(
                [{
                    id: 'comp-row-1',
                    order_id: 'order-1',
                    product_id: 'product-1',
                    batch_id: null,
                    product_name: 'Paracetamol',
                    product_code: 'PA001',
                    unit_name: 'Viên',
                    unit_price: 0,
                    quantity: 5,
                    total_price: 0,
                    line_type: 'combo_component',
                    parent_order_item_id: 'parent-1',
                    sort_index: 10
                }],
                [
                    { comboParentRowId: 'parent-1', productId: 'product-1', batchId: 'batch-a', quantity: 2 },
                    { comboParentRowId: 'parent-1', productId: 'product-1', batchId: 'batch-b', quantity: 3 }
                ]
            );

            assert.equal(result.updates.length, 0);
            assert.equal(result.replacements.length, 1);
            assert.equal(result.replacements[0].rows.length, 2);
            assert.notEqual(result.replacements[0].rows[0].id, 'comp-row-1');
            assert.equal(result.replacements[0].rows[0].batch_id, 'batch-a');
            assert.equal(result.replacements[0].rows[0].quantity, 2);
            assert.equal(result.replacements[0].rows[1].batch_id, 'batch-b');
            assert.equal(result.replacements[0].rows[1].quantity, 3);
        `);
    });

    test('combo batch reconciliation splits every component when multiple combo ingredients use multiple batches', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { buildComboBatchReconciliation } from './js/features/pos/comboOrderRules.js';

            const result = buildComboBatchReconciliation(
                [
                    {
                        id: 'comp-row-a',
                        order_id: 'order-1',
                        product_id: 'product-a',
                        batch_id: null,
                        product_name: 'Bơm tiêm 5cc',
                        product_code: 'BT5',
                        unit_name: 'Cái',
                        unit_price: 0,
                        quantity: 3,
                        total_price: 0,
                        line_type: 'combo_component',
                        parent_order_item_id: 'parent-1',
                        sort_index: 10
                    },
                    {
                        id: 'comp-row-b',
                        order_id: 'order-1',
                        product_id: 'product-b',
                        batch_id: null,
                        product_name: 'Becozym',
                        product_code: 'BCZ',
                        unit_name: 'Ống',
                        unit_price: 0,
                        quantity: 4,
                        total_price: 0,
                        line_type: 'combo_component',
                        parent_order_item_id: 'parent-1',
                        sort_index: 11
                    }
                ],
                [
                    { comboParentRowId: 'parent-1', productId: 'product-a', batchId: 'batch-a1', quantity: 1 },
                    { comboParentRowId: 'parent-1', productId: 'product-a', batchId: 'batch-a2', quantity: 2 },
                    { comboParentRowId: 'parent-1', productId: 'product-b', batchId: 'batch-b1', quantity: 1 },
                    { comboParentRowId: 'parent-1', productId: 'product-b', batchId: 'batch-b2', quantity: 3 }
                ]
            );

            assert.equal(result.updates.length, 0);
            assert.equal(result.replacements.length, 2);

            const replacementA = result.replacements.find(item => item.deleteId === 'comp-row-a');
            const replacementB = result.replacements.find(item => item.deleteId === 'comp-row-b');

            assert.ok(replacementA);
            assert.ok(replacementB);

            assert.equal(replacementA.rows.length, 2);
            assert.notEqual(replacementA.rows[0].id, 'comp-row-a');
            assert.notEqual(replacementA.rows[1].id, 'comp-row-a');
            assert.equal(replacementA.rows[0].batch_id, 'batch-a1');
            assert.equal(replacementA.rows[0].quantity, 1);
            assert.equal(replacementA.rows[1].batch_id, 'batch-a2');
            assert.equal(replacementA.rows[1].quantity, 2);

            assert.equal(replacementB.rows.length, 2);
            assert.notEqual(replacementB.rows[0].id, 'comp-row-b');
            assert.notEqual(replacementB.rows[1].id, 'comp-row-b');
            assert.equal(replacementB.rows[0].batch_id, 'batch-b1');
            assert.equal(replacementB.rows[0].quantity, 1);
            assert.equal(replacementB.rows[1].batch_id, 'batch-b2');
            assert.equal(replacementB.rows[1].quantity, 3);
        `);
    });

    test('partial combo return keeps integer component quantities even when source component was split across batches', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { buildReturnOrderItemsPayload } from './js/features/pos/comboOrderRules.js';

            const rows = buildReturnOrderItemsPayload({
                orderId: '11111111-1111-4111-8111-111111111111',
                returnItems: [{
                    sourceOrderItemId: 'parent-1',
                    id: 'combo-1',
                    productId: 'combo-1',
                    code: 'CB001',
                    name: 'Chích thuốc khỏe',
                    unit: 'Combo',
                    price: 15000,
                    quantity: 1
                }],
                sourceOrderItems: [
                    {
                        id: 'parent-1',
                        product_id: 'combo-1',
                        product_name: 'Chích thuốc khỏe',
                        product_code: 'CB001',
                        unit_name: 'Combo',
                        unit_price: 15000,
                        quantity: 3,
                        line_type: 'combo_parent'
                    },
                    {
                        id: 'comp-1',
                        product_id: 'becozym',
                        product_name: 'Becozym',
                        product_code: 'BCZ',
                        unit_name: 'Ống',
                        quantity: 1,
                        batch_id: 'batch-a',
                        line_type: 'combo_component',
                        parent_order_item_id: 'parent-1'
                    },
                    {
                        id: 'comp-2',
                        product_id: 'becozym',
                        product_name: 'Becozym',
                        product_code: 'BCZ',
                        unit_name: 'Ống',
                        quantity: 2,
                        batch_id: 'batch-b',
                        line_type: 'combo_component',
                        parent_order_item_id: 'parent-1'
                    }
                ],
                existingProductIds: new Set(['combo-1', 'becozym']),
                existingBatchIds: new Set(['batch-a', 'batch-b']),
                comboDefinitionMap: new Map([
                    ['combo-1', { isCombo: true, items: [{ id: 'becozym', name: 'Becozym', unit: 'Ống', quantity: 1 }] }]
                ])
            });

            assert.equal(rows.length, 2);
            assert.equal(rows[1].quantity, -1);
            assert.equal(rows[1].batch_id, 'batch-a');
        `);
    });

    test('partial combo return splits restored components across original batches when needed', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { buildReturnOrderItemsPayload } from './js/features/pos/comboOrderRules.js';

            const rows = buildReturnOrderItemsPayload({
                orderId: '11111111-1111-4111-8111-111111111111',
                returnItems: [{
                    sourceOrderItemId: 'parent-1',
                    id: 'combo-1',
                    productId: 'combo-1',
                    code: 'CB001',
                    name: 'ChÃ­ch thuá»‘c khá»e',
                    unit: 'Combo',
                    price: 15000,
                    quantity: 2
                }],
                sourceOrderItems: [
                    {
                        id: 'parent-1',
                        product_id: 'combo-1',
                        product_name: 'ChÃ­ch thuá»‘c khá»e',
                        product_code: 'CB001',
                        unit_name: 'Combo',
                        unit_price: 15000,
                        quantity: 3,
                        line_type: 'combo_parent'
                    },
                    {
                        id: 'comp-1',
                        product_id: 'becozym',
                        product_name: 'Becozym',
                        product_code: 'BCZ',
                        unit_name: 'á»ng',
                        quantity: 1,
                        batch_id: 'batch-a',
                        line_type: 'combo_component',
                        parent_order_item_id: 'parent-1'
                    },
                    {
                        id: 'comp-2',
                        product_id: 'becozym',
                        product_name: 'Becozym',
                        product_code: 'BCZ',
                        unit_name: 'á»ng',
                        quantity: 2,
                        batch_id: 'batch-b',
                        line_type: 'combo_component',
                        parent_order_item_id: 'parent-1'
                    }
                ],
                existingProductIds: new Set(['combo-1', 'becozym']),
                existingBatchIds: new Set(['batch-a', 'batch-b']),
                comboDefinitionMap: new Map([
                    ['combo-1', { isCombo: true, items: [{ id: 'becozym', name: 'Becozym', unit: 'á»ng', quantity: 1 }] }]
                ])
            });

            assert.equal(rows.length, 3);
            assert.equal(rows[1].quantity, -1);
            assert.equal(rows[1].batch_id, 'batch-a');
            assert.equal(rows[2].quantity, -1);
            assert.equal(rows[2].batch_id, 'batch-b');
        `);
    });
});
