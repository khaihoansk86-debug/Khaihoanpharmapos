const { execFileSync } = require('child_process');

describe('POS keyboard rules', () => {
    test('blocks checkout shortcuts while an operation modal is open', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import { isPOSShortcutBlocked } from './js/features/pos/posKeyboardRules.js';

            const documentWith = openIds => ({
                getElementById(id) {
                    if (!openIds.includes(id)) return null;
                    return { classList: { contains: name => name === 'hidden' ? false : false } };
                }
            });

            assert.equal(isPOSShortcutBlocked(documentWith([])), false);
            assert.equal(isPOSShortcutBlocked(documentWith(['posDraftRecoveryModal'])), true);
            assert.equal(isPOSShortcutBlocked(documentWith(['customItemModal'])), true);
            assert.equal(isPOSShortcutBlocked(documentWith(['quickCustomerModal'])), true);
            assert.equal(isPOSShortcutBlocked(documentWith(['variantSelectionModal'])), true);
            assert.equal(isPOSShortcutBlocked(documentWith(['qrPaymentModal'])), true);
            assert.equal(isPOSShortcutBlocked(documentWith(['posActionModal'])), true);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });
});
