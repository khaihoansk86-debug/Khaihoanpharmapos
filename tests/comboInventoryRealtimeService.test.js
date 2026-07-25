const { execFileSync } = require('child_process');

describe('combo inventory realtime service', () => {
    function runCheck(scriptBody) {
        execFileSync('node', ['--input-type=module', '-e', scriptBody], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('debounces batch changes and releases the realtime channel', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { startProductBatchRealtimeSync } from './js/features/pos/comboInventoryRealtimeService.js';

            let changeHandler = null;
            let removedChannel = null;
            const channel = {
                on(type, filter, handler) {
                    assert.equal(type, 'postgres_changes');
                    assert.equal(filter.table, 'product_batches');
                    changeHandler = handler;
                    return this;
                },
                subscribe() {
                    return this;
                }
            };
            const client = {
                channel() {
                    return channel;
                },
                removeChannel(value) {
                    removedChannel = value;
                }
            };
            let syncCount = 0;
            const stop = startProductBatchRealtimeSync({
                client,
                debounceMs: 10,
                onInventoryChange: async () => {
                    syncCount += 1;
                }
            });

            changeHandler({ new: { id: 'batch-1', stock_quantity: 10 } });
            changeHandler({ new: { id: 'batch-1', stock_quantity: 9 } });
            await new Promise(resolve => setTimeout(resolve, 30));
            assert.equal(syncCount, 1);

            stop();
            assert.equal(removedChannel, channel);
        `);
    });
});
