const { execFileSync } = require('child_process');

describe('product stock limit history service', () => {
    test('requests selling-unit snapshots and maps their conversion to base stock', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import { fetchProductSalesHistoryWithClient } from './js/features/products/productStockLimitHistoryRepository.js';

            const calls = [];
            const client = {
                from(table) {
                    calls.push(['from', table]);
                    if (table === 'product_units') {
                        return {
                            select(value) { calls.push(['units-select', value]); return this; },
                            eq(column, value) { calls.push(['units-eq', column, value]); return this; },
                            async order() {
                                return {
                                    data: [
                                        { unit_name: 'Viên', conversion_rate: 1, is_base_unit: true },
                                        { unit_name: 'Vỉ', conversion_rate: 10, is_base_unit: false }
                                    ],
                                    error: null
                                };
                            }
                        };
                    }

                    return {
                        select(value) { calls.push(['items-select', value]); return this; },
                        eq(column, value) { calls.push(['items-eq', column, value]); return this; },
                        async range() {
                            return {
                                data: [{
                                    quantity: 2,
                                    unit_name: 'vĩ',
                                    orders: {
                                        status: 'completed',
                                        order_type: 'retail',
                                        created_at: '2026-08-01T08:00:00Z'
                                    }
                                }],
                                error: null
                            };
                        }
                    };
                }
            };

            const rows = await fetchProductSalesHistoryWithClient(client, 'sku-1');
            assert.equal(rows.length, 1);
            assert.equal(rows[0].unit_name, 'vĩ');
            assert.equal(rows[0].conversion_rate, 10);
            assert.match(calls.find(call => call[0] === 'items-select')[1], /unit_name/);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });
});
