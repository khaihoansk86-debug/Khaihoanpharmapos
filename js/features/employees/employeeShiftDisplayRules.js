const EMPLOYEE_SHIFT_DISPLAY_TEMPLATES = Object.freeze([
    Object.freeze({
        id: 'morning',
        type: 'morning',
        name: 'Sáng',
        start_time: '06:30',
        end_time: '13:30'
    }),
    Object.freeze({
        id: 'afternoon',
        type: 'afternoon',
        name: 'Chiều',
        start_time: '13:30',
        end_time: '20:00'
    })
]);

const LEGACY_DEFAULT_TIMES = Object.freeze({
    morning: '07:00|14:00',
    afternoon: '14:00|21:00'
});

function normalizeText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
}

function normalizeTime(value) {
    return value ? String(value).slice(0, 5) : '';
}

export function getEmployeeShiftDisplayType(name) {
    const normalized = normalizeText(name);
    if (normalized === 'sang' || normalized === 'ca sang') return 'morning';
    if (normalized === 'chieu' || normalized === 'ca chieu') return 'afternoon';
    return null;
}

export function buildEmployeeShiftDisplayTemplates(storedTemplates = []) {
    const stored = Array.isArray(storedTemplates) ? storedTemplates : [];

    return EMPLOYEE_SHIFT_DISPLAY_TEMPLATES.map(defaultTemplate => {
        const saved = stored.find(template => template?.id === defaultTemplate.id);
        if (!saved) return { ...defaultTemplate };

        const savedTimes = `${normalizeTime(saved.start_time)}|${normalizeTime(saved.end_time)}`;
        if (savedTimes === LEGACY_DEFAULT_TIMES[defaultTemplate.type]) {
            return { ...defaultTemplate };
        }

        return {
            ...defaultTemplate,
            start_time: normalizeTime(saved.start_time) || defaultTemplate.start_time,
            end_time: normalizeTime(saved.end_time) || defaultTemplate.end_time
        };
    });
}

export function shiftBelongsToEmployeeShiftDisplay(shift = {}, template = {}) {
    return Boolean(template.type)
        && getEmployeeShiftDisplayType(shift.shift_name) === template.type;
}
