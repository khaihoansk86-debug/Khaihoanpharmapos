const { execFileSync } = require('child_process');

describe('combo invoice lifecycle rules', () => {
    function runCheck(scriptBody) {
        execFileSync('node', ['--input-type=module', '-e', scriptBody], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('allows cancellation only when every combo component has its persisted batch snapshot', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import {
                assertComboOrderReversible,
                getComboReversalIntegrityIssues
            } from './js/features/pos/comboInvoiceLifecycleRules.js';

            const validItems = [
                {
                    id: 'parent-1',
                    line_type: 'combo_parent',
                    product_name: 'Combo A',
                    quantity: 2
                },
                {
                    id: 'component-1',
                    line_type: 'combo_component',
                    parent_order_item_id: 'parent-1',
                    product_id: 'medicine-1',
                    product_name: 'Thuốc A',
                    batch_id: 'batch-1',
                    quantity: 2
                }
            ];

            assert.deepEqual(getComboReversalIntegrityIssues(validItems), []);
            assert.doesNotThrow(() => assertComboOrderReversible({ items: validItems }));

            const missingBatchItems = validItems.map(item => (
                item.id === 'component-1' ? { ...item, batch_id: null } : item
            ));
            assert.throws(
                () => assertComboOrderReversible({ items: missingBatchItems }),
                /không xác định được lô gốc/
            );
        `);
    });

    test('does not block cancellation for invoices without combo rows', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { assertComboOrderReversible } from './js/features/pos/comboInvoiceLifecycleRules.js';

            assert.doesNotThrow(() => assertComboOrderReversible({
                items: [{
                    id: 'standard-1',
                    line_type: 'standard',
                    product_id: 'medicine-1',
                    batch_id: 'batch-1',
                    quantity: 1
                }]
            }));
        `);
    });

    test('rejects cumulative combo returns that exceed the quantity sold', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import {
                assertReturnQuantitiesWithinSource,
                getRemainingReturnQuantity
            } from './js/features/pos/comboInvoiceLifecycleRules.js';

            assert.equal(getRemainingReturnQuantity(3, 1), 2);
            assert.equal(getRemainingReturnQuantity(3, 5), 0);

            const sourceOrder = {
                items: [{
                    id: 'parent-1',
                    line_type: 'combo_parent',
                    product_name: 'Combo A',
                    quantity: 3
                }]
            };
            const returnedBySourceId = new Map([['parent-1', 2]]);

            assert.doesNotThrow(() => assertReturnQuantitiesWithinSource({
                sourceOrder,
                cartItems: [{
                    sourceOrderItemId: 'parent-1',
                    originalQuantity: 3,
                    quantity: 1
                }],
                returnedBySourceId
            }));

            assert.throws(() => assertReturnQuantitiesWithinSource({
                sourceOrder,
                cartItems: [{
                    sourceOrderItemId: 'parent-1',
                    originalQuantity: 3,
                    quantity: 2
                }],
                returnedBySourceId
            }), /chỉ còn được trả 1/);
        `);
    });
});
