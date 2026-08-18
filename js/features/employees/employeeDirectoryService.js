export async function fetchEmployeeDirectory(client) {
    if (!client?.rpc) throw new Error('Supabase chưa được kết nối.');

    const { data, error } = await client.rpc('get_employee_directory');
    if (error) throw new Error(error.message || 'Không thể tải danh bạ nhân viên.');
    return data || [];
}

/**
 * Load active accounts for the shared POS register account switcher.
 * This uses a protected RPC because employee-row RLS intentionally limits
 * non-admin profile reads to the signed-in employee.
 */
export async function fetchEmployeeAccountDirectory(client) {
    if (!client?.rpc) throw new Error('Supabase chÆ°a Ä‘Æ°á»£c káº¿t ná»‘i.');

    const { data, error } = await client.rpc('get_employee_account_directory');
    if (error) throw new Error(error.message || 'KhÃ´ng thá»ƒ táº£i danh sÃ¡ch tÃ i khoáº£n.');
    return data || [];
}
