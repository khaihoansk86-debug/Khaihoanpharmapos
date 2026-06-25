export function getCreateCustomerMetricDelta(total = 0) {
    return {
        totalDelta: Number(total || 0),
        orderCountDelta: 1
    };
}

export function getReturnCustomerMetricDelta(finalTotal = 0) {
    return {
        totalDelta: Number(finalTotal || 0),
        orderCountDelta: 0
    };
}

export function getEditCustomerMetricDelta(previousTotal = 0, nextTotal = 0) {
    return {
        totalDelta: Number(nextTotal || 0) - Number(previousTotal || 0),
        orderCountDelta: 0
    };
}

export function isReturnOrder(order = {}) {
    return String(order.order_code || '').toUpperCase().startsWith('TH');
}

export function getCancelCustomerMetricDelta(order = {}) {
    return {
        totalDelta: -Number(order.total || 0),
        orderCountDelta: isReturnOrder(order) ? 0 : -1
    };
}
