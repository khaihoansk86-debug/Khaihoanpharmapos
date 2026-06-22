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
    return normalizeTimeToSeconds(a.end_time) - normalizeTimeToSeconds(b.end_time);
}

function compareStartDesc(a, b) {
    return compareStartAsc(b, a);
}

export function pickTimeMatchedShift(shifts, currentSec, employeeId) {
    const timeMatched = (shifts || []).filter(s => {
        if (!s.start_time || !s.end_time) return false;
        const startSec = normalizeTimeToSeconds(s.start_time);
        const endSec = normalizeTimeToSeconds(s.end_time);
        return isTimeInInterval(currentSec, startSec, endSec);
    });

    if (!timeMatched.length) return null;

    timeMatched.sort((a, b) => {
        const aIsEmployee = a.employee_id === employeeId;
        const bIsEmployee = b.employee_id === employeeId;
        if (aIsEmployee && !bIsEmployee) return -1;
        if (bIsEmployee && !aIsEmployee) return 1;
        return compareStartAsc(a, b);
    });

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
    const employeeOpenWorkedShifts = openWorkedShifts.filter(s => s.employee_id === employeeId);
    return pickTimeMatchedShift(employeeOpenWorkedShifts, currentSec, employeeId)
        || pickNextEmployeeShift(shifts, currentSec, employeeId)
        || pickTimeMatchedShift(openWorkedShifts, currentSec, employeeId);
}
