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
});
