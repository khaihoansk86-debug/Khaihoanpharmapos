const { execFileSync } = require('child_process');

describe('Dose report rules', () => {
    function runDoseReportRuleCheck(scriptBody) {
        execFileSync('node', ['--input-type=module', '-e', scriptBody], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('ingredient-only dose rows still mark the order for dose cost reporting', () => {
        runDoseReportRuleCheck(`
            import assert from 'node:assert/strict';
            import { isDosePackageSaleLine, isDoseReportLine } from './js/features/reports/doseReportRules.js';

            const lookups = {
                isDoseProductMap: new Map([['berberin', true]]),
                isDoseRetailMap: new Map()
            };
            const ingredient = {
                product_id: 'berberin',
                product_code: 'BBR',
                total_price: 0
            };

            assert.equal(isDoseReportLine(ingredient, lookups), true);
            assert.equal(isDosePackageSaleLine(ingredient, lookups, true, 0), false);
        `);
    });

    test('DOSE coded products are not treated as package sale rows without tags', () => {
        runDoseReportRuleCheck(`
            import assert from 'node:assert/strict';
            import { isDosePackageSaleLine, isDoseReportLine } from './js/features/reports/doseReportRules.js';

            const packageLine = {
                product_id: 'dose-10k',
                product_code: 'DOSE-10000',
                total_price: 10000
            };

            assert.equal(isDoseReportLine(packageLine, {}), false);
            assert.equal(isDosePackageSaleLine(packageLine, {}, true, 10000), false);
        `);
    });

    test('dose retail tag is required for package sale rows', () => {
        runDoseReportRuleCheck(`
            import assert from 'node:assert/strict';
            import { isDosePackageSaleLine, isDoseReportLine } from './js/features/reports/doseReportRules.js';

            const lookups = {
                isDoseProductMap: new Map([['dose-10k', false]]),
                isDoseRetailMap: new Map([['dose-10k', true]])
            };
            const packageLine = {
                product_id: 'dose-10k',
                product_code: 'DOSE-10000',
                total_price: 10000
            };

            assert.equal(isDoseReportLine(packageLine, lookups), true);
            assert.equal(isDosePackageSaleLine(packageLine, lookups, true, 10000), true);
        `);
    });

    test('dose ingredient toggle is not dose revenue without retail toggle', () => {
        runDoseReportRuleCheck(`
            import assert from 'node:assert/strict';
            import { isDosePackageSaleLine } from './js/features/reports/doseReportRules.js';

            const lookups = {
                isDoseProductMap: new Map([['ingredient-1', true]]),
                isDoseRetailMap: new Map([['ingredient-1', false]])
            };

            assert.equal(isDosePackageSaleLine({
                product_id: 'ingredient-1',
                product_code: 'ING-1'
            }, lookups, true, 25000), false);
        `);
    });

    test('normal retail rows do not mark dose reports', () => {
        runDoseReportRuleCheck(`
            import assert from 'node:assert/strict';
            import { isDoseReportLine } from './js/features/reports/doseReportRules.js';

            assert.equal(isDoseReportLine({ product_id: 'normal', product_code: 'MED-01' }, {
                isDoseProductMap: new Map([['normal', false]]),
                isDoseRetailMap: new Map()
            }), false);
        `);
    });

    test('dose retail package performance does not carry direct product cost', () => {
        runDoseReportRuleCheck(`
            import assert from 'node:assert/strict';
            import { getDoseProductPerformanceValues } from './js/features/reports/doseReportRules.js';

            const values = getDoseProductPerformanceValues({
                revenue: 1896000,
                cost: 1264000,
                profit: 632000,
                isDosePackageSale: true
            });

            assert.equal(values.cost, 0);
            assert.equal(values.profit, 1896000);
        `);
    });

    test('missing cost ignores dose retail packages and counts dose ingredients', () => {
        runDoseReportRuleCheck(`
            import assert from 'node:assert/strict';
            import { shouldCountMissingCostForReportLine } from './js/features/reports/doseReportRules.js';

            assert.equal(shouldCountMissingCostForReportLine({
                costSource: 'missing',
                isDosePackageSale: true
            }), false);
            assert.equal(shouldCountMissingCostForReportLine({
                costSource: 'missing',
                isDosePackageSale: false
            }), true);
            assert.equal(shouldCountMissingCostForReportLine({
                costSource: 'unit',
                isDosePackageSale: false
            }), false);
        `);
    });

    test('normal retail rows sold inside a dose cut order are classified as dose ingredients', () => {
        runDoseReportRuleCheck(`
            import assert from 'node:assert/strict';
            import { buildAnalytics } from './js/features/reports/reportAnalyticsRules.js';

            const orders = [{
                id: 'order-1',
                status: 'completed',
                total: 15000,
                discount: 0,
                created_at: '2026-06-26T10:00:00.000Z',
                order_type: 'retail',
                customer_phone: '0900000001'
            }];

            const items = [
                {
                    id: 'dose-package-1',
                    order_id: 'order-1',
                    product_id: 'dose-15k',
                    product_name: 'Thuoc lieu 15k',
                    product_code: 'DOSE-15000',
                    unit_name: 'Lieu',
                    quantity: 1,
                    total_price: 15000,
                    line_type: 'standard',
                    created_at: '2026-06-26T10:00:00.000Z'
                },
                {
                    id: 'normal-medicine-1',
                    order_id: 'order-1',
                    product_id: 'paracetamol',
                    product_name: 'Paracetamol 500mg',
                    product_code: 'PCT',
                    unit_name: 'Vien',
                    quantity: 10,
                    total_price: 0,
                    line_type: 'standard',
                    created_at: '2026-06-26T10:00:00.000Z'
                }
            ];

            const lookups = {
                unitCosts: new Map([
                    ['paracetamol::Vien', { cost_price: 500, conversion_rate: 1, is_base_unit: true }]
                ]),
                batchCosts: new Map(),
                isDoseProductMap: new Map([
                    ['dose-15k', false],
                    ['paracetamol', false]
                ]),
                isDoseRetailMap: new Map([
                    ['dose-15k', true]
                ]),
                comboDefinitionMap: new Map()
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

            assert.equal(analytics.summary.doseIngredientCost, 5000);
            assert.equal(analytics.summary.doseIngredientPOSCost, 5000);
            assert.equal(analytics.summary.retailCost, 0);
        `);
    });

    test('normal retail rows sold inside a dose cut order with price > 0 remain retail sales', () => {
        runDoseReportRuleCheck(`
            import assert from 'node:assert/strict';
            import { buildAnalytics } from './js/features/reports/reportAnalyticsRules.js';

            const orders = [{
                id: 'order-1',
                status: 'completed',
                total: 70000,
                discount: 0,
                created_at: '2026-06-26T10:00:00.000Z',
                order_type: 'retail',
                customer_phone: '0900000001'
            }];

            const items = [
                {
                    id: 'dose-package-1',
                    order_id: 'order-1',
                    product_id: 'dose-15k',
                    product_name: 'Thuoc lieu 15k',
                    product_code: 'DOSE-15000',
                    unit_name: 'Lieu',
                    quantity: 1,
                    total_price: 15000,
                    line_type: 'standard',
                    created_at: '2026-06-26T10:00:00.000Z'
                },
                {
                    id: 'normal-medicine-1',
                    order_id: 'order-1',
                    product_id: 'vrohto',
                    product_name: 'V.Rohto Vitamin',
                    product_code: 'VRH',
                    unit_name: 'Chai',
                    quantity: 1,
                    total_price: 55000, // price > 0
                    line_type: 'standard',
                    created_at: '2026-06-26T10:00:00.000Z'
                }
            ];

            const lookups = {
                unitCosts: new Map([
                    ['vrohto::Chai', { cost_price: 35000, conversion_rate: 1, is_base_unit: true }]
                ]),
                batchCosts: new Map(),
                isDoseProductMap: new Map([
                    ['dose-15k', false],
                    ['vrohto', false]
                ]),
                isDoseRetailMap: new Map([
                    ['dose-15k', true]
                ]),
                comboDefinitionMap: new Map()
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

            // V.Rohto should NOT be counted under dose ingredients (doseIngredientCost = 0)
            assert.equal(analytics.summary.doseIngredientCost, 0);
            // It should be counted under retailCost instead!
            assert.equal(analytics.summary.retailCost, 35000);
        `);
    });

    test('ecommerce classification follows order type, not product tag alone', () => {
        runDoseReportRuleCheck(`
            import assert from 'node:assert/strict';
            import { buildAnalytics } from './js/features/reports/reportAnalyticsRules.js';

            const orders = [
                { id: 'retail-order', status: 'completed', total: 143000, discount: 0, created_at: '2026-07-09T14:00:00.000Z', order_type: 'retail' },
                { id: 'ecom-order', status: 'completed', total: 0, discount: 0, created_at: '2026-07-09T15:00:00.000Z', order_type: 'ecommerce', ecommerce_platform: 'Shopee' }
            ];

            const items = [
                { id: 'retail-line', order_id: 'retail-order', product_id: 'shopee-deriva', product_name: 'Shopee Deriva MS 0.1%', product_code: 'SP001886', unit_name: 'Tuyp', quantity: 1, total_price: 140000, line_type: 'standard', created_at: '2026-07-09T14:00:00.000Z' },
                { id: 'retail-line-2', order_id: 'retail-order', product_id: 'perimirane', product_name: 'Perimirane 10mg', product_code: 'SP001199', unit_name: 'Vien', quantity: 4, total_price: 3000, line_type: 'standard', created_at: '2026-07-09T14:00:00.000Z' },
                { id: 'ecom-line', order_id: 'ecom-order', product_id: 'shopee-deriva', product_name: 'Shopee Deriva MS 0.1%', product_code: 'SP001886', unit_name: 'Tuyp', quantity: 4, total_price: 0, line_type: 'standard', created_at: '2026-07-09T15:00:00.000Z' }
            ];

            const lookups = {
                unitCosts: new Map([
                    ['perimirane::Vien', { cost_price: 328, conversion_rate: 1, is_base_unit: true }],
                    ['shopee-deriva::Tuyp', { cost_price: 140000, conversion_rate: 1, is_base_unit: true }]
                ]),
                batchCosts: new Map(),
                isDoseProductMap: new Map(),
                isDoseRetailMap: new Map(),
                comboDefinitionMap: new Map()
            };

            const range = {
                keys: ['2026-07-09'], currentKeys: ['2026-07-09'], previousKeys: [],
                todayKey: '2026-07-09', yesterdayKey: '2026-07-08', dateFrom: '2026-07-09', dateTo: '2026-07-09',
                fromIso: '2026-07-09T00:00:00.000Z', toIso: '2026-07-09T23:59:59.999Z'
            };

            const allAnalytics = buildAnalytics(orders, items, lookups, new Map(), range, 'all', [], []);
            assert.equal(allAnalytics.productPerformance.some(product => product.name === 'Shopee Deriva MS 0.1%'), true);
            assert.equal(allAnalytics.productPerformance.some(product => product.name === 'Perimirane 10mg'), true);

            const ecommerceAnalytics = buildAnalytics(orders, items, lookups, new Map(), range, 'ecommerce', [], []);
            assert.equal(ecommerceAnalytics.productPerformance.some(product => product.name === 'Shopee Deriva MS 0.1%'), true);
        `);
    });

    test('internal movements from POS internal orders with reason dose_cutting are counted as dose ingredients', () => {
        runDoseReportRuleCheck(`
            import assert from 'node:assert/strict';
            import { buildAnalytics } from './js/features/reports/reportAnalyticsRules.js';

            const orders = [{
                id: 'order-internal-1',
                status: 'completed',
                total: 0,
                discount: 0,
                created_at: '2026-06-26T10:00:00.000Z',
                order_type: 'internal', // internal order
                customer_phone: ''
            }];

            const items = [];

            const internalMovements = [{
                product_id: 'gabapentin',
                quantity_base: -10,
                cost_price: 850,
                reason: 'dose_cutting',
                note: '[POS_ORDER:order-internal-1] [PX20260628005463] Xuất nội bộ POS',
                created_at: '2026-06-26T10:00:00.000Z',
                products: {
                    name: 'Gabapentin 300',
                    product_code: 'SP001837'
                }
            }];

            const lookups = {
                unitCosts: new Map(),
                batchCosts: new Map(),
                isDoseProductMap: new Map([
                    ['gabapentin', false]
                ]),
                isDoseRetailMap: new Map(),
                comboDefinitionMap: new Map()
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
                internalMovements
            );

            // Cost of Gabapentin (10 * 850 = 8500) should be counted under doseIngredientCost & doseIngredientInternalCost
            assert.equal(analytics.summary.doseIngredientCost, 8500);
            assert.equal(analytics.summary.doseIngredientInternalCost, 8500);
        `);
    });
});

