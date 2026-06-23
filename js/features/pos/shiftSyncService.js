import { getShifts, saveShift } from '../employees/employeeService.js';
import { pickShiftForPOSSync, pickTimeMatchedShift } from './shiftSelection.js';
import { getOrderRules } from './orderRules.js';
import { getPaymentAmountsForDelta, shouldReverseOrderFromShift } from './shiftAmountRules.js';

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

export async function syncPaymentToCurrentShift(amount, orderCode, method = 'cash', context = {}, options = {}) {
    const rules = getOrderRules(context);
    if (!rules.shouldSyncShift || !amount || amount <= 0) return null;

    const employeeId = options.employeeId || getCurrentEmployeeId();
    if (!employeeId) return null;

    const now = options.now || new Date();
    const todayStr = todayKey(now);
    const currentSec = currentTimeSeconds(now);
    const shifts = await getShifts({ from: todayStr, to: todayStr });

    let shiftToUpdate = pickShiftForPOSSync(shifts, currentSec, employeeId);

    if (shiftToUpdate) {
        console.log('Khop ca lam viec theo gio thuc te:', shiftToUpdate.shift_name, 'NV:', shiftToUpdate.employee_id);
    } else {
        console.log('Ngoai gio ca lam viec, tinh cho tai khoan dang nhap:', employeeId);

        let matched = (shifts || []).filter(shift => shift.employee_id === employeeId && shift.status === 'worked' && !shift.is_closed);
        if (!matched.length) {
            matched = (shifts || []).filter(shift => shift.employee_id === employeeId && !shift.is_closed);
        }

        if (matched.length) {
            matched.sort((a, b) => {
                const timeA = `${a.start_time || ''}${a.end_time || ''}`;
                const timeB = `${b.start_time || ''}${b.end_time || ''}`;
                return timeB.localeCompare(timeA);
            });
            shiftToUpdate = matched[0];
        }
    }

    if (shiftToUpdate) {
        const amounts = getPaymentAmountsForDelta(shiftToUpdate, amount, method, 1);

        const savedShift = await saveShift({
            ...shiftToUpdate,
            ...amounts
        });
        console.log('Da cap nhat doanh thu vao ca:', shiftToUpdate.shift_name, 'NV:', shiftToUpdate.employee_id, 'so tien:', amount, 'don:', orderCode);
        await options.onSynced?.(savedShift);
        return savedShift;
    }

    try {
        const nextDay = new Date(now);
        nextDay.setDate(nextDay.getDate() + 1);
        const limitDate = new Date(now);
        limitDate.setDate(limitDate.getDate() + 30);

        const futureShifts = await getShifts({ from: todayKey(nextDay), to: todayKey(limitDate) });
        const userFutureShifts = (futureShifts || [])
            .filter(shift => shift.employee_id === employeeId)
            .sort((a, b) => a.shift_date.localeCompare(b.shift_date));

        if (!userFutureShifts.length) return null;

        const targetDate = userFutureShifts[0].shift_date;
        const targetDayShifts = userFutureShifts.filter(s => s.shift_date === targetDate);
        const mainShift = targetDayShifts.find(s => s.status === 'worked') || targetDayShifts[0];
        if (!mainShift) return null;

        const newOutOfShift = Number(mainShift.out_of_shift_sales || 0) + amount;
        const posPortion = Math.max(0, Number(mainShift.cash_amount || 0) + Number(mainShift.bank_amount || 0) - Number(mainShift.cash_exchange_amount || 0));
        const existingExtra = Math.max(0, Number(mainShift.sales_amount || 0) - posPortion - Number(mainShift.out_of_shift_sales || 0));
        const newSales = posPortion + existingExtra + newOutOfShift;

        const savedShift = await saveShift({
            ...mainShift,
            out_of_shift_sales: newOutOfShift,
            sales_amount: newSales
        });
        console.log('Da tu dong cong tien ngoai ca vao ca ngay:', mainShift.shift_date, 'NV:', employeeId, 'so tien:', amount, 'don:', orderCode);
        return savedShift;
    } catch (err) {
        console.error('Loi khi tu dong cong tien ngoai ca:', err);
        return null;
    }
}

export async function reversePaymentFromShiftForOrder(order, options = {}) {
    if (!shouldReverseOrderFromShift(order)) return null;

    const amount = Number(order.total || 0);
    const employeeId = options.employeeId || getCurrentEmployeeId();
    const shiftDate = getShiftDateFromOrder(order);
    const orderSec = getOrderTimeSeconds(order);
    const shifts = await getShifts({ from: shiftDate, to: shiftDate });
    const workedShifts = (shifts || []).filter(shift => shift.status === 'worked');
    let shiftToUpdate = pickTimeMatchedShift(workedShifts, orderSec, employeeId);

    if (!shiftToUpdate && employeeId) {
        const employeeShifts = (shifts || []).filter(shift => shift.employee_id === employeeId);
        shiftToUpdate = pickTimeMatchedShift(employeeShifts, orderSec, employeeId)
            || employeeShifts.find(shift => shift.status === 'worked')
            || employeeShifts[0];
    }

    if (!shiftToUpdate) return null;

    const amounts = getPaymentAmountsForDelta(shiftToUpdate, amount, order.payment_method || 'cash', -1);
    const savedShift = await saveShift({
        ...shiftToUpdate,
        ...amounts
    });

    console.log('Da tru nguoc doanh thu ca khi huy don:', shiftToUpdate.shift_name, 'so tien:', amount, 'don:', order.order_code);
    await options.onSynced?.(savedShift);
    return savedShift;
}
