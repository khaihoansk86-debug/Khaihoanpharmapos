const { execFileSync } = require('child_process');

describe('ecommerce return report integration', () => {
    test('a completed return subtracts ecommerce quantity and cost', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import { buildAnalytics } from './js/features/reports/reportAnalyticsRules.js';

            const orders = [
                {
                    id: 'sale',
                    status: 'completed',
                    total: 30000,
                    discount: 0,
                    created_at: '2026-07-26T08:00:00.000Z',
                    order_type: 'ecommerce',
                    ecommerce_platform: 'Shopee'
                },
                {
                    id: 'return',
                    status: 'completed',
                    total: -10000,
                    discount: 0,
                    created_at: '2026-07-26T09:00:00.000Z',
                    order_type: 'ecommerce',
                    ecommerce_platform: 'Shopee'
                }
            ];
            const items = [
                {
                    id: 'sale-item',
                    order_id: 'sale',
                    product_id: 'product-1',
                    product_name: 'Sản phẩm A',
                    product_code: 'SP001',
                    unit_name: 'Hộp',
                    quantity: 3,
                    total_price: 30000,
                    cost_price_snapshot: 10000,
                    line_type: 'standard'
                },
                {
                    id: 'return-item',
                    order_id: 'return',
                    product_id: 'product-1',
                    product_name: 'Sản phẩm A',
                    product_code: 'SP001',
                    unit_name: 'Hộp',
                    quantity: -1,
                    total_price: -10000,
                    cost_price_snapshot: 10000,
                    line_type: 'standard'
                }
            ];
            const lookups = {
                unitCosts: new Map(),
                batchCosts: new Map(),
                isDoseProductMap: new Map([['product-1', false]]),
                isDoseRetailMap: new Map(),
                comboDefinitionMap: new Map()
            };
            const range = {
                keys: ['2026-07-26'],
                currentKeys: ['2026-07-26'],
                previousKeys: [],
                todayKey: '2026-07-26',
                yesterdayKey: '2026-07-25',
                dateFrom: '2026-07-26',
                dateTo: '2026-07-26',
                fromIso: '2026-07-26T00:00:00.000Z',
                toIso: '2026-07-26T23:59:59.999Z'
            };

            const analytics = buildAnalytics(
                orders,
                items,
                lookups,
                new Map(),
                range,
                'ecommerce',
                [],
                []
            );

            assert.equal(analytics.summary.ecommerceCost, 20000);
            assert.equal(analytics.summary.ecommerceItemsSold, 2);
            assert.equal(analytics.productPerformance[0].quantity, 2);
            assert.equal(analytics.productPerformance[0].cost, 20000);
            assert.equal(analytics.platformsPerformance[0].revenue, 20000);
        `], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    });
});
