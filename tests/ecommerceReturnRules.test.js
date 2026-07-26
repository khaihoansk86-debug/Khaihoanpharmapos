const { execFileSync } = require('child_process');

describe('ecommerce return rules', () => {
    function runRuleCheck(scriptBody) {
        execFileSync('node', ['--input-type=module', '-e', scriptBody], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('builds a server-authoritative return payload and merges duplicate lines', () => {
        runRuleCheck(`
            import assert from 'node:assert/strict';
            import { buildEcommerceReturnPayload } from './js/features/pos/ecommerceReturnRules.js';

            const payload = buildEcommerceReturnPayload({
                platform: 'Shopee',
                trackingCode: '  SPX VN-001  ',
                receivedAt: '2026-07-25T09:30:00.000Z',
                note: 'Hàng còn nguyên',
                createdBy: 'Nhân viên A',
                items: [
                    { productId: 'product-1', batchId: 'batch-1', unitName: 'Hộp', quantity: 1, costPrice: 999999, conversionRate: 999 },
                    { productId: 'product-1', batchId: 'batch-1', unitName: 'Hộp', quantity: 2 }
                ]
            });

            assert.deepEqual(payload.returnData, {
                ecommerce_platform: 'Shopee',
                tracking_code: 'SPX VN-001',
                tracking_code_normalized: 'SPXVN001',
                received_at: '2026-07-25T09:30:00.000Z',
                note: 'Hàng còn nguyên',
                created_by_name: 'Nhân viên A'
            });
            assert.deepEqual(payload.items, [{
                product_id: 'product-1',
                batch_id: 'batch-1',
                unit_name: 'Hộp',
                quantity: 3
            }]);
            assert.equal('cost_price' in payload.items[0], false);
            assert.equal('conversion_rate' in payload.items[0], false);
        `);
    });

    test('rejects a missing tracking code and invalid return quantities', () => {
        runRuleCheck(`
            import assert from 'node:assert/strict';
            import { buildEcommerceReturnPayload } from './js/features/pos/ecommerceReturnRules.js';

            assert.throws(() => buildEcommerceReturnPayload({
                platform: 'Shopee',
                trackingCode: ' ',
                items: [{ productId: 'p1', batchId: 'b1', unitName: 'Viên', quantity: 1 }]
            }), /mã vận đơn/i);

            assert.throws(() => buildEcommerceReturnPayload({
                platform: 'Shopee',
                trackingCode: 'SPX001',
                items: [{ productId: 'p1', batchId: 'b1', unitName: 'Viên', quantity: 0 }]
            }), /số lượng/i);
        `);
    });
});
