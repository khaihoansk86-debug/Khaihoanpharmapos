/**
 * ==========================================
 * LÕI NGHIỆP VỤ - CORE LOGIC CONTRACT
 * ==========================================
 * Các hàm trong tệp này thuộc Core Logic của hệ thống PharmaPOS.
 * KHÔNG ĐƯỢC PHÉP CHỈNH SỬA HÀNH VI TÍNH TOÁN HIỆN TẠI (định dạng, tổng, tồn kho, v.v)
 * trừ khi có yêu cầu rõ ràng từ người dùng để thay đổi Core Logic.
 * Thay vào đó, hãy mở rộng thông qua các helper/adapter bên ngoài.
 * Đọc thêm: docs/core-logic-contract.md
 * ==========================================
 */
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

export function isRetailShiftTrackedOrder(order = {}) {
    const orderType = order.order_type || 'retail';
    return orderType === 'retail' || orderType === null;
}

export function shouldReverseOrderFromShift(order = {}) {
    return isRetailShiftTrackedOrder(order) && Number(order.total || 0) > 0;
}

export function shouldReverseShiftSettlementForCancellation(order = {}) {
    return isRetailShiftTrackedOrder(order) && Number(order.total || 0) !== 0;
}

export function getShiftAmountsForCancelledOrder(shift = {}, order = {}) {
    const total = Number(order.total || 0);
    const amount = Math.abs(total);
    const method = order.payment_method || 'cash';

    if (!amount) {
        return {
            cash_amount: Number(shift.cash_amount || 0),
            bank_amount: Number(shift.bank_amount || 0),
            cash_exchange_amount: Number(shift.cash_exchange_amount || 0),
            sales_amount: Number(shift.sales_amount || 0)
        };
    }

    if (total > 0) {
        return getPaymentAmountsForDelta(shift, amount, method, -1);
    }

    if (method === 'bank_transfer') {
        return getPaymentAmountsForDelta(shift, amount, method, 1);
    }

    const breakdown = getShiftSalesBreakdown(shift);
    const cashExchangeAmount = Math.max(0, breakdown.exchangeAmount - amount);

    return {
        cash_amount: breakdown.cashAmount,
        bank_amount: breakdown.bankAmount,
        cash_exchange_amount: cashExchangeAmount,
        sales_amount: Math.max(
            0,
            breakdown.cashAmount
            + breakdown.bankAmount
            - cashExchangeAmount
            + breakdown.extraAmount
            + breakdown.outOfShiftAmount
        )
    };
}

