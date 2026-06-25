export const DEFAULT_ROLE_PERMISSIONS = Object.freeze({
    admin: [
        'access_pos', 'access_products', 'manage_products', 'access_cost_price', 'access_invoices',
        'manage_invoices', 'access_inventory', 'manage_inventory', 'access_employees', 'manage_shifts',
        'access_payroll', 'access_overview', 'access_customers', 'access_suppliers',
        'access_settings'
    ],
    manager: [
        'access_pos', 'access_products', 'manage_products', 'access_cost_price', 'access_invoices',
        'manage_invoices', 'access_inventory', 'manage_inventory', 'access_payroll', 'access_customers',
        'access_suppliers', 'manage_shifts'
    ],
    staff: [
        'access_pos', 'access_products', 'access_invoices', 'access_customers'
    ]
});

export function normalizeEmployeeRole(role) {
    return Object.prototype.hasOwnProperty.call(DEFAULT_ROLE_PERMISSIONS, role) ? role : 'staff';
}

export function getDefaultPermissionsForRole(role) {
    return [...(DEFAULT_ROLE_PERMISSIONS[normalizeEmployeeRole(role)] || [])];
}

export function resolveEmployeePermissions(employee = {}) {
    if (Array.isArray(employee.permissions) && employee.permissions.length > 0) {
        return [...employee.permissions];
    }
    return getDefaultPermissionsForRole(employee.role);
}

export function shouldAutoApplyRoleDefaults(selectedPermissions = [], previousRole) {
    if (!selectedPermissions.length) return true;
    const previousDefaults = getDefaultPermissionsForRole(previousRole);
    if (selectedPermissions.length !== previousDefaults.length) return false;

    const selectedSet = new Set(selectedPermissions);
    return previousDefaults.every(permission => selectedSet.has(permission));
}
