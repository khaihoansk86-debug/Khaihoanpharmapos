import { createHash } from 'node:crypto';

const EMPLOYEE_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeEmployeeId(value) {
    const employeeId = String(value || '').trim();
    if (!EMPLOYEE_ID_PATTERN.test(employeeId)) {
        throw new Error('INVALID_EMPLOYEE_ID');
    }
    return employeeId;
}

export function normalizeProvisioningInput(body = {}) {
    const employeeId = normalizeEmployeeId(body.employeeId);
    const username = String(body.username || '').trim();
    const password = typeof body.password === 'string' ? body.password : '';

    if (!username || username.length > 100) {
        throw new Error('INVALID_USERNAME');
    }
    if (password.length < 6 || password.length > 128) {
        throw new Error('INVALID_PASSWORD');
    }

    return { employeeId, username, password };
}

export function canManageEmployeeCredentials(employee = {}) {
    if (employee.status !== 'active') return false;
    return employee.role === 'admin';
}

export function buildTechnicalAuthEmail(username) {
    const identifier = createHash('sha256')
        .update(String(username || '').trim().toLocaleLowerCase('vi-VN'), 'utf8')
        .digest('hex');
    return `${identifier}@pos.khaihoanpharma.local`;
}
