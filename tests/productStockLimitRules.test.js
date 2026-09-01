const { execFileSync } = require('child_process');

describe('product stock limit rules', () => {
    test('validates optional values without converting blank to zero', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import { parseOptionalStockLimit, validateStockLimits } from './js/features/products/productStockLimitRules.js';
            assert.equal(parseOptionalStockLimit(''), null);
            assert.equal(parseOptionalStockLimit(null), null);
            assert.equal(parseOptionalStockLimit('12.5'), 12.5);
            assert.equal(validateStockLimits({ min: '', max: '' }).length, 0);
            assert.equal(validateStockLimits({ min: 10, max: 9 })[0].key, 'max-before-min-stock');
            assert.equal(validateStockLimits({ min: -1, max: 5 })[0].key, 'negative-min-stock');
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('does not suggest limits for new or insufficient products', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import { buildStockLimitSuggestion } from './js/features/products/productStockLimitRules.js';
            const rows = Array.from({ length: 5 }, (_, i) => ({
                quantity: 1,
                created_at: '2026-08-0' + (i + 1),
                status: 'completed',
                order_type: 'retail'
            }));
            const result = buildStockLimitSuggestion(rows, { now: new Date('2026-08-12T00:00:00Z') });
            assert.equal(result.eligible, false);
            assert.equal(result.minStockQuantity, undefined);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('uses completed retail/ecommerce demand, subtracts returns, and excludes other statuses/types', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import { buildStockLimitSuggestion } from './js/features/products/productStockLimitRules.js';
            const rows = [];
            for (let day = 1; day <= 30; day += 1) {
                rows.push({ quantity: 2, created_at: '2026-07-' + String(day).padStart(2, '0'), status: 'completed', order_type: day % 2 ? 'retail' : 'ecommerce' });
            }
            rows.push({ quantity: -10, created_at: '2026-07-15', status: 'completed', order_type: 'retail' });
            rows.push({ quantity: 1000, created_at: '2026-07-30', status: 'completed', order_type: 'internal' });
            rows.push({ quantity: 1000, created_at: '2026-07-30', status: 'cancelled', order_type: 'retail' });
            rows.push({ quantity: 1000, created_at: '2026-07-30', status: 'draft', order_type: 'retail' });
            const result = buildStockLimitSuggestion(rows);
            assert.equal(result.eligible, true);
            assert.equal(result.metrics.totalNetQuantity, 50);
            assert.equal(result.minStockQuantity, 12);
            assert.equal(result.maxStockQuantity, 50);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('normalizes selling-unit quantities to the SKU base unit', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import { buildStockLimitSuggestion } from './js/features/products/productStockLimitRules.js';
            const rows = [];
            for (let day = 1; day <= 30; day += 1) {
                rows.push({
                    quantity: 2,
                    conversion_rate: 10,
                    created_at: '2026-07-' + String(day).padStart(2, '0'),
                    status: 'completed',
                    order_type: 'retail'
                });
            }
            const result = buildStockLimitSuggestion(rows);
            assert.equal(result.eligible, true);
            assert.equal(result.metrics.totalNetQuantity, 600);
            assert.equal(result.metrics.averageDailyDemand, 20);
            assert.equal(result.minStockQuantity, 140);
            assert.equal(result.maxStockQuantity, 600);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('classifies configured and unconfigured stock without changing legacy behavior', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import { classifyStockAgainstLimits } from './js/features/products/productStockLimitRules.js';
            assert.equal(classifyStockAgainstLimits(0, { min: 5 }), 'out-of-stock');
            assert.equal(classifyStockAgainstLimits(3, { min: 5 }), 'below-minimum');
            assert.equal(classifyStockAgainstLimits(20, { max: 10 }), 'above-maximum');
            assert.equal(classifyStockAgainstLimits(8, { min: 5, max: 10 }), 'within-limits');
            assert.equal(classifyStockAgainstLimits(3), 'unconfigured');
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });
});
