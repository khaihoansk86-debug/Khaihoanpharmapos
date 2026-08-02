const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

describe('atomic stocktake documents', () => {
    function runCheck(body) {
        execFileSync('node', ['--input-type=module', '-e', body], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('normalizes stocktake lines for the database RPC', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { buildAtomicStocktakePayload } from './js/features/stocktake/stocktakeAtomicRules.js';

            const payload = buildAtomicStocktakePayload({
                note: ' Kiểm cuối ngày ',
                reason: 'stocktake',
                lines: [{
                    productId: '11111111-1111-4111-8111-111111111111',
                    productName: 'Sản phẩm A',
                    productCode: 'SPA',
                    batchId: '22222222-2222-4222-8222-222222222222',
                    batchNumber: ' L01 ',
                    expiryDate: '2027-01-01',
                    countedQuantity: 12,
                    costPrice: 1500,
                    isRenamed: true
                }]
            });

            assert.equal(payload.p_note, 'Kiểm cuối ngày');
            assert.equal(payload.p_reason, 'stocktake');
            assert.deepEqual(payload.p_lines, [{
                product_id: '11111111-1111-4111-8111-111111111111',
                product_name: 'Sản phẩm A',
                product_code: 'SPA',
                batch_id: '22222222-2222-4222-8222-222222222222',
                batch_number: 'L01',
                expiry_date: '2027-01-01',
                counted_quantity: 12,
                cost_price: 1500,
                is_new_batch: false,
                is_renamed: true
            }]);
        `);
    });

    test('rejects empty, negative, or incomplete stocktake input before writing', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { buildAtomicStocktakePayload } from './js/features/stocktake/stocktakeAtomicRules.js';

            assert.throws(() => buildAtomicStocktakePayload({ lines: [] }), /ít nhất một dòng/i);
            assert.throws(() => buildAtomicStocktakePayload({
                lines: [{ productId: 'p1', batchId: 'b1', countedQuantity: -1 }]
            }), /số lượng thực đếm/i);
            assert.throws(() => buildAtomicStocktakePayload({
                lines: [{ productId: '', batchId: 'b1', countedQuantity: 1 }]
            }), /hàng hóa/i);
        `);
    });

    test('migration applies header, lines, movements, and stock in one transaction', () => {
        const migration = fs.readFileSync(
            path.join(process.cwd(), 'supabase/migrations/082_apply_stocktake_document_atomic.sql'),
            'utf8'
        );

        expect(migration).toMatch(/CREATE OR REPLACE FUNCTION public\.apply_stocktake_document_atomic/i);
        expect(migration).toMatch(/INSERT INTO public\.inventory_documents/i);
        expect(migration).toMatch(/INSERT INTO public\.inventory_document_items/i);
        expect(migration).toMatch(/INSERT INTO public\.inventory_movements/i);
        expect(migration).toMatch(/UPDATE public\.product_batches/i);
        expect(migration).toMatch(/auth\.uid\(\) IS NULL/i);
        expect(migration).toMatch(/REVOKE ALL ON FUNCTION[\s\S]*FROM PUBLIC, anon/i);
        expect(migration).toMatch(/GRANT EXECUTE ON FUNCTION[\s\S]*TO authenticated, service_role/i);
    });
});
