const { execFileSync } = require('child_process');

describe('customer history display rules', () => {
    test('normalizes sale, combo, return, and legacy snapshots', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import { getCustomerHistoryDisplayItems } from './js/features/customers/customerHistoryRules.js';

            const ordered = getCustomerHistoryDisplayItems([
                { product_name: 'Vitamin C', product_code: 'VC', unit_name: 'Hộp', quantity: 2, sort_index: 200 },
                { product_name: 'Paracetamol', product_code: 'PARA', unit_name: 'Viên', quantity: 10, sort_index: 100 }
            ]);
            assert.deepEqual(ordered, [
                { name: 'Paracetamol', code: 'PARA', unit: 'Viên', quantity: 10, isReturn: false },
                { name: 'Vitamin C', code: 'VC', unit: 'Hộp', quantity: 2, isReturn: false }
            ]);

            const combo = getCustomerHistoryDisplayItems([
                { product_name: 'Combo cảm cúm', quantity: 1, line_type: 'combo_parent', sort_index: 100 },
                { product_name: 'Paracetamol', quantity: 2, line_type: 'combo_component', sort_index: 110 },
                { product_name: 'Vitamin C', quantity: 1, line_type: 'combo_component', sort_index: 120 }
            ]);
            assert.equal(combo.length, 1);
            assert.equal(combo[0].name, 'Combo cảm cúm');

            const returned = getCustomerHistoryDisplayItems([
                { product_id: null, product_name: 'Sản phẩm cũ', quantity: -3, unit_name: 'Viên' }
            ]);
            assert.deepEqual(returned[0], {
                name: 'Sản phẩm cũ',
                code: '',
                unit: 'Viên',
                quantity: -3,
                isReturn: true
            });

            assert.deepEqual(getCustomerHistoryDisplayItems(null), []);
            assert.deepEqual(getCustomerHistoryDisplayItems([null, { quantity: 'không hợp lệ' }]), [
                { name: 'Mặt hàng chưa có tên', code: '', unit: '', quantity: 0, isReturn: false }
            ]);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });
});
