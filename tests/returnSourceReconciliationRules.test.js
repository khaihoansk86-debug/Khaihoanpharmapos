const { execFileSync } = require('child_process');

describe('return source reconciliation rules', () => {
    test('replaces stale draft ids with the fresh server item id before insert', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import { reconcileReturnSourceIds } from './js/features/pos/returnSourceReconciliationRules.js';

            const sourceId = '11111111-1111-4111-8111-111111111111';
            const staleId = 'old-browser-row-id';
            const productId = '22222222-2222-4222-8222-222222222222';
            const [reconciled, newItem] = reconcileReturnSourceIds([
                { sourceOrderItemId: staleId, productId, id: productId, unit: 'Hộp', price: 90000, quantity: 1, originalQuantity: 2 },
                { id: productId, name: 'Hàng đổi mới', unit: 'Hộp', price: 100000, quantity: 1 }
            ], [{
                id: sourceId, product_id: productId, product_name: 'Thuốc gốc',
                product_code: 'SP001', unit_name: 'Hộp', unit_price: 100000,
                quantity: 2, line_type: 'standard'
            }]);

            assert.equal(reconciled.sourceOrderItemId, sourceId);
            assert.equal(newItem.sourceOrderItemId, undefined);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('never maps a combo component or an unresolved line as a return source', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import { reconcileReturnSourceIds } from './js/features/pos/returnSourceReconciliationRules.js';

            const [component, missing] = reconcileReturnSourceIds([
                { sourceOrderItemId: 'stale-component', productId: 'p1', id: 'p1', unit: 'Cái', price: 0, quantity: 1, originalQuantity: 1 },
                { sourceOrderItemId: 'stale-missing', productId: 'p2', id: 'p2', unit: 'Cái', price: 10, quantity: 1, originalQuantity: 1 }
            ], [{
                id: 'component-id', product_id: 'p1', unit_name: 'Cái', unit_price: 0,
                quantity: 1, line_type: 'combo_component'
            }]);

            assert.equal(component.sourceOrderItemId, null);
            assert.equal(missing.sourceOrderItemId, null);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });
});
