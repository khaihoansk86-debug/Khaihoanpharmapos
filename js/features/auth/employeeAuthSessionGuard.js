const EMPLOYEE_STORAGE_KEY = 'pos_user';

function clearStoredEmployee(storage) {
    storage?.removeItem?.(EMPLOYEE_STORAGE_KEY);
}

export function readAuthenticatedEmployee(storage = globalThis.localStorage) {
    const rawEmployee = storage?.getItem?.(EMPLOYEE_STORAGE_KEY);
    if (!rawEmployee) return null;

    try {
        const employee = JSON.parse(rawEmployee);
        if (!employee || employee.authenticatedSession !== true) {
            clearStoredEmployee(storage);
            return null;
        }
        return employee;
    } catch {
        clearStoredEmployee(storage);
        return null;
    }
}

export async function verifyAuthenticatedEmployeeSession(
    client,
    storage = globalThis.localStorage
) {
    const employee = readAuthenticatedEmployee(storage);
    if (!employee || !client?.auth?.getSession) {
        clearStoredEmployee(storage);
        return null;
    }

    try {
        const { data, error } = await client.auth.getSession();
        if (error || !data?.session?.access_token) {
            clearStoredEmployee(storage);
            return null;
        }
        if (!client?.rpc) {
            clearStoredEmployee(storage);
            return null;
        }
        const profileResult = await client.rpc('get_current_employee_profile');
        const profile = Array.isArray(profileResult?.data)
            ? profileResult.data[0]
            : profileResult?.data;
        if (profileResult?.error || !profile || profile.id !== employee.id || profile.status !== 'active') {
            clearStoredEmployee(storage);
            return null;
        }
        return { ...employee, ...profile, authenticatedSession: true };
    } catch {
        clearStoredEmployee(storage);
        return null;
    }
}
