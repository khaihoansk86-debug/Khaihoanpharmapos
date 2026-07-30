const { execFileSync } = require('child_process');

describe('SePay webhook security', () => {
    function runRuleCheck(scriptBody) {
        execFileSync('node', ['--input-type=module', '-e', scriptBody], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('fails closed when the webhook secret is missing or invalid', () => {
        runRuleCheck(`
            import assert from 'node:assert/strict';
            import { getSePayWebhookAuthFailure } from './js/features/payments/sepayWebhookRules.js';

            assert.deepEqual(getSePayWebhookAuthFailure('', ''), {
                status: 503,
                error: 'Server configuration error.'
            });
            assert.deepEqual(getSePayWebhookAuthFailure('expected', 'Bearer wrong'), {
                status: 401,
                error: 'Unauthorized'
            });
            assert.equal(
                getSePayWebhookAuthFailure('expected', 'Bearer expected'),
                null
            );
        `);
    });

    test('validates and normalizes the SePay payload before persistence', () => {
        runRuleCheck(`
            import assert from 'node:assert/strict';
            import { buildSePayWebhookRecord } from './js/features/payments/sepayWebhookRules.js';

            assert.equal(buildSePayWebhookRecord(null).ok, false);
            assert.equal(buildSePayWebhookRecord({ id: 'tx-1', amount: 0 }).ok, false);
            assert.equal(buildSePayWebhookRecord({ id: 'tx-1', amount: 'NaN' }).ok, false);
            assert.equal(buildSePayWebhookRecord({
                id: 'x'.repeat(101),
                amount: 1000
            }).ok, false);
            assert.equal(buildSePayWebhookRecord({
                id: 'tx-large',
                amount: 1000,
                content: 'x'.repeat(70 * 1024)
            }).ok, false);
            assert.equal(buildSePayWebhookRecord({
                id: 'tx-out',
                transferAmount: 1000,
                transferType: 'out'
            }).ok, false);

            const result = buildSePayWebhookRecord({
                transaction_id: ' tx-1 ',
                transferAmount: '125000',
                transferType: 'in',
                transferContent: 'Thanh toan TT1A2B3C',
                gateway: 'VCB'
            });

            assert.equal(result.ok, true);
            assert.deepEqual(result.record, {
                transaction_id: 'tx-1',
                amount: 125000,
                transfer_content: 'Thanh toan TT1A2B3C',
                order_code: 'TT1A2B3C',
                bank_account: 'VCB',
                raw_data: {
                    transaction_id: ' tx-1 ',
                    transferAmount: '125000',
                    transferType: 'in',
                    transferContent: 'Thanh toan TT1A2B3C',
                    gateway: 'VCB'
                },
                status: 'pending'
            });
        `);
    });

    test('endpoint rejects requests before any database write when auth is unavailable', () => {
        runRuleCheck(`
            import assert from 'node:assert/strict';

            process.env.SUPABASE_URL = 'https://example.supabase.co';
            process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
            delete process.env.SEPAY_WEBHOOK_TOKEN;

            const { default: handler } = await import('./api/sepay-webhook.js');
            let statusCode = 0;
            let responseBody = null;
            const res = {
                status(status) {
                    statusCode = status;
                    return this;
                },
                json(body) {
                    responseBody = body;
                    return this;
                }
            };

            await handler({
                method: 'POST',
                headers: {},
                body: { id: 'tx-1', amount: 1000 }
            }, res);

            assert.equal(statusCode, 503);
            assert.deepEqual(responseBody, { error: 'Server configuration error.' });
        `);
    });

    test('endpoint rejects a wrong token and never falls back to an anonymous key', () => {
        runRuleCheck(`
            import assert from 'node:assert/strict';

            process.env.SUPABASE_URL = 'https://example.supabase.co';
            process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
            process.env.VITE_SUPABASE_ANON_KEY = 'must-not-be-used';
            process.env.SEPAY_WEBHOOK_TOKEN = 'expected';

            const { default: handler } = await import('./api/sepay-webhook.js');
            let statusCode = 0;
            const res = {
                status(status) {
                    statusCode = status;
                    return this;
                },
                json() {
                    return this;
                }
            };

            await handler({
                method: 'POST',
                headers: { authorization: 'Bearer wrong' },
                body: { id: 'tx-1', amount: 1000 }
            }, res);

            assert.equal(statusCode, 401);
        `);

        const endpoint = require('fs').readFileSync(
            require('path').join(process.cwd(), 'api/sepay-webhook.js'),
            'utf8'
        );
        expect(endpoint).not.toContain('VITE_SUPABASE_ANON_KEY');
        expect(endpoint).toContain('ignoreDuplicates: true');
    });
});
