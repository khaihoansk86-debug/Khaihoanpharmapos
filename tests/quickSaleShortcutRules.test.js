const { execFileSync } = require('child_process');

describe('quick sale shortcut rules', () => {
    test('assigns one key to one quick-sale target without collisions', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                assignQuickSaleShortcut,
                findQuickSaleKey,
                normalizeQuickSaleKey
            } from './js/features/pos/quickSaleShortcutRules.js';

            let bindings = assignQuickSaleShortcut({}, 'dose:12000', 'f2');
            assert.deepEqual(bindings, { F2: 'dose:12000' });
            assert.equal(findQuickSaleKey(bindings, 'dose:12000'), 'F2');

            bindings = assignQuickSaleShortcut(bindings, 'product:p1', 'F2');
            assert.deepEqual(bindings, { F2: 'product:p1' });

            bindings = assignQuickSaleShortcut(bindings, 'product:p1', 'F3');
            assert.deepEqual(bindings, { F3: 'product:p1' });
            assert.equal(normalizeQuickSaleKey('F8'), '');
            assert.equal(normalizeQuickSaleKey('F10'), '');
        `], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    });
});
