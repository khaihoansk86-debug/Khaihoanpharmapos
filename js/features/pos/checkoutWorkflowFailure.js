import { CHECKOUT_WORKFLOWS } from './checkoutWorkflowRules.js';

export function getCheckoutOperationLabel(workflow) {
    switch (workflow) {
        case CHECKOUT_WORKFLOWS.ECOMMERCE_EXPORT: return 'xuất TMĐT';
        case CHECKOUT_WORKFLOWS.INTERNAL_EXPORT: return 'xuất nội bộ';
        case CHECKOUT_WORKFLOWS.DOSE_CUT: return 'xuất thuốc liều';
        case CHECKOUT_WORKFLOWS.RETURN: return 'đổi/trả hàng';
        default: return 'bán hàng';
    }
}

export function formatCheckoutFailureMessage(workflow, error) {
    const operation = getCheckoutOperationLabel(workflow);
    const detail = String(error?.code || error?.message || '').trim();
    return detail
        ? `Không thể hoàn tất ${operation}: ${detail}`
        : `Không thể hoàn tất ${operation}. Vui lòng thử lại.`;
}
