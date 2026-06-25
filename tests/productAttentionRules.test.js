const { execFileSync } = require('child_process');

describe('product attention task rules', () => {
    test('groups expired and near-expiry batches by product and ignores empty stock', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import { buildProductAttentionTasks } from './js/features/products/productAttentionRules.js';

            const products = [
                {
                    id: 'expired',
                    is_active: true,
                    product_batches: [
                        { batch_number: 'A', stock_quantity: 2, expiry_date: '2026-06-20' },
                        { batch_number: 'B', stock_quantity: 0, expiry_date: '2026-06-01' }
                    ]
                },
                {
                    id: 'near',
                    is_active: true,
                    product_batches: [{ batch_number: 'C', stock_quantity: 3, expiry_date: '2026-07-10' }]
                },
                {
                    id: 'safe',
                    is_active: true,
                    product_batches: [{ batch_number: 'D', stock_quantity: 1, expiry_date: '2027-01-01' }]
                }
            ];
            const cleanup = [{ product: products[2], severity: 'review', reason: 'Cần xem' }];
            const tasks = buildProductAttentionTasks(products, cleanup, new Date('2026-06-25T00:00:00Z'));

            assert.deepEqual(tasks.expired.map(item => item.product.id), ['expired']);
            assert.equal(tasks.expired[0].batches.length, 1);
            assert.deepEqual(tasks.nearExpiry.map(item => item.product.id), ['near']);
            assert.equal(tasks.cleanup.length, 1);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });
});
