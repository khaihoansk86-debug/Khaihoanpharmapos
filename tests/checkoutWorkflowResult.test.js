const { execFileSync } = require('child_process');

describe('checkout workflow result handling', () => {
    function runCheck(scriptBody) {
        execFileSync('node', ['--input-type=module', '-e', scriptBody], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('keeps return success side effects separate from export success', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { CHECKOUT_WORKFLOWS } from './js/features/pos/checkoutWorkflowRules.js';
            import { completeCheckoutSuccess } from './js/features/pos/checkoutWorkflowResult.js';
            const events = [];
            completeCheckoutSuccess({
                workflow: CHECKOUT_WORKFLOWS.RETURN,
                createdOrder: { id: 'return-1' }, orderCode: 'TH-1', total: 100,
                restoreReturnStock: () => events.push('restore'),
                markReturnComplete: () => events.push('mark-return'),
                showSuccess: code => events.push('success:' + code),
                startPostProcessing: options => events.push(options.isReturn ? 'post-return' : 'post-other'),
                resetTab: () => events.push('reset')
            });
            assert.deepEqual(events, ['restore', 'mark-return', 'success:TH-1', 'post-return', 'reset']);
        `);
    });

    test('TMĐT is treated as stock export without internal-success messaging', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { CHECKOUT_WORKFLOWS } from './js/features/pos/checkoutWorkflowRules.js';
            import { getCheckoutSuccessPlan } from './js/features/pos/checkoutWorkflowResult.js';
            const plan = getCheckoutSuccessPlan(CHECKOUT_WORKFLOWS.ECOMMERCE_EXPORT);
            assert.equal(plan.isReturn, false);
            assert.equal(plan.showInternalSuccess, false);
            assert.equal(plan.shouldCleanBatches, true);
            assert.equal(plan.remindPendingItems, true);
        `);
    });
});
