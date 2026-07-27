const { execFileSync } = require('child_process');

describe('product variant packaging rules', () => {
    test('builds the two confirmed Hapacol 650 packaging equations', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                buildPackagingPlan,
                groupVariantsByClinicalIdentity,
                buildParentVariantSearchText
            } from './js/features/products/productVariantPackagingRules.js';

            const box50 = buildPackagingPlan({
                baseUnitName: 'Viên',
                innerUnitName: 'Vỉ',
                innerCount: 10,
                basePerInner: 5
            });
            const box100 = buildPackagingPlan({
                baseUnitName: 'Viên',
                innerUnitName: 'Vỉ',
                innerCount: 10,
                basePerInner: 10
            });

            assert.equal(box50.totalBase, 50);
            assert.equal(box50.packagingSpec, 'Hộp 10 vỉ × 5 viên');
            assert.deepEqual(box50.units.map(unit => unit.conversion_rate), [1, 5, 50]);
            assert.equal(box100.totalBase, 100);
            assert.equal(box100.equation, '1 Hộp = 10 Vỉ = 100 Viên');

            const variants = [
                { name: 'Hapacol 650mg', concentration: '650mg', dosage_form: 'Viên nén', packaging_spec: box50.packagingSpec },
                { name: 'Hapacol 650 h/100v', concentration: '650mg', dosage_form: 'Viên nén', packaging_spec: box100.packagingSpec }
            ];
            const groups = groupVariantsByClinicalIdentity(variants);
            assert.equal(groups.length, 1);
            assert.equal(groups[0].label, '650mg • Viên nén');
            assert.match(buildParentVariantSearchText({ name: 'Hapacol' }, variants), /100v/);
            assert.match(buildParentVariantSearchText({ name: 'Hapacol' }, variants), /Hộp 10 vỉ × 5 viên/);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('rejects invalid packaging conversion', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import { buildPackagingPlan } from './js/features/products/productVariantPackagingRules.js';
            assert.throws(() => buildPackagingPlan({
                baseUnitName: 'Viên',
                innerUnitName: 'Vỉ',
                innerCount: 10,
                basePerInner: 0
            }), /lớn hơn 0/);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });
});
