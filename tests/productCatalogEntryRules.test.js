const { execFileSync } = require('child_process');

describe('product catalog entry rules', () => {
    test('turns a multi-SKU catalog entry into a non-sellable parent group', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                buildCatalogEntryPlan,
                buildTechnicalParentUnit
            } from './js/features/products/productCatalogEntryRules.js';

            const plan = buildCatalogEntryPlan({ hasVariants: true });
            assert.equal(plan.kind, 'product_group');
            assert.equal(plan.isDirectSale, false);
            assert.equal(plan.usesPhysicalUnits, false);
            assert.equal(plan.usesBatches, false);
            assert.deepEqual(buildTechnicalParentUnit(), [{
                unit_name: 'Nhóm',
                retail_price: 0,
                cost_price: 0,
                conversion_rate: 1,
                is_base_unit: true
            }]);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('detects duplicate SKU and barcode before saving', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import { findCatalogIdentityConflict } from './js/features/products/productCatalogEntryRules.js';

            const products = [{
                id: 'existing',
                product_code: 'SP000910',
                barcode: '8935001234567',
                name: 'Hapacol 650 hộp 50 viên'
            }];
            assert.equal(findCatalogIdentityConflict({
                productCode: 'sp000910',
                existingProducts: products
            }).field, 'product_code');
            assert.equal(findCatalogIdentityConflict({
                productCode: 'SP-NEW',
                barcode: '8935001234567',
                existingProducts: products
            }).field, 'barcode');
            assert.equal(findCatalogIdentityConflict({
                productCode: 'SP000910',
                existingProducts: products,
                excludeProductId: 'existing'
            }), null);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('maps database identity conflicts back to the correct form field', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                resolveCatalogIdentityPersistenceIssue
            } from './js/features/products/productCatalogEntryRules.js';

            assert.deepEqual(resolveCatalogIdentityPersistenceIssue(
                new Error('Mã hàng HAPACOL-650 đã tồn tại!'),
                { productCode: 'HAPACOL-650' }
            ), {
                key: 'identity-product-code-conflict',
                field: 'add_code',
                rejectedValue: 'HAPACOL-650',
                message: 'Mã SKU HAPACOL-650 đã được sử dụng. Vui lòng chọn mã khác.'
            });

            assert.equal(resolveCatalogIdentityPersistenceIssue({
                code: '23505',
                details: 'Key (barcode)=(8935001234567) already exists.'
            }, {
                productCode: 'NEW-SKU',
                barcode: '8935001234567'
            }).field, 'add_barcode');

            assert.equal(resolveCatalogIdentityPersistenceIssue(
                new Error('Mất kết nối mạng'),
                { productCode: 'NEW-SKU' }
            ), null);
            assert.equal(resolveCatalogIdentityPersistenceIssue({
                code: '23505',
                details: 'Key (batch_number)=(LOT-01) already exists.'
            }, {
                productCode: 'NEW-SKU'
            }), null);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('supports both box-to-sachet and box-to-blister packaging requests', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import { buildVariantPackagingRequest } from './js/features/products/productCatalogEntryRules.js';
            import { buildPackagingPlan } from './js/features/products/productVariantPackagingRules.js';

            const sachets = buildPackagingPlan(buildVariantPackagingRequest({
                mode: 'direct',
                baseUnitName: 'Gói',
                basePerPackage: 24
            }));
            const tablets = buildPackagingPlan(buildVariantPackagingRequest({
                mode: 'with_inner',
                baseUnitName: 'Viên',
                innerUnitName: 'Vỉ',
                innerCount: 10,
                basePerInner: 5
            }));

            assert.equal(sachets.packagingSpec, 'Hộp 24 gói');
            assert.equal(tablets.packagingSpec, 'Hộp 10 vỉ × 5 viên');
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('provides common pharmacy packaging presets for consecutive SKU entry', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                getVariantPackagingPreset,
                listVariantPackagingPresets
            } from './js/features/products/productCatalogEntryRules.js';
            import { buildPackagingPlan } from './js/features/products/productVariantPackagingRules.js';

            const hapacol50 = getVariantPackagingPreset('box_10x5');
            const hapacol100 = getVariantPackagingPreset('box_10x10');
            const hapacol250 = getVariantPackagingPreset('box_24_sachets');

            assert.equal(buildPackagingPlan(hapacol50).packagingSpec, 'Hộp 10 vỉ × 5 viên');
            assert.equal(buildPackagingPlan(hapacol100).packagingSpec, 'Hộp 10 vỉ × 10 viên');
            assert.equal(buildPackagingPlan(hapacol250).packagingSpec, 'Hộp 24 gói');
            assert.equal(listVariantPackagingPresets().length, 4);
            assert.throws(
                () => getVariantPackagingPreset('unknown'),
                /Mẫu quy cách không hợp lệ/
            );
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('builds a pre-save SKU review with derived prices and warnings', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                buildVariantDraftReview,
                getVariantPackagingPreset
            } from './js/features/products/productCatalogEntryRules.js';
            import { buildPackagingPlan } from './js/features/products/productVariantPackagingRules.js';

            const packagingPlan = buildPackagingPlan(
                getVariantPackagingPreset('box_10x5')
            );
            const ready = buildVariantDraftReview({
                concentration: '650mg',
                dosageForm: 'Viên nén',
                productCode: 'SP000910',
                barcode: '8930000000910',
                packagingPlan,
                baseCost: 1000,
                baseRetail: 1500
            });

            assert.equal(ready.identityLabel, '650mg • Viên nén • Hộp 10 vỉ × 5 viên');
            assert.equal(ready.equation, '1 Hộp = 10 Vỉ = 50 Viên');
            assert.deepEqual(ready.unitPrices.map(unit => [
                unit.unitName,
                unit.costPrice,
                unit.retailPrice
            ]), [
                ['Viên', 1000, 1500],
                ['Vỉ', 5000, 7500],
                ['Hộp', 50000, 75000]
            ]);
            assert.equal(ready.isReady, true);
            assert.equal(ready.warnings.length, 0);

            const invalid = buildVariantDraftReview({
                packagingPlan,
                baseCost: 2000,
                baseRetail: 1000
            });
            assert.equal(invalid.isReady, false);
            assert.ok(invalid.warnings.some(item => item.key === 'missing-concentration'));
            assert.ok(invalid.warnings.some(item => item.key === 'retail-below-cost'));
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('suggests readable collision-free SKU codes from parent and packaging', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                buildVariantIdentitySuggestion,
                getVariantPackagingPreset
            } from './js/features/products/productCatalogEntryRules.js';
            import { buildPackagingPlan } from './js/features/products/productVariantPackagingRules.js';

            const packagingPlan = buildPackagingPlan(
                getVariantPackagingPreset('box_10x5')
            );
            const first = buildVariantIdentitySuggestion({
                parentCode: 'PARENT_HAPACOL',
                parentName: 'Hapacol',
                concentration: '650 mg',
                dosageForm: 'Viên nén',
                packagingPlan,
                existingProducts: []
            });
            const collision = buildVariantIdentitySuggestion({
                parentCode: 'PARENT_HAPACOL',
                concentration: '650 mg',
                dosageForm: 'Viên nén',
                packagingPlan,
                existingProducts: [
                    { product_code: 'HAPACOL-650-MG-50VIEN' },
                    { product_code: 'HAPACOL-650-MG-50VIEN-2' }
                ]
            });

            assert.equal(first.suggestedCode, 'HAPACOL-650-MG-50VIEN');
            assert.equal(
                first.suggestedLabel,
                '650 mg • Viên nén • Hộp 10 vỉ × 5 viên'
            );
            assert.equal(collision.suggestedCode, 'HAPACOL-650-MG-50VIEN-3');
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('carries only safe clinical and base-price fields into the next SKU draft', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                buildVariantContinuationSeed
            } from './js/features/products/productCatalogEntryRules.js';

            const seed = buildVariantContinuationSeed({
                concentration: ' 650 mg ',
                dosageForm: ' Viên nén ',
                packagingMode: 'with_inner',
                baseUnitName: 'Viên',
                innerUnitName: 'Vỉ',
                baseCost: '1000',
                baseRetail: '1500',
                productCode: 'MUST-NOT-COPY',
                barcode: '8930000000000',
                batches: [{ batch_number: 'LOT-OLD' }]
            });

            assert.deepEqual(seed, {
                concentration: '650 mg',
                dosageForm: 'Viên nén',
                packagingMode: 'with_inner',
                baseUnitName: 'Viên',
                innerUnitName: 'Vỉ',
                baseCost: 1000,
                baseRetail: 1500
            });
            assert.equal('productCode' in seed, false);
            assert.equal('barcode' in seed, false);
            assert.equal('batches' in seed, false);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('detects meaningful SKU draft changes without warning for empty batch rows', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                hasVariantDraftChanged
            } from './js/features/products/productCatalogEntryRules.js';

            const initial = {
                concentration: '650 mg',
                dosageForm: 'Viên nén',
                packagingMode: 'with_inner',
                baseUnitName: 'Viên',
                innerUnitName: 'Vỉ',
                innerCount: 10,
                basePerInner: 5,
                baseCost: 1000,
                baseRetail: 1500,
                batches: [{ batchNumber: '', expiryDate: '', quantity: 0 }]
            };

            assert.equal(hasVariantDraftChanged(initial, {
                ...initial,
                concentration: ' 650 mg ',
                batches: [
                    { batchNumber: '', expiryDate: '', quantity: '0' },
                    { batchNumber: '   ', expiryDate: '', quantity: '' }
                ]
            }), false);
            assert.equal(hasVariantDraftChanged(initial, {
                ...initial,
                barcode: '8930000000000'
            }), true);
            assert.equal(hasVariantDraftChanged(initial, {
                ...initial,
                batches: [{ batchNumber: 'LOT-NEW', expiryDate: '', quantity: 0 }]
            }), true);
            assert.equal(hasVariantDraftChanged({
                ...initial,
                batches: [{ batchId: 'batch-1', batchNumber: 'LOT-OLD', quantity: 5 }]
            }, {
                ...initial,
                batches: [{ batchId: '', batchNumber: 'LOT-OLD', quantity: 5 }]
            }), true);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('detects meaningful product form changes while ignoring edge whitespace', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                hasProductFormDraftChanged
            } from './js/features/products/productCatalogEntryRules.js';

            const initial = [
                { key: 'add_name', type: 'text', value: 'Hapacol', checked: false },
                { key: 'add_has_variants', type: 'checkbox', value: 'on', checked: true },
                { key: 'add_category', type: 'select-one', value: 'medicine', checked: false }
            ];

            assert.equal(hasProductFormDraftChanged(initial, [
                { ...initial[0], value: '  Hapacol  ' },
                initial[1],
                initial[2]
            ]), false);
            assert.equal(hasProductFormDraftChanged(initial, [
                { ...initial[0], value: 'Hapacol 650' },
                initial[1],
                initial[2]
            ]), true);
            assert.equal(hasProductFormDraftChanged(initial, [
                initial[0],
                { ...initial[1], checked: false },
                initial[2]
            ]), true);
            assert.equal(hasProductFormDraftChanged(initial, initial.slice(0, 2)), true);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('validates required product, unit and tracked-batch fields before save', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                validateProductCatalogEntry
            } from './js/features/products/productCatalogEntryRules.js';

            const issues = validateProductCatalogEntry({
                name: '',
                productCode: ' ',
                categoryId: '',
                usesPhysicalUnits: true,
                baseUnitName: '',
                baseRetail: '',
                usesBatches: true,
                tracksBatches: true,
                batches: [
                    { expiryDate: '' },
                    { expiryDate: '2028-12-31' }
                ]
            });

            assert.deepEqual(issues.map(issue => issue.key), [
                'missing-name',
                'missing-code',
                'missing-category',
                'missing-base-unit',
                'invalid-base-retail',
                'missing-batch-expiry-0'
            ]);
            assert.equal(validateProductCatalogEntry({
                name: 'Hapacol',
                productCode: 'HAPACOL-650',
                categoryId: 'medicine',
                usesPhysicalUnits: true,
                baseUnitName: 'Viên',
                baseRetail: '0',
                usesBatches: true,
                tracksBatches: false,
                batches: [{ expiryDate: '' }]
            }).length, 0);
            assert.equal(validateProductCatalogEntry({
                name: 'Nhóm Hapacol',
                productCode: 'PARENT_HAPACOL',
                categoryId: 'medicine',
                usesPhysicalUnits: false,
                usesBatches: false
            }).length, 0);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });
});
