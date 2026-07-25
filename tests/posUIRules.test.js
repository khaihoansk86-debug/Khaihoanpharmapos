const { execFileSync } = require('child_process');

describe('POS UI display rules', () => {
    function runPosUiRuleCheck(scriptBody) {
        execFileSync('node', ['--input-type=module', '-e', scriptBody], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('dose ingredients display selected batch cost converted to current unit', () => {
        runPosUiRuleCheck(`
            import assert from 'node:assert/strict';
            import { getDoseIngredientDisplayCost } from './js/features/pos/posUI.js';

            const displayCost = getDoseIngredientDisplayCost({
                batchId: 'batch-1',
                conversionRate: 10,
                costPrice: 2000,
                batches: [
                    { id: 'batch-1', cost_price: 150 },
                    { id: 'batch-2', cost_price: 300 }
                ]
            });

            assert.equal(displayCost, 1500);
        `);
    });

    test('dose ingredients display unit cost when selected batch has no cost', () => {
        runPosUiRuleCheck(`
            import assert from 'node:assert/strict';
            import { getDoseIngredientDisplayCost } from './js/features/pos/posUI.js';

            const displayCost = getDoseIngredientDisplayCost({
                batchId: 'batch-1',
                conversionRate: 10,
                costPrice: 2000,
                batches: [{ id: 'batch-1', stock_quantity: 100 }]
            });

            assert.equal(displayCost, 2000);
        `);
    });

    test('combo search displays virtual availability and its limiting component', () => {
        runPosUiRuleCheck(`
            import assert from 'node:assert/strict';
            import { getPOSProductStockDisplay } from './js/features/pos/posUI.js';

            const display = getPOSProductStockDisplay({
                name: 'Chích thuốc khỏe',
                comboAvailability: {
                    isCombo: true,
                    availableQuantity: 131,
                    bottleneck: { name: 'Becozyme' }
                }
            }, { unit_name: 'Combo' });

            assert.equal(display.quantity, 131);
            assert.equal(display.unitName, 'Combo');
            assert.equal(display.label, 'Bán được: 131 Combo');
            assert.equal(display.detail, 'Giới hạn bởi: Becozyme');
        `);
    });

    test('cart explains how one converted unit will be taken from multiple batches', () => {
        runPosUiRuleCheck(`
            import assert from 'node:assert/strict';
            import { getPOSBatchAllocationDisplay } from './js/features/pos/posUI.js';

            const display = getPOSBatchAllocationDisplay({
                batchId: 'old-batch',
                unit: 'Hộp',
                quantity: 1,
                conversionRate: 30,
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

            assert.equal(display.isSplit, true);
            assert.equal(display.label, 'Gợi ý xuất: lô 091125 × 20 + lô 050526 × 10');
        `);
    });
});
