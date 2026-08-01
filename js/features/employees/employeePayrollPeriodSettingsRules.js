import { getPayrollMonthRange } from './employeePayrollPeriodRules.js';

const MAX_MONEY = 1_000_000_000_000;
const MAX_NOTE_LENGTH = 500;

function requireNonNegativeMoney(value, label) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0 || number > MAX_MONEY) {
        throw new Error(`${label} không hợp lệ.`);
    }
    return Math.round(number);
}

function requireCommissionRate(value) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0 || number > 100) {
        throw new Error('Thưởng doanh số phải từ 0 đến 100%.');
    }
    return number;
}

export function buildPayrollPeriodSettingPayload(input = {}) {
    const employeeId = String(input.employee_id || '').trim();
    if (!employeeId) throw new Error('Thiếu nhân viên cần lưu kỳ lương.');

    const note = String(input.note || '').trim();
    if (note.length > MAX_NOTE_LENGTH) {
        throw new Error(`Ghi chú tối đa ${MAX_NOTE_LENGTH} ký tự.`);
    }

    return {
        employee_id: employeeId,
        payroll_month: getPayrollMonthRange(input.payroll_month).first,
        monthly_salary: requireNonNegativeMoney(input.monthly_salary, 'Lương cơ bản'),
        monthly_allowance: requireNonNegativeMoney(input.monthly_allowance, 'Phụ cấp'),
        commission_rate: requireCommissionRate(input.commission_rate),
        note: note || null
    };
}

export function resolvePayrollEmployeeForPeriod(employee = {}, setting = null) {
    if (!setting) {
        return { ...employee, payroll_setting_source: 'profile' };
    }

    return {
        ...employee,
        monthly_salary: Number(setting.monthly_salary || 0),
        monthly_allowance: Number(setting.monthly_allowance || 0),
        commission_rate: Number(setting.commission_rate || 0),
        payroll_setting_source: 'period'
    };
}
