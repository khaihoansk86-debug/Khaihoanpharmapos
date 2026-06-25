export function getPaymentAmountsForDelta(shift = {}, amount = 0, method = 'cash', direction = 1) {
    const delta = Math.max(0, Number(amount || 0));
    const cashDelta = method === 'cash' ? delta : 0;
    const bankDelta = method === 'bank_transfer' ? delta : 0;
    const {
        exchangeAmount,
        extraAmount,
        outOfShiftAmount
    } = getShiftSalesBreakdown(shift);
    const cashAmount = Math.max(0, Number(shift.cash_amount || 0) + direction * cashDelta);
    const bankAmount = Math.max(0, Number(shift.bank_amount || 0) + direction * bankDelta);
    const salesAmount = Math.max(0, cashAmount + bankAmount - exchangeAmount + extraAmount + outOfShiftAmount);

    return {
        cash_amount: cashAmount,
        bank_amount: bankAmount,
        cash_exchange_amount: exchangeAmount,
        sales_amount: salesAmount
    };
}

export function getShiftSalesBreakdown(shift = {}) {
    const cashAmount = Number(shift.cash_amount || 0);
    const bankAmount = Number(shift.bank_amount || 0);
    const exchangeAmount = Number(shift.cash_exchange_amount || 0);
    const outOfShiftAmount = Number(shift.out_of_shift_sales || 0);
    const salesAmount = Number(shift.sales_amount || 0);
    const posAmount = Math.max(0, cashAmount + bankAmount - exchangeAmount);
    const extraAmount = Math.max(0, salesAmount - posAmount - outOfShiftAmount);

    return {
        cashAmount,
        bankAmount,
        exchangeAmount,
        outOfShiftAmount,
        salesAmount,
        posAmount,
        extraAmount
    };
}

export function applyOutOfShiftSale(shift = {}, amount = 0) {
    const delta = Math.max(0, Number(amount || 0));
    const breakdown = getShiftSalesBreakdown(shift);
    const nextOutOfShiftAmount = breakdown.outOfShiftAmount + delta;

    return {
        out_of_shift_sales: nextOutOfShiftAmount,
        sales_amount: breakdown.posAmount + breakdown.extraAmount + nextOutOfShiftAmount
    };
}

export function shouldReverseOrderFromShift(order = {}) {
    const orderType = order.order_type || 'retail';
    return (orderType === 'retail' || orderType === null) && Number(order.total || 0) > 0;
}
