const { execFileSync } = require('child_process');

describe('employee payroll period settings service', () => {
    test('reads and upserts settings through the month and employee key', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                fetchEmployeePayrollPeriodSettings,
                saveEmployeePayrollPeriodSetting
            } from './js/features/employees/employeePayrollPeriodSettingsService.js';

            const calls = [];
            const saved = {
                employee_id: '04947d90-bcc4-4232-bb63-9d21746b565d',
                payroll_month: '2026-07-01',
                monthly_salary: 7500000,
                monthly_allowance: 250000,
                commission_rate: 1,
                note: null
            };
            const client = {
                from(table) {
                    calls.push(['from', table]);
                    return {
                        select(columns) {
                            calls.push(['select', columns]);
                            return {
                                eq(column, value) {
                                    calls.push(['eq', column, value]);
                                    return {
                                        order(column) {
                                            calls.push(['order', column]);
                                            return Promise.resolve({ data: [saved], error: null });
                                        }
                                    };
                                }
                            };
                        },
                        upsert(payload, options) {
                            calls.push(['upsert', payload, options]);
                            return {
                                select() {
                                    return {
                                        single() {
                                            return Promise.resolve({ data: payload, error: null });
                                        }
                                    };
                                }
                            };
                        }
                    };
                }
            };

            const rows = await fetchEmployeePayrollPeriodSettings('2026-07-19', client);
            assert.deepEqual(rows, [saved]);
            const result = await saveEmployeePayrollPeriodSetting(saved, client);
            assert.deepEqual(result, saved);
            assert.ok(calls.some(call => call[0] === 'eq' && call[2] === '2026-07-01'));
            assert.ok(calls.some(call => call[0] === 'upsert'
                && call[2].onConflict === 'employee_id,payroll_month'));
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('does not silently fall back when sensitive payroll storage fails', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import { fetchEmployeePayrollPeriodSettings } from './js/features/employees/employeePayrollPeriodSettingsService.js';

            const client = {
                from() {
                    return {
                        select() {
                            return {
                                eq() {
                                    return {
                                        order() {
                                            return Promise.resolve({ data: null, error: { message: 'permission denied' } });
                                        }
                                    };
                                }
                            };
                        }
                    };
                }
            };
            await assert.rejects(
                fetchEmployeePayrollPeriodSettings('2026-07-01', client),
                /permission denied/i
            );
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });
});
