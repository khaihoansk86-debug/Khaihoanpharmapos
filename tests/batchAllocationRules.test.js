const { execFileSync } = require('child_process');

describe('POS multi-batch allocation rules', () => {
    function runCheck(body) {
        execFileSync('node', ['--input-type=module', '-e', body], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('fills one 30-tablet box from 20 tablets in the oldest batch and 10 in the next batch', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { planFefoBatchAllocations } from './js/features/pos/batchAllocationRules.js';

            const allocations = planFefoBatchAllocations({
                requiredQuantity: 30,
                preferredBatchId: 'old-batch',
                batches: [
                    {
                        id: 'old-batch',
                        batch_number: '091125',
                        expiry_date: '2028-11-26',
                        stock_quantity: 20
                    },
                    {
                        id: 'new-batch',
                        batch_number: '050526',
                        expiry_date: '2029-05-08',
                        stock_quantity: 2760
                    }
                ]
            });

            assert.deepEqual(allocations, [
                {
                    batchId: 'old-batch',
                    batchNumber: '091125',
                    expiryDate: '2028-11-26',
                    quantity: 20,
                    costPrice: 0
                },
                {
                    batchId: 'new-batch',
                    batchNumber: '050526',
                    expiryDate: '2029-05-08',
                    quantity: 10,
                    costPrice: 0
                }
            ]);
        `);
    });

    test('restores the original batch slices across repeated partial returns', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { sliceBatchAllocationsForReturn } from './js/features/pos/batchAllocationRules.js';

            const sourceAllocations = [
                { batch_id: 'old-batch', quantity_base: 20, cost_price: 100 },
                { batch_id: 'new-batch', quantity_base: 40, cost_price: 120 }
            ];

            const firstReturn = sliceBatchAllocationsForReturn({
                sourceAllocations,
                sourceSaleQuantity: 2,
                returnQuantity: 1,
                alreadyReturnedQuantity: 0
            });
            assert.deepEqual(firstReturn, [
                { batch_id: 'old-batch', quantity_base: -20, cost_price: 100 },
                { batch_id: 'new-batch', quantity_base: -10, cost_price: 120 }
            ]);

            const secondReturn = sliceBatchAllocationsForReturn({
                sourceAllocations,
                sourceSaleQuantity: 2,
                returnQuantity: 1,
                alreadyReturnedQuantity: 1
            });
            assert.deepEqual(secondReturn, [
                { batch_id: 'new-batch', quantity_base: -30, cost_price: 120 }
            ]);
        `);
    });

    test('cancelling a sale restores stock while cancelling a return deducts it again', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { getBatchAllocationInventoryDeltas } from './js/features/pos/batchAllocationRules.js';

            const saleAllocations = [
                { batch_id: 'old-batch', quantity_base: 20 },
                { batch_id: 'new-batch', quantity_base: 10 }
            ];
            assert.deepEqual(
                getBatchAllocationInventoryDeltas({
                    allocations: saleAllocations,
                    mode: 'cancel'
                }),
                [
                    { batchId: 'old-batch', quantity: 20 },
                    { batchId: 'new-batch', quantity: 10 }
                ]
            );

            const returnAllocations = [
                { batch_id: 'old-batch', quantity_base: -20 },
                { batch_id: 'new-batch', quantity_base: -10 }
            ];
            assert.deepEqual(
                getBatchAllocationInventoryDeltas({
                    allocations: returnAllocations,
                    mode: 'return'
                }),
                [
                    { batchId: 'old-batch', quantity: 20 },
                    { batchId: 'new-batch', quantity: 10 }
                ]
            );
            assert.deepEqual(
                getBatchAllocationInventoryDeltas({
                    allocations: returnAllocations,
                    mode: 'cancel'
                }),
                [
                    { batchId: 'old-batch', quantity: -20 },
                    { batchId: 'new-batch', quantity: -10 }
                ]
            );
        `);
    });

    test('does not double-count a duplicated cached batch when checking stock', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { planFefoBatchAllocations } from './js/features/pos/batchAllocationRules.js';

            assert.throws(() => planFefoBatchAllocations({
                requiredQuantity: 30,
                batches: [
                    {
                        id: 'same-batch',
                        batch_number: 'L1',
                        expiry_date: '2028-01-01',
                        stock_quantity: 20
                    },
                    {
                        id: 'same-batch',
                        batch_number: 'L1',
                        expiry_date: '2028-01-01',
                        stock_quantity: 20
                    }
                ]
            }), /Không đủ tồn kho/);
        `);
    });

    test('honours a manually selected sufficient batch and keeps unknown expiry last', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { planFefoBatchAllocations } from './js/features/pos/batchAllocationRules.js';

            const batches = [
                {
                    id: 'unknown-expiry',
                    batch_number: 'NO-HSD',
                    expiry_date: null,
                    stock_quantity: 100
                },
                {
                    id: 'old-batch',
                    batch_number: 'OLD',
                    expiry_date: '2028-01-01',
                    stock_quantity: 10
                },
                {
                    id: 'selected-batch',
                    batch_number: 'SELECTED',
                    expiry_date: '2029-01-01',
                    stock_quantity: 50
                }
            ];

            assert.deepEqual(planFefoBatchAllocations({
                requiredQuantity: 30,
                preferredBatchId: 'selected-batch',
                batches
            }).map(item => [item.batchId, item.quantity]), [
                ['selected-batch', 30]
            ]);

            assert.deepEqual(planFefoBatchAllocations({
                requiredQuantity: 20,
                batches
            }).map(item => [item.batchId, item.quantity]), [
                ['old-batch', 10],
                ['selected-batch', 10]
            ]);
        `);
    });
});
