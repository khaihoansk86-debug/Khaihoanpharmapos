const { execFileSync } = require('child_process');

describe('checkout workflow boundaries', () => {
    function runCheck(scriptBody) {
        execFileSync('node', ['--input-type=module', '-e', scriptBody], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('resolves mutually exclusive POS workflows in business priority order', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { CHECKOUT_WORKFLOWS, resolveCheckoutWorkflow } from './js/features/pos/checkoutWorkflowRules.js';
            assert.equal(resolveCheckoutWorkflow({ isReturn: true, isEcommerce: true }), CHECKOUT_WORKFLOWS.RETURN);
            assert.equal(resolveCheckoutWorkflow({ isInternal: true, isEcommerce: true }), CHECKOUT_WORKFLOWS.INTERNAL_EXPORT);
            assert.equal(resolveCheckoutWorkflow({ isEcommerce: true }), CHECKOUT_WORKFLOWS.ECOMMERCE_EXPORT);
            assert.equal(resolveCheckoutWorkflow({ isDoseCut: true }), CHECKOUT_WORKFLOWS.DOSE_CUT);
            assert.equal(resolveCheckoutWorkflow(), CHECKOUT_WORKFLOWS.SALE);
        `);
    });

    test('keeps payment and online-start rules isolated by workflow', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { CHECKOUT_WORKFLOWS, getCheckoutWorkflowCapabilities } from './js/features/pos/checkoutWorkflowRules.js';
            assert.deepEqual(getCheckoutWorkflowCapabilities(CHECKOUT_WORKFLOWS.SALE), {
                requiresOnlineStart: false, stockExport: false, requiresPayment: true
            });
            assert.deepEqual(getCheckoutWorkflowCapabilities(CHECKOUT_WORKFLOWS.ECOMMERCE_EXPORT), {
                requiresOnlineStart: false, stockExport: true, requiresPayment: false
            });
            assert.equal(getCheckoutWorkflowCapabilities(CHECKOUT_WORKFLOWS.RETURN).requiresOnlineStart, true);
        `);
    });
});
