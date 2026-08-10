import { getCheckoutWorkflowCapabilities } from './checkoutWorkflowRules.js';

export function validateCheckoutState({
    workflow,
    payableItemCount = 0,
    total = 0,
    amountReceived = 0,
    isOnline = true
} = {}) {
    const capabilities = getCheckoutWorkflowCapabilities(workflow);
    if (payableItemCount <= 0) return { ok: false, reason: 'empty_cart' };
    if (capabilities.requiresOnlineStart && !isOnline) return { ok: false, reason: 'requires_online' };
    if (capabilities.requiresPayment && total > 0 && amountReceived < total) {
        return { ok: false, reason: 'insufficient_payment', due: total - amountReceived };
    }
    return { ok: true, reason: null };
}
