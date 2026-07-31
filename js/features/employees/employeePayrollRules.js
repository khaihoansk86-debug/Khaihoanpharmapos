export const STANDARD_MONTHLY_WORK_DAYS = 27;
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
        safeNumber(employee.daily_rate) * STANDARD_MONTHLY_WORK_DAYS
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

    let workedDays = 0;
    let leaveDays = 0;
    days.forEach(day => {
        if (day.worked) workedDays += 1;
        else if (day.off) leaveDays += 1;
    });
    return { workedDays, leaveDays };
}

export function calculateEmployeePayroll({ employee = {}, shifts = [] } = {}) {
    const monthlySalary = getEmployeeMonthlySalary(employee);
    const monthlyAllowance = getEmployeeMonthlyAllowance(employee);
    const dailyRate = monthlySalary / STANDARD_MONTHLY_WORK_DAYS;
    const { workedDays, leaveDays } = summarizeAttendanceDays(shifts);
    const hasAttendance = workedDays + leaveDays > 0;
    const paidLeaveDays = hasAttendance
        ? Math.min(leaveDays, MONTHLY_PAID_LEAVE_DAYS)
        : 0;
    const unusedLeaveDays = hasAttendance && leaveDays === 0
        ? MONTHLY_PAID_LEAVE_DAYS
        : 0;
    const unpaidLeaveDays = Math.max(
        0,
        leaveDays - MONTHLY_PAID_LEAVE_DAYS
    );
    const paidDays = workedDays + paidLeaveDays + unusedLeaveDays;
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
        leaveDays,
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
