const { execFileSync } = require('child_process');

function runModuleCheck(source) {
    execFileSync('node', ['--input-type=module', '-e', source], {
        cwd: process.cwd(),
        stdio: 'pipe'
    });
}

describe('stocktake session rules', () => {
    test('tracks pending, matched and discrepancy batches independently from stock values', () => {
        runModuleCheck(`
            import assert from 'node:assert/strict';
            import { summarizeStocktake, getBatchVerificationState } from './js/features/stocktake/stocktakeSessionRules.js';

            const products = [{ batches: [
                { systemQuantity: 10, countedQuantity: 10, deltaValue: 0, isVerified: false },
                { systemQuantity: 5, countedQuantity: 5, deltaValue: 0, isVerified: true },
                { systemQuantity: 8, countedQuantity: 6, deltaValue: -2000, isVerified: true }
            ] }];
            assert.equal(getBatchVerificationState(products[0].batches[0]), 'pending');
            assert.equal(getBatchVerificationState(products[0].batches[1]), 'matched');
            assert.equal(getBatchVerificationState(products[0].batches[2]), 'discrepancy');
            assert.deepEqual(summarizeStocktake(products), {
                total: 3, verified: 2, pending: 1, matched: 1, discrepancy: 1,
                lossValue: 2000, gainValue: 0, percent: 67
            });
        `);
    });

    test('drafts preserve metadata, verification, new batches and cost', () => {
        runModuleCheck(`
            import assert from 'node:assert/strict';
            import { buildStocktakeDraft, applyStocktakeDraft } from './js/features/stocktake/stocktakeSessionRules.js';

            const draft = buildStocktakeDraft({
                docCode: 'PKK-01', auditDate: '2026-08-04', reason: 'correction', note: 'Kiểm lại', timestamp: 123,
                groupedProducts: [{ productId: 'p1', batches: [{
                    batchId: 'new-1', batchNumber: 'L-MOI', originalBatchNumber: '', expiryDate: '2027-01-01',
                    countedQuantity: 7, costPrice: 1200, isNewBatch: true, isVerified: true
                }] }],
                activityLogs: [{ message: 'saved' }]
            });
            assert.equal(draft.version, 2);
            assert.equal(draft.note, 'Kiểm lại');
            assert.equal(draft.lines[0].batches[0].costPrice, 1200);
            assert.equal(draft.lines[0].batches[0].isVerified, true);

            const products = [{ productId: 'p1', batches: [] }];
            applyStocktakeDraft(products, draft);
            assert.equal(products[0].batches.length, 1);
            assert.equal(products[0].batches[0].countedQuantity, 7);
            assert.equal(products[0].batches[0].deltaValue, 8400);
            assert.equal(products[0].batches[0].isVerified, true);
        `);
    });

    test('chooses the newest valid draft and blocks pending completion unless explicitly confirmed', () => {
        runModuleCheck(`
            import assert from 'node:assert/strict';
            import { chooseNewestStocktakeDraft, canCompleteStocktake } from './js/features/stocktake/stocktakeSessionRules.js';
            const oldDraft = { timestamp: 10, lines: [] };
            const newDraft = { timestamp: 20, lines: [] };
            assert.equal(chooseNewestStocktakeDraft(oldDraft, null, newDraft), newDraft);

            const products = [{ batches: [{ systemQuantity: 4, countedQuantity: 4, isVerified: false }] }];
            assert.equal(canCompleteStocktake(products).allowed, false);
            assert.equal(canCompleteStocktake(products).requiresPendingConfirmation, true);
            assert.equal(canCompleteStocktake(products, true).allowed, true);
        `);
    });

    test('ignores a blank new-batch placeholder in progress', () => {
        runModuleCheck(`
            import assert from 'node:assert/strict';
            import { summarizeStocktake } from './js/features/stocktake/stocktakeSessionRules.js';
            const summary = summarizeStocktake([{ batches: [{
                isNewBatch: true, batchNumber: '', countedQuantity: 0, systemQuantity: 0, isVerified: false
            }] }]);
            assert.equal(summary.total, 0);
            assert.equal(summary.percent, 0);
        `);
    });
});
