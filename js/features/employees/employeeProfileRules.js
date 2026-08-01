const MAX_MONEY = 1_000_000_000_000;

function boundedMoney(value) {
    const amount = Number(value || 0);
    if (!Number.isFinite(amount) || amount < 0 || amount > MAX_MONEY) {
        throw new Error('INVALID_EMPLOYEE_MONEY');
    }
    return amount;
}

export function normalizeEmployeeProfileInput(employee = {}) {
    const name = String(employee.name || '').trim();
    if (!name || name.length > 150) throw new Error('INVALID_EMPLOYEE_NAME');
    const phone = String(employee.phone || '').trim();
    if (phone.length > 30) throw new Error('INVALID_EMPLOYEE_PHONE');
    const monthlySalary = boundedMoney(
        employee.monthly_salary ?? (Number(employee.daily_rate || 0) * 27)
    );
    const monthlyAllowance = boundedMoney(employee.monthly_allowance);
    const commissionRate = Number(employee.commission_rate || 0);
    if (!Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 100) {
        throw new Error('INVALID_COMMISSION_RATE');
    }
    const status = employee.status === 'inactive' ? 'inactive' : 'active';
    const role = ['admin', 'manager', 'staff'].includes(employee.role) ? employee.role : 'staff';
    const permissions = Array.isArray(employee.permissions)
        ? employee.permissions.filter(permission => typeof permission === 'string')
        : [];
    return {
        name,
        phone: phone || null,
        monthly_salary: monthlySalary,
        monthly_allowance: monthlyAllowance,
        daily_rate: monthlySalary / 27,
        commission_rate: commissionRate,
        status,
        role,
        permissions
    };
}
