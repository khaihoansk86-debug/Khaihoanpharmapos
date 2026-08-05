const { execFileSync } = require('child_process');

describe('POS checkout resilience rules', () => {
    function runCheck(scriptBody) {
        execFileSync('node', ['--input-type=module', '-e', scriptBody], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('starts post-checkout work without blocking the success path and contains task failures', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { startPostCheckoutTasks } from './js/features/pos/checkoutResilienceRules.js';

            const events = [];
            let release;
            const gate = new Promise(resolve => { release = resolve; });
            const job = startPostCheckoutTasks([
                { name: 'clean-batches', run: async () => { events.push('clean-start'); await gate; events.push('clean-done'); } },
                { name: 'shift-reconcile', run: async () => { events.push('reconcile'); throw new Error('shift unavailable'); } }
            ], {
                onTaskError: ({ name }) => events.push('error:' + name)
            });

            events.push('success-visible');
            await Promise.resolve();
            assert.deepEqual(events, ['success-visible', 'clean-start']);

            release();
            const report = await job.completion;
            assert.deepEqual(events, [
                'success-visible',
                'clean-start',
                'clean-done',
                'reconcile',
                'error:shift-reconcile'
            ]);
            assert.equal(report.ok, false);
            assert.deepEqual(report.failedTasks, ['shift-reconcile']);
        `);
    });

    test('persists a reload-safe draft without runtime subscriptions and restores the active tab', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import {
                createReloadSafeDraft,
                restoreReloadSafeDraft
            } from './js/features/pos/checkoutResilienceRules.js';

            const draft = createReloadSafeDraft({
                tabs: [
                    { id: 'tab-a', cart: [{ id: 'p1', quantity: 2 }], qrRealtimeSubscription: { unsubscribe() {} } },
                    { id: 'tab-b', cart: [{ id: 'p2', quantity: 1 }], customerValue: 'Lan' }
                ],
                currentTabId: 'tab-b'
            });

            assert.equal(draft.tabs[0].qrRealtimeSubscription, null);
            const restored = restoreReloadSafeDraft(JSON.stringify(draft));
            assert.equal(restored.currentTabId, 'tab-b');
            assert.equal(restored.activeTab.customerValue, 'Lan');
            assert.equal(restored.tabs[0].cart[0].quantity, 2);
            assert.equal(restored.savedAt, draft.savedAt);
        `);
    });

    test('restores drafts only for the same employee and device within 24 hours', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { createReloadSafeDraft, restoreReloadSafeDraft } from './js/features/pos/checkoutResilienceRules.js';

            const now = new Date('2026-08-05T10:00:00.000Z');
            const draft = createReloadSafeDraft({
                tabs: [{ id: 'tab-a', cart: [{ id: 'p1' }] }],
                currentTabId: 'tab-a',
                ownerEmployeeId: 'employee-a',
                deviceKey: 'device-a',
                now
            });
            const options = {
                employeeId: 'employee-a',
                deviceKey: 'device-a',
                now: new Date('2026-08-06T09:59:00.000Z')
            };

            assert.ok(restoreReloadSafeDraft(draft, options));
            assert.equal(restoreReloadSafeDraft(draft, { ...options, employeeId: 'employee-b' }), null);
            assert.equal(restoreReloadSafeDraft(draft, { ...options, deviceKey: 'device-b' }), null);
            assert.equal(restoreReloadSafeDraft(draft, {
                ...options,
                now: new Date('2026-08-06T10:01:00.000Z')
            }), null);
            assert.equal(restoreReloadSafeDraft({ ...draft, ownerEmployeeId: null }, options), null);
        `);
    });

    test('does not queue the same offline order twice after retry or reload', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { upsertOfflineOrder } from './js/features/pos/checkoutResilienceRules.js';

            const original = {
                id: 'OFF-1',
                type: 'sale',
                orderData: { orderCode: 'HD202607240001', total: 50000 },
                cartItems: [{ id: 'p1', quantity: 1 }],
                timestamp: '2026-07-24T08:00:00.000Z'
            };
            const retried = {
                ...original,
                id: 'OFF-2',
                timestamp: '2026-07-24T08:00:03.000Z'
            };

            const result = upsertOfflineOrder([original], retried);
            assert.equal(result.length, 1);
            assert.equal(result[0].id, 'OFF-1');
            assert.equal(result[0].orderData.orderCode, 'HD202607240001');
        `);
    });

    test('treats corrupted or invalid offline storage as an empty queue', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import {
                parseOfflineOrders,
                restoreReloadSafeDraft
            } from './js/features/pos/checkoutResilienceRules.js';

            assert.deepEqual(parseOfflineOrders('{broken-json'), []);
            assert.deepEqual(parseOfflineOrders('{"not":"an array"}'), []);
            assert.deepEqual(parseOfflineOrders('[null,{"id":"OFF-1"},42]'), [{ id: 'OFF-1' }]);
            assert.equal(restoreReloadSafeDraft('{broken-json'), null);
        `);
    });

    test('classifies browser fetch failures as recoverable network errors', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { isRecoverableNetworkError } from './js/features/pos/checkoutResilienceRules.js';

            assert.equal(isRecoverableNetworkError(new Error('Failed to fetch')), true);
            assert.equal(isRecoverableNetworkError(new TypeError('NetworkError when attempting to fetch resource.')), true);
            assert.equal(isRecoverableNetworkError(new Error('duplicate key value violates unique constraint')), false);
        `);
    });

    test('reuses the same order code after F5 only when the cart is unchanged', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import {
                createCartFingerprint,
                getReusableOrderCode
            } from './js/features/pos/checkoutResilienceRules.js';

            const originalCart = [
                { id: 'p1', batchId: 'b1', quantity: 2, price: 10000 },
                { id: 'p2', batchId: 'b2', quantity: 1, price: 5000 }
            ];
            const fingerprint = createCartFingerprint(originalCart);
            const pending = { orderCode: 'HD202607240123', cartFingerprint: fingerprint };

            assert.equal(getReusableOrderCode(pending, originalCart), 'HD202607240123');
            assert.equal(getReusableOrderCode(pending, [
                { id: 'p1', batchId: 'b1', quantity: 3, price: 10000 },
                { id: 'p2', batchId: 'b2', quantity: 1, price: 5000 }
            ]), null);
        `);
    });

    test('never reports an offline sale as successful when local storage is full', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { completeOfflineCheckout } from './js/features/pos/checkoutResilienceRules.js';

            const events = [];
            await assert.rejects(() => completeOfflineCheckout({
                save: () => { throw new Error('QuotaExceededError'); },
                onSaved: () => events.push('success')
            }), /QuotaExceededError/);
            assert.deepEqual(events, []);

            await completeOfflineCheckout({
                save: () => events.push('saved'),
                onSaved: () => events.push('success')
            });
            assert.deepEqual(events, ['saved', 'success']);
        `);
    });
});
