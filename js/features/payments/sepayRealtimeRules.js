export const SEPAY_REALTIME_TABLE = 'sepay_webhooks';

function normalizeOrderCode(value) {
    return String(value ?? '').trim().toUpperCase();
}

export function isCurrentSePayRequestAmount(expectedAmount, currentAmount) {
    const expected = Number(expectedAmount);
    const current = Number(currentAmount);
    return Number.isFinite(expected)
        && expected > 0
        && Number.isFinite(current)
        && current > 0
        && current === expected;
}

export function isMatchingSePayPayment({
    expectedOrderCode,
    expectedAmount,
    transaction
} = {}) {
    const orderCode = normalizeOrderCode(expectedOrderCode);
    const receivedOrderCode = normalizeOrderCode(transaction?.order_code);
    const amount = Number(transaction?.amount);
    const requiredAmount = Number(expectedAmount);

    return Boolean(orderCode)
        && receivedOrderCode === orderCode
        && Number.isFinite(amount)
        && amount > 0
        && isCurrentSePayRequestAmount(requiredAmount, requiredAmount)
        && amount >= requiredAmount;
}
