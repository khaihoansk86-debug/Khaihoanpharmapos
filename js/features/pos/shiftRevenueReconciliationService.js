import { supabaseClient } from '../../core/supabase.js';
import { getShifts, saveShift } from '../employees/employeeService.js?v=20260709d';
import { normalizeTimeToSeconds, isTimeInInterval, pickNextEmployeeShift } from './shiftSelection.js?v=20260709d';

function localDateKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function dateStartIso(dateKey) {
    return new Date(`${dateKey}T00:00:00+07:00`).toISOString();
}

function dateEndIso(dateKey) {
    return new Date(`${dateKey}T23:59:59.999+07:00`).toISOString();
}

function secondsFromDate(date = new Date()) {
    return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
}

function compareStartAsc(a, b) {
    const startDiff = normalizeTimeToSeconds(a.start_time) - normalizeTimeToSeconds(b.start_time);
    if (startDiff !== 0) return startDiff;

    const endDiff = normalizeTimeToSeconds(a.end_time) - normalizeTimeToSeconds(b.end_time);
    if (endDiff !== 0) return endDiff;

    const createdA = Date.parse(a.created_at || 0);
    const createdB = Date.parse(b.created_at || 0);
    if (createdA !== createdB) return createdA - createdB;

    return String(a.id || '').localeCompare(String(b.id || ''));
}

function closedSeconds(shift) {
    if (!shift.is_closed || !shift.closed_at) return null;
    const closed = secondsFromDate(new Date(shift.closed_at));
    const scheduledEnd = normalizeTimeToSeconds(shift.end_time);
    return Math.min(closed, scheduledEnd || closed);
}

function getCurrentEmployeeId() {
    try {
        const user = JSON.parse(localStorage.getItem('pos_user') || 'null');
        return user?.id || null;
    } catch {
        return null;
    }
}

function pickScheduledShift(dayShifts, orderSec) {
    const workedShifts = (dayShifts || [])
        .filter((shift) => shift.status === 'worked' && shift.start_time && shift.end_time)
        .sort(compareStartAsc);

    let previousEndSec = null;
    for (const shift of workedShifts) {
        const startSec = normalizeTimeToSeconds(shift.start_time);
        const endSec = normalizeTimeToSeconds(shift.end_time);
        const closedSec = closedSeconds(shift);
        const effectiveStartSec = previousEndSec === null ? startSec : previousEndSec;
        const effectiveEndSec = Math.max(effectiveStartSec, closedSec ?? endSec);

        if (isTimeInInterval(orderSec, effectiveStartSec, effectiveEndSec)) {
            return shift;
        }

        previousEndSec = effectiveEndSec;
    }

    return null;
}

function pickShiftForOrder(dayShifts, order, fallbackEmployeeId) {
    const orderDate = new Date(order.created_at);
    const orderSec = secondsFromDate(orderDate);
    const scheduledShift = pickScheduledShift(dayShifts, orderSec);
    if (scheduledShift) {
        return {
            shift: scheduledShift,
            outOfShift: false
        };
    }

    const employeeId = fallbackEmployeeId || getCurrentEmployeeId();
    const fallbackShift = employeeId ? pickNextEmployeeShift(dayShifts, orderSec, employeeId) : null;
    return fallbackShift
        ? { shift: fallbackShift, outOfShift: true }
        : null;
}

function emptyShiftTotals(shift) {
    return {
        shift,
        cash_amount: 0,
        bank_amount: 0,
        cash_exchange_amount: 0,
        out_of_shift_sales: 0,
        sales_amount: 0,
        order_count: 0
    };
}

function applyOrderToTotals(totals, order, outOfShift) {
    const amount = Number(order.total || 0);
    const method = order.payment_method || 'cash';

    if (!amount) return;

    if (outOfShift && amount > 0) {
        totals.out_of_shift_sales += amount;
        totals.sales_amount += amount;
        totals.order_count += 1;
        return;
    }

    if (amount > 0) {
        if (method === 'bank_transfer') totals.bank_amount += amount;
        else totals.cash_amount += amount;
    } else if (method === 'bank_transfer') {
        totals.bank_amount = Math.max(0, totals.bank_amount + amount);
    } else {
        totals.cash_exchange_amount += Math.abs(amount);
    }

    totals.sales_amount = Math.max(
        0,
        totals.cash_amount
        + totals.bank_amount
        - totals.cash_exchange_amount
        + totals.out_of_shift_sales
    );
    totals.order_count += 1;
}

function amountsDiffer(shift, totals) {
    return Number(shift.cash_amount || 0) !== totals.cash_amount
        || Number(shift.bank_amount || 0) !== totals.bank_amount
        || Number(shift.cash_exchange_amount || 0) !== totals.cash_exchange_amount
        || Number(shift.out_of_shift_sales || 0) !== totals.out_of_shift_sales
        || Number(shift.sales_amount || 0) !== totals.sales_amount;
}

export async function reconcileShiftSalesFromOrders({ referenceDate = new Date(), employeeId = null } = {}) {
    if (!supabaseClient) return null;

    const date = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
    const dateKey = Number.isNaN(date.getTime()) ? localDateKey() : localDateKey(date);
    const shifts = await getShifts({ from: dateKey, to: dateKey });
    const dayShifts = (shifts || []).filter((shift) => shift.shift_date === dateKey);
    if (!dayShifts.length) return { date: dateKey, updated: [], unmatched: [] };

    const { data: orders, error } = await supabaseClient
        .from('orders')
        .select('id, order_code, total, payment_method, status, created_at, order_type')
        .eq('status', 'completed')
        .or('order_type.eq.retail,order_type.is.null')
        .gte('created_at', dateStartIso(dateKey))
        .lte('created_at', dateEndIso(dateKey))
        .order('created_at', { ascending: true });

    if (error) throw error;

    const totalsByShift = new Map(dayShifts.map((shift) => [shift.id, emptyShiftTotals(shift)]));
    const unmatched = [];

    for (const order of orders || []) {
        const target = pickShiftForOrder(dayShifts, order, employeeId);
        if (!target?.shift?.id || !totalsByShift.has(target.shift.id)) {
            unmatched.push(order.order_code || order.id);
            continue;
        }
        applyOrderToTotals(totalsByShift.get(target.shift.id), order, target.outOfShift);
    }

    const updated = [];
    for (const totals of totalsByShift.values()) {
        if (!amountsDiffer(totals.shift, totals)) continue;
        const saved = await saveShift({
            ...totals.shift,
            cash_amount: totals.cash_amount,
            bank_amount: totals.bank_amount,
            cash_exchange_amount: totals.cash_exchange_amount,
            out_of_shift_sales: totals.out_of_shift_sales,
            sales_amount: totals.sales_amount
        });
        updated.push({
            id: saved.id,
            shift_name: saved.shift_name,
            employee_id: saved.employee_id,
            sales_amount: Number(saved.sales_amount || 0),
            order_count: totals.order_count
        });
    }

    return {
        date: dateKey,
        order_count: (orders || []).length,
        updated,
        unmatched
    };
}
