const { execFileSync } = require('child_process');

describe('employee payroll visibility rules', () => {
    test('admin sees every payroll row while each employee sees only their own', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                canViewAllEmployeePayroll,
                filterPayrollEmployeesForViewer
            } from './js/features/employees/employeePayrollVisibilityRules.js';

            const employees = [
                { id: 'hung', name: 'Hùng' },
                { id: 'long', name: 'Long' }
            ];

            assert.equal(canViewAllEmployeePayroll({ role: 'admin' }), true);
            assert.deepEqual(
                filterPayrollEmployeesForViewer(employees, { id: 'admin', role: 'admin' }),
                employees
            );
            assert.deepEqual(
                filterPayrollEmployeesForViewer(employees, { id: 'hung', role: 'manager' }),
                [employees[0]]
            );
            assert.deepEqual(
                filterPayrollEmployeesForViewer(employees, { id: 'long', role: 'staff' }),
                [employees[1]]
            );
            assert.deepEqual(filterPayrollEmployeesForViewer(employees, null), []);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('merges a safe directory with only the profiles returned by RLS', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                mergeEmployeeDirectoryWithProfiles
            } from './js/features/employees/employeePayrollVisibilityRules.js';

            const directory = [
                { id: 'hung', name: 'Hùng', status: 'active' },
                { id: 'long', name: 'Long', status: 'active' }
            ];
            const profiles = [{
                id: 'long',
                name: 'Long',
                status: 'active',
                monthly_salary: 6_300_000
            }];
            assert.deepEqual(
                mergeEmployeeDirectoryWithProfiles(directory, profiles),
                [
                    directory[0],
                    { ...directory[1], monthly_salary: 6_300_000 }
                ]
            );
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });
});
