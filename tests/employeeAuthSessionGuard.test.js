const { execFileSync } = require('child_process');

describe('employee Auth session guard', () => {
    function runCheck(scriptBody) {
        execFileSync('node', ['--input-type=module', '-e', scriptBody], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('rejects and clears a legacy pos_user without an authenticated-session marker', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import {
                readAuthenticatedEmployee
            } from './js/features/auth/employeeAuthSessionGuard.js';

            const values = new Map([[
                'pos_user',
                JSON.stringify({ id: 'legacy-user', role: 'admin' })
            ]]);
            const storage = {
                getItem: key => values.get(key) ?? null,
                removeItem: key => values.delete(key)
            };

            assert.equal(readAuthenticatedEmployee(storage), null);
            assert.equal(values.has('pos_user'), false);
        `);
    });

    test('keeps a marked employee only when Supabase has a real Auth session', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import {
                verifyAuthenticatedEmployeeSession
            } from './js/features/auth/employeeAuthSessionGuard.js';

            const values = new Map([[
                'pos_user',
                JSON.stringify({
                    id: 'employee-1',
                    role: 'staff',
                    authenticatedSession: true
                })
            ]]);
            const storage = {
                getItem: key => values.get(key) ?? null,
                removeItem: key => values.delete(key)
            };
            const employee = await verifyAuthenticatedEmployeeSession({
                auth: {
                    getSession: async () => ({
                        data: { session: { access_token: 'jwt' } },
                        error: null
                    })
                },
                rpc: async () => ({
                    data: { id: 'employee-1', status: 'active' },
                    error: null
                })
            }, storage);

            assert.equal(employee.id, 'employee-1');
            assert.equal(values.has('pos_user'), true);
        `);
    });

    test('clears a marked employee when the Supabase Auth session is absent', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import {
                verifyAuthenticatedEmployeeSession
            } from './js/features/auth/employeeAuthSessionGuard.js';

            const values = new Map([[
                'pos_user',
                JSON.stringify({
                    id: 'employee-1',
                    role: 'staff',
                    authenticatedSession: true
                })
            ]]);
            const storage = {
                getItem: key => values.get(key) ?? null,
                removeItem: key => values.delete(key)
            };
            const employee = await verifyAuthenticatedEmployeeSession({
                auth: {
                    getSession: async () => ({
                        data: { session: null },
                        error: null
                    })
                }
            }, storage);

            assert.equal(employee, null);
            assert.equal(values.has('pos_user'), false);
        `);
    });

    test('clears a local employee when the JWT profile belongs to another employee', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { verifyAuthenticatedEmployeeSession } from './js/features/auth/employeeAuthSessionGuard.js';
            const values = new Map([['pos_user', JSON.stringify({
                id: 'employee-local', authenticatedSession: true
            })]]);
            const storage = {
                getItem: key => values.get(key) ?? null,
                removeItem: key => values.delete(key)
            };
            const client = {
                auth: { getSession: async () => ({ data: { session: { access_token: 'jwt' } }, error: null }) },
                rpc: async name => {
                    assert.equal(name, 'get_current_employee_profile');
                    return { data: { id: 'employee-jwt', status: 'active' }, error: null };
                }
            };
            assert.equal(await verifyAuthenticatedEmployeeSession(client, storage), null);
            assert.equal(values.has('pos_user'), false);
        `);
    });
});
