const TIME_ZONE = 'Asia/Ho_Chi_Minh';

function timeToSeconds(value) {
    const parts = String(value || '').split(':').map(Number);
    return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
}

export function vietnamDateKey(date = new Date()) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(date);
}

function isTimeInInterval(timeSec, startSec, endSec) {
    if (endSec >= startSec) return timeSec >= startSec && timeSec < endSec;
    return timeSec >= startSec || timeSec < endSec;
}

export function findActiveShiftForTime(shifts = [], date = new Date()) {
    const dateKey = vietnamDateKey(date);
    const timeParts = new Intl.DateTimeFormat('en-GB', {
        timeZone: TIME_ZONE,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23'
    }).formatToParts(date);
    const time = Object.fromEntries(timeParts.map(part => [part.type, part.value]));
    const currentSec = timeToSeconds(`${time.hour}:${time.minute}:${time.second}`);

    return (shifts || [])
        .filter(shift => shift
            && shift.shift_date === dateKey
            && shift.status === 'worked'
            && shift.is_closed !== true
            && shift.employee_id
            && shift.start_time
            && shift.end_time
            && isTimeInInterval(
                currentSec,
                timeToSeconds(shift.start_time),
                timeToSeconds(shift.end_time)
            ))
        .sort((left, right) => timeToSeconds(left.start_time) - timeToSeconds(right.start_time))[0] || null;
}

export function shouldPromptShiftSwitch({ currentEmployeeId, activeShift } = {}) {
    return Boolean(
        activeShift?.employee_id
        && String(activeShift.employee_id) !== String(currentEmployeeId || '')
    );
}

export function buildShiftSwitchPromptKey(activeShift, date = new Date()) {
    if (!activeShift?.employee_id) return null;
    return [
        vietnamDateKey(date),
        activeShift.id || activeShift.employee_id,
        activeShift.start_time || '',
        activeShift.end_time || ''
    ].join(':');
}

export async function promptForActiveShiftEmployee({
    client,
    currentEmployeeId,
    now = new Date(),
    storage = globalThis.sessionStorage,
    openSwitchModal
} = {}) {
    if (!client?.from || !currentEmployeeId) return { status: 'skipped' };

    const dateKey = vietnamDateKey(now);
    const { data, error } = await client
        .from('employee_shifts')
        .select('id, employee_id, shift_date, shift_name, start_time, end_time, status, is_closed')
        .eq('shift_date', dateKey)
        .eq('status', 'worked');
    if (error) return { status: 'unavailable', error };

    const activeShift = findActiveShiftForTime(data || [], now);
    if (!shouldPromptShiftSwitch({ currentEmployeeId, activeShift })) {
        return { status: 'matched', activeShift };
    }

    const promptKey = buildShiftSwitchPromptKey(activeShift, now);
    if (storage?.getItem?.('pos_shift_switch_prompt') === promptKey) {
        return { status: 'already_prompted', activeShift };
    }
    storage?.setItem?.('pos_shift_switch_prompt', promptKey);

    if (typeof openSwitchModal !== 'function') {
        return { status: 'prompt_unavailable', activeShift };
    }
    await openSwitchModal({
        targetEmployeeId: activeShift.employee_id,
        shift: activeShift,
        autoPrompt: true
    });
    return { status: 'prompted', activeShift };
}
