const { execFileSync } = require('child_process');

describe('employee Auth provisioning browser service', () => {
    test('requires a signed-in session and sends the JWT only in Authorization', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import { provisionEmployeeAuth } from './js/features/employees/employeeAuthProvisioningService.js';

            let request;
            const result = await provisionEmployeeAuth({
                auth: {
                    getSession: async () => ({
                        data: { session: { access_token: 'signed-jwt' } },
                        error: null
                    })
                }
            }, {
                employeeId: '123e4567-e89b-42d3-a456-426614174000',
                username: 'lan',
                password: 'secret123',
                fetchImpl: async (url, options) => {
                    request = { url, options };
                    return { ok: true, status: 200 };
                }
            });

            assert.equal(result, true);
            assert.equal(request.url, '/api/employee-auth-provision');
            assert.equal(request.options.headers.Authorization, 'Bearer signed-jwt');
            assert.deepEqual(JSON.parse(request.options.body), {
                employeeId: '123e4567-e89b-42d3-a456-426614174000',
                username: 'lan',
                password: 'secret123'
            });
        `], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    });

    test('rejects expired sessions before making a request', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import { provisionEmployeeAuth } from './js/features/employees/employeeAuthProvisioningService.js';

            let fetched = false;
            await assert.rejects(
                () => provisionEmployeeAuth({
                    auth: {
                        getSession: async () => ({ data: { session: null }, error: null })
                    }
                }, {
                    employeeId: 'employee-1',
                    username: 'lan',
                    password: 'secret123',
                    fetchImpl: async () => {
                        fetched = true;
                        return { ok: true };
                    }
                }),
                /Phiên đăng nhập đã hết hạn/
            );
            assert.equal(fetched, false);
        `], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    });
});
