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
});
