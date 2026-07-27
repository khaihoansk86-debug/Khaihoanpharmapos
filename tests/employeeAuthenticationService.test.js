const { execFileSync } = require('child_process');

describe('employee authentication service', () => {
    function runCheck(scriptBody) {
        execFileSync('node', ['--input-type=module', '-e', scriptBody], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('authenticates through the server RPC without querying password_hash', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import {
                authenticateLegacyEmployee,
                buildEmployeeAuthEmail,
                hashLegacyEmployeePassword
            } from './js/features/auth/employeeAuthenticationService.js';

            assert.equal(
                await hashLegacyEmployeePassword('admin123'),
                '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'
            );
            assert.match(
                await buildEmployeeAuthEmail(' Admin '),
                /^[0-9a-f]{64}@pos\\.khaihoanpharma\\.local$/
            );

            let rpcName = '';
            let rpcArgs = null;
            const client = {
                rpc: async (name, args) => {
                    rpcName = name;
                    rpcArgs = args;
                    return {
                        data: [{
                            id: 'employee-1',
                            name: 'Lan',
                            username: 'lan',
                            role: 'staff',
                            status: 'active',
                            permissions: ['access_pos'],
                            auth_migration_ready: false
                        }],
                        error: null
                    };
                }
            };

            const employee = await authenticateLegacyEmployee(client, {
                username: ' lan ',
                password: 'admin123'
            });
            assert.equal(rpcName, 'authenticate_employee_legacy');
            assert.equal(rpcArgs.p_username, 'lan');
            assert.equal(rpcArgs.p_password_hash.length, 64);
            assert.equal(employee.username, 'lan');
            assert.deepEqual(employee.permissions, ['access_pos']);
        `);
    });

    test('upgrades a verified legacy employee to a Supabase Auth session', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { tryUpgradeEmployeeAuthSession } from './js/features/auth/employeeAuthenticationService.js';

            const calls = [];
            const upgraded = await tryUpgradeEmployeeAuthSession({
                auth: {
                    signInWithPassword: async credentials => {
                        calls.push(['sign-in', credentials]);
                        return { error: null };
                    }
                }
            }, {
                employee: { id: 'employee-1', username: 'lan', authMigrationReady: false },
                username: 'lan',
                password: 'secret123',
                fetchImpl: async (url, options) => {
                    calls.push(['migrate', url, JSON.parse(options.body)]);
                    return { ok: true };
                }
            });

            assert.equal(upgraded, true);
            assert.equal(calls[0][0], 'migrate');
            assert.equal(calls[1][0], 'sign-in');
            assert.match(calls[1][1].email, /^[0-9a-f]{64}@pos\\.khaihoanpharma\\.local$/);
        `);
    });

    test('prefers Supabase Auth and loads the employee profile from the authenticated JWT', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { authenticateEmployee } from './js/features/auth/employeeAuthenticationService.js';

            const calls = [];
            const employee = await authenticateEmployee({
                auth: {
                    signInWithPassword: async credentials => {
                        calls.push(['sign-in', credentials]);
                        return { error: null };
                    }
                },
                rpc: async name => {
                    calls.push(['rpc', name]);
                    if (name === 'get_current_employee_profile') {
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
                    throw new Error('Legacy RPC must not run after Auth succeeds.');
                }
            }, {
                username: 'lan',
                password: 'secret123'
            });

            assert.equal(employee.id, 'employee-1');
            assert.equal(employee.authenticatedSession, true);
            assert.deepEqual(calls.map(call => call[0]), ['sign-in', 'rpc']);
            assert.equal(calls[1][1], 'get_current_employee_profile');
        `);
    });

    test('stops a stalled auth migration request without blocking legacy login', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { tryUpgradeEmployeeAuthSession } from './js/features/auth/employeeAuthenticationService.js';

            let requestSignal = null;
            const startedAt = Date.now();
            const upgraded = await tryUpgradeEmployeeAuthSession({
                auth: {
                    signInWithPassword: async () => ({ error: null })
                }
            }, {
                employee: { id: 'employee-1', username: 'lan', authMigrationReady: false },
                username: 'lan',
                password: 'secret123',
                timeoutMs: 20,
                fetchImpl: async (_url, options) => {
                    requestSignal = options.signal;
                    return new Promise((resolve, reject) => {
                        options.signal.addEventListener('abort', () => {
                            reject(new Error('aborted'));
                        }, { once: true });
                    });
                }
            });

            assert.equal(upgraded, false);
            assert.equal(requestSignal.aborted, true);
            assert.ok(Date.now() - startedAt < 1000);
        `);
    });

    test('uses a generic error when credentials do not match', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { authenticateLegacyEmployee } from './js/features/auth/employeeAuthenticationService.js';

            await assert.rejects(
                () => authenticateLegacyEmployee({
                    rpc: async () => ({ data: [], error: null })
                }, {
                    username: 'unknown',
                    password: 'wrong'
                }),
                /Sai tên đăng nhập hoặc mật khẩu/
            );
        `);
    });
});
