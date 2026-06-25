const { execFileSync } = require('child_process');

describe('return and exchange settlement rules', () => {
    test('distinguishes collect, refund, and even exchange', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import { getReturnSettlement } from './js/features/pos/returnSettlementRules.js';

            assert.deepEqual(getReturnSettlement(25000), { type: 'collect', amount: 25000 });
            assert.deepEqual(getReturnSettlement(-15000), { type: 'refund', amount: 15000 });
            assert.deepEqual(getReturnSettlement(0), { type: 'even', amount: 0 });
        `], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    });
});
