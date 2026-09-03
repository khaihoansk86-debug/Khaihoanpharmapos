const { execFileSync } = require('child_process');

describe('shared editor rules for an existing variant SKU', () => {
    test('preserves clinical identity and the complete unit/batch snapshot', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import { buildSharedVariantSavePayload } from './js/features/products/productVariantSharedEditorRules.js';

            const units = Array.from({ length: 5 }, (_, index) => ({
                id: 'unit-' + index,
                unit_name: index === 0 ? 'Viên' : 'Đơn vị ' + index,
                conversion_rate: index + 1,
                cost_price: 100 * (index + 1),
                retail_price: 200 * (index + 1),
                is_base_unit: index === 0
            }));
            const batches = Array.from({ length: 7 }, (_, index) => ({
                id: 'batch-' + index,
                batch_number: 'Lô ' + index,
                expiry_date: '2027-12-31',
                stock_quantity: index + 1,
                is_tracked: true
            }));
            const payload = buildSharedVariantSavePayload({
                variant: {
                    id: 'sku-1',
                    parent_id: 'parent-1',
                    variant_values: { scent: 'Cam', volume: '80ml' },
                    product_units: units,
                    product_batches: batches
                },
                parent: { id: 'parent-1', name: 'Soffell' },
                productData: {
                    name: 'Soffell - Cam 80ml',
                    product_code: 'SOF-CAM-80',
                    barcode: '123',
                    concentration: null,
                    dosage_form: null,
                    packaging_spec: 'Chai 80ml',
                    category_id: 'category-1',
                    is_active: true
                },
                units,
                batches,
                minStockQuantity: 5,
                maxStockQuantity: 20
            });

            assert.equal(payload.variant_label, 'Cam 80ml');
            assert.deepEqual(payload.variant_values, { scent: 'Cam', volume: '80ml' });
            assert.equal(payload.units.length, 5);
            assert.equal(payload.units[4].id, 'unit-4');
            assert.equal(payload.units[4].retail_price, 1000);
            assert.equal(payload.batches.length, 7);
            assert.equal(payload.min_stock_quantity, 5);
            assert.equal(payload.max_stock_quantity, 20);
            assert.equal(payload.category_id, 'category-1');
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('blocks changing the base unit while the SKU still has stock', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import { buildSharedVariantSavePayload } from './js/features/products/productVariantSharedEditorRules.js';

            assert.throws(() => buildSharedVariantSavePayload({
                variant: {
                    id: 'sku-1',
                    parent_id: 'parent-1',
                    variant_label: 'Hộp 24 gói',
                    product_units: [{ unit_name: 'Gói', conversion_rate: 1, is_base_unit: true }],
                    product_batches: [{ stock_quantity: 24 }]
                },
                parent: { id: 'parent-1', name: 'Thuốc A' },
                productData: { name: 'Thuốc A - Hộp 24 gói', product_code: 'A-24' },
                units: [{ unit_name: 'Viên', conversion_rate: 1, is_base_unit: true }],
                batches: [{ stock_quantity: 24 }]
            }), /đơn vị tồn nhỏ nhất/i);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });
});
