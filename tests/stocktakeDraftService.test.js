const { execFileSync } = require('child_process');

function runModuleCheck(source) {
    execFileSync('node', ['--input-type=module', '-e', source], {
        cwd: process.cwd(),
        stdio: 'pipe'
    });
}

describe('stocktake draft service', () => {
    test('upserts only the authenticated user draft through the public service', () => {
        runModuleCheck(`
            import assert from 'node:assert/strict';
            import { saveRemoteStocktakeDraft } from './js/features/stocktake/stocktakeDraftService.js';
            const calls = [];
            const client = {
                auth: { getSession: async () => ({ data: { session: { user: { id: 'user-1' } } }, error: null }) },
                from(table) {
                    calls.push(['from', table]);
                    return { upsert(payload, options) { calls.push(['upsert', payload, options]); return Promise.resolve({ error: null }); } };
                }
            };
            const result = await saveRemoteStocktakeDraft({ timestamp: 100, lines: [] }, client);
            assert.equal(result.synced, true);
            assert.equal(calls[0][1], 'stocktake_drafts');
            assert.equal(calls[1][1].user_id, 'user-1');
            assert.equal(calls[1][1].draft_key, 'default');
            assert.equal(calls[1][2].onConflict, 'user_id,draft_key');
        `);
    });

    test('does not write a remote draft without an authenticated session', () => {
        runModuleCheck(`
            import assert from 'node:assert/strict';
            import { saveRemoteStocktakeDraft } from './js/features/stocktake/stocktakeDraftService.js';
            let touched = false;
            const client = {
                auth: { getSession: async () => ({ data: { session: null }, error: null }) },
                from() { touched = true; }
            };
            const result = await saveRemoteStocktakeDraft({ timestamp: 100, lines: [] }, client);
            assert.deepEqual(result, { synced: false, reason: 'unauthenticated' });
            assert.equal(touched, false);
        `);
    });

    test('loads the user-scoped remote draft through the service interface', () => {
        runModuleCheck(`
            import assert from 'node:assert/strict';
            import { loadRemoteStocktakeDraft } from './js/features/stocktake/stocktakeDraftService.js';
            const calls = [];
            const draft = { timestamp: 123, lines: [] };
            const client = {
                auth: { getSession: async () => ({ data: { session: { user: { id: 'user-2' } } }, error: null }) },
                from(table) {
                    calls.push(['from', table]);
                    return { select() { return { eq(column, value) { calls.push(['eq', column, value]); return { eq(column2, value2) { calls.push(['eq', column2, value2]); return { maybeSingle: async () => ({ data: { payload: draft }, error: null }) }; } }; } }; } };
                }
            };
            assert.deepEqual(await loadRemoteStocktakeDraft(client), draft);
            assert.ok(calls.some(call => call[0] === 'eq' && call[1] === 'user_id' && call[2] === 'user-2'));
            assert.ok(calls.some(call => call[0] === 'eq' && call[1] === 'draft_key' && call[2] === 'default'));
        `);
    });

    test('keeps the newest local draft available when remote loading fails', () => {
        runModuleCheck(`
            import assert from 'node:assert/strict';
            const values = new Map();
            globalThis.localStorage = {
                getItem: key => values.get(key) || null,
                setItem: (key, value) => values.set(key, value),
                removeItem: key => values.delete(key)
            };
            const draft = { timestamp: 999, lines: [{ productId: 'p1', batches: [] }] };
            localStorage.setItem('khaihoan_stocktake_draft', JSON.stringify(draft));
            const { loadNewestStocktakeDraft } = await import('./js/features/stocktake/stocktakeDraftService.js');
            const client = { auth: { getSession: async () => ({ data: null, error: new Error('offline') }) } };
            assert.deepEqual(await loadNewestStocktakeDraft(client), draft);
        `);
    });
});
