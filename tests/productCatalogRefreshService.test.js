const { execFileSync } = require('child_process');

describe('product catalog refresh service', () => {
    test('reads a fresh product snapshot by code with units and batches', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                fetchCatalogProductSnapshot
            } from './js/features/products/productCatalogRefreshService.js';

            const calls = [];
            const query = {
                select(value) {
                    calls.push(['select', value]);
                    return this;
                },
                eq(column, value) {
                    calls.push(['eq', column, value]);
                    return this;
                },
                async single() {
                    return {
                        data: {
                            id: 'parent-1',
                            product_code: 'PARENT_HAPACOL',
                            product_categories: { id: 'cat-1', name: 'Thuốc' },
                            product_units: [{ unit_name: 'Nhóm' }],
                            product_batches: []
                        },
                        error: null
                    };
                }
            };
            const client = {
                from(table) {
                    calls.push(['from', table]);
                    return query;
                }
            };

            const product = await fetchCatalogProductSnapshot(client, {
                productCode: 'PARENT_HAPACOL'
            });

            assert.equal(product.categories.name, 'Thuốc');
            assert.deepEqual(calls[0], ['from', 'products']);
            assert.deepEqual(calls[2], ['eq', 'product_code', 'PARENT_HAPACOL']);
            assert.match(calls[1][1], /product_units\\(\\*\\)/);
            assert.match(calls[1][1], /product_batches\\(\\*\\)/);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('replaces an existing snapshot without changing list position', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                mergeCatalogProductSnapshot
            } from './js/features/products/productCatalogRefreshService.js';

            const original = [
                { id: 'parent', name: 'Hapacol' },
                { id: 'sku-1', name: 'Old SKU' }
            ];
            const snapshot = {
                id: 'sku-1',
                name: 'Hapacol 650',
                packaging_spec: 'Hộp 10 vỉ × 5 viên'
            };

            const merged = mergeCatalogProductSnapshot(original, snapshot);
            assert.equal(merged.length, 2);
            assert.equal(merged[1].name, 'Hapacol 650');
            assert.equal(original[1].name, 'Old SKU');
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('checks the live catalog to distinguish SKU from barcode conflicts', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                fetchCatalogIdentityConflictSnapshot
            } from './js/features/products/productCatalogRefreshService.js';

            const calls = [];
            const rowsByColumn = {
                product_code: [],
                barcode: [{
                    id: 'existing-barcode',
                    name: 'Panadol Extra',
                    product_code: 'PANADOL-EXTRA',
                    barcode: '8935001234567'
                }]
            };
            const client = {
                from(table) {
                    calls.push(['from', table]);
                    let activeColumn = '';
                    return {
                        select(value) {
                            calls.push(['select', value]);
                            return this;
                        },
                        eq(column, value) {
                            activeColumn = column;
                            calls.push(['eq', column, value]);
                            return this;
                        },
                        async limit(value) {
                            calls.push(['limit', value]);
                            return {
                                data: rowsByColumn[activeColumn] || [],
                                error: null
                            };
                        }
                    };
                }
            };

            const conflict = await fetchCatalogIdentityConflictSnapshot(client, {
                productCode: 'NEW-SKU',
                barcode: '8935001234567'
            });

            assert.equal(conflict.id, 'existing-barcode');
            assert.deepEqual(
                calls.filter(call => call[0] === 'eq').map(call => call[1]),
                ['product_code', 'barcode']
            );
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('appends a newly created SKU snapshot', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                mergeCatalogProductSnapshot
            } from './js/features/products/productCatalogRefreshService.js';

            const merged = mergeCatalogProductSnapshot(
                [{ id: 'parent', name: 'Hapacol' }],
                { id: 'sku-new', parent_id: 'parent', name: 'Hapacol 250' }
            );

            assert.equal(merged.length, 2);
            assert.equal(merged[1].id, 'sku-new');
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });
});
