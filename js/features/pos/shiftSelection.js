export const normalizeTimeToSeconds = (timeStr) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map(Number);
    return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
};

export const isTimeInInterval = (timeSec, startSec, endSec) => {
    if (endSec >= startSec) {
        return timeSec >= startSec && timeSec < endSec;
    }
    return timeSec >= startSec || timeSec < endSec;
};

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

function compareStartDesc(a, b) {
    return compareStartAsc(b, a);
}

function compareCreatedAsc(a, b) {
    const createdA = Date.parse(a.created_at || 0);
    const createdB = Date.parse(b.created_at || 0);
    if (createdA !== createdB) return createdA - createdB;

    return String(a.id || '').localeCompare(String(b.id || ''));
}

export function pickTimeMatchedShift(shifts, currentSec, employeeId, options = {}) {
    const timeMatched = (shifts || []).filter(s => {
        if (!s.start_time || !s.end_time) return false;
        const startSec = normalizeTimeToSeconds(s.start_time);
        const resolvedEndSec = options.resolveEndSec?.(s);
        const endSec = Number.isFinite(resolvedEndSec)
            ? resolvedEndSec
            : normalizeTimeToSeconds(s.end_time);
        return isTimeInInterval(currentSec, startSec, endSec);
    });

    if (!timeMatched.length) return null;

    // Khi nhiều ca cùng bao phủ thời điểm bán, ca được tạo trước có quyền ưu tiên.
    // Nhân viên đang đăng nhập chỉ được dùng làm fallback khi không có ca khớp giờ.
    timeMatched.sort(compareCreatedAsc);

    return timeMatched[0];
}

export function pickNextEmployeeShift(shifts, currentSec, employeeId) {
    const employeeShifts = (shifts || []).filter(s => s.employee_id === employeeId && !s.is_closed);
    if (!employeeShifts.length) return null;

    const worked = employeeShifts.filter(s => s.status === 'worked');
    const candidates = worked.length ? worked : employeeShifts;

    const upcoming = candidates
        .filter(s => normalizeTimeToSeconds(s.start_time) >= currentSec)
        .sort(compareStartAsc);
    if (upcoming.length) return upcoming[0];

    return [...candidates].sort(compareStartDesc)[0] || null;
}

export function pickShiftForPOSSync(shifts, currentSec, employeeId) {
    const openWorkedShifts = (shifts || []).filter(s => s.status === 'worked' && !s.is_closed);
    return pickTimeMatchedShift(openWorkedShifts, currentSec, employeeId)
        || pickNextEmployeeShift(shifts, currentSec, employeeId);
}
