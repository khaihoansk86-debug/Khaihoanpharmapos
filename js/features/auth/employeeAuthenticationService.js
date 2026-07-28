function cleanUsername(value) {
    return String(value || '').trim();
}

const AUTH_TIMEOUT_MS = 8000;

async function runWithTimeout(operation, timeoutMs = AUTH_TIMEOUT_MS) {
    let timeoutId;
    try {
        return await Promise.race([
            operation(),
            new Promise((_, reject) => {
                timeoutId = setTimeout(
                    () => reject(new Error('Authentication timed out.')),
                    timeoutMs
                );
            })
        ]);
    } finally {
        clearTimeout(timeoutId);
    }
}

function normalizeEmployeeProfile(employee) {
    return {
        id: employee.id,
        name: employee.name,
        username: employee.username,
        role: employee.role || 'staff',
        status: employee.status,
        permissions: Array.isArray(employee.permissions) ? employee.permissions : [],
        authMigrationReady: true,
        authenticatedSession: true
    };
}

export async function buildEmployeeAuthEmail(username) {
    const normalizedUsername = cleanUsername(username).toLocaleLowerCase('vi-VN');
    if (!normalizedUsername) throw new Error('Thiếu tên đăng nhập.');
    const message = new TextEncoder().encode(normalizedUsername);
    const digest = await crypto.subtle.digest('SHA-256', message);
    const identifier = Array.from(new Uint8Array(digest))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
    return `${identifier}@pos.khaihoanpharma.local`;
}

async function clearUnboundAuthSession(client) {
    try {
        await client?.auth?.signOut?.();
    } catch {
        // The caller still receives a generic authentication error.
    }
}

export async function authenticateEmployee(client, {
    username,
    password,
    timeoutMs = AUTH_TIMEOUT_MS
} = {}) {
    const normalizedUsername = cleanUsername(username);
    const rawPassword = String(password || '');
    if (!normalizedUsername || !rawPassword) {
        throw new Error('Vui lòng nhập tên đăng nhập và mật khẩu.');
    }
    if (!client?.auth?.signInWithPassword || !client?.rpc) {
        throw new Error('Chưa kết nối được máy chủ xác thực.');
    }

    const email = await buildEmployeeAuthEmail(normalizedUsername);
    let signInResult;
    try {
        signInResult = await runWithTimeout(
            () => client.auth.signInWithPassword({
                email,
                password: rawPassword
            }),
            timeoutMs
        );
    } catch {
        throw new Error('Không thể xác thực tài khoản lúc này.');
    }

    if (signInResult.error) {
        throw new Error('Sai tên đăng nhập hoặc mật khẩu!');
    }

    let profileResult;
    try {
        profileResult = await runWithTimeout(
            () => client.rpc('get_current_employee_profile'),
            timeoutMs
        );
    } catch {
        await clearUnboundAuthSession(client);
        throw new Error('Không thể xác thực tài khoản lúc này.');
    }

    const profile = Array.isArray(profileResult.data)
        ? profileResult.data[0]
        : profileResult.data;
    if (profileResult.error || !profile) {
        await clearUnboundAuthSession(client);
        throw new Error('Tài khoản không hoạt động hoặc chưa được liên kết.');
    }

    return normalizeEmployeeProfile(profile);
}
