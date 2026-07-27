function cleanUsername(value) {
    return String(value || '').trim();
}

const AUTH_UPGRADE_TIMEOUT_MS = 8000;

async function runWithTimeout(operation, timeoutMs = AUTH_UPGRADE_TIMEOUT_MS) {
    let timeoutId;
    try {
        return await Promise.race([
            operation(),
            new Promise((_, reject) => {
                timeoutId = setTimeout(
                    () => reject(new Error('Authentication upgrade timed out.')),
                    timeoutMs
                );
            })
        ]);
    } finally {
        clearTimeout(timeoutId);
    }
}

function normalizeEmployeeProfile(employee, {
    authenticatedSession = false,
    authMigrationReady = false
} = {}) {
    return {
        id: employee.id,
        name: employee.name,
        username: employee.username,
        role: employee.role || 'staff',
        status: employee.status,
        permissions: Array.isArray(employee.permissions) ? employee.permissions : [],
        authMigrationReady,
        authenticatedSession
    };
}

export async function hashLegacyEmployeePassword(password) {
    const rawPassword = String(password || '');
    if (!rawPassword) throw new Error('Vui lòng nhập mật khẩu.');
    const message = new TextEncoder().encode(rawPassword);
    const digest = await crypto.subtle.digest('SHA-256', message);
    return Array.from(new Uint8Array(digest))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
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

export async function authenticateLegacyEmployee(client, {
    username,
    password
} = {}) {
    const normalizedUsername = cleanUsername(username);
    if (!normalizedUsername || !password) {
        throw new Error('Vui lòng nhập tên đăng nhập và mật khẩu.');
    }
    if (!client?.rpc) {
        throw new Error('Chưa kết nối được máy chủ xác thực.');
    }

    const passwordHash = await hashLegacyEmployeePassword(password);
    const { data, error } = await client.rpc('authenticate_employee_legacy', {
        p_username: normalizedUsername,
        p_password_hash: passwordHash
    });
    if (error) throw new Error('Không thể xác thực tài khoản lúc này.');

    const employee = Array.isArray(data) ? data[0] : data;
    if (!employee) throw new Error('Sai tên đăng nhập hoặc mật khẩu!');
    if (employee.status === 'inactive') {
        throw new Error('Tài khoản này đã bị vô hiệu hóa!');
    }

    return normalizeEmployeeProfile(employee, {
        authMigrationReady: employee.auth_migration_ready === true
    });
}

export async function authenticateEmployee(client, {
    username,
    password,
    fetchImpl = globalThis.fetch,
    timeoutMs = AUTH_UPGRADE_TIMEOUT_MS
} = {}) {
    const normalizedUsername = cleanUsername(username);
    const rawPassword = String(password || '');
    if (!normalizedUsername || !rawPassword) {
        throw new Error('Vui lòng nhập tên đăng nhập và mật khẩu.');
    }

    if (client?.auth?.signInWithPassword && client?.rpc) {
        try {
            const email = await buildEmployeeAuthEmail(normalizedUsername);
            const signInResult = await runWithTimeout(
                () => client.auth.signInWithPassword({
                    email,
                    password: rawPassword
                }),
                timeoutMs
            );
            if (!signInResult.error) {
                const profileResult = await runWithTimeout(
                    () => client.rpc('get_current_employee_profile'),
                    timeoutMs
                );
                const profile = Array.isArray(profileResult.data)
                    ? profileResult.data[0]
                    : profileResult.data;
                if (!profileResult.error && profile) {
                    return normalizeEmployeeProfile(profile, {
                        authenticatedSession: true,
                        authMigrationReady: true
                    });
                }
            }
        } catch {
            // The legacy bridge remains available during the staged rollout.
        }
    }

    const employee = await authenticateLegacyEmployee(client, {
        username: normalizedUsername,
        password: rawPassword
    });
    employee.authenticatedSession = await tryUpgradeEmployeeAuthSession(client, {
        employee,
        username: normalizedUsername,
        password: rawPassword,
        fetchImpl,
        timeoutMs
    });
    return employee;
}

export async function tryUpgradeEmployeeAuthSession(client, {
    employee,
    username,
    password,
    fetchImpl = globalThis.fetch,
    timeoutMs = AUTH_UPGRADE_TIMEOUT_MS
} = {}) {
    if (!client?.auth?.signInWithPassword || !employee?.id) return false;

    const email = await buildEmployeeAuthEmail(username || employee.username);
    if (employee.authMigrationReady === true) {
        try {
            const existingSignIn = await runWithTimeout(
                () => client.auth.signInWithPassword({
                    email,
                    password: String(password || '')
                }),
                timeoutMs
            );
            if (!existingSignIn.error) return true;
        } catch {
            return false;
        }
    }

    if (typeof fetchImpl !== 'function') return false;
    const abortController = typeof AbortController === 'function'
        ? new AbortController()
        : null;
    let abortTimeoutId;
    try {
        if (abortController) {
            abortTimeoutId = setTimeout(() => abortController.abort(), timeoutMs);
        }
        const response = await fetchImpl('/api/auth-migrate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store'
            },
            cache: 'no-store',
            credentials: 'same-origin',
            signal: abortController?.signal,
            body: JSON.stringify({
                username: cleanUsername(username || employee.username),
                password: String(password || '')
            })
        });
        if (!response.ok) return false;
    } catch {
        return false;
    } finally {
        clearTimeout(abortTimeoutId);
    }

    try {
        const { error } = await runWithTimeout(
            () => client.auth.signInWithPassword({
                email,
                password: String(password || '')
            }),
            timeoutMs
        );
        return !error;
    } catch {
        return false;
    }
}
