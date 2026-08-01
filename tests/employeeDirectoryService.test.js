const { execFileSync } = require('child_process');

describe('employee directory service', () => {
    test('loads only the safe employee directory through its protected RPC', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import { fetchEmployeeDirectory } from './js/features/employees/employeeDirectoryService.js';

            const calls = [];
            const client = {
                rpc: async name => {
                    calls.push(name);
                    return {
                        data: [{ id: 'hung', name: 'Hùng', status: 'active' }],
                        error: null
                    };
                }
            };

            assert.deepEqual(await fetchEmployeeDirectory(client), [
                { id: 'hung', name: 'Hùng', status: 'active' }
            ]);
            assert.deepEqual(calls, ['get_employee_directory']);
            await assert.rejects(
                () => fetchEmployeeDirectory(null),
                /Supabase chưa được kết nối/i
            );
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });
});
