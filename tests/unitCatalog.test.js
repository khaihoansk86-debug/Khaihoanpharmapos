const { execFileSync } = require('child_process');

describe('shared unit catalog', () => {
    test('exposes the four canonical defaults and normalizes vĩ/vỉ', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import { DEFAULT_UNIT_NAMES, normalizeUnitName, getUnitOptions } from './js/core/unitCatalog.js';
            assert.deepEqual(DEFAULT_UNIT_NAMES, ['Viên', 'Vỉ', 'Hộp', 'Lọ']);
            assert.equal(normalizeUnitName('vĩ'), 'Vỉ');
            assert.equal(normalizeUnitName(' VỈ '), 'Vỉ');
            assert.equal(normalizeUnitName('viên'), 'Viên');
            assert.deepEqual(getUnitOptions(), DEFAULT_UNIT_NAMES);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('remembers a custom unit and de-duplicates aliases after reload', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            const store = new Map();
            globalThis.localStorage = {
                getItem: key => store.get(key) || null,
                setItem: (key, value) => store.set(key, String(value))
            };
            const catalog = await import('./js/core/unitCatalog.js?test=' + Date.now());
            assert.equal(catalog.addCustomUnit('ống'), 'Ống');
            assert.equal(catalog.addCustomUnit('ỐNG'), 'Ống');
            assert.deepEqual(catalog.getUnitOptions().slice(-1), ['Ống']);
            assert.equal(catalog.normalizeProductUnits([
                { id: 'old', unit_name: 'vĩ', conversion_rate: 10 },
                { id: 'new', unit_name: 'Vỉ', conversion_rate: 10 }
            ]).length, 1);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('suggests the remaining defaults and accepts product-unit records', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                getNextSuggestedUnit,
                getUnitOptions,
                normalizeProductUnits,
                normalizeUnitName
            } from './js/core/unitCatalog.js';

            assert.equal(getNextSuggestedUnit(['Viên']), 'Vỉ');
            assert.equal(getNextSuggestedUnit(['Viên', 'vĩ']), 'Hộp');
            assert.equal(getNextSuggestedUnit(['Viên', 'Vỉ', 'Hộp', 'Lọ']), '');
            assert.deepEqual(getUnitOptions([
                { unit_name: 'vĩ' },
                { unit_name: 'Ống' }
            ]), ['Viên', 'Vỉ', 'Hộp', 'Lọ', 'Ống']);

            const rows = normalizeProductUnits([
                { id: 'legacy', unit_name: 'vĩ', conversion_rate: 10 },
                { id: 'canonical', unit_name: 'Vỉ', conversion_rate: 10, is_base_unit: true }
            ]);
            assert.equal(rows.length, 1);
            assert.equal(rows[0].id, 'canonical');
            assert.equal(rows[0].unit_name, 'Vỉ');
            assert.equal(normalizeUnitName('  vĩ  '), 'Vỉ');
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });
});
