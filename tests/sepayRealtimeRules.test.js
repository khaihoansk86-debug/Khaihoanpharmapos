const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

describe('SePay realtime payment confirmation', () => {
    function runRuleCheck(scriptBody) {
        execFileSync('node', ['--input-type=module', '-e', scriptBody], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('only accepts the matching order with a sufficient positive amount', () => {
        runRuleCheck(`
            import assert from 'node:assert/strict';
            import {
                isCurrentSePayRequestAmount,
                isMatchingSePayPayment,
                SEPAY_REALTIME_TABLE
            } from './js/features/payments/sepayRealtimeRules.js';

            assert.equal(SEPAY_REALTIME_TABLE, 'sepay_webhooks');
            assert.equal(isCurrentSePayRequestAmount(125000, '125000'), true);
            assert.equal(isCurrentSePayRequestAmount(125000, 124999), false);
            assert.equal(isCurrentSePayRequestAmount(0, 0), false);
            const base = {
                expectedOrderCode: 'TT1A2B3C',
                expectedAmount: 125000
            };
            assert.equal(isMatchingSePayPayment({
                ...base,
                transaction: { order_code: 'tt1a2b3c', amount: '125000' }
            }), true);
            assert.equal(isMatchingSePayPayment({
                ...base,
                transaction: { order_code: 'TT9Z9Z9Z', amount: 125000 }
            }), false);
            assert.equal(isMatchingSePayPayment({
                ...base,
                transaction: { order_code: 'TT1A2B3C', amount: 124999 }
            }), false);
            assert.equal(isMatchingSePayPayment({
                ...base,
                transaction: { order_code: 'TT1A2B3C', amount: Infinity }
            }), false);
            assert.equal(isMatchingSePayPayment({
                ...base,
                transaction: { order_code: 'TT1A2B3C', amount: -1 }
            }), false);
        `);
    });

    test('POS subscribes to the persisted table and does not log webhook payloads', () => {
        const controller = fs.readFileSync(
            path.join(process.cwd(), 'js/features/pos/posController.js'),
            'utf8'
        );

        expect(controller).toContain('table: SEPAY_REALTIME_TABLE');
        expect(controller).toContain('isMatchingSePayPayment({');
        expect(controller).toContain('currentTab.qrExpectedAmount = amount');
        expect(controller).toContain('isCurrentSePayRequestAmount(amount, currentAmount)');
        expect(controller).toContain('Mã QR cũ đã được hủy');
        expect(controller).not.toContain("table: 'sepay_transactions'");
        expect(controller).not.toContain('SePay Webhook Received:');
    });
});
