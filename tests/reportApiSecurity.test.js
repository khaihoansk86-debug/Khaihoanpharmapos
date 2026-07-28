const { execFileSync } = require('child_process');

describe('report API authentication security', () => {
    function runSecurityCheck(scriptBody) {
        execFileSync('node', ['--input-type=module', '-e', scriptBody], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('report endpoints fail closed before data access when API_SECRET_TOKEN is missing', () => {
        runSecurityCheck(`
            import assert from 'node:assert/strict';

            delete process.env.API_SECRET_TOKEN;
            let fetchCalls = 0;
            globalThis.fetch = async () => {
                fetchCalls += 1;
                throw new Error('Data access must not run without API_SECRET_TOKEN.');
            };

            const [{ default: reportHandler }, { default: telegramReportHandler }] =
                await Promise.all([
                    import('./api/report.js?missing-secret'),
                    import('./api/telegram-report.js?missing-secret')
                ]);

            async function invoke(handler, url) {
                let statusCode = null;
                let responseBody = '';
                const response = {
                    writeHead(status) {
                        statusCode = status;
                    },
                    end(body = '') {
                        responseBody = body;
                    }
                };
                await handler({
                    method: 'GET',
                    headers: {
                        host: 'localhost',
                        authorization: 'Bearer attacker-controlled-token'
                    },
                    url
                }, response);
                return {
                    statusCode,
                    body: JSON.parse(responseBody)
                };
            }

            const reportResponse = await invoke(reportHandler, '/api/report');
            const telegramResponse = await invoke(
                telegramReportHandler,
                '/api/telegram-report?action=product_stock'
            );

            assert.equal(reportResponse.statusCode, 503);
            assert.equal(telegramResponse.statusCode, 503);
            assert.equal(reportResponse.body.error, 'Server configuration error.');
            assert.equal(telegramResponse.body.error, 'Server configuration error.');
            assert.equal(fetchCalls, 0);
        `);
    });

    test('configured secrets still reject invalid callers and authorize valid callers', () => {
        runSecurityCheck(`
            import assert from 'node:assert/strict';

            process.env.API_SECRET_TOKEN = 'configured-test-token';
            const [{ default: reportHandler }, { default: telegramReportHandler }] =
                await Promise.all([
                    import('./api/report.js?configured-secret'),
                    import('./api/telegram-report.js?configured-secret')
                ]);

            async function invoke(handler, url, token) {
                let statusCode = null;
                let responseBody = '';
                const response = {
                    writeHead(status) {
                        statusCode = status;
                    },
                    end(body = '') {
                        responseBody = body;
                    }
                };
                await handler({
                    method: 'GET',
                    headers: {
                        host: 'localhost',
                        authorization: \`Bearer \${token}\`
                    },
                    url
                }, response);
                return {
                    statusCode,
                    body: JSON.parse(responseBody)
                };
            }

            const invalidResponse = await invoke(
                reportHandler,
                '/api/report',
                'invalid-token'
            );
            const validResponse = await invoke(
                telegramReportHandler,
                '/api/telegram-report?action=product_stock',
                'configured-test-token'
            );

            assert.equal(invalidResponse.statusCode, 401);
            assert.equal(validResponse.statusCode, 200);
            assert.equal(validResponse.body.total, 0);
        `);
    });
});
