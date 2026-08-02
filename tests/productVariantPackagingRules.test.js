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

    test('groups generic classifications in the parent-defined order', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                groupVariantsByClinicalIdentity
            } from './js/features/products/productVariantPackagingRules.js';

            const definitions = [
                { key: 'scent', label: 'Hương / Mùi' },
                { key: 'volume', label: 'Dung tích' }
            ];
            const groups = groupVariantsByClinicalIdentity([
                {
                    product_code: 'SOFFELL-CAM-80-A',
                    variant_values: { volume: '80ml', scent: 'Cam' },
                    packaging_spec: 'Chai 80ml'
                },
                {
                    product_code: 'SOFFELL-CAM-80-B',
                    variant_values: { scent: 'Cam', volume: '80ml' },
                    packaging_spec: 'Vỉ 10 gói'
                }
            ], definitions);

            assert.equal(groups.length, 1);
            assert.equal(groups[0].label, 'Cam • 80ml');
            assert.equal(groups[0].variants.length, 2);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('reconstructs direct and blister packaging editors from existing SKU units', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                buildVariantPackagingEditorSeed
            } from './js/features/products/productVariantPackagingRules.js';

            assert.deepEqual(buildVariantPackagingEditorSeed({
                product_units: [
                    {
                        id: 'goi',
                        unit_name: 'Gói',
                        conversion_rate: 1,
                        cost_price: 1920,
                        retail_price: 2500,
                        is_base_unit: true
                    },
                    {
                        id: 'hop',
                        unit_name: 'Hộp',
                        conversion_rate: 24,
                        cost_price: 46080,
                        retail_price: 50000
                    }
                ]
            }), {
                mode: 'direct',
                baseUnitName: 'Gói',
                innerUnitName: '',
                innerCount: null,
                basePerInner: null,
                basePerPackage: 24,
                baseCost: 1920,
                baseRetail: 2500
            });

            assert.deepEqual(buildVariantPackagingEditorSeed({
                product_units: [
                    {
                        id: 'vien',
                        unit_name: 'Viên',
                        conversion_rate: 1,
                        cost_price: 552,
                        retail_price: 800,
                        is_base_unit: true
                    },
                    {
                        id: 'vi',
                        unit_name: 'Vĩ',
                        conversion_rate: 5,
                        cost_price: 2760,
                        retail_price: 4000
                    },
                    {
                        id: 'hop',
                        unit_name: 'Hộp',
                        conversion_rate: 50,
                        cost_price: 27600,
                        retail_price: 40000
                    }
                ]
            }), {
                mode: 'with_inner',
                baseUnitName: 'Viên',
                innerUnitName: 'Vĩ',
                innerCount: 10,
                basePerInner: 5,
                basePerPackage: null,
                baseCost: 552,
                baseRetail: 800
            });
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('builds all unit prices for one SKU and preserves matching unit row ids', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                buildPackagingPlan,
                buildVariantUnitRows,
                getObsoleteVariantUnitIds
            } from './js/features/products/productVariantPackagingRules.js';

            const existingUnits = [
                { id: 'base-id', unit_name: 'viên' },
                { id: 'blister-id', unit_name: 'Vĩ' },
                { id: 'box-id', unit_name: 'Hộp' },
                { id: 'obsolete-id', unit_name: 'Thùng' }
            ];
            const packagingPlan = buildPackagingPlan({
                baseUnitName: 'Viên',
                innerUnitName: 'Vỉ',
                innerCount: 10,
                basePerInner: 5
            });
            const rows = buildVariantUnitRows({
                productId: 'hapacol-650-50',
                packagingPlan,
                baseCost: 552,
                baseRetail: 800,
                existingUnits
            });

            assert.deepEqual(rows, [
                {
                    id: 'base-id',
                    product_id: 'hapacol-650-50',
                    unit_name: 'Viên',
                    conversion_rate: 1,
                    cost_price: 552,
                    retail_price: 800,
                    is_base_unit: true
                },
                {
                    id: 'blister-id',
                    product_id: 'hapacol-650-50',
                    unit_name: 'Vỉ',
                    conversion_rate: 5,
                    cost_price: 2760,
                    retail_price: 4000,
                    is_base_unit: false
                },
                {
                    id: 'box-id',
                    product_id: 'hapacol-650-50',
                    unit_name: 'Hộp',
                    conversion_rate: 50,
                    cost_price: 27600,
                    retail_price: 40000,
                    is_base_unit: false
                }
            ]);
            assert.deepEqual(getObsoleteVariantUnitIds(existingUnits, rows), ['obsolete-id']);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('blocks changing the base stock unit while an SKU still has inventory', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                assertSafeVariantBaseUnitChange
            } from './js/features/products/productVariantPackagingRules.js';

            assert.throws(() => assertSafeVariantBaseUnitChange({
                existingUnits: [{
                    unit_name: 'Gói',
                    conversion_rate: 1,
                    is_base_unit: true
                }],
                nextUnits: [{
                    unit_name: 'Viên',
                    conversion_rate: 1,
                    is_base_unit: true
                }],
                stockQuantity: 24
            }), /đơn vị tồn nhỏ nhất/i);

            assert.doesNotThrow(() => assertSafeVariantBaseUnitChange({
                existingUnits: [{
                    unit_name: 'Gói',
                    conversion_rate: 1,
                    is_base_unit: true
                }],
                nextUnits: [{
                    unit_name: 'Gói',
                    conversion_rate: 1,
                    is_base_unit: true
                }, {
                    unit_name: 'Hộp',
                    conversion_rate: 30
                }],
                stockQuantity: 24
            }));
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });
});
