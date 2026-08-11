const { execFileSync } = require('child_process');

describe('checkout log server mapping', () => {
    function runCheck(scriptBody) {
        execFileSync('node', ['--input-type=module', '-e', scriptBody], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('maps completed order and item snapshots into a short cross-device log row', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { mapOrderToCheckoutLog } from './js/features/pos/checkoutLogRules.js';
            const row = mapOrderToCheckoutLog({
                order_code: 'HD-100', order_type: 'ecommerce', created_at: '2026-08-11T03:10:00.000Z',
                order_items: [{ product_name: 'Paracetamol', quantity: 2 }, { product_name: 'Khẩu trang', quantity: 1 }]
            });
            assert.equal(row.orderCode, 'HD-100');
            assert.equal(row.operation, 'xuất TMĐT');
            assert.equal(row.summary, 'Paracetamol x2 + Khẩu trang x1');
            assert.equal(row.source, 'server');
        `);
    });

    test('keeps only unsynced local rows when merging with server truth', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { mergeCheckoutLogs } from './js/features/pos/checkoutLogRules.js';
            const rows = mergeCheckoutLogs(
                [{ orderCode: 'HD-1', createdAt: '2026-08-11T03:00:00.000Z' }],
                [{ orderCode: 'HD-1', status: 'completed' }, { orderCode: 'OFF-1', status: 'offline' }]
            );
            assert.deepEqual(rows.map(row => row.orderCode), ['HD-1', 'OFF-1']);
        `);
    });
});
