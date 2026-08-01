function parseMonth(value) {
    const source = value instanceof Date ? new Date(value) : new Date(`${value || ''}T00:00:00`);
    if (Number.isNaN(source.getTime())) return new Date();
    return source;
}

function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function normalizePayrollMonth(value = new Date()) {
    const date = parseMonth(value);
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function shiftPayrollMonth(value, offset) {
    const date = normalizePayrollMonth(value);
    date.setMonth(date.getMonth() + Number(offset || 0));
    return normalizePayrollMonth(date);
}

export function getPayrollMonthRange(value) {
    const firstDate = normalizePayrollMonth(value);
    const lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth() + 1, 0);
    return {
        first: formatLocalDate(firstDate),
        last: formatLocalDate(lastDate)
    };
}

export function formatPayrollMonthLabel(value) {
    const date = normalizePayrollMonth(value);
    return `Tháng ${date.getMonth() + 1} / ${date.getFullYear()}`;
}
