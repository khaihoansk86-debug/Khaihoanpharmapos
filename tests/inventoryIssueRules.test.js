const { execFileSync } = require('child_process');

describe('POS inventory issue rules', () => {
    function runInventoryIssueRuleCheck(scriptBody) {
        execFileSync('node', ['--input-type=module', '-e', scriptBody], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('issue lines use base quantity and selected batch cost', () => {
        runInventoryIssueRuleCheck(`
            import assert from 'node:assert/strict';
            import { buildInventoryIssueLine } from './js/features/pos/inventoryIssueRules.js';

            const line = buildInventoryIssueLine({
                productId: 'p1',
                batchId: 'b1',
                batchNo: 'LOT-1',
                quantity: 3,
                conversionRate: 10,
                costPrice: 2000,
                batches: [{ id: 'b1', cost_price: 150 }]
            }, 'dose_cutting');

            assert.equal(line.quantity, 30);
            assert.equal(line.costPrice, 150);
            assert.equal(line.reason, 'dose_cutting');
            assert.equal(line.productName, 'Sản phẩm');
        `);
    });

    test('POS issue note carries order id for cancellation lookup', () => {
        runInventoryIssueRuleCheck(`
            import assert from 'node:assert/strict';
            import { buildPOSInventoryIssueNote } from './js/features/pos/inventoryIssueRules.js';

            const note = buildPOSInventoryIssueNote({
                orderId: 'order-1',
                orderCode: 'HD202606230001',
                label: 'Xuất thuốc liều',
                note: 'test'
            });

            assert.match(note, /\\[POS_ORDER:order-1\\]/);
            assert.match(note, /HD202606230001/);
            assert.match(note, /Xuất thuốc liều/);
        `);
    });

    test('cancel restore quantity respects order item unit conversion', () => {
        runInventoryIssueRuleCheck(`
            import assert from 'node:assert/strict';
            import { getOrderItemStockRestoreQuantity } from './js/features/pos/inventoryIssueRules.js';

            assert.equal(getOrderItemStockRestoreQuantity({ quantity: 3 }, 10), 30);
            assert.equal(getOrderItemStockRestoreQuantity({ quantity: -2 }, 12), -24);
        `);
    });

});
