const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

describe('product AI assistant UI', () => {
    const productsPage = fs.readFileSync(
        path.join(process.cwd(), 'pages/products.html'),
        'utf8'
    );
    const assistantController = fs.readFileSync(
        path.join(process.cwd(), 'js/features/products/aiChatController.js'),
        'utf8'
    );
    const inventoryController = fs.readFileSync(
        path.join(process.cwd(), 'js/features/inventory/inventoryController.js'),
        'utf8'
    );
    const productController = fs.readFileSync(
        path.join(process.cwd(), 'js/features/products/productController.js'),
        'utf8'
    );
    const productUI = fs.readFileSync(
        path.join(process.cwd(), 'js/features/products/productUI.js'),
        'utf8'
    );

    test('shows operational shortcuts instead of task notifications', () => {
        expect(productsPage).toContain('Thao tác nhanh');
        expect(productsPage).toContain('Sửa giá bán');
        expect(productsPage).toContain('Sửa giá vốn');
        expect(productsPage).toContain('Xuất bỏ lô');
        expect(productsPage).toContain('Ngừng kinh doanh');
        expect(productsPage).toContain('id="aiOperationTags"');
        expect(productsPage).toContain('data-ai-operation="retail-price"');
        expect(productsPage).toContain('data-ai-operation="cost-price"');
        expect(productsPage).toContain('data-ai-operation="discard-batch"');
        expect(productsPage).toContain('data-ai-operation="inactive-product"');
        expect((productsPage.match(/aria-pressed="false"/g) || [])).toHaveLength(4);
        expect(productsPage).not.toContain('Công việc cần check hôm nay');
        expect(assistantController).not.toContain(".from('tasks')");
        expect(productsPage).not.toContain('aiFloatingTooltip');
        expect(productsPage).not.toContain('aiDismissAlertBtn');
        expect(assistantController).not.toContain('startAIChatReminders');
        expect(assistantController).not.toContain('refreshProductAITasks');
        expect(assistantController).not.toContain('dismissAlertById');
        expect(productController).not.toContain('startAIChatReminders');
        expect(productController).not.toContain('refreshProductAITasks');
        expect(productUI).not.toContain('aiReminderInterval');
        expect(productUI).not.toContain('_aiIntervalPaused');
    });

    test('shows contextual guidance and selects the editable command placeholder', () => {
        expect(assistantController).toContain('getProductAIOperationGuide(operationKey)');
        expect(assistantController).toContain('showAIOperationGuide(guide)');
        expect(assistantController).toContain("document.getElementById('ai_operation_guide')?.remove()");
        expect(assistantController).toContain("tag.setAttribute('aria-pressed', String(selected))");
        expect(assistantController).toContain("tag.classList.toggle('ring-2', selected)");
        expect(assistantController).toContain("const start = input.value.indexOf('[')");
        expect(assistantController).toContain('input.setSelectionRange(start, end + 1)');
        expect(productsPage).toContain('class="flex flex-wrap gap-2"');
        expect((productsPage.match(/min-h-11 touch-manipulation rounded-full/g) || [])).toHaveLength(4);
    });

    test('prepares price and status changes for explicit form confirmation', () => {
        expect(assistantController).toContain('parseProductAssistantCommand(command)');
        expect(assistantController).toContain('window.openAddProductModal(product)');
        expect(assistantController).toContain("action.priceType === 'cost' ? '.unit-cost' : '.unit-retail'");
        expect(assistantController).toContain('window.handleUnitCostChange?.(input)');
        expect(assistantController).toContain('window.handleUnitRetailChange?.(input)');
        expect(assistantController).toContain('bấm “Lưu dữ liệu” để xác nhận');
        expect(assistantController).not.toContain('async function performPriceUpdate');
        expect(assistantController).not.toContain('updateProductFull');
        expect(assistantController).not.toContain('performNameUpdate');
        expect(assistantController).not.toContain('performBatchUpdate');
        expect(assistantController).not.toContain('fetchProductLifecycleCandidates');
        expect(assistantController).not.toContain('showProductLifecycleCandidates');
    });

    test('initializes the assistant controls exactly once when the module loads', () => {
        expect(assistantController).toContain("operationTags.dataset.bound !== 'true'");
        expect(assistantController).toContain("aiCommandInput.dataset.bound !== 'true'");
        expect(assistantController).toContain("document.readyState === 'loading'");
        expect(assistantController).toContain("document.addEventListener('DOMContentLoaded', initAIChat, { once: true })");
        expect(assistantController).toContain('initAIChat();');
    });

    test('binds and executes a quick-operation tag in a real DOM', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import { JSDOM } from 'jsdom';

            const dom = new JSDOM(\`
                <div id="aiChatBody"></div>
                <input id="aiCommandInput">
                <div id="aiOperationTags">
                    <button data-ai-operation="retail-price" aria-pressed="false">Sửa giá bán</button>
                </div>
            \`);
            globalThis.window = dom.window;
            globalThis.document = dom.window.document;
            globalThis.Event = dom.window.Event;
            dom.window.HTMLElement.prototype.scrollTo = () => {};

            await import('./js/features/products/aiChatController.js?runtime-test');
            const input = document.getElementById('aiCommandInput');
            const button = document.querySelector('[data-ai-operation]');
            assert.equal(input.dataset.bound, 'true');
            assert.equal(document.getElementById('aiOperationTags').dataset.bound, 'true');
            button.click();
            assert.equal(button.getAttribute('aria-pressed'), 'true');
            assert.match(input.value, /^Sửa giá bán/);
            assert.ok(document.getElementById('ai_operation_guide'));
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });

    test('routes stock-containing batch removal through the official issue form', () => {
        expect(assistantController).toContain('buildAssistantInventoryIssueUrl');
        expect(assistantController).toContain('Mở phiếu xuất bỏ lô');
        expect(assistantController).not.toContain('async function performBatchDelete');
        expect(inventoryController).toContain("params.get('assistantAction') !== 'discard-batch'");
        expect(inventoryController).toContain("issueReasonSelect.value = 'damage'");
        expect(inventoryController).toContain('issueQtyInput.value = String(Number(batch.stock_quantity || 0))');
        expect(inventoryController).toContain("document.getElementById('addIssueLineBtn')?.click()");
        expect(inventoryController).toContain("document.getElementById('submitIssueDocBtn')?.focus()");
    });

    test('renders user commands as text rather than executable HTML', () => {
        expect(assistantController).toContain("element.textContent = String(message || '')");
        expect(assistantController).toContain('escapeAIHtml(error.message)');
    });
});
