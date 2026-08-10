export const CHECKOUT_WORKFLOWS = Object.freeze({
    SALE: 'sale',
    ECOMMERCE_EXPORT: 'ecommerce_export',
    INTERNAL_EXPORT: 'internal_export',
    DOSE_CUT: 'dose_cut',
    RETURN: 'return'
});

export function resolveCheckoutWorkflow({
    isReturn = false,
    isDoseCut = false,
    isInternal = false,
    isEcommerce = false
} = {}) {
    if (isReturn) return CHECKOUT_WORKFLOWS.RETURN;
    if (isInternal) return CHECKOUT_WORKFLOWS.INTERNAL_EXPORT;
    if (isEcommerce) return CHECKOUT_WORKFLOWS.ECOMMERCE_EXPORT;
    if (isDoseCut) return CHECKOUT_WORKFLOWS.DOSE_CUT;
    return CHECKOUT_WORKFLOWS.SALE;
}

export function getCheckoutWorkflowCapabilities(workflow) {
    switch (workflow) {
        case CHECKOUT_WORKFLOWS.RETURN:
            return Object.freeze({ requiresOnlineStart: true, stockExport: false, requiresPayment: false });
        case CHECKOUT_WORKFLOWS.INTERNAL_EXPORT:
        case CHECKOUT_WORKFLOWS.ECOMMERCE_EXPORT:
            return Object.freeze({ requiresOnlineStart: false, stockExport: true, requiresPayment: false });
        case CHECKOUT_WORKFLOWS.DOSE_CUT:
            return Object.freeze({ requiresOnlineStart: false, stockExport: true, requiresPayment: false });
        default:
            return Object.freeze({ requiresOnlineStart: false, stockExport: false, requiresPayment: true });
    }
}
