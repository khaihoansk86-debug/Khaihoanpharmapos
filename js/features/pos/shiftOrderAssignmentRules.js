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

    // Ngoài mọi ca: giữ người bán tại thời điểm lập hóa đơn. Nếu người bán không có ca
    // trong ngày (ví dụ ca đã bị xóa/chuyển), fallback sang người đang đối soát hoặc ca làm duy nhất trong ngày.
    let fallbackShift = sellerEmployeeId
        ? pickNextEmployeeShift(shifts, orderSec, sellerEmployeeId)
        : null;

    if (!fallbackShift && reconciliationEmployeeId) {
        fallbackShift = pickNextEmployeeShift(shifts, orderSec, reconciliationEmployeeId);
    }

    if (!fallbackShift) {
        const remainingWorked = shifts.filter((shift) => shift.status === 'worked');
        if (remainingWorked.length === 1) {
            fallbackShift = remainingWorked[0];
        }
    }

    return fallbackShift
        ? { shift: fallbackShift, outOfShift: true }
        : null;
}
