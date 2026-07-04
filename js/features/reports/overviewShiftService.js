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
export function getLocalTimeSeconds(dateStr) {
    const d = new Date(dateStr);
    return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
}

export function normalizeTimeToSeconds(timeStr) {
    if (!timeStr) return 0;
    const parts = String(timeStr).split(':').map(Number);
    const hrs = parts[0] || 0;
    const mins = parts[1] || 0;
    const secs = parts[2] || 0;
    return hrs * 3600 + mins * 60 + secs;
}

export function isTimeInInterval(timeSec, startSec, endSec) {
    if (endSec >= startSec) {
        return timeSec >= startSec && timeSec < endSec;
    }
    return timeSec >= startSec || timeSec < endSec;
}

function toNumber(value) {
    const number = Number(value || 0);
    return Number.isFinite(number) ? number : 0;
}

function dateKey(value) {
    const d = new Date(value);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function localSecondsFromDate(value) {
    const d = new Date(value);
    return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
}

function buildShiftSegment(shift) {
    const startSec = normalizeTimeToSeconds(shift.start_time);
    const endSec = shift.is_closed && shift.closed_at
        ? localSecondsFromDate(shift.closed_at)
        : normalizeTimeToSeconds(shift.end_time);

    return {
        name: shift.shift_name,
        start_time: shift.start_time,
        end_time: shift.end_time,
        startSec,
        endSec,
        revenue: 0
    };
}

export function buildOverviewShiftsByDay({ keys = [], shiftData = [], orders = [] } = {}) {
    const shiftsByDay = new Map();

    keys.forEach(key => {
        const dayShifts = shiftData
            .filter(shift => shift.shift_date === key && shift.status === 'worked')
            .map(buildShiftSegment)
            .sort((a, b) => (a.start_time || '00:00:00').localeCompare(b.start_time || '00:00:00'));

        const dayOrders = orders.filter(order => dateKey(order.created_at) === key);
        dayOrders.forEach(order => {
            const orderTimeSec = getLocalTimeSeconds(order.created_at);
            const matchingShift = dayShifts.find(shift => isTimeInInterval(orderTimeSec, shift.startSec, shift.endSec));
            if (matchingShift) {
                matchingShift.revenue += toNumber(order.total);
            }
        });

        shiftsByDay.set(key, dayShifts);
    });

    return shiftsByDay;
}

