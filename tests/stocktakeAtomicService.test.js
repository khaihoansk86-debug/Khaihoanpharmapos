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

    test('safely normalizes new batch lines with client generated new_ ids to null batch_id', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { buildAtomicStocktakePayload } from './js/features/stocktake/stocktakeAtomicRules.js';

            const payload = buildAtomicStocktakePayload({
                note: 'Thêm lô mới',
                reason: 'stocktake',
                lines: [{
                    productId: '11111111-1111-4111-8111-111111111111',
                    productName: 'Sản phẩm A',
                    productCode: 'SPA',
                    batchId: 'new_xyz123456',
                    batchNumber: 'L09',
                    expiryDate: '2027-06-01',
                    countedQuantity: 5,
                    costPrice: 2000,
                    isNewBatch: true
                }]
            });

            assert.equal(payload.p_lines[0].batch_id, null);
            assert.equal(payload.p_lines[0].is_new_batch, true);
            assert.equal(payload.p_lines[0].batch_number, 'L09');
            assert.equal(payload.p_lines[0].counted_quantity, 5);
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

    test('allows completing a stocktake when every counted batch matches system stock', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { buildStocktakeCompletionLines } from './js/features/stocktake/stocktakeCompletionRules.js';

            const lines = buildStocktakeCompletionLines([{
                productId: '11111111-1111-4111-8111-111111111111',
                productName: 'Product A',
                productCode: 'SPA',
                baseUnit: 'Box',
                batches: [{
                    batchId: '22222222-2222-4222-8222-222222222222',
                    batchNumber: 'L01',
                    originalBatchNumber: 'L01',
                    expiryDate: '2027-01-01',
                    systemQuantity: 12,
                    countedQuantity: 12,
                    costPrice: 1500,
                    delta: 0,
                    deltaValue: 0,
                    isNewBatch: false,
                    isVerified: true
                }, {
                    batchId: '33333333-3333-4333-8333-333333333333',
                    batchNumber: 'L02',
                    originalBatchNumber: 'L02',
                    expiryDate: '2027-01-01',
                    systemQuantity: 50,
                    countedQuantity: 50,
                    costPrice: 1000,
                    delta: 0,
                    deltaValue: 0,
                    isNewBatch: false,
                    isVerified: false
                }]
            }]);

            assert.equal(lines.length, 1);
            assert.equal(lines[0].batchId, '22222222-2222-4222-8222-222222222222');
            assert.equal(lines[0].countedQuantity, 12);
            assert.equal(lines[0].delta, 0);
        `);
    });

    test('stocktake controller submits completion lines instead of blocking matched stock', () => {
        const controller = fs.readFileSync(
            path.join(process.cwd(), 'js/features/stocktake/stocktakeController.js'),
            'utf8'
        );

        expect(controller).toMatch(/import \{ buildStocktakeCompletionLines \}/);
        expect(controller).toMatch(
            /const linesToAdjust = buildStocktakeCompletionLines\(groupedProducts\)/
        );
        expect(controller).not.toMatch(/Tất cả lô hàng đều khớp[^\n]+không cần cân bằng kho/);
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
