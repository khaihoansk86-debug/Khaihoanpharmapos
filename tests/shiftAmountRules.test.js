const { execFileSync } = require('child_process');

describe('POS shift amount rules', () => {
    function runShiftAmountRuleCheck(scriptBody) {
        execFileSync('node', ['--input-type=module', '-e', scriptBody], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('retail orders reverse from employee shift while ecommerce exports do not', () => {
        runShiftAmountRuleCheck(`
            import assert from 'node:assert/strict';
            import { shouldReverseOrderFromShift } from './js/features/pos/shiftAmountRules.js';

            assert.equal(shouldReverseOrderFromShift({ order_type: 'retail', total: 120000 }), true);
            assert.equal(shouldReverseOrderFromShift({ order_type: null, total: 120000 }), true);
            assert.equal(shouldReverseOrderFromShift({ order_type: 'ecommerce', total: 120000 }), false);
            assert.equal(shouldReverseOrderFromShift({ order_type: 'internal', total: -120000 }), false);
            assert.equal(shouldReverseOrderFromShift({ order_type: 'retail', total: 0 }), false);
        `);
    });

    test('cancel subtracts the payment method but keeps manual and out-of-shift amounts', () => {
        runShiftAmountRuleCheck(`
            import assert from 'node:assert/strict';
            import { getPaymentAmountsForDelta } from './js/features/pos/shiftAmountRules.js';

            const shift = {
                cash_amount: 500000,
                bank_amount: 200000,
                cash_exchange_amount: 50000,
                out_of_shift_sales: 80000,
                sales_amount: 750000
            };

            const result = getPaymentAmountsForDelta(shift, 120000, 'cash', -1);

            assert.equal(result.cash_amount, 380000);
            assert.equal(result.bank_amount, 200000);
            assert.equal(result.cash_exchange_amount, 50000);
            assert.equal(result.sales_amount, 630000);
        `);
    });
});
