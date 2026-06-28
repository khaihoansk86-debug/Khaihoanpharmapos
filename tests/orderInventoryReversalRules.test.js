const { execFileSync } = require('child_process');

describe('POS order inventory reversal rules', () => {
    function runCheck(scriptBody) {
        execFileSync('node', ['--input-type=module', '-e', scriptBody], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('return restore always adds stock back from negative order rows', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { getStockQuantityForReturnRestore } from './js/features/pos/orderInventoryReversalRules.js';

            assert.equal(getStockQuantityForReturnRestore({ quantity: -2 }, 12), 24);
            assert.equal(getStockQuantityForReturnRestore({ quantity: 3 }, 10), 30);
        `);
    });

    test('order cancellation reverses stock by preserving the original row sign', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { getStockQuantityForOrderCancellation } from './js/features/pos/orderInventoryReversalRules.js';

            assert.equal(getStockQuantityForOrderCancellation({ quantity: 3 }, 10), 30);
            assert.equal(getStockQuantityForOrderCancellation({ quantity: -2 }, 12), -24);
        `);
    });
});
