const { execFileSync } = require('child_process');
const fs = require('fs');

describe('POS product search mode rules', () => {
    function runCheck(body) {
        execFileSync('node', ['--input-type=module', '-e', body], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('recognizes flags from both JSON and already-parsed descriptions', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import {
                getProductDescriptionFlags,
                isDoseCutCatalogProduct
            } from './js/features/pos/posProductSearchRules.js';

            assert.deepEqual(
                getProductDescriptionFlags({ description: JSON.stringify({ is_dose_cut: true }) }),
                { is_dose_cut: true }
            );
            assert.deepEqual(
                getProductDescriptionFlags({ description: { is_dose_cut: true } }),
                { is_dose_cut: true }
            );
            assert.equal(isDoseCutCatalogProduct({ description: { is_dose_cut: true } }), true);
            assert.equal(isDoseCutCatalogProduct({ description: { is_dose_cut: true, is_dose_retail: true } }), false);
        `);
    });

    test('dose mode only allows active dose ingredient catalog products', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { isProductAllowedInPOSMode } from './js/features/pos/posProductSearchRules.js';
            const context = { isDoseCutMode: true };
            const doseIngredient = { is_active: true, description: JSON.stringify({ is_dose_cut: true }) };
            const doseRetailPackage = { is_active: true, description: JSON.stringify({ is_dose_retail: true }) };
            const regularProduct = { is_active: true, description: JSON.stringify({}) };
            assert.equal(isProductAllowedInPOSMode(doseIngredient, context), true);
            assert.equal(isProductAllowedInPOSMode(doseRetailPackage, context), false);
            assert.equal(isProductAllowedInPOSMode(regularProduct, context), false);
            assert.equal(isProductAllowedInPOSMode({ ...doseIngredient, is_active: false }, context), false);
        `);
    });

    test('preserves normal, ecommerce, and internal dose-cutting eligibility', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { isProductAllowedInPOSMode } from './js/features/pos/posProductSearchRules.js';
            const doseIngredient = { is_active: true, description: JSON.stringify({ is_dose_cut: true }) };
            const doseRetailPackage = { is_active: true, description: JSON.stringify({ is_dose_retail: true }) };
            const regularProduct = { is_active: true, description: JSON.stringify({}) };
            assert.equal(isProductAllowedInPOSMode(doseIngredient), false);
            assert.equal(isProductAllowedInPOSMode(doseRetailPackage), true);
            assert.equal(isProductAllowedInPOSMode(regularProduct), true);
            assert.equal(isProductAllowedInPOSMode(doseIngredient, { isInternalMode: true, internalReason: 'dose_cutting' }), true);
            assert.equal(isProductAllowedInPOSMode(doseIngredient, { isEcommerceMode: true }), false);
            assert.equal(isProductAllowedInPOSMode({ ...regularProduct, is_ecommerce: true }, { isEcommerceMode: true }), true);
        `);
    });

    test('controller applies the same guard to search, barcode, quick search, and cart entry', () => {
        const controller = fs.readFileSync('js/features/pos/posController.js', 'utf8');
        expect(controller).toContain("import {\n    getProductDescriptionFlags,");
        expect(controller).toContain('if (!isCurrentPOSProductAllowed(p)) return false;');
        expect(controller).toContain('if (!isCurrentPOSProductAllowed(product)) return false;');
        expect(controller).toContain('if (!isCurrentPOSProductAllowed(exactMatch)) {');
        expect(controller).toContain('if (!isCurrentPOSProductAllowed(product)) {');
        expect(controller).toContain('function resetPOSSearchAfterModeChange()');
        expect(controller).not.toContain('window.selectPOSProduct(');
    });
});
