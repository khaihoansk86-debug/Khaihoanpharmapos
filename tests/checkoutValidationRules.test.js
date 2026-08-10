const { execFileSync } = require('child_process');

describe('checkout validation boundaries', () => {
    function runCheck(scriptBody) {
        execFileSync('node', ['--input-type=module', '-e', scriptBody], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('does not require payment for ecommerce or internal export', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { CHECKOUT_WORKFLOWS } from './js/features/pos/checkoutWorkflowRules.js';
            import { validateCheckoutState } from './js/features/pos/checkoutValidationRules.js';
            for (const workflow of [CHECKOUT_WORKFLOWS.ECOMMERCE_EXPORT, CHECKOUT_WORKFLOWS.INTERNAL_EXPORT]) {
                assert.equal(validateCheckoutState({ workflow, payableItemCount: 1, total: 100000, amountReceived: 0 }).ok, true);
            }
        `);
    });

    test('requires online start only for returns and validates retail payment', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { CHECKOUT_WORKFLOWS } from './js/features/pos/checkoutWorkflowRules.js';
            import { validateCheckoutState } from './js/features/pos/checkoutValidationRules.js';
            assert.equal(validateCheckoutState({ workflow: CHECKOUT_WORKFLOWS.RETURN, payableItemCount: 1, isOnline: false }).reason, 'requires_online');
            const result = validateCheckoutState({ workflow: CHECKOUT_WORKFLOWS.SALE, payableItemCount: 1, total: 100000, amountReceived: 40000 });
            assert.equal(result.reason, 'insufficient_payment');
            assert.equal(result.due, 60000);
        `);
    });
});
