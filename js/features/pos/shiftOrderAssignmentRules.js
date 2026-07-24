import { pickNextEmployeeShift, pickTimeMatchedShift } from './shiftSelection.js?v=20260712a';

export function pickShiftForOrderAssignment({
    shifts = [],
    orderSec = 0,
    sellerEmployeeId = null,
    reconciliationEmployeeId = null,
    resolveEndSec
} = {}) {
    const workedShifts = shifts.filter((shift) => shift.status === 'worked');
    const scheduledShift = pickTimeMatchedShift(workedShifts, orderSec, null, { resolveEndSec });

    if (scheduledShift) {
        return { shift: scheduledShift, outOfShift: false };
    }

    // Ngoài mọi ca: giữ người bán tại thời điểm lập hóa đơn. Người đang đối soát
    // chỉ là fallback cho dữ liệu cũ chưa có seller_employee_id.
    const employeeId = sellerEmployeeId || reconciliationEmployeeId;
    const fallbackShift = employeeId
        ? pickNextEmployeeShift(shifts, orderSec, employeeId)
        : null;

    return fallbackShift
        ? { shift: fallbackShift, outOfShift: true }
        : null;
}
