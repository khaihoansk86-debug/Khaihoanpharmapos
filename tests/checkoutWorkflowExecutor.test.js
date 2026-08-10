const { execFileSync } = require('child_process');

describe('checkout workflow executor', () => {
    function runCheck(scriptBody) {
        execFileSync('node', ['--input-type=module', '-e', scriptBody], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('routes return persistence only to the return workflow', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { CHECKOUT_WORKFLOWS } from './js/features/pos/checkoutWorkflowRules.js';
            import { executeCheckoutPersistence } from './js/features/pos/checkoutWorkflowExecutor.js';
            const calls = [];
            const result = await executeCheckoutPersistence({
                workflow: CHECKOUT_WORKFLOWS.RETURN,
                returnOrder: { order_code: 'HD-1' },
                orderPayload: { orderCode: 'HD-1-1' },
                checkoutCart: [{ id: 'p1', quantity: 1 }],
                createReturnOrder: async (...args) => { calls.push(args); return { id: 'return-1' }; },
                createOrderWithAtomicFastPath: async () => { throw new Error('wrong workflow'); }
            });
            assert.equal(result.id, 'return-1');
            assert.equal(calls.length, 1);
            assert.equal(calls[0][0].order_code, 'HD-1');
        `);
    });

    test('routes sale, ecommerce and internal persistence through the atomic seam', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { CHECKOUT_WORKFLOWS } from './js/features/pos/checkoutWorkflowRules.js';
            import { executeCheckoutPersistence } from './js/features/pos/checkoutWorkflowExecutor.js';
            for (const workflow of [
                CHECKOUT_WORKFLOWS.SALE,
                CHECKOUT_WORKFLOWS.ECOMMERCE_EXPORT,
                CHECKOUT_WORKFLOWS.INTERNAL_EXPORT
            ]) {
                let called = 0;
                const result = await executeCheckoutPersistence({
                    workflow,
                    orderPayload: { orderCode: workflow },
                    checkoutCart: [{ id: 'p1', quantity: 1 }],
                    createOrderWithAtomicFastPath: async (payload, cart, options) => {
                        called++;
                        assert.equal(payload.orderCode, workflow);
                        assert.equal(cart[0].id, 'p1');
                        assert.equal(typeof options.fallback, 'function');
                        return { id: workflow };
                    },
                    createOrder: async () => ({ id: 'fallback' })
                });
                assert.equal(result.id, workflow);
                assert.equal(called, 1);
            }
        `);
    });
});
