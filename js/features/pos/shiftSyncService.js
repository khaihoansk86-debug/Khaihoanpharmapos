import { getShifts, saveShift } from '../employees/employeeService.js';
import { getOrderRules } from './orderRules.js';
import {
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

export async function syncPaymentToCurrentShift(amount, orderCode, method = 'cash', context = {}, options = {}) {
    try {
        const rules = getOrderRules(context);
        if (!rules.shouldSyncShift || !amount || amount <= 0) return null;

        const employeeId = options.employeeId || getCurrentEmployeeId();
        if (!employeeId) return null;

        // THUẬT TOÁN ĐƠN GIẢN: Tìm ca làm việc đang mở gần nhất (bất kể ngày nào)
        // Ưu tiên ca của chính nhân viên này, nếu không có thì lấy ca bất kỳ đang mở
        const { data: shifts, error } = await import('../../core/supabase.js').then(m => m.supabaseClient
            .from('employee_shifts')
            .select('*')
            .eq('status', 'worked')
            .eq('is_closed', false)
            .order('created_at', { ascending: false })
            .limit(10)
        );

        if (error || !shifts || shifts.length === 0) {
            console.log('Không tìm thấy ca làm việc nào đang mở để cộng tiền.');
            return null;
        }

        let shiftToUpdate = shifts.find(s => s.employee_id === employeeId);
        if (!shiftToUpdate) {
            shiftToUpdate = shifts[0]; // Lấy ca đầu tiên đang mở nếu không tìm thấy ca của nhân viên
            console.log(`Đẩy tiền vào ca của người khác (${shiftToUpdate.employee_id}) vì nhân viên hiện tại không mở ca.`);
        }

        const amounts = getPaymentAmountsForDelta(shiftToUpdate, amount, method, 1);

        const savedShift = await saveShift({
            ...shiftToUpdate,
            ...amounts
        });
        
        console.log('Đã cập nhật doanh thu vào ca:', shiftToUpdate.shift_name, 'số tiền:', amount, 'đơn:', orderCode);
        await options.onSynced?.(savedShift);
        return savedShift;
    } catch (err) {
        console.error('Lỗi khi đồng bộ tiền vào ca:', err);
        return null;
    }
}

export async function syncReturnSettlementToCurrentShift(total, orderCode, method = 'cash', options = {}) {
    const amount = Math.abs(Number(total || 0));
    if (!amount) return null;

    const employeeId = options.employeeId || getCurrentEmployeeId();
    if (!employeeId) return null;

    // THUẬT TOÁN ĐƠN GIẢN
    const { data: shifts, error } = await import('../../core/supabase.js').then(m => m.supabaseClient
        .from('employee_shifts')
        .select('*')
        .eq('status', 'worked')
        .eq('is_closed', false)
        .order('created_at', { ascending: false })
        .limit(10)
    );

    if (error || !shifts || shifts.length === 0) return null;

    let shift = shifts.find(s => s.employee_id === employeeId);
    if (!shift) shift = shifts[0];

    let amounts;
    if (Number(total) > 0) {
        amounts = getPaymentAmountsForDelta(shift, amount, method, 1);
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
            sales_amount: Math.max(0,
                Number(shift.cash_amount || 0)
                + Number(shift.bank_amount || 0)
                - cashExchangeAmount
                + extraAmount
                + Number(shift.out_of_shift_sales || 0)
            )
        };
    }

    const savedShift = await saveShift({ ...shift, ...amounts });
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
    const workedShifts = (shifts || []).filter(shift => shift.status === 'worked');
    let shiftToUpdate = pickTimeMatchedShift(workedShifts, orderSec, employeeId);

    if (!shiftToUpdate && employeeId) {
        const employeeShifts = (shifts || []).filter(shift => shift.employee_id === employeeId);
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
