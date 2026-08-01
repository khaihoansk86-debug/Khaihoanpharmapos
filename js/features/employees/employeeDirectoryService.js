export async function fetchEmployeeDirectory(client) {
    if (!client?.rpc) throw new Error('Supabase chưa được kết nối.');

    const { data, error } = await client.rpc('get_employee_directory');
    if (error) throw new Error(error.message || 'Không thể tải danh bạ nhân viên.');
    return data || [];
}
