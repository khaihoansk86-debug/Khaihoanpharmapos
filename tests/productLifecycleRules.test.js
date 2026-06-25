const { execFileSync } = require('child_process');

describe('product lifecycle cleanup rules', () => {
    test('flags only mature products with reliable no-sale signals', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import { buildProductLifecycleCandidates } from './js/features/products/productLifecycleRules.js';

            const now = new Date('2026-06-25T00:00:00Z');
            const products = [
                { id: 'dead', name: 'Hàng cũ', is_active: true, created_at: '2024-01-01', product_batches: [] },
                { id: 'stocked', name: 'Hàng tồn', is_active: true, created_at: '2024-01-01', product_batches: [{ stock_quantity: 8 }] },
                { id: 'recent', name: 'Hàng mới', is_active: true, created_at: '2026-05-01', product_batches: [] },
                { id: 'selling', name: 'Hàng đang bán', is_active: true, created_at: '2024-01-01', product_batches: [] },
                { id: 'inactive', name: 'Đã ngừng', is_active: false, created_at: '2024-01-01', product_batches: [] }
            ];
            const sales = [{ product_id: 'selling', quantity: 1, sold_at: '2026-06-20' }];
            const result = buildProductLifecycleCandidates(products, sales, now);

            assert.deepEqual(result.map(item => [item.product.id, item.severity]), [
                ['dead', 'likely_discontinued'],
                ['stocked', 'review']
            ]);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });
});
