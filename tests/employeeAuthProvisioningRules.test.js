const { execFileSync } = require('child_process');

describe('employee Auth provisioning rules', () => {
    test('validates input, authorization, and deterministic technical email', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                buildTechnicalAuthEmail,
                canManageEmployeeCredentials,
                normalizeEmployeeId,
                normalizeProvisioningInput
            } from './api/employee-auth-provisioning-rules.js';

            const input = normalizeProvisioningInput({
                employeeId: '123e4567-e89b-42d3-a456-426614174000',
                username: ' lan ',
                password: 'secret123'
            });
            assert.equal(input.username, 'lan');
            assert.equal(input.password, 'secret123');
            assert.equal(
                normalizeEmployeeId('123e4567-e89b-42d3-a456-426614174000'),
                '123e4567-e89b-42d3-a456-426614174000'
            );
            assert.match(
                buildTechnicalAuthEmail(' Lan '),
                /^[0-9a-f]{64}@pos\\.khaihoanpharma\\.local$/
            );
            assert.equal(canManageEmployeeCredentials({
                role: 'admin',
                status: 'active',
                permissions: []
            }), true);
            assert.equal(canManageEmployeeCredentials({
                role: 'staff',
                status: 'active',
                permissions: ['access_employees']
            }), true);
            assert.equal(canManageEmployeeCredentials({
                role: 'admin',
                status: 'inactive',
                permissions: ['access_employees']
            }), false);
            assert.throws(
                () => normalizeProvisioningInput({
                    employeeId: 'bad-id',
                    username: 'lan',
                    password: 'secret123'
                }),
                /INVALID_EMPLOYEE_ID/
            );
            assert.throws(
                () => normalizeProvisioningInput({
                    employeeId: '123e4567-e89b-42d3-a456-426614174000',
                    username: 'lan',
                    password: '123'
                }),
                /INVALID_PASSWORD/
            );
        `], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    });
});
