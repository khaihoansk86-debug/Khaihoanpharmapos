const { execFileSync } = require('child_process');

describe('combo availability rules', () => {
    function runCheck(scriptBody) {
        execFileSync('node', ['--input-type=module', '-e', scriptBody], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('derives sellable combo quantity from the limiting component instead of parent stock', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { calculateComboAvailability } from './js/features/pos/comboAvailabilityRules.js';

            const combo = {
                id: 'combo-1',
                name: 'Chích thuốc khỏe',
                description: JSON.stringify({
                    isCombo: true,
                    items: [
                        { id: 'becozyme', name: 'Becozyme', unit: 'Ống', quantity: 1 },
                        { id: 'syringe', name: 'Bơm Tiêm 5cc', unit: 'Cái', quantity: 1 }
                    ]
                }),
                product_batches: []
            };
            const products = [
                {
                    id: 'becozyme',
                    name: 'Becozyme',
                    product_units: [{ unit_name: 'Ống', conversion_rate: 1, is_base_unit: true }],
                    product_batches: [{ stock_quantity: 131 }]
                },
                {
                    id: 'syringe',
                    name: 'Bơm Tiêm 5cc',
                    product_units: [{ unit_name: 'Cái', conversion_rate: 1, is_base_unit: true }],
                    product_batches: [{ stock_quantity: 230 }]
                }
            ];

            const result = calculateComboAvailability(combo, products);
            assert.equal(result.isCombo, true);
            assert.equal(result.availableQuantity, 131);
            assert.equal(result.bottleneck.name, 'Becozyme');
        `);
    });

    test('converts component units to base stock before calculating availability', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import {
                calculateComboAvailability,
                getComboComponentBaseQuantity
            } from './js/features/pos/comboAvailabilityRules.js';

            const componentProduct = {
                id: 'medicine',
                name: 'Thuốc A',
                product_units: [
                    { unit_name: 'Viên', conversion_rate: 1, is_base_unit: true },
                    { unit_name: 'Vỉ', conversion_rate: 10, is_base_unit: false }
                ],
                product_batches: [{ stock_quantity: 45 }]
            };
            const component = { id: 'medicine', name: 'Thuốc A', unit: 'Vỉ', quantity: 2 };
            assert.equal(getComboComponentBaseQuantity(component, componentProduct, 1), 20);

            const result = calculateComboAvailability({
                id: 'combo-2',
                description: JSON.stringify({ isCombo: true, items: [component] }),
                product_batches: [{ stock_quantity: 9999 }]
            }, [componentProduct]);

            assert.equal(result.availableQuantity, 2);
            assert.equal(result.components[0].requiredBaseQuantity, 20);
        `);
    });

    test('returns zero when a component or its configured unit is unavailable', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { calculateComboAvailability } from './js/features/pos/comboAvailabilityRules.js';

            const missingProduct = calculateComboAvailability({
                description: JSON.stringify({
                    isCombo: true,
                    items: [{ id: 'missing', name: 'Thiếu hàng', unit: 'Viên', quantity: 1 }]
                })
            }, []);
            assert.equal(missingProduct.availableQuantity, 0);
            assert.equal(missingProduct.components[0].status, 'missing_product');

            const missingUnit = calculateComboAvailability({
                description: JSON.stringify({
                    isCombo: true,
                    items: [{ id: 'medicine', name: 'Thuốc A', unit: 'Hộp', quantity: 1 }]
                })
            }, [{
                id: 'medicine',
                product_units: [{ unit_name: 'Viên', conversion_rate: 1, is_base_unit: true }],
                product_batches: [{ stock_quantity: 100 }]
            }]);
            assert.equal(missingUnit.availableQuantity, 0);
            assert.equal(missingUnit.components[0].status, 'missing_unit');
        `);
    });

    test('caps cart quantity at the number of combos available', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { getAllowedComboQuantity } from './js/features/pos/comboAvailabilityRules.js';

            assert.equal(getAllowedComboQuantity(150, {
                isCombo: true,
                availableQuantity: 131
            }), 131);
            assert.equal(getAllowedComboQuantity(2, {
                isCombo: true,
                availableQuantity: 131
            }), 2);
            assert.equal(getAllowedComboQuantity(5, {
                isCombo: false,
                availableQuantity: null
            }), 5);
        `);
    });

    test('builds checkout stock requirements in base units for every combo component', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { buildComboComponentRequirements } from './js/features/pos/comboAvailabilityRules.js';

            const requirements = buildComboComponentRequirements([{
                quantity: 3,
                description: JSON.stringify({
                    isCombo: true,
                    items: [{ id: 'medicine', name: 'Thuốc A', unit: 'Vỉ', quantity: 2 }]
                })
            }], [{
                id: 'medicine',
                product_units: [
                    { unit_name: 'Viên', conversion_rate: 1, is_base_unit: true },
                    { unit_name: 'Vỉ', conversion_rate: 10, is_base_unit: false }
                ]
            }]);

            assert.equal(requirements.get('medicine').requiredBaseQuantity, 60);
            assert.equal(requirements.get('medicine').name, 'Thuốc A');
        `);
    });
});
