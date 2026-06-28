const { execFileSync } = require('child_process');

describe('Combo overview analytics', () => {
    function runCheck(scriptBody) {
        execFileSync('node', ['--input-type=module', '-e', scriptBody], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('retail combo contributes to retail revenue, cost, and profit without leaking into dose metrics', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { buildAnalytics } from './js/features/reports/reportAnalyticsRules.js';

            const orders = [{
                id: 'order-1',
                status: 'completed',
                total: 80000,
                discount: 0,
                created_at: '2026-06-26T10:00:00.000Z',
                order_type: 'retail',
                customer_phone: '0900000001'
            }];

            const items = [
                {
                    id: 'parent-1',
                    order_id: 'order-1',
                    product_id: 'combo-1',
                    product_name: 'Chich thuoc khoe',
                    product_code: 'CB6740',
                    unit_name: 'Combo',
                    quantity: 1,
                    total_price: 80000,
                    line_type: 'combo_parent',
                    created_at: '2026-06-26T10:00:00.000Z'
                },
                {
                    id: 'child-1',
                    order_id: 'order-1',
                    product_id: 'bom-tiem',
                    product_name: 'Bom tiem 5cc',
                    product_code: 'BT5',
                    unit_name: 'Cai',
                    quantity: 1,
                    total_price: 0,
                    line_type: 'combo_component',
                    parent_order_item_id: 'parent-1',
                    created_at: '2026-06-26T10:00:00.000Z'
                },
                {
                    id: 'child-2',
                    order_id: 'order-1',
                    product_id: 'becozym',
                    product_name: 'Becozym',
                    product_code: 'BCZ',
                    unit_name: 'Ong',
                    quantity: 1,
                    total_price: 0,
                    line_type: 'combo_component',
                    parent_order_item_id: 'parent-1',
                    created_at: '2026-06-26T10:00:00.000Z'
                }
            ];

            const lookups = {
                unitCosts: new Map([
                    ['bom-tiem::Cai', { cost_price: 5000, conversion_rate: 1, is_base_unit: true }],
                    ['becozym::Ong', { cost_price: 25000, conversion_rate: 1, is_base_unit: true }]
                ]),
                batchCosts: new Map(),
                isDoseProductMap: new Map([
                    ['combo-1', false],
                    ['bom-tiem', false],
                    ['becozym', false]
                ]),
                isDoseRetailMap: new Map(),
                comboDefinitionMap: new Map([
                    ['combo-1', {
                        isCombo: true,
                        items: [
                            { id: 'bom-tiem', name: 'Bom tiem 5cc', quantity: 1, unit: 'Cai' },
                            { id: 'becozym', name: 'Becozym', quantity: 1, unit: 'Ong' }
                        ]
                    }]
                ])
            };

            const range = {
                keys: ['2026-06-26'],
                currentKeys: ['2026-06-26'],
                previousKeys: [],
                todayKey: '2026-06-26',
                yesterdayKey: '2026-06-25',
                dateFrom: '2026-06-26',
                dateTo: '2026-06-26',
                fromIso: '2026-06-26T00:00:00.000Z',
                toIso: '2026-06-26T23:59:59.999Z'
            };

            const analytics = buildAnalytics(
                orders,
                items,
                lookups,
                new Map(),
                range,
                'all',
                [],
                []
            );

            assert.equal(analytics.summary.retailRevenue, 80000);
            assert.equal(analytics.summary.revenue, 80000);
            assert.equal(analytics.summary.retailCost, 30000);
            assert.equal(analytics.summary.cost, 30000);
            assert.equal(analytics.summary.retailProfit, 50000);
            assert.equal(analytics.summary.grossProfit, 50000);
            assert.equal(analytics.summary.dosePackageRevenue, 0);
            assert.equal(analytics.summary.doseIngredientCost, 0);
            assert.equal(analytics.summary.doseProfit, 0);
            assert.equal(analytics.summary.retailItemsSold, 1);
            assert.equal(analytics.productPerformance.length, 1);
            assert.equal(analytics.productPerformance[0].code, 'CB6740');
        `);
    });
});
