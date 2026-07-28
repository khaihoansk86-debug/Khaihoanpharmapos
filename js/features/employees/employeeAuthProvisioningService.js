export async function provisionEmployeeAuth(client, {
    employeeId,
    username,
    password,
    fetchImpl = globalThis.fetch
} = {}) {
    if (!employeeId || !username || !password) {
        throw new Error('Thiếu thông tin tài khoản nhân viên.');
    }
    if (!client?.auth?.getSession || typeof fetchImpl !== 'function') {
        throw new Error('Chưa kết nối được máy chủ cấp tài khoản.');
    }

    const { data, error } = await client.auth.getSession();
    const accessToken = data?.session?.access_token;
    if (error || !accessToken) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }

    const response = await fetchImpl('/api/employee-auth-provision', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
        },
        cache: 'no-store',
        credentials: 'same-origin',
        body: JSON.stringify({ employeeId, username, password })
    });

    if (response.ok) return true;
    if (response.status === 409) {
        throw new Error('Tên đăng nhập đã được sử dụng.');
    }
    if (response.status === 401) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
    if (response.status === 403) {
        throw new Error('Bạn không có quyền cấp tài khoản nhân viên.');
    }
    throw new Error('Không thể cấp tài khoản nhân viên lúc này.');
}
