const { execFileSync } = require('child_process');

describe('checkout workflow failure messages', () => {
    function runCheck(scriptBody) {
        execFileSync('node', ['--input-type=module', '-e', scriptBody], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('does not label ecommerce export failures as payment failures', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { CHECKOUT_WORKFLOWS } from './js/features/pos/checkoutWorkflowRules.js';
            import { formatCheckoutFailureMessage } from './js/features/pos/checkoutWorkflowFailure.js';
            const message = formatCheckoutFailureMessage(
                CHECKOUT_WORKFLOWS.ECOMMERCE_EXPORT,
                { code: 'INVALID_ORDER_ITEM' }
            );
            assert.equal(message, 'Không thể hoàn tất xuất TMĐT: INVALID_ORDER_ITEM');
            assert.equal(message.includes('Thanh toán'), false);
        `);
    });

    test('keeps operation labels distinct for return and internal workflows', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { CHECKOUT_WORKFLOWS } from './js/features/pos/checkoutWorkflowRules.js';
            import { getCheckoutOperationLabel } from './js/features/pos/checkoutWorkflowFailure.js';
            assert.equal(getCheckoutOperationLabel(CHECKOUT_WORKFLOWS.RETURN), 'đổi/trả hàng');
            assert.equal(getCheckoutOperationLabel(CHECKOUT_WORKFLOWS.INTERNAL_EXPORT), 'xuất nội bộ');
        `);
    });

    test('shows the database reason instead of masking it with P0001', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { CHECKOUT_WORKFLOWS } from './js/features/pos/checkoutWorkflowRules.js';
            import { formatCheckoutFailureMessage } from './js/features/pos/checkoutWorkflowFailure.js';
            assert.equal(
                formatCheckoutFailureMessage(CHECKOUT_WORKFLOWS.RETURN, { code: 'P0001', message: 'RETURN_QUANTITY_EXCEEDED' }),
                'Không thể hoàn tất đổi/trả hàng: RETURN_QUANTITY_EXCEEDED'
            );
        `);
    });
});
