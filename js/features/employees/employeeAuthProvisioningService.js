async function getSessionAccessToken(client) {
    if (!client?.auth?.getSession) {
        throw new Error('Chưa kết nối được máy chủ cấp tài khoản.');
    }

    const { data, error } = await client.auth.getSession();
    const accessToken = data?.session?.access_token;
    if (error || !accessToken) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
    return accessToken;
}

export async function provisionEmployeeAuth(client, {
    employeeId,
    username,
    password,
    fetchImpl = globalThis.fetch
} = {}) {
    if (!employeeId || !username || !password) {
        throw new Error('Thiếu thông tin tài khoản nhân viên.');
    }
    if (typeof fetchImpl !== 'function') {
        throw new Error('Chưa kết nối được máy chủ cấp tài khoản.');
    }

    const accessToken = await getSessionAccessToken(client);

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

export async function deleteEmployeeAccount(client, {
    employeeId,
    fetchImpl = globalThis.fetch
} = {}) {
    if (!employeeId) throw new Error('Thiếu mã nhân viên cần xóa.');
    if (typeof fetchImpl !== 'function') {
        throw new Error('Chưa kết nối được máy chủ xóa tài khoản.');
    }

    const accessToken = await getSessionAccessToken(client);
    const response = await fetchImpl('/api/employee-auth-delete', {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
        },
        cache: 'no-store',
        credentials: 'same-origin',
        body: JSON.stringify({ employeeId })
    });

    if (response.ok) return true;
    if (response.status === 409) {
        throw new Error('Không thể xóa tài khoản đang sử dụng hoặc quản trị viên cuối cùng.');
    }
    if (response.status === 401) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
    if (response.status === 403) {
        throw new Error('Bạn không có quyền xóa tài khoản nhân viên.');
    }
    if (response.status === 404) return true;
    throw new Error('Không thể xóa tài khoản nhân viên lúc này.');
}
