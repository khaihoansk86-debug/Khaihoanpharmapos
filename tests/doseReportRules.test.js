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

    test('DOSE coded products are treated as package sale rows', () => {
        runDoseReportRuleCheck(`
            import assert from 'node:assert/strict';
            import { isDosePackageSaleLine, isDoseReportLine } from './js/features/reports/doseReportRules.js';

            const packageLine = {
                product_id: 'dose-10k',
                product_code: 'DOSE-10000',
                total_price: 10000
            };

            assert.equal(isDoseReportLine(packageLine, {}), true);
            assert.equal(isDosePackageSaleLine(packageLine, {}, true, 10000), true);
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
});
