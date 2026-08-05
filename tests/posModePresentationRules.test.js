const { execFileSync } = require('child_process');

describe('POS mode presentation rules', () => {
    function runCheck(scriptBody) {
        execFileSync('node', ['--input-type=module', '-e', scriptBody], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('each operation has one unambiguous checkout label', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { getPOSModePresentation } from './js/features/pos/posModePresentationRules.js';

            assert.deepEqual(getPOSModePresentation({}), {
                key: 'normal',
                modeLabel: 'Bán thông thường',
                checkoutHint: 'Bán thông thường (F10)',
                checkoutLabel: 'BÁN THÔNG THƯỜNG',
                checkoutIcon: 'fa-cart-shopping'
            });
            assert.equal(getPOSModePresentation({ isInternal: true }).checkoutLabel, 'XUẤT NỘI BỘ');
            assert.equal(getPOSModePresentation({ isEcommerce: true }).checkoutLabel, 'XUẤT TMĐT');
            assert.equal(getPOSModePresentation({ isDoseCut: true }).checkoutLabel, 'XUẤT THUỐC LIỀU');
        `);
    });

    test('draft summary reports the saved operation and item count before recovery', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { summarizePOSDraft } from './js/features/pos/posModePresentationRules.js';

            const summary = summarizePOSDraft({
                savedAt: '2026-08-05T01:30:00.000Z',
                currentTabId: 'internal-tab',
                tabs: [
                    { id: 'normal-tab', cart: [{ id: 'a' }] },
                    { id: 'internal-tab', isInternal: true, cart: [{ name: 'thử đường' }, { id: 'b' }] }
                ]
            });

            assert.equal(summary.tabCount, 2);
            assert.equal(summary.itemCount, 3);
            assert.equal(summary.activeModeLabel, 'Xuất nội bộ');
            assert.equal(summary.hasData, true);
        `);
    });

    test('conflicting legacy flags resolve to one deterministic operation', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { getPOSModePresentation } from './js/features/pos/posModePresentationRules.js';

            const presentation = getPOSModePresentation({
                isDoseCut: true,
                isInternal: true,
                isEcommerce: true
            });
            assert.equal(presentation.key, 'internal');
            assert.equal(presentation.checkoutLabel, 'XUẤT NỘI BỘ');
        `);
    });

    test('tab labels expose the operation instead of generic invoice numbers', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { getPOSTabPresentation } from './js/features/pos/posModePresentationRules.js';

            assert.equal(getPOSTabPresentation({}, 1).label, 'Bán thường 1');
            assert.equal(getPOSTabPresentation({ isInternal: true }, 2).label, 'Nội bộ 2');
            assert.equal(getPOSTabPresentation({ isEcommerce: true }, 3).label, 'TMĐT 3');
            assert.equal(getPOSTabPresentation({ isDoseCut: true }, 4).label, 'Thuốc liều 4');
        `);
    });
});
