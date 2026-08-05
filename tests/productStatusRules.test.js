const { execFileSync } = require('child_process');

describe('product business status rules', () => {
    test('updates only the selected product without mutating the catalog snapshot', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                applyProductBusinessStatus,
                filterProductBusinessStatus,
                filterProductStatusView
            } from './js/features/products/productStatusRules.js';

            const catalog = [
                { id: 'sugar-test', name: 'Thử đường', is_active: true },
                { id: 'other', name: 'Mặt hàng khác', is_active: true }
            ];
            const updated = applyProductBusinessStatus(catalog, 'sugar-test', false);

            assert.equal(updated[0].is_active, false);
            assert.equal(updated[1], catalog[1]);
            assert.equal(catalog[0].is_active, true);
            assert.deepEqual(filterProductBusinessStatus(updated, 'active').map(item => item.id), ['other']);
            assert.deepEqual(filterProductBusinessStatus(updated, 'inactive').map(item => item.id), ['sugar-test']);

            const stoppedDose = {
                id: 'dose-stopped',
                is_active: false,
                description: JSON.stringify({ is_dose_cut: true })
            };
            const activeDose = {
                id: 'dose-active',
                is_active: true,
                description: JSON.stringify({ is_dose_cut: true })
            };
            const mixedCatalog = [...updated, stoppedDose, activeDose];
            assert.deepEqual(
                filterProductStatusView(mixedCatalog, 'inactive').map(item => item.id),
                ['sugar-test', 'dose-stopped']
            );
            assert.deepEqual(
                filterProductStatusView(mixedCatalog, 'dose_cut').map(item => item.id),
                ['dose-active']
            );
            assert.deepEqual(
                filterProductStatusView(mixedCatalog, 'active').map(item => item.id),
                ['other']
            );
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });
});
