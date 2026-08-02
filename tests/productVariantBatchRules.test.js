const { execFileSync } = require('child_process');

describe('product variant batch safety rules', () => {
    function runCheck(scriptBody) {
        execFileSync('node', ['--input-type=module', '-e', scriptBody], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('blocks removal of an existing batch that still has stock', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import {
                assertSafeVariantBatchRemoval,
                findRemovedPositiveStockBatches
            } from './js/features/products/productVariantBatchRules.js';

            const existing = [
                { id: 'batch-a', batch_number: 'LO-A', stock_quantity: 20 },
                { id: 'batch-b', batch_number: 'LO-B', stock_quantity: 0 }
            ];
            const next = [{ id: 'batch-b', batch_number: 'LO-B', stock_quantity: 0 }];

            assert.deepEqual(
                findRemovedPositiveStockBatches(existing, next).map(batch => batch.id),
                ['batch-a']
            );
            assert.throws(
                () => assertSafeVariantBatchRemoval({
                    existingBatches: existing,
                    nextBatches: next
                }),
                /LO-A.*20/
            );
        `);
    });

    test('allows retained positive batches and removal of empty batches', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { assertSafeVariantBatchRemoval } from './js/features/products/productVariantBatchRules.js';

            assert.equal(assertSafeVariantBatchRemoval({
                existingBatches: [
                    { id: 'batch-a', stock_quantity: 20 },
                    { id: 'batch-b', stock_quantity: 0 }
                ],
                nextBatches: [
                    { id: 'batch-a', stock_quantity: 20 }
                ]
            }), true);
        `);
    });
});
