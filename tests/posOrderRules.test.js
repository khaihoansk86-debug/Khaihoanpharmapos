const { execFileSync } = require('child_process');

describe('POS order rules', () => {
    function runOrderRulesCheck(scriptBody) {
        execFileSync('node', ['--input-type=module', '-e', scriptBody], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('retail sale and dose cut orders sync to employee shifts', () => {
        runOrderRulesCheck(`
            import assert from 'node:assert/strict';
            import { createOrderContext, getOrderRules } from './js/features/pos/orderRules.js';
            assert.equal(getOrderRules(createOrderContext({})).shouldSyncShift, true);
            assert.equal(getOrderRules(createOrderContext({ isDoseCut: true })).shouldSyncShift, true);
        `);
    });

    test('ecommerce, internal, return, and edit orders never sync to employee shifts', () => {
        runOrderRulesCheck(`
            import assert from 'node:assert/strict';
            import { createOrderContext, getOrderRules } from './js/features/pos/orderRules.js';
            assert.equal(getOrderRules(createOrderContext({ isEcommerce: true })).shouldSyncShift, false);
            assert.equal(getOrderRules(createOrderContext({ isInternal: true })).shouldSyncShift, false);
            assert.equal(getOrderRules(createOrderContext({ isReturn: true })).shouldSyncShift, false);
            assert.equal(getOrderRules(createOrderContext({ isEdit: true })).shouldSyncShift, false);
        `);
    });
});
