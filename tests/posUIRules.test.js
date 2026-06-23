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
});
