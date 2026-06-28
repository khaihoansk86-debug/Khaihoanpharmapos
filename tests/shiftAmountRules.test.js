const { execFileSync } = require('child_process');

describe('POS shift amount rules', () => {
    function runShiftAmountRuleCheck(scriptBody) {
        execFileSync('node', ['--input-type=module', '-e', scriptBody], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('retail sales reverse from employee shift while ecommerce exports do not', () => {
        runShiftAmountRuleCheck(`
            import assert from 'node:assert/strict';
            import {
                shouldReverseOrderFromShift,
                shouldReverseShiftSettlementForCancellation
            } from './js/features/pos/shiftAmountRules.js';

            assert.equal(shouldReverseOrderFromShift({ order_type: 'retail', total: 120000 }), true);
            assert.equal(shouldReverseOrderFromShift({ order_type: null, total: 120000 }), true);
            assert.equal(shouldReverseOrderFromShift({ order_type: 'ecommerce', total: 120000 }), false);
            assert.equal(shouldReverseOrderFromShift({ order_type: 'internal', total: -120000 }), false);
            assert.equal(shouldReverseOrderFromShift({ order_type: 'retail', total: 0 }), false);

            assert.equal(shouldReverseShiftSettlementForCancellation({ order_type: 'retail', total: -120000 }), true);
            assert.equal(shouldReverseShiftSettlementForCancellation({ order_type: 'retail', total: 120000 }), true);
            assert.equal(shouldReverseShiftSettlementForCancellation({ order_type: 'ecommerce', total: -120000 }), false);
            assert.equal(shouldReverseShiftSettlementForCancellation({ order_type: 'retail', total: 0 }), false);
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

    test('out-of-shift sync keeps POS and manual extra amounts intact', () => {
        runShiftAmountRuleCheck(`
            import assert from 'node:assert/strict';
            import { applyOutOfShiftSale, getShiftSalesBreakdown } from './js/features/pos/shiftAmountRules.js';

            const shift = {
                cash_amount: 300000,
                bank_amount: 200000,
                cash_exchange_amount: 50000,
                out_of_shift_sales: 80000,
                sales_amount: 610000
            };

            const breakdown = getShiftSalesBreakdown(shift);
            assert.equal(breakdown.posAmount, 450000);
            assert.equal(breakdown.extraAmount, 80000);
            assert.equal(breakdown.outOfShiftAmount, 80000);

            const result = applyOutOfShiftSale(shift, 120000);
            assert.equal(result.out_of_shift_sales, 200000);
            assert.equal(result.sales_amount, 730000);
        `);
    });

    test('cancelled cash return removes exchange amount and restores sales amount', () => {
        runShiftAmountRuleCheck(`
            import assert from 'node:assert/strict';
            import { getShiftAmountsForCancelledOrder } from './js/features/pos/shiftAmountRules.js';

            const shift = {
                cash_amount: 80000,
                bank_amount: 0,
                cash_exchange_amount: 80000,
                out_of_shift_sales: 0,
                sales_amount: 0
            };

            const result = getShiftAmountsForCancelledOrder(shift, {
                order_type: 'retail',
                total: -80000,
                payment_method: 'cash'
            });

            assert.equal(result.cash_amount, 80000);
            assert.equal(result.bank_amount, 0);
            assert.equal(result.cash_exchange_amount, 0);
            assert.equal(result.sales_amount, 80000);
        `);
    });

    test('cancelled bank return restores bank revenue and positive return subtracts received amount', () => {
        runShiftAmountRuleCheck(`
            import assert from 'node:assert/strict';
            import { getShiftAmountsForCancelledOrder } from './js/features/pos/shiftAmountRules.js';

            const bankReturnShift = {
                cash_amount: 0,
                bank_amount: 0,
                cash_exchange_amount: 0,
                out_of_shift_sales: 0,
                sales_amount: 0
            };

            const bankResult = getShiftAmountsForCancelledOrder(bankReturnShift, {
                order_type: 'retail',
                total: -50000,
                payment_method: 'bank_transfer'
            });

            assert.equal(bankResult.cash_amount, 0);
            assert.equal(bankResult.bank_amount, 50000);
            assert.equal(bankResult.cash_exchange_amount, 0);
            assert.equal(bankResult.sales_amount, 50000);

            const positiveReturnShift = {
                cash_amount: 120000,
                bank_amount: 0,
                cash_exchange_amount: 0,
                out_of_shift_sales: 0,
                sales_amount: 120000
            };

            const positiveReturnResult = getShiftAmountsForCancelledOrder(positiveReturnShift, {
                order_type: 'retail',
                total: 20000,
                payment_method: 'cash'
            });

            assert.equal(positiveReturnResult.cash_amount, 100000);
            assert.equal(positiveReturnResult.bank_amount, 0);
            assert.equal(positiveReturnResult.cash_exchange_amount, 0);
            assert.equal(positiveReturnResult.sales_amount, 100000);
        `);
    });
});
