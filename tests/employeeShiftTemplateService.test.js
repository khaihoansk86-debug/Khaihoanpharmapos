const { execFileSync } = require('child_process');

describe('employee shift template service', () => {
    test('loads and saves only the two centralized templates', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                fetchEmployeeShiftTemplates,
                saveEmployeeShiftTemplate
            } from './js/features/employees/employeeShiftTemplateService.js';

            const calls = [];
            const client = {
                from(table) {
                    assert.equal(table, 'employee_shift_templates');
                    return {
                        select() { return { order: async () => ({ data: [
                            { id: 'morning', name: 'Sáng', start_time: '06:30:00', end_time: '13:30:00' },
                            { id: 'afternoon', name: 'Chiều', start_time: '13:30:00', end_time: '20:00:00' }
                        ], error: null }) }; },
                        update(payload) { calls.push(payload); return { eq: async () => ({ data: null, error: null }) }; }
                    };
                }
            };
            const templates = await fetchEmployeeShiftTemplates(client);
            assert.deepEqual(templates.map(item => item.id), ['morning', 'afternoon']);
            await saveEmployeeShiftTemplate({ id: 'morning', start_time: '06:00', end_time: '13:00' }, client);
            assert.deepEqual(calls, [{ start_time: '06:00', end_time: '13:00' }]);
            await assert.rejects(
                saveEmployeeShiftTemplate({ id: 'night', start_time: '20:00', end_time: '23:00' }, client),
                /INVALID_SHIFT_TEMPLATE/
            );
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });
});
