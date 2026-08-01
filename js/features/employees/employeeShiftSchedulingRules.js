const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const MAX_SHIFT_RANGE_DAYS = 62;

function normalizeText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
}

export function normalizeEmployeeShiftName(value) {
    const normalized = normalizeText(value);
    if (normalized === 'sang' || normalized === 'ca sang') return 'Sáng';
    if (normalized === 'chieu' || normalized === 'ca chieu') return 'Chiều';
    throw new Error('INVALID_SHIFT_NAME');
}

function parseDate(value) {
    if (!DATE_PATTERN.test(String(value || ''))) throw new Error('INVALID_SHIFT_DATE');
    const date = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
        throw new Error('INVALID_SHIFT_DATE');
    }
    return date;
}

function normalizeAmount(value) {
    const amount = Number(value || 0);
    if (!Number.isFinite(amount) || amount < 0) throw new Error('INVALID_SHIFT_AMOUNT');
    return amount;
}

export function validateEmployeeShift(input = {}) {
    if (!UUID_PATTERN.test(String(input.employee_id || ''))) throw new Error('INVALID_EMPLOYEE_ID');
    const shiftDate = String(input.shift_date || '');
    parseDate(shiftDate);
    const startTime = String(input.start_time || '').slice(0, 5);
    const endTime = String(input.end_time || '').slice(0, 5);
    if (!TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime) || endTime <= startTime) {
        throw new Error('INVALID_SHIFT_TIME');
    }
    const status = input.status === 'off' ? 'off' : input.status === 'worked' ? 'worked' : null;
    if (!status) throw new Error('INVALID_SHIFT_STATUS');
    const note = String(input.note || '').trim();
    if (note.length > 500) throw new Error('INVALID_SHIFT_NOTE');
    const isOff = status === 'off';

    return {
        employee_id: input.employee_id,
        shift_date: shiftDate,
        shift_name: normalizeEmployeeShiftName(input.shift_name),
        start_time: startTime,
        end_time: endTime,
        cash_amount: isOff ? 0 : normalizeAmount(input.cash_amount),
        bank_amount: isOff ? 0 : normalizeAmount(input.bank_amount),
        cash_exchange_amount: isOff ? 0 : normalizeAmount(input.cash_exchange_amount),
        sales_amount: isOff ? 0 : normalizeAmount(input.sales_amount),
        out_of_shift_sales: isOff ? 0 : normalizeAmount(input.out_of_shift_sales),
        status,
        note: note || null
    };
}

export function buildEmployeeShiftRange({ from, to, ...input } = {}) {
    const start = parseDate(from);
    const end = parseDate(to || from);
    const dayCount = Math.floor((end - start) / 86400000) + 1;
    if (dayCount < 1) throw new Error('INVALID_SHIFT_RANGE');
    if (dayCount > MAX_SHIFT_RANGE_DAYS) throw new Error('SHIFT_RANGE_TOO_LARGE');

    return Array.from({ length: dayCount }, (_, index) => {
        const date = new Date(start);
        date.setUTCDate(date.getUTCDate() + index);
        return validateEmployeeShift({
            ...input,
            shift_date: date.toISOString().slice(0, 10)
        });
    });
}

export { MAX_SHIFT_RANGE_DAYS };
