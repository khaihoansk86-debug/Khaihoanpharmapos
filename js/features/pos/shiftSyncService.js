import { getShifts, saveShift } from '../employees/employeeService.js?v=20260709d';
import { getOrderRules } from './orderRules.js';
import { pickShiftForPOSSync, pickTimeMatchedShift } from './shiftSelection.js?v=20260709d';
import {
    applyOutOfShiftSale,
    getShiftAmountsForCancelledOrder,
    getPaymentAmountsForDelta,
    shouldReverseShiftSettlementForCancellation
} from './shiftAmountRules.js';

function todayKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function currentTimeSeconds(date = new Date()) {
    return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
}

function getCurrentEmployeeId() {
    try {
        const userStr = localStorage.getItem('pos_user');
        const user = userStr ? JSON.parse(userStr) : null;
        return user?.id || null;
    } catch {
        return null;
    }
}

function getShiftDateFromOrder(order) {
    if (!order?.created_at) return todayKey();
    return todayKey(new Date(order.created_at));
}

function getOrderTimeSeconds(order) {
    if (!order?.created_at) return currentTimeSeconds();
    return currentTimeSeconds(new Date(order.created_at));
}

function resolveReferenceDate(value) {
    if (!value) return new Date();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

async function findShiftForRealtimeSync(options = {}) {
    const employeeId = options.employeeId || getCurrentEmployeeId();
    const referenceDate = resolveReferenceDate(options.referenceDate);
    const shiftDate = todayKey(referenceDate);
    const currentSec = currentTimeSeconds(referenceDate);
    const shifts = await getShifts({ from: shiftDate, to: shiftDate });
    const openWorkedShifts = (shifts || []).filter(shift => shift.status === 'worked' && !shift.is_closed);
    const matchedShift = pickTimeMatchedShift(openWorkedShifts, currentSec, employeeId);
    if (matchedShift) {
        return {
            shift: matchedShift,
            isOutOfShiftFallback: false
        };
    }

    if (!employeeId) return null;

    const targetShift = pickShiftForPOSSync(shifts || [], currentSec, employeeId);

    if (!targetShift) return null;

    return {
        shift: targetShift,
        isOutOfShiftFallback: !matchedShift
    };
}

export async function syncPaymentToCurrentShift(amount, orderCode, method = 'cash', context = {}, options = {}) {
    try {
        const rules = getOrderRules(context);
        if (!rules.shouldSyncShift || !amount || amount <= 0) return null;

        const syncTarget = await findShiftForRealtimeSync(options);
        if (!syncTarget) {
            console.log('Khong tim thay ca hop le cua nhan vien de cong tien.', {
                employeeId: options.employeeId || getCurrentEmployeeId(),
                orderCode
            });
            return null;
        }

        const shiftToUpdate = syncTarget.shift;
        const amounts = syncTarget.isOutOfShiftFallback
            ? applyOutOfShiftSale(shiftToUpdate, amount)
            : getPaymentAmountsForDelta(shiftToUpdate, amount, method, 1);
        const savedShift = await saveShift({
            ...shiftToUpdate,
            ...amounts,
            __source: 'pos-sync',
            __syncReferenceDate: resolveReferenceDate(options.referenceDate).toISOString(),
            __allowOutOfShiftFallback: syncTarget.isOutOfShiftFallback,
            __syncOrderCode: orderCode
        });

        console.log('Da cap nhat doanh thu vao ca:', shiftToUpdate.shift_name, 'so tien:', amount, 'don:', orderCode);
        await options.onSynced?.(savedShift);
        return savedShift;
    } catch (err) {
        console.error('Loi khi dong bo tien vao ca:', err);
        return null;
    }
}

export async function syncReturnSettlementToCurrentShift(total, orderCode, method = 'cash', options = {}) {
    const amount = Math.abs(Number(total || 0));
    if (!amount) return null;

    const syncTarget = await findShiftForRealtimeSync(options);
    if (!syncTarget) return null;
    const shift = syncTarget.shift;

    let amounts;
    if (Number(total) > 0) {
        amounts = syncTarget.isOutOfShiftFallback
            ? applyOutOfShiftSale(shift, amount)
            : getPaymentAmountsForDelta(shift, amount, method, 1);
    } else if (method === 'bank_transfer') {
        amounts = getPaymentAmountsForDelta(shift, amount, method, -1);
    } else {
        const cashExchangeAmount = Number(shift.cash_exchange_amount || 0) + amount;
        const oldPOSAmount = Math.max(0, Number(shift.cash_amount || 0) + Number(shift.bank_amount || 0) - Number(shift.cash_exchange_amount || 0));
        const extraAmount = Math.max(0, Number(shift.sales_amount || 0) - oldPOSAmount - Number(shift.out_of_shift_sales || 0));
        amounts = {
            cash_amount: Number(shift.cash_amount || 0),
            bank_amount: Number(shift.bank_amount || 0),
            cash_exchange_amount: cashExchangeAmount,
            sales_amount: Math.max(
                0,
                Number(shift.cash_amount || 0)
                + Number(shift.bank_amount || 0)
                - cashExchangeAmount
                + extraAmount
                + Number(shift.out_of_shift_sales || 0)
            )
        };
    }

    const savedShift = await saveShift({
        ...shift,
        ...amounts,
        __source: 'pos-sync',
        __syncReferenceDate: resolveReferenceDate(options.referenceDate).toISOString(),
        __allowOutOfShiftFallback: syncTarget.isOutOfShiftFallback,
        __syncOrderCode: orderCode
    });
    console.log('Da cap nhat chenh lech doi/tra hang vao ca:', orderCode, total);
    await options.onSynced?.(savedShift);
    return savedShift;
}

export async function reversePaymentFromShiftForOrder(order, options = {}) {
    if (!shouldReverseShiftSettlementForCancellation(order)) return null;

    const employeeId = options.employeeId || getCurrentEmployeeId();
    const shiftDate = getShiftDateFromOrder(order);
    const orderSec = getOrderTimeSeconds(order);
    const shifts = await getShifts({ from: shiftDate, to: shiftDate });
    const workedShifts = (shifts || []).filter(shift => shift.status === 'worked' && !shift.is_closed);
    let shiftToUpdate = pickTimeMatchedShift(workedShifts, orderSec, employeeId);

    if (!shiftToUpdate && employeeId) {
        const employeeShifts = (shifts || []).filter(shift => shift.employee_id === employeeId && !shift.is_closed);
        shiftToUpdate = pickTimeMatchedShift(employeeShifts, orderSec, employeeId)
            || employeeShifts.find(shift => shift.status === 'worked')
            || employeeShifts[0];
    }

    if (!shiftToUpdate) return null;

    const amounts = getShiftAmountsForCancelledOrder(shiftToUpdate, order);
    const savedShift = await saveShift({
        ...shiftToUpdate,
        ...amounts
    });

    console.log('Da dao nguoc doanh thu ca khi huy don:', shiftToUpdate.shift_name, 'so tien:', Number(order.total || 0), 'don:', order.order_code);
    await options.onSynced?.(savedShift);
    return savedShift;
}
