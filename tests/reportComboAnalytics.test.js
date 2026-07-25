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

    test('standard multi-batch sale uses its immutable weighted cost snapshot', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { buildAnalytics } from './js/features/reports/reportAnalyticsRules.js';

            const orders = [{
                id: 'order-1',
                status: 'completed',
                total: 100000,
                discount: 0,
                created_at: '2026-06-26T10:00:00.000Z',
                order_type: 'retail'
            }];
            const items = [{
                id: 'item-1',
                order_id: 'order-1',
                product_id: 'apitim',
                product_name: 'Apitim 5',
                product_code: 'SP001284',
                unit_name: 'Hộp',
                quantity: 1,
                total_price: 100000,
                cost_price_snapshot: 3200,
                batch_id: null,
                batch_allocations: [
                    { batch_id: 'old', quantity_base: 20, cost_price: 100 },
                    { batch_id: 'new', quantity_base: 10, cost_price: 120 }
                ],
                line_type: 'standard',
                created_at: '2026-06-26T10:00:00.000Z'
            }];
            const lookups = {
                unitCosts: new Map([
                    ['apitim::Hộp', { cost_price: 9999, conversion_rate: 30 }]
                ]),
                batchCosts: new Map(),
                isDoseProductMap: new Map([['apitim', false]]),
                isDoseRetailMap: new Map(),
                comboDefinitionMap: new Map()
            };
            const range = {
                keys: ['2026-06-26'],
                currentKeys: ['2026-06-26'],
                previousKeys: [],
                todayKey: '2026-06-26',
                yesterdayKey: '2026-06-25'
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

            assert.equal(analytics.summary.retailRevenue, 100000);
            assert.equal(analytics.summary.retailCost, 3200);
            assert.equal(analytics.summary.retailProfit, 96800);
        `);
    });

    test('combo return subtracts revenue and sales while a cancelled combo contributes nothing', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { buildAnalytics } from './js/features/reports/reportAnalyticsRules.js';

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
            const lookups = {
                unitCosts: new Map([
                    ['medicine-1::Viên', { cost_price: 10000, conversion_rate: 1, is_base_unit: true }]
                ]),
                batchCosts: new Map(),
                isDoseProductMap: new Map([
                    ['combo-1', false],
                    ['medicine-1', false]
                ]),
                isDoseRetailMap: new Map(),
                comboDefinitionMap: new Map([
                    ['combo-1', {
                        isCombo: true,
                        items: [{ id: 'medicine-1', name: 'Thuốc A', quantity: 1, unit: 'Viên' }]
                    }]
                ])
            };
            const buildItems = (orderId, sign = 1) => [
                {
                    id: 'parent-' + orderId,
                    order_id: orderId,
                    product_id: 'combo-1',
                    product_name: 'Combo A',
                    product_code: 'CB001',
                    unit_name: 'Combo',
                    quantity: sign,
                    total_price: sign * 50000,
                    line_type: 'combo_parent',
                    created_at: '2026-06-26T10:00:00.000Z'
                },
                {
                    id: 'component-' + orderId,
                    order_id: orderId,
                    product_id: 'medicine-1',
                    product_name: 'Thuốc A',
                    product_code: 'MED001',
                    unit_name: 'Viên',
                    quantity: sign,
                    total_price: 0,
                    line_type: 'combo_component',
                    parent_order_item_id: 'parent-' + orderId,
                    created_at: '2026-06-26T10:00:00.000Z'
                }
            ];

            const saleAndReturnOrders = [
                {
                    id: 'sale',
                    status: 'completed',
                    total: 50000,
                    discount: 0,
                    created_at: '2026-06-26T10:00:00.000Z',
                    order_type: 'retail'
                },
                {
                    id: 'return',
                    status: 'completed',
                    total: -50000,
                    discount: 0,
                    created_at: '2026-06-26T11:00:00.000Z',
                    order_type: 'retail'
                }
            ];
            const saleAndReturn = buildAnalytics(
                saleAndReturnOrders,
                [...buildItems('sale', 1), ...buildItems('return', -1)],
                lookups,
                new Map(),
                range,
                'all',
                [],
                []
            );
            assert.equal(saleAndReturn.summary.retailRevenue, 0);
            assert.equal(saleAndReturn.summary.revenue, 0);
            assert.equal(saleAndReturn.summary.retailItemsSold, 0);

            const cancelled = buildAnalytics(
                [{
                    id: 'cancelled-sale',
                    status: 'cancelled',
                    total: 50000,
                    discount: 0,
                    created_at: '2026-06-26T10:00:00.000Z',
                    order_type: 'retail'
                }],
                buildItems('cancelled-sale', 1),
                lookups,
                new Map(),
                range,
                'all',
                [],
                []
            );
            assert.equal(cancelled.summary.retailRevenue, 0);
            assert.equal(cancelled.summary.revenue, 0);
            assert.equal(cancelled.summary.retailItemsSold, 0);
        `);
    });

    test('combo cost stays on the persisted component snapshot after recipe and catalog costs change', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { buildAnalytics } from './js/features/reports/reportAnalyticsRules.js';

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
            const orders = [
                {
                    id: 'sale',
                    status: 'completed',
                    total: 50000,
                    discount: 0,
                    created_at: '2026-06-26T10:00:00.000Z',
                    order_type: 'retail'
                },
                {
                    id: 'return',
                    status: 'completed',
                    total: -50000,
                    discount: 0,
                    created_at: '2026-06-26T11:00:00.000Z',
                    order_type: 'retail'
                }
            ];
            const items = [
                {
                    id: 'sale-parent',
                    order_id: 'sale',
                    product_id: 'combo-1',
                    product_name: 'Combo A',
                    product_code: 'CB001',
                    unit_name: 'Combo',
                    quantity: 1,
                    total_price: 50000,
                    line_type: 'combo_parent',
                    created_at: '2026-06-26T10:00:00.000Z'
                },
                {
                    id: 'sale-component',
                    order_id: 'sale',
                    product_id: 'medicine-1',
                    batch_id: 'batch-original',
                    unit_name: 'Vien',
                    quantity: 2,
                    total_price: 0,
                    cost_price_snapshot: 6000,
                    line_type: 'combo_component',
                    parent_order_item_id: 'sale-parent',
                    created_at: '2026-06-26T10:00:00.000Z'
                },
                {
                    id: 'return-parent',
                    order_id: 'return',
                    product_id: 'combo-1',
                    product_name: 'Combo A',
                    product_code: 'CB001',
                    unit_name: 'Combo',
                    quantity: -1,
                    total_price: -50000,
                    line_type: 'combo_parent',
                    created_at: '2026-06-26T11:00:00.000Z'
                },
                {
                    id: 'return-component',
                    order_id: 'return',
                    product_id: 'medicine-1',
                    batch_id: 'batch-original',
                    unit_name: 'Vien',
                    quantity: -2,
                    total_price: 0,
                    cost_price_snapshot: 6000,
                    line_type: 'combo_component',
                    parent_order_item_id: 'return-parent',
                    created_at: '2026-06-26T11:00:00.000Z'
                }
            ];
            const lookups = {
                unitCosts: new Map([
                    ['medicine-1::Vien', { cost_price: 30000, conversion_rate: 1, is_base_unit: true }]
                ]),
                batchCosts: new Map([['batch-original', 25000]]),
                isDoseProductMap: new Map([
                    ['combo-1', false],
                    ['medicine-1', false]
                ]),
                isDoseRetailMap: new Map(),
                comboDefinitionMap: new Map([
                    ['combo-1', {
                        isCombo: true,
                        items: [{ id: 'medicine-1', quantity: 5, unit: 'Vien' }]
                    }]
                ])
            };

            const saleOnly = buildAnalytics(
                [orders[0]],
                items.slice(0, 2),
                lookups,
                new Map(),
                range,
                'all',
                [],
                []
            );
            assert.equal(saleOnly.summary.retailCost, 12000);
            assert.equal(saleOnly.summary.retailProfit, 38000);

            const saleAndReturn = buildAnalytics(
                orders,
                items,
                lookups,
                new Map(),
                range,
                'all',
                [],
                []
            );
            assert.equal(saleAndReturn.summary.retailRevenue, 0);
            assert.equal(saleAndReturn.summary.retailCost, 0);
            assert.equal(saleAndReturn.summary.retailProfit, 0);
        `);
    });
});
