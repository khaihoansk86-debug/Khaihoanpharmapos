import { CHECKOUT_WORKFLOWS } from './checkoutWorkflowRules.js';
import { getCheckoutOperationLabel } from './checkoutWorkflowFailure.js';

function getWorkflowFromOrderType(orderType) {
    if (orderType === 'ecommerce') return CHECKOUT_WORKFLOWS.ECOMMERCE_EXPORT;
    if (orderType === 'internal') return CHECKOUT_WORKFLOWS.INTERNAL_EXPORT;
    if (orderType === 'return') return CHECKOUT_WORKFLOWS.RETURN;
    return CHECKOUT_WORKFLOWS.SALE;
}

export function mapOrderToCheckoutLog(order = {}) {
    const items = Array.isArray(order.order_items) ? order.order_items : [];
    const summary = items.length > 0
        ? items.slice(0, 3).map(item => `${String(item.product_name || 'Mặt hàng').slice(0, 24)} x${Number(item.quantity || 0)}`).join(' + ')
        : 'Không có chi tiết';
    return {
        orderCode: String(order.order_code || order.id || ''),
        operation: getCheckoutOperationLabel(getWorkflowFromOrderType(order.order_type)),
        summary,
        status: 'completed',
        source: 'server',
        createdAt: order.created_at || null,
        time: order.created_at
            ? new Date(order.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
            : '--:--'
    };
}

export function mergeCheckoutLogs(serverLogs = [], localLogs = []) {
    const merged = [...serverLogs, ...localLogs.filter(item => item.status === 'offline')];
    const seen = new Set();
    return merged
        .filter(item => item?.orderCode && !seen.has(item.orderCode) && seen.add(item.orderCode))
        .sort((a, b) => String(b.createdAt || b.time || '').localeCompare(String(a.createdAt || a.time || '')))
        .slice(0, 200);
}
