const { execFileSync } = require('child_process');

describe('product variant classification rules', () => {
    test('keeps at most two unique classification axes', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                buildVariantDefinitionsFromAxes,
                normalizeVariantDefinitions
            } from './js/features/products/productVariantClassificationRules.js';

            assert.deepEqual(buildVariantDefinitionsFromAxes([
                { presetKey: 'scent' },
                { presetKey: 'volume' },
                { presetKey: 'color' }
            ]), [
                { key: 'scent', label: 'Hương / Mùi' },
                { key: 'volume', label: 'Dung tích' }
            ]);

            assert.deepEqual(normalizeVariantDefinitions([
                { key: 'color', label: 'Màu sắc' },
                { key: 'color', label: 'Màu khác' }
            ]), [
                { key: 'color', label: 'Màu sắc' }
            ]);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('rejects duplicate axes and unnamed custom axes before normalization', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                validateVariantAxes
            } from './js/features/products/productVariantClassificationRules.js';

            assert.deepEqual(validateVariantAxes([
                { presetKey: 'concentration', field: 'primary' },
                { presetKey: 'concentration', field: 'secondary' }
            ]).map(issue => issue.key), ['duplicate-variant-axis']);

            assert.deepEqual(validateVariantAxes([
                { presetKey: 'scent', field: 'primary' },
                { presetKey: 'custom', customLabel: '', field: 'secondary' }
            ]).map(issue => issue.key), ['missing-custom-variant-axis-secondary']);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('stores Hapacol clinical identity without mixing in packaging', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                buildVariantClassificationLabel,
                buildVariantClassificationPayload
            } from './js/features/products/productVariantClassificationRules.js';

            const definitions = [
                { key: 'concentration', label: 'Hàm lượng' },
                { key: 'dosage_form', label: 'Dạng bào chế' }
            ];
            const payload = buildVariantClassificationPayload({
                definitions,
                values: {
                    concentration: ' 650mg ',
                    dosage_form: ' Viên nén '
                }
            });

            assert.deepEqual(payload, {
                variant_values: {
                    concentration: '650mg',
                    dosage_form: 'Viên nén'
                },
                concentration: '650mg',
                dosage_form: 'Viên nén'
            });
            assert.equal(
                buildVariantClassificationLabel(definitions, payload.variant_values),
                '650mg • Viên nén'
            );
            assert.equal('packaging_spec' in payload, false);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('supports non-medicine axes and reports missing values by visible label', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                buildVariantClassificationPayload,
                validateVariantValues
            } from './js/features/products/productVariantClassificationRules.js';

            const definitions = [
                { key: 'scent', label: 'Hương / Mùi' },
                { key: 'volume', label: 'Dung tích' }
            ];
            assert.deepEqual(buildVariantClassificationPayload({
                definitions,
                values: { scent: 'Cam', volume: '80ml' }
            }), {
                variant_values: { scent: 'Cam', volume: '80ml' },
                concentration: null,
                dosage_form: null
            });
            assert.deepEqual(validateVariantValues(definitions, {
                scent: 'Cam'
            }).map(issue => issue.label), ['Dung tích']);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('falls back to legacy medicine fields for products not migrated yet', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                normalizeVariantValues,
                resolveVariantDefinitions
            } from './js/features/products/productVariantClassificationRules.js';

            const definitions = resolveVariantDefinitions({}, [{
                concentration: '250mg',
                dosage_form: 'Bột pha uống'
            }]);
            assert.deepEqual(definitions, [
                { key: 'concentration', label: 'Hàm lượng' },
                { key: 'dosage_form', label: 'Dạng bào chế' }
            ]);
            assert.deepEqual(normalizeVariantValues(definitions, {}, {
                concentration: '250mg',
                dosage_form: 'Bột pha uống'
            }), {
                concentration: '250mg',
                dosage_form: 'Bột pha uống'
            });
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });
});
