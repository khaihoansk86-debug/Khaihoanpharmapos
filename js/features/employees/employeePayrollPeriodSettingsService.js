import { getPayrollMonthRange } from './employeePayrollPeriodRules.js';
import { buildPayrollPeriodSettingPayload } from './employeePayrollPeriodSettingsRules.js';

const TABLE = 'employee_payroll_period_settings';

function requireClient(client) {
    if (!client) throw new Error('Supabase chưa được kết nối.');
    return client;
}

export async function fetchEmployeePayrollPeriodSettings(
    payrollMonth,
    client
) {
    const db = requireClient(client);
    const monthKey = getPayrollMonthRange(payrollMonth).first;
    const { data, error } = await db
        .from(TABLE)
        .select('*')
        .eq('payroll_month', monthKey)
        .order('employee_id', { ascending: true });

    if (error) throw new Error(error.message || 'Không thể tải thiết lập kỳ lương.');
    return data || [];
}

export async function saveEmployeePayrollPeriodSetting(
    input,
    client
) {
    const db = requireClient(client);
    const payload = buildPayrollPeriodSettingPayload(input);
    const { data, error } = await db
        .from(TABLE)
        .upsert(payload, { onConflict: 'employee_id,payroll_month' })
        .select()
        .single();

    if (error) throw new Error(error.message || 'Không thể lưu thiết lập kỳ lương.');
    return data;
}
