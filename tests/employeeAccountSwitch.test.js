const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

describe('quick employee account switching', () => {
    test('loads every active account through the protected account-directory RPC', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import { fetchEmployeeAccountDirectory } from './js/features/employees/employeeDirectoryService.js';

            const calls = [];
            const client = {
                rpc: async name => {
                    calls.push(name);
                    return {
                        data: [
                            { id: 'hung', name: 'Hùng', username: 'hung', role: 'staff', status: 'active' },
                            { id: 'long', name: 'Long', username: 'long', role: 'staff', status: 'active' }
                        ],
                        error: null
                    };
                }
            };

            assert.deepEqual(await fetchEmployeeAccountDirectory(client), [
                { id: 'hung', name: 'Hùng', username: 'hung', role: 'staff', status: 'active' },
                { id: 'long', name: 'Long', username: 'long', role: 'staff', status: 'active' }
            ]);
            assert.deepEqual(calls, ['get_employee_account_directory']);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('does not query the RLS-protected employees table from the switch modal', () => {
        const layout = fs.readFileSync(path.join(process.cwd(), 'js/components/layout.js'), 'utf8');
        const modalStart = layout.indexOf('window.openQuickUserSwitchModal');
        const modal = layout.slice(modalStart);
        expect(modal).toContain('fetchEmployeeAccountDirectory(supabaseClient)');
        expect(modal).not.toMatch(/supabaseClient\s*\.from\(['"]employees['"]\)/);
    });

    test('exposes only non-sensitive account fields through the RPC', () => {
        const migration = fs.readFileSync(
            path.join(process.cwd(), 'supabase/migrations/098_create_employee_account_directory.sql'),
            'utf8'
        );
        expect(migration).toMatch(/CREATE OR REPLACE FUNCTION public\.get_employee_account_directory\(\)/i);
        expect(migration).toMatch(/RETURNS TABLE\s*\(\s*id UUID,\s*name TEXT,\s*username TEXT,\s*role TEXT,\s*status TEXT/i);
        expect(migration).not.toMatch(/monthly_salary|monthly_allowance|password_hash|auth_user_id/i);
        expect(migration).toMatch(/SECURITY DEFINER/i);
        expect(migration).toMatch(/GRANT EXECUTE ON FUNCTION public\.get_employee_account_directory\(\) TO authenticated/i);
    });
});
