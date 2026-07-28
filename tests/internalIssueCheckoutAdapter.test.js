const { execFileSync } = require('child_process');

describe('internal issue checkout adapter', () => {
    function runCheck(body) {
        execFileSync('node', ['--input-type=module', '-e', body], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('normalizes selected-unit cost to base-unit cost without mutating stock conversion', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { normalizeInternalIssueCheckoutItems } from './js/features/pos/internalIssueCheckoutAdapter.js';

            const acuroff = {
                id: 'acuroff',
                unit: 'Hộp',
                quantity: 2,
                conversionRate: 10,
                price: 35000,
                costPrice: 35000,
                batchId: 'batch-acuroff',
                batches: [{ id: 'batch-acuroff', cost_price: 0 }]
            };
            const hoXanh = {
                id: 'ho-xanh',
                unit: 'Hộp',
                quantity: 1,
                conversionRate: 100,
                price: 35000,
                costPrice: 35000,
                batchId: 'batch-ho-xanh',
                batches: [{ id: 'batch-ho-xanh', cost_price: 0 }]
            };

            const result = normalizeInternalIssueCheckoutItems(
                { isInternal: true },
                [acuroff, hoXanh]
            );

            assert.equal(result[0].costPrice, 3500);
            assert.equal(result[0].quantity, 2);
            assert.equal(result[0].conversionRate, 10);
            assert.equal(result[0].price, 35000);
            assert.equal(result[1].costPrice, 350);
            assert.equal(result[1].quantity, 1);
            assert.equal(result[1].conversionRate, 100);
            assert.equal(result[1].price, 35000);
            assert.notEqual(result[0], acuroff);
            assert.equal(acuroff.costPrice, 35000);
        `);
    });

    test('reproduced Acuroff and Ho Xanh issue trails now retain the correct total cost', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { normalizeInternalIssueCheckoutItems } from './js/features/pos/internalIssueCheckoutAdapter.js';
            import { buildInventoryIssueLine } from './js/features/pos/inventoryIssueRules.js';

            const cases = [
                {
                    name: 'Acuroff',
                    quantity: 2,
                    conversionRate: 10,
                    costPrice: 35000,
                    expectedBaseQuantity: 20,
                    expectedBaseCost: 3500,
                    expectedTotalCost: 70000
                },
                {
                    name: 'Ho Xanh',
                    quantity: 1,
                    conversionRate: 100,
                    costPrice: 35000,
                    expectedBaseQuantity: 100,
                    expectedBaseCost: 350,
                    expectedTotalCost: 35000
                }
            ];

            for (const testCase of cases) {
                const [adapted] = normalizeInternalIssueCheckoutItems(
                    { isInternal: true },
                    [{
                        ...testCase,
                        batchId: testCase.name,
                        batches: [{ id: testCase.name, cost_price: 0 }]
                    }]
                );
                const trackedAllocation = {
                    ...adapted,
                    quantity: testCase.quantity * testCase.conversionRate,
                    conversionRate: 1
                };
                const line = buildInventoryIssueLine(trackedAllocation, 'staff');

                assert.equal(line.quantity, testCase.expectedBaseQuantity);
                assert.equal(line.costPrice, testCase.expectedBaseCost);
                assert.equal(line.quantity * line.costPrice, testCase.expectedTotalCost);
            }
        `);
    });

    test('a positive batch cost remains authoritative after normalization', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { normalizeInternalIssueCheckoutItems } from './js/features/pos/internalIssueCheckoutAdapter.js';
            import { buildInventoryIssueLine } from './js/features/pos/inventoryIssueRules.js';

            const [adapted] = normalizeInternalIssueCheckoutItems(
                { isInternal: true },
                [{
                    name: 'Acuroff',
                    quantity: 2,
                    conversionRate: 10,
                    costPrice: 35000,
                    batchId: 'recorded-cost',
                    batches: [{ id: 'recorded-cost', cost_price: 3600 }]
                }]
            );
            const line = buildInventoryIssueLine({
                ...adapted,
                quantity: 20,
                conversionRate: 1
            });

            assert.equal(adapted.costPrice, 3500);
            assert.equal(line.costPrice, 3600);
            assert.equal(line.quantity * line.costPrice, 72000);
        `);
    });

    test('leaves base units and every non-internal checkout unchanged', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { normalizeInternalIssueCheckoutItems } from './js/features/pos/internalIssueCheckoutAdapter.js';

            const baseUnit = {
                id: 'base-unit',
                unit: 'Viên',
                quantity: 20,
                conversionRate: 1,
                price: 3500,
                costPrice: 3500
            };
            const retailBox = {
                id: 'retail-box',
                unit: 'Hộp',
                quantity: 2,
                conversionRate: 10,
                price: 60000,
                costPrice: 35000
            };

            const internal = normalizeInternalIssueCheckoutItems(
                { isInternal: true },
                [baseUnit]
            );
            const retail = normalizeInternalIssueCheckoutItems({}, [retailBox]);
            const ecommerce = normalizeInternalIssueCheckoutItems(
                { isEcommerce: true },
                [retailBox]
            );

            assert.equal(internal[0], baseUnit);
            assert.equal(retail[0], retailBox);
            assert.equal(ecommerce[0], retailBox);
        `);
    });

    test('fast checkout passes normalized costs only to the internal fallback', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { createOrderWithAtomicFastPath } from './js/features/pos/fastCheckoutService.js';

            const item = {
                id: '11111111-1111-4111-8111-111111111111',
                batchId: '33333333-3333-4333-8333-333333333333',
                name: 'Acuroff',
                unit: 'Hộp',
                quantity: 2,
                conversionRate: 10,
                price: 35000,
                costPrice: 35000,
                batches: [{
                    id: '33333333-3333-4333-8333-333333333333',
                    cost_price: 0,
                    stock_quantity: 100
                }]
            };

            let fallbackItems = null;
            await createOrderWithAtomicFastPath(
                { isInternal: true, orderCode: 'PXNB-TEST', total: 70000 },
                [item],
                {
                    client: { rpc: async () => { throw new Error('RPC must not run'); } },
                    fallback: async (_order, items) => {
                        fallbackItems = items;
                        return { id: 'internal-order' };
                    }
                }
            );

            assert.equal(fallbackItems[0].costPrice, 3500);
            assert.equal(fallbackItems[0].conversionRate, 10);
            assert.equal(fallbackItems[0].quantity, 2);
            assert.equal(fallbackItems[0].price, 35000);
            assert.equal(item.costPrice, 35000);
        `);
    });
});
