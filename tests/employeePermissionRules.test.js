const { execFileSync } = require('child_process');

describe('employee permission rules', () => {
    test('falls back to role defaults and preserves explicit permission overrides', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                getDefaultPermissionsForRole,
                resolveEmployeePermissions,
                shouldAutoApplyRoleDefaults
            } from './js/features/employees/employeePermissionRules.js';

            assert.deepEqual(
                getDefaultPermissionsForRole('manager'),
                ['access_pos', 'access_products', 'manage_products', 'access_cost_price', 'access_invoices', 'manage_invoices', 'access_inventory', 'manage_inventory', 'access_payroll', 'access_customers', 'access_suppliers', 'manage_shifts']
            );

            assert.deepEqual(
                resolveEmployeePermissions({ role: 'staff', permissions: [] }),
                ['access_pos', 'access_products', 'access_invoices', 'access_customers']
            );

            assert.deepEqual(
                resolveEmployeePermissions({ role: 'staff', permissions: ['access_pos', 'manage_shifts'] }),
                ['access_pos', 'manage_shifts']
            );

            assert.equal(
                shouldAutoApplyRoleDefaults(['access_pos', 'access_products', 'access_invoices', 'access_customers'], 'staff'),
                true
            );

            assert.equal(
                shouldAutoApplyRoleDefaults(['access_pos', 'manage_shifts'], 'staff'),
                false
            );
        `], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    });
});
