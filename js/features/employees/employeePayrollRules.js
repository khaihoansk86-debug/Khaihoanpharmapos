export const STANDARD_MONTHLY_WORK_DAYS = 30;
export const MONTHLY_PAID_REST_DAYS = 3;
export const MONTHLY_PAID_LEAVE_DAYS = 1;

function safeNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}

export function getEmployeeMonthlySalary(employee = {}) {
    if (employee.monthly_salary !== undefined && employee.monthly_salary !== null) {
        return Math.max(0, safeNumber(employee.monthly_salary));
    }
    return Math.max(
        0,
        // Legacy daily_rate stores the old monthly contract divided by 27.
        // Preserve that contract; only payroll's daily divisor changes.
        safeNumber(employee.daily_rate) * 27
    );
}

export function getEmployeeMonthlyAllowance(employee = {}) {
    return Math.max(0, safeNumber(employee.monthly_allowance));
}

function summarizeAttendanceDays(shifts = []) {
    const days = new Map();
    (shifts || []).forEach(shift => {
        const date = String(shift?.shift_date || '').trim();
        if (!date) return;
        const current = days.get(date) || { worked: false, off: false };
        if (shift.status === 'worked') current.worked = true;
        if (shift.status === 'off') current.off = true;
        days.set(date, current);
    });

    let recordedWorkedDays = 0;
    let recordedOffDays = 0;
    days.forEach(day => {
        if (day.worked) recordedWorkedDays += 1;
        else if (day.off) recordedOffDays += 1;
    });

    const restDays = Math.min(recordedOffDays, MONTHLY_PAID_REST_DAYS);
    const leaveDays = Math.max(0, recordedOffDays - restDays);
    return {
        workedDays: recordedWorkedDays,
        leaveDays,
        restDays,
        recordedWorkedDays
    };
}

export function calculateEmployeePayroll({ employee = {}, shifts = [] } = {}) {
    const monthlySalary = getEmployeeMonthlySalary(employee);
    const monthlyAllowance = getEmployeeMonthlyAllowance(employee);
    const dailyRate = monthlySalary / STANDARD_MONTHLY_WORK_DAYS;
    const {
        workedDays,
        leaveDays,
        restDays,
        recordedWorkedDays
    } = summarizeAttendanceDays(shifts);
    const hasAttendance = recordedWorkedDays + leaveDays + restDays > 0;
    const paidLeaveDays = hasAttendance
        ? Math.min(leaveDays, MONTHLY_PAID_LEAVE_DAYS)
        : 0;
    const unusedLeaveDays = hasAttendance
        ? Math.max(0, MONTHLY_PAID_REST_DAYS + MONTHLY_PAID_LEAVE_DAYS - restDays - leaveDays)
        : 0;
    const unpaidLeaveDays = Math.max(
        0,
        leaveDays - MONTHLY_PAID_LEAVE_DAYS
    );
    // Full-month estimate from recorded days off, never calendar-month length.
    // Missing attendance is not an absence; an empty month earns no estimate.
    const paidDays = hasAttendance
        ? Math.max(0, STANDARD_MONTHLY_WORK_DAYS + unusedLeaveDays - unpaidLeaveDays)
        : 0;
    const sales = (shifts || []).reduce(
        (sum, shift) => sum + Math.max(0, safeNumber(shift?.sales_amount)),
        0
    );
    const commissionRate = Math.max(0, safeNumber(employee.commission_rate));
    const basePay = Math.round(paidDays * dailyRate);
    const commission = Math.round(sales * commissionRate / 100);
    const allowance = hasAttendance ? Math.round(monthlyAllowance) : 0;

    return {
        monthlySalary,
        monthlyAllowance,
        dailyRate,
        workedDays,
        recordedWorkedDays,
        leaveDays,
        restDays,
        paidLeaveDays,
        unusedLeaveDays,
        unpaidLeaveDays,
        paidDays,
        sales,
        commissionRate,
        basePay,
        allowance,
        commission,
        total: basePay + allowance + commission
    };
}
