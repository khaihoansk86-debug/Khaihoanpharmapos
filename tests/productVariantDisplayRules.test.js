const { execFileSync } = require('child_process');

describe('product variant display rules', () => {
    test('summarizes parent stock and prices without mixing base units', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                buildParentProductSummary,
                buildStockBreakdown,
                displayUnitName
            } from './js/features/products/productVariantDisplayRules.js';

            const makeVariant = ({ id, baseUnit, stock, retail, packaging, rates, zeroCost = false }) => ({
                id,
                packaging_spec: packaging,
                product_units: rates.map(([unit_name, conversion_rate], index) => ({
                    unit_name,
                    conversion_rate,
                    is_base_unit: index === rates.length - 1,
                    retail_price: index === rates.length - 1 ? retail : retail * conversion_rate
                })),
                product_batches: [{ stock_quantity: stock, cost_price: zeroCost ? 0 : 100 }]
            });

            const variants = [
                makeVariant({ id: '250', baseUnit: 'Gói', stock: 238, retail: 2500, packaging: 'Hộp 24 gói', rates: [['Hộp', 24], ['Gói', 1]] }),
                makeVariant({ id: '650-50', baseUnit: 'Viên', stock: 108, retail: 800, packaging: 'Hộp 10 vỉ × 5 viên', rates: [['Hộp', 50], ['Vĩ', 5], ['Viên', 1]], zeroCost: true }),
                makeVariant({ id: '650-100', baseUnit: 'Viên', stock: 186, retail: 800, packaging: 'Hộp 10 vỉ × 10 viên', rates: [['Hộp', 100], ['vỉ', 10], ['viên', 1]] })
            ];
            const summary = buildParentProductSummary({
                product_batches: [{ stock_quantity: 1 }]
            }, variants);

            assert.deepEqual(summary.stockByUnit, [
                { unitName: 'Gói', quantity: 238 },
                { unitName: 'Viên', quantity: 294 }
            ]);
            assert.deepEqual(summary.priceByUnit, [
                { unitName: 'Gói', min: 2500, max: 2500 },
                { unitName: 'Viên', min: 800, max: 800 }
            ]);
            assert.equal(summary.parentStock, 1);
            assert.equal(summary.zeroCostBatchCount, 1);
            assert.equal(displayUnitName('Vĩ'), 'Vỉ');

            const breakdown = buildStockBreakdown(variants[1]);
            assert.equal(breakdown.totalLabel, '108 Viên');
            assert.equal(breakdown.breakdownLabel, '2 Hộp + 1 Vỉ + 3 Viên');
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });
});
