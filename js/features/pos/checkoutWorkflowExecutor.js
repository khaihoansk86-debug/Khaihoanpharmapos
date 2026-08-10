import { CHECKOUT_WORKFLOWS } from './checkoutWorkflowRules.js';

/**
 * Execute only the persistence part of a checkout workflow.
 * UI state, inventory presentation and post-checkout tasks remain owned by
 * the controller until the migration is complete.
 */
export async function executeCheckoutPersistence({
    workflow,
    returnOrder = null,
    orderPayload,
    checkoutCart,
    createReturnOrder,
    createOrderWithAtomicFastPath,
    supabaseClient,
    createOrder
}) {
    if (workflow === CHECKOUT_WORKFLOWS.RETURN) {
        if (typeof createReturnOrder !== 'function') throw new Error('Thiếu workflow đổi/trả hàng.');
        return createReturnOrder(returnOrder, orderPayload, checkoutCart);
    }

    if (typeof createOrderWithAtomicFastPath !== 'function') {
        throw new Error('Thiếu workflow ghi đơn hàng.');
    }

    return createOrderWithAtomicFastPath(orderPayload, checkoutCart, {
        client: supabaseClient,
        fallback: createOrder
    });
}
