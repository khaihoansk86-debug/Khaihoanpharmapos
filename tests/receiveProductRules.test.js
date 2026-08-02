const { execFileSync } = require('child_process');

describe('receive product rules', () => {
    test('filters non-receivable catalog rows and supports rich SKU search', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                buildReceiveProductCatalog,
                isReceivablePhysicalSku,
                searchReceiveProducts
            } from './js/features/receive/receiveProductRules.js';

            const product = (overrides = {}) => ({
                id: 'product-' + Math.random(),
                product_code: 'SP001',
                name: 'Hapacol 650',
                is_active: true,
                is_direct_sale: true,
                product_categories: { name: 'Thuốc' },
                product_units: [
                    { id: 'vien', unit_name: 'Viên', conversion_rate: 1, is_base_unit: true },
                    { id: 'vi', unit_name: 'Vỉ', conversion_rate: 5 },
                    { id: 'hop', unit_name: 'Hộp', conversion_rate: 50 }
                ],
                product_batches: [{ stock_quantity: 70 }],
                ...overrides
            });

            const parent = product({
                id: 'parent',
                product_code: 'PARENT_HAPACOL',
                name: 'Hapacol',
                is_direct_sale: false
            });
            const child = product({
                id: 'child',
                parent_id: 'parent',
                product_code: 'SP000910',
                barcode: '8935001234567',
                concentration: '650mg',
                dosage_form: 'Viên nén',
                packaging_spec: 'Hộp 10 vỉ × 5 viên'
            });
            const inactive = product({ id: 'inactive', is_active: false });
            const combo = product({ id: 'combo', product_categories: { name: 'Combo' } });
            const virtualDose = product({
                id: 'dose',
                description: JSON.stringify({ is_dose_retail: true })
            });

            const catalog = buildReceiveProductCatalog([parent, child, inactive, combo, virtualDose]);
            assert.deepEqual(catalog.map(item => item.id), ['child']);
            assert.equal(isReceivablePhysicalSku(parent, new Set(['parent'])), false);
            assert.equal(searchReceiveProducts(catalog, '8935001234567')[0].id, 'child');
            assert.equal(searchReceiveProducts(catalog, '650mg vien nen')[0].id, 'child');
            assert.equal(searchReceiveProducts(catalog, '10 vi 5 vien')[0].id, 'child');
            assert.equal(catalog[0]._receiveMeta.stockLabel, '70 Viên');
            assert.deepEqual(
                catalog[0]._receiveMeta.units.map(unit => unit.unit_name),
                ['Hộp', 'Vỉ', 'Viên']
            );

            const customParent = product({
                id: 'custom-parent',
                product_code: 'PARENT_SOFFELL',
                name: 'Soffell',
                is_direct_sale: false,
                variant_definitions: [
                    { key: 'scent', label: 'Hương / Mùi' },
                    { key: 'volume', label: 'Dung tích' }
                ]
            });
            const customChild = product({
                id: 'custom-child',
                parent_id: 'custom-parent',
                product_code: 'SOFFELL-CAM-80',
                name: 'Soffell Cam 80ml',
                variant_values: { scent: 'Cam', volume: '80ml' }
            });
            const customCatalog = buildReceiveProductCatalog([customParent, customChild]);
            assert.equal(customCatalog[0]._receiveMeta.clinicalLabel, 'Cam • 80ml');
            assert.equal(searchReceiveProducts(customCatalog, 'huong mui cam')[0].id, 'custom-child');
            assert.equal(searchReceiveProducts(customCatalog, 'dung tich 80ml')[0].id, 'custom-child');
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('filters a legacy parent even when it is still marked for direct sale', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import { buildReceiveProductCatalog } from './js/features/receive/receiveProductRules.js';

            const legacyParent = {
                id: 'legacy-parent',
                product_code: 'SP-PARENT-OLD',
                name: 'Hapacol',
                is_active: true,
                is_direct_sale: true
            };
            const child = {
                id: 'legacy-child',
                parent_id: 'legacy-parent',
                product_code: 'SP-CHILD',
                name: 'Hapacol 650',
                is_active: true,
                is_direct_sale: true,
                product_units: [{ id: 'base', unit_name: 'Viên', conversion_rate: 1, is_base_unit: true }]
            };

            assert.deepEqual(
                buildReceiveProductCatalog([legacyParent, child]).map(item => item.id),
                ['legacy-child']
            );
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('shows quantity and cost conversion in the base stock unit', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import { buildReceiveConversionSummary } from './js/features/receive/receiveProductRules.js';

            assert.deepEqual(buildReceiveConversionSummary({
                quantity: 4,
                unitName: 'Hộp',
                conversionRate: 50,
                baseUnitName: 'Viên',
                costPrice: 48000
            }), {
                quantityBase: 200,
                costPriceBase: 960,
                equationLabel: '1 Hộp = 50 Viên',
                receiveLabel: 'Cộng 200 Viên vào kho',
                costBaseLabel: '960đ/Viên'
            });
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });
});
