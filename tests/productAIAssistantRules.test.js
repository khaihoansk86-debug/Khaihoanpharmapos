const { execFileSync } = require('child_process');

describe('product AI assistant rules', () => {
    test('distinguishes cost and retail price commands', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import { parseProductAssistantCommand } from './js/features/products/productAIAssistantRules.js';

            assert.deepEqual(
                parseProductAssistantCommand('Sửa giá vốn Panadol thành 15k'),
                {
                    action: 'prepare_price',
                    priceType: 'cost',
                    amount: 15000,
                    productQuery: 'PANADOL',
                    originalCommand: 'Sửa giá vốn Panadol thành 15k'
                }
            );
            assert.deepEqual(
                parseProductAssistantCommand('Cập nhật Hapacol 650 giá bán 20.000'),
                {
                    action: 'prepare_price',
                    priceType: 'retail',
                    amount: 20000,
                    productQuery: 'HAPACOL 650',
                    originalCommand: 'Cập nhật Hapacol 650 giá bán 20.000'
                }
            );
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('recognizes discard and discontinue operations', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                buildAssistantInventoryIssueUrl,
                parseProductAssistantCommand,
                resolveAssistantBatch
            } from './js/features/products/productAIAssistantRules.js';

            assert.deepEqual(
                parseProductAssistantCommand('Xuất bỏ lô L01 của Panadol'),
                {
                    action: 'prepare_batch_discard',
                    batchNumber: 'L01',
                    productQuery: 'PANADOL',
                    originalCommand: 'Xuất bỏ lô L01 của Panadol'
                }
            );
            assert.equal(
                parseProductAssistantCommand('Ngừng kinh doanh Hapacol').action,
                'prepare_inactive'
            );
            assert.equal(
                resolveAssistantBatch({
                    product_batches: [{ id: 'batch-1', batch_number: 'lô 01' }]
                }, 'LÔ 01').id,
                'batch-1'
            );
            assert.equal(
                buildAssistantInventoryIssueUrl({
                    productCode: 'SP 01',
                    batchId: 'batch/1'
                }),
                'inventory.html?assistantAction=discard-batch&productCode=SP+01&batchId=batch%2F1#stock-issue'
            );
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('does not interpret task reminders as operational commands', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import { parseProductAssistantCommand } from './js/features/products/productAIAssistantRules.js';

            assert.equal(parseProductAssistantCommand('Nhắc tôi kiểm hàng ngày mai'), null);
            assert.equal(parseProductAssistantCommand('Danh sách công việc'), null);
            assert.equal(parseProductAssistantCommand('Hàng cận hạn'), null);
            assert.equal(parseProductAssistantCommand('Hàng tồn lâu'), null);
            assert.equal(parseProductAssistantCommand('Dọn danh mục hàng hóa'), null);
            assert.equal(parseProductAssistantCommand('Đổi tên Panadol thành Panadol mới'), null);
            assert.equal(parseProductAssistantCommand('Đổi lô L01 thành L02'), null);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('provides concise selectable guidance for every supported operation', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                getProductAIOperationGuide,
                PRODUCT_AI_OPERATION_GUIDES
            } from './js/features/products/productAIAssistantRules.js';

            assert.deepEqual(Object.keys(PRODUCT_AI_OPERATION_GUIDES), [
                'retail-price',
                'cost-price',
                'discard-batch',
                'inactive-product',
                'import-goods',
                'delete-product',
                'quick-query'
            ]);
            Object.values(PRODUCT_AI_OPERATION_GUIDES).forEach(guide => {
                assert.ok(guide.steps.length >= 2);
                assert.match(guide.commandTemplate, /\\[tên mặt hàng\\]/);
                assert.ok(guide.example.includes('Panadol'));
            });
            assert.equal(getProductAIOperationGuide('cost-price').label, 'Sửa giá vốn');
            assert.equal(getProductAIOperationGuide('unknown'), null);
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });
});
