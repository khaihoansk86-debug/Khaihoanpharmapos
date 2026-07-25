const { execFileSync } = require('child_process');

describe('combo catalog service', () => {
    function runCheck(scriptBody) {
        execFileSync('node', ['--input-type=module', '-e', scriptBody], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('saves combo product and unit through one atomic RPC call', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { saveComboCatalogAtomic } from './js/features/products/comboCatalogService.js';

            let captured = null;
            const client = {
                async rpc(name, payload) {
                    captured = { name, payload };
                    return { data: 'combo-id', error: null };
                }
            };
            const id = await saveComboCatalogAtomic({
                id: null,
                name: 'Combo A',
                code: 'CB001',
                categoryId: '11111111-1111-4111-8111-111111111111',
                price: 50000,
                items: [{
                    id: '22222222-2222-4222-8222-222222222222',
                    name: 'Thuốc A',
                    unit: 'Viên',
                    quantity: 2
                }]
            }, client);

            assert.equal(id, 'combo-id');
            assert.equal(captured.name, 'save_combo_catalog_atomic');
            assert.equal(captured.payload.p_code, 'CB001');
            assert.equal(captured.payload.p_price, 50000);
            assert.equal(captured.payload.p_description.isCombo, true);
            assert.equal(captured.payload.p_description.items.length, 1);
        `);
    });

    test('rejects invalid combo input before calling the database', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { saveComboCatalogAtomic } from './js/features/products/comboCatalogService.js';

            let calls = 0;
            const client = { rpc: async () => { calls += 1; } };
            await assert.rejects(() => saveComboCatalogAtomic({
                name: '',
                code: 'CB001',
                categoryId: null,
                price: -1,
                items: []
            }, client), /không hợp lệ/);
            assert.equal(calls, 0);
        `);
    });
});
