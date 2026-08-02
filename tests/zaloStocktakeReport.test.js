const { execFileSync } = require('child_process');

describe('Zalo stocktake report', () => {
    function runCheck(scriptBody) {
        execFileSync('node', ['--input-type=module', '-e', scriptBody], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('uses a deterministic Vietnam calendar-day range', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import {
                getVietnamDateKey,
                getVietnamDayRange
            } from './bot-assistant/rules/stocktakeReportRules.js';

            assert.equal(
                getVietnamDateKey(new Date('2026-07-31T17:30:00.000Z')),
                '2026-08-01'
            );
            assert.deepEqual(getVietnamDayRange('2026-07-31'), {
                start: '2026-07-30T17:00:00.000Z',
                end: '2026-07-31T17:00:00.000Z'
            });
        `);
    });

    test('never turns a database error into a no-document result', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { fetchStocktakeDocuments } from './bot-assistant/services/dbService.js';

            const query = {
                select() { return this; },
                eq() { return this; },
                gte() { return this; },
                lt() { return Promise.resolve({ data: null, error: new Error('database unavailable') }); }
            };
            const client = { from() { return query; } };

            await assert.rejects(
                fetchStocktakeDocuments(client, '2026-07-31'),
                /Không thể đọc phiếu kiểm kho/
            );
        `);
    });

    test('renders an explicit system-error report instead of claiming there are no documents', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { buildStocktakeReportMessage } from './bot-assistant/rules/stocktakeReportRules.js';

            const message = buildStocktakeReportMessage({
                dateKey: '2026-07-31',
                error: new Error('database unavailable')
            });

            assert.match(message, /Không thể đọc dữ liệu phiếu kiểm kho/);
            assert.doesNotMatch(message, /Không có Phiếu kiểm kho/);
            assert.doesNotMatch(message, /database unavailable/);
        `);
    });

    test('keeps the scheduled job dry-run safe when the database query fails', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { jobStocktakeReport } from './bot-assistant/jobs/stocktakeReportJob.js';

            const result = await jobStocktakeReport(
                { report_receivers: ['Không được gửi trong dry-run'] },
                {
                    dateKey: '2026-07-31',
                    dryRun: true,
                    fetchDocuments: async () => { throw new Error('database unavailable'); }
                }
            );

            assert.equal(result.status, 'query_error');
            assert.equal(result.sent, 0);
            assert.match(result.message, /Không thể đọc dữ liệu phiếu kiểm kho/);
            assert.doesNotMatch(result.message, /Không có Phiếu kiểm kho/);
            assert.doesNotMatch(result.message, /database unavailable/);
        `);
    });
});
