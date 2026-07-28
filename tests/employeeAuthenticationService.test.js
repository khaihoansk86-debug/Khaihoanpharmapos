const { execFileSync } = require('child_process');

describe('employee authentication service', () => {
    function runCheck(scriptBody) {
        execFileSync('node', ['--input-type=module', '-e', scriptBody], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('builds a deterministic technical Auth email without exposing the username', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { buildEmployeeAuthEmail } from './js/features/auth/employeeAuthenticationService.js';

            const email = await buildEmployeeAuthEmail(' Admin ');
            assert.match(email, /^[0-9a-f]{64}@pos\\.khaihoanpharma\\.local$/);
            assert.equal(email.includes('admin'), false);
        `);
    });

    test('authenticates only through Supabase Auth and the JWT-bound profile RPC', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { authenticateEmployee } from './js/features/auth/employeeAuthenticationService.js';

            const calls = [];
            const employee = await authenticateEmployee({
                auth: {
                    signInWithPassword: async credentials => {
                        calls.push(['sign-in', credentials]);
                        return { error: null };
                    },
                    signOut: async () => calls.push(['sign-out'])
                },
                rpc: async name => {
                    calls.push(['rpc', name]);
                    assert.equal(name, 'get_current_employee_profile');
                    return {
                        data: [{
                            id: 'employee-1',
                            name: 'Lan',
                            username: 'lan',
                            role: 'staff',
                            status: 'active',
                            permissions: ['access_pos']
                        }],
                        error: null
                    };
                }
            }, {
                username: 'lan',
                password: 'secret123'
            });

            assert.equal(employee.id, 'employee-1');
            assert.equal(employee.authenticatedSession, true);
            assert.equal(employee.authMigrationReady, true);
            assert.deepEqual(calls.map(call => call[0]), ['sign-in', 'rpc']);
        `);
    });

    test('does not fall back to a legacy RPC when Auth rejects credentials', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { authenticateEmployee } from './js/features/auth/employeeAuthenticationService.js';

            let rpcCalled = false;
            await assert.rejects(
                () => authenticateEmployee({
                    auth: {
                        signInWithPassword: async () => ({
                            error: { message: 'Invalid login credentials' }
                        })
                    },
                    rpc: async () => {
                        rpcCalled = true;
                        throw new Error('Legacy fallback must not run.');
                    }
                }, {
                    username: 'unknown',
                    password: 'wrong'
                }),
                /Sai tên đăng nhập hoặc mật khẩu/
            );
            assert.equal(rpcCalled, false);
        `);
    });

    test('clears an Auth session that is not linked to an active employee', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { authenticateEmployee } from './js/features/auth/employeeAuthenticationService.js';

            let signedOut = false;
            await assert.rejects(
                () => authenticateEmployee({
                    auth: {
                        signInWithPassword: async () => ({ error: null }),
                        signOut: async () => { signedOut = true; }
                    },
                    rpc: async () => ({ data: [], error: null })
                }, {
                    username: 'inactive',
                    password: 'secret123'
                }),
                /không hoạt động hoặc chưa được liên kết/
            );
            assert.equal(signedOut, true);
        `);
    });

    test('returns promptly when the Auth request stalls', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { authenticateEmployee } from './js/features/auth/employeeAuthenticationService.js';

            const startedAt = Date.now();
            await assert.rejects(
                () => authenticateEmployee({
                    auth: {
                        signInWithPassword: async () => new Promise(() => {})
                    },
                    rpc: async () => ({ data: [], error: null })
                }, {
                    username: 'lan',
                    password: 'secret123',
                    timeoutMs: 20
                }),
                /Không thể xác thực tài khoản lúc này/
            );
            assert.ok(Date.now() - startedAt < 1000);
        `);
    });
});
