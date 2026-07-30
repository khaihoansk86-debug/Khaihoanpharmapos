const { execFileSync } = require('child_process');

describe('Telegram ecommerce cost view rules', () => {
    function runRuleCheck(scriptBody) {
        execFileSync('node', ['--input-type=module', '-e', scriptBody], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('aligns Telegram revenue and cost to the recorded ecommerce cost', () => {
        runRuleCheck(`
            import assert from 'node:assert/strict';
            import { buildTelegramEcommerceCostView } from './js/features/reports/telegramEcommerceCostViewRules.js';

            const rawReport = {
                orders_count: 42,
                items_quantity: 100,
                revenue: 27057200,
                cost: 23526706.66,
                profit: 3530493.34,
                orders: [{ id: 'order-1' }],
                top_products: [{
                    name: 'Sản phẩm TMĐT',
                    quantity: 2,
                    revenue: 2630000,
                    cost: 0
                }]
            };

            const view = buildTelegramEcommerceCostView(rawReport);

            assert.equal(view.metric_basis, 'recorded_cost');
            assert.equal(view.revenue, 27057200);
            assert.equal(view.cost, 27057200);
            assert.equal(view.profit, 0);
            assert.equal(view.orders_count, 42);
            assert.deepEqual(view.orders, [{ id: 'order-1' }]);
            assert.equal(view.top_products[0].revenue, 2630000);
            assert.equal(view.top_products[0].cost, 2630000);
            assert.equal(rawReport.cost, 23526706.66);
            assert.equal(rawReport.top_products[0].cost, 0);
        `);
    });

    test('normalizes missing or invalid totals without producing NaN', () => {
        runRuleCheck(`
            import assert from 'node:assert/strict';
            import { buildTelegramEcommerceCostView } from './js/features/reports/telegramEcommerceCostViewRules.js';

            const view = buildTelegramEcommerceCostView({
                revenue: 'không hợp lệ',
                top_products: null
            });

            assert.equal(view.revenue, 0);
            assert.equal(view.cost, 0);
            assert.equal(view.profit, 0);
            assert.deepEqual(view.top_products, []);
        `);
    });

    test('Telegram report endpoint returns one aligned recorded-cost total', () => {
        runRuleCheck(`
            import assert from 'node:assert/strict';

            process.env.API_SECRET_TOKEN = 'test-secret';
            process.env.SUPABASE_URL = 'https://example.supabase.co';
            process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

            globalThis.fetch = async url => {
                const path = String(url);
                let data = [];
                if (path.includes('/orders?')) {
                    data = [{
                        id: 'order-1',
                        order_code: 'XTMDT001',
                        total: 100,
                        created_at: '2026-07-30T01:00:00.000Z',
                        ecommerce_platform: 'Shopee'
                    }];
                } else if (path.includes('/order_items?')) {
                    data = [{
                        id: 'item-1',
                        order_id: 'order-1',
                        product_id: 'product-1',
                        batch_id: null,
                        product_name: 'Sản phẩm TMĐT',
                        product_code: 'TMDT001',
                        unit_name: 'Hộp',
                        quantity: 1,
                        total_price: 100
                    }];
                } else if (path.includes('/product_units?')) {
                    data = [{
                        product_id: 'product-1',
                        unit_name: 'Hộp',
                        cost_price: 60,
                        conversion_rate: 1,
                        is_base_unit: true
                    }];
                }

                return {
                    ok: true,
                    json: async () => data
                };
            };

            const { default: handler } = await import('./api/telegram-report.js');
            let statusCode = 0;
            let responseBody = '';
            const req = {
                method: 'GET',
                url: '/api/telegram-report?action=ecommerce_today&token=test-secret',
                headers: { host: 'localhost' }
            };
            const res = {
                writeHead(status) {
                    statusCode = status;
                },
                end(body) {
                    responseBody = body;
                }
            };

            await handler(req, res);
            const payload = JSON.parse(responseBody);

            assert.equal(statusCode, 200);
            assert.equal(payload.metric_basis, 'recorded_cost');
            assert.equal(payload.revenue, 100);
            assert.equal(payload.cost, 100);
            assert.equal(payload.profit, 0);
            assert.equal(payload.top_products[0].revenue, 100);
            assert.equal(payload.top_products[0].cost, 100);
        `);
    });
});
