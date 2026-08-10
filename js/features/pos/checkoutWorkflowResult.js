import { CHECKOUT_WORKFLOWS } from './checkoutWorkflowRules.js';

export function getCheckoutSuccessPlan(workflow) {
    if (workflow === CHECKOUT_WORKFLOWS.RETURN) {
        return Object.freeze({
            isReturn: true,
            showInternalSuccess: false,
            shouldCleanBatches: false,
            remindPendingItems: false
        });
    }

    return Object.freeze({
        isReturn: false,
        showInternalSuccess: workflow === CHECKOUT_WORKFLOWS.INTERNAL_EXPORT,
        shouldCleanBatches: true,
        remindPendingItems: workflow === CHECKOUT_WORKFLOWS.SALE
            || workflow === CHECKOUT_WORKFLOWS.ECOMMERCE_EXPORT
    });
}

export function completeCheckoutSuccess({
    workflow,
    createdOrder,
    orderCode,
    total,
    paymentMethod,
    orderContext,
    employeeId,
    referenceDate,
    showInternalSuccess,
    showSuccess,
    restoreReturnStock,
    startPostProcessing,
    recordCheckout,
    markReturnComplete,
    resetTab
}) {
    const plan = getCheckoutSuccessPlan(workflow);
    recordCheckout?.({ orderCode, workflow, status: 'completed' });
    if (plan.isReturn) {
        restoreReturnStock?.();
        markReturnComplete?.();
    }

    if (plan.showInternalSuccess) showInternalSuccess?.(orderCode);
    else showSuccess?.(orderCode);

    startPostProcessing?.({
        createdOrder,
        orderCode,
        total,
        paymentMethod,
        orderContext,
        isReturn: plan.isReturn,
        shouldCleanBatches: plan.shouldCleanBatches,
        remindPendingItems: plan.remindPendingItems,
        employeeId,
        referenceDate
    });
    resetTab?.();
    return plan;
}
