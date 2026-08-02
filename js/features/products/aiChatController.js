import {
    buildAssistantInventoryIssueUrl,
    formatAssistantMoney,
    getProductAIOperationGuide,
    parseProductAssistantCommand,
    resolveAssistantBatch
} from './productAIAssistantRules.js';

function escapeAIHtml(value) {
    return String(value || '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}

function normalizeSearchText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();
}

function addAIChatMessage(message, type = 'user', id = null) {
    const chatBody = document.getElementById('aiChatBody');
    if (!chatBody) return null;

    const element = document.createElement('div');
    element.className = 'p-3 rounded-xl shadow-md text-sm border animate-in fade-in slide-in-from-bottom-2 duration-300 w-[85%] break-words backdrop-blur-sm';
    if (id) element.id = id;

    if (type === 'user') {
        element.className += ' bg-blue-600/90 text-white rounded-tr-none self-end border-blue-700/50';
        element.textContent = String(message || '');
    } else if (type === 'bot_error') {
        element.className += ' bg-white/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 rounded-tl-none border-red-200/50 dark:border-red-800/30 self-start border-l-4 border-l-red-500';
        element.innerHTML = message;
    } else if (type === 'bot_loading') {
        element.className += ' bg-white/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 rounded-tl-none border-blue-200/50 dark:border-blue-800/30 self-start border-l-4 border-l-blue-500';
        element.innerHTML = message;
    } else {
        element.className += ' bg-white/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 rounded-tl-none border-emerald-200/50 dark:border-emerald-800/30 self-start border-l-4 border-l-emerald-500';
        element.innerHTML = message;
    }

    chatBody.appendChild(element);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });
    return element;
}

window.addAIChatMessage = addAIChatMessage;
window.aiContext = null;

window.toggleAIChat = () => {
    const chatWindow = document.getElementById('aiChatWindow');
    if (!chatWindow) return;
    chatWindow.classList.toggle('hidden');
    if (!chatWindow.classList.contains('hidden')) {
        setTimeout(() => document.getElementById('aiCommandInput')?.focus(), 150);
    }
};

window.fillAIQuickCommand = command => {
    const input = document.getElementById('aiCommandInput');
    if (!input) return;
    input.value = String(command || '');
    input.focus();
    const start = input.value.indexOf('[');
    const end = input.value.indexOf(']', start);
    if (start >= 0 && end > start) input.setSelectionRange(start, end + 1);
    else input.setSelectionRange(input.value.length, input.value.length);
};

function showAIOperationGuide(guide) {
    document.getElementById('ai_operation_guide')?.remove();
    const steps = guide.steps.map(
        (step, index) => `<li class="flex gap-2"><span class="font-black text-blue-600">${index + 1}.</span><span>${escapeAIHtml(step)}</span></li>`
    ).join('');
    addAIChatMessage(
        `<div class="flex items-center gap-2 font-black text-slate-800 dark:text-white">`
        + `<i class="fa-solid ${escapeAIHtml(guide.icon)} text-blue-500"></i> ${escapeAIHtml(guide.label)}</div>`
        + `<ol class="mt-2 space-y-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">${steps}</ol>`
        + `<div class="mt-3 rounded-lg bg-blue-50 px-2.5 py-2 text-xs font-bold text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">`
        + `Ví dụ: “${escapeAIHtml(guide.example)}”</div>`,
        'bot_loading',
        'ai_operation_guide'
    );
}

window.selectAIQuickOperation = operationKey => {
    const guide = getProductAIOperationGuide(operationKey);
    if (!guide) return;
    document.querySelectorAll('[data-ai-operation]').forEach(tag => {
        const selected = tag.dataset.aiOperation === operationKey;
        tag.setAttribute('aria-pressed', String(selected));
        tag.classList.toggle('ring-2', selected);
        tag.classList.toggle('ring-blue-500', selected);
        tag.classList.toggle('ring-offset-2', selected);
        tag.classList.toggle('dark:ring-offset-slate-900', selected);
    });
    window.fillAIQuickCommand(guide.commandTemplate);
    showAIOperationGuide(guide);
};

function findProducts(query) {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) return [];

    const products = (window.currentProductsList || []).map(product => {
        const name = normalizeSearchText(product.name);
        const code = normalizeSearchText(product.product_code);
        let score = 0;
        if (code === normalizedQuery || name === normalizedQuery) score = 100;
        else if (name.startsWith(normalizedQuery)) score = 80;
        else if (name.includes(normalizedQuery)) score = 60;
        else {
            const tokens = normalizedQuery.split(' ').filter(Boolean);
            const matched = tokens.filter(token => name.includes(token)).length;
            score = tokens.length ? matched / tokens.length * 40 : 0;
        }
        return { product, score };
    });

    return products
        .filter(item => item.score >= 20)
        .sort((left, right) => right.score - left.score)
        .map(item => item.product);
}

function exactProduct(products, query) {
    const normalizedQuery = normalizeSearchText(query);
    return products.find(product =>
        normalizeSearchText(product.name) === normalizedQuery
        || normalizeSearchText(product.product_code) === normalizedQuery
    ) || null;
}

function preparePriceUpdate(product, action, loadingMessage) {
    const baseUnit = product.product_units?.find(unit => unit.is_base_unit)
        || product.product_units?.[0];
    if (!baseUnit) throw new Error('Mặt hàng chưa có đơn vị tính để sửa giá.');
    if (!window.openAddProductModal) throw new Error('Không mở được biểu mẫu chỉnh sửa mặt hàng.');

    loadingMessage?.remove();
    window.openAddProductModal(product);
    const selector = action.priceType === 'cost' ? '.unit-cost' : '.unit-retail';
    const input = document.querySelector(`#unitsContainer .unit-row:first-child ${selector}`);
    if (!input) throw new Error('Không tìm thấy ô giá của đơn vị cơ sở.');

    const oldPrice = Number(action.priceType === 'cost' ? baseUnit.cost_price : baseUnit.retail_price) || 0;
    input.value = String(action.amount);
    if (action.priceType === 'cost') window.handleUnitCostChange?.(input);
    else window.handleUnitRetailChange?.(input);
    input.dispatchEvent(new Event('input', { bubbles: true }));

    const label = action.priceType === 'cost' ? 'giá vốn chuẩn' : 'giá bán';
    addAIChatMessage(
        `<i class="fa-solid fa-pen-to-square mr-2 text-blue-500"></i> Đã điền <b>${label}</b> cho <b>${escapeAIHtml(product.name)}</b>: `
        + `${formatAssistantMoney(oldPrice)} → <b>${formatAssistantMoney(action.amount)}</b>.<br><br>`
        + '<span class="text-xs font-bold text-amber-700 dark:text-amber-300">Kiểm tra các đơn vị quy đổi và lô liên quan, sau đó bấm “Lưu dữ liệu” để xác nhận.</span>',
        'bot_success'
    );
}

function prepareBatchDiscard(product, action, loadingMessage) {
    const batch = resolveAssistantBatch(product, action.batchNumber);
    if (!batch) throw new Error(`Mặt hàng ${product.name} không có lô “${action.batchNumber}”.`);

    loadingMessage?.remove();
    const stock = Math.max(0, Number(batch.stock_quantity || 0));
    if (stock <= 0) {
        addAIChatMessage(
            `<i class="fa-solid fa-circle-info mr-2 text-blue-500"></i> Lô <b>${escapeAIHtml(batch.batch_number)}</b> của `
            + `<b>${escapeAIHtml(product.name)}</b> đã hết tồn; hệ thống giữ lịch sử và không tạo phiếu xuất rỗng.`,
            'bot_success'
        );
        return;
    }

    const url = buildAssistantInventoryIssueUrl({
        productCode: product.product_code,
        batchId: batch.id
    });
    addAIChatMessage(
        `<i class="fa-solid fa-box-open mr-2 text-amber-500"></i> Lô <b>${escapeAIHtml(batch.batch_number)}</b> của `
        + `<b>${escapeAIHtml(product.name)}</b> còn <b>${stock.toLocaleString('vi-VN')}</b> đơn vị.<br><br>`
        + 'Mở phiếu xuất bỏ đã điền sẵn toàn bộ số tồn, kiểm tra lý do rồi xác nhận xuất kho.<br>'
        + `<a href="${escapeAIHtml(url)}" class="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2 font-black text-white hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/30">`
        + '<i class="fa-solid fa-arrow-up-from-bracket"></i> Mở phiếu xuất bỏ lô</a>',
        'bot_success'
    );
}

function prepareInactive(product, loadingMessage) {
    if (!window.openAddProductModal) throw new Error('Không mở được biểu mẫu chỉnh sửa mặt hàng.');
    loadingMessage?.remove();
    window.openAddProductModal(product);
    const toggle = document.getElementById('add_is_active');
    if (!toggle) throw new Error('Không tìm thấy trạng thái kinh doanh của mặt hàng.');
    toggle.checked = false;
    toggle.dispatchEvent(new Event('change', { bubbles: true }));
    addAIChatMessage(
        `<i class="fa-solid fa-store-slash mr-2 text-amber-500"></i> Đã chuẩn bị chuyển <b>${escapeAIHtml(product.name)}</b> sang `
        + '<b>Ngừng kinh doanh</b>. Kiểm tra tồn kho rồi bấm “Lưu dữ liệu” để xác nhận.',
        'bot_success'
    );
}

function prepareAction(product, action, loadingMessage) {
    if (action.action === 'prepare_price') preparePriceUpdate(product, action, loadingMessage);
    else if (action.action === 'prepare_batch_discard') prepareBatchDiscard(product, action, loadingMessage);
    else if (action.action === 'prepare_inactive') prepareInactive(product, loadingMessage);
    else throw new Error('Nghiệp vụ này không được trợ lý hỗ trợ.');
}

function promptProductSelection(products, action, loadingMessage) {
    loadingMessage?.remove();
    window.aiContext = { products: products.slice(0, 10), action };
    const rows = window.aiContext.products.map(product =>
        `• <b>${escapeAIHtml(product.name)}</b> (${escapeAIHtml(product.product_code || 'không mã')})`
    ).join('<br>');
    addAIChatMessage(
        `Tìm thấy nhiều mặt hàng phù hợp. Hãy nhập đúng tên hoặc mã mặt hàng:<br><br>${rows}`
        + '<br><br><span class="text-[11px] opacity-70">Nhập “Hủy” để dừng thao tác.</span>',
        'bot_loading'
    );
}

window.processAICommand = () => {
    const input = document.getElementById('aiCommandInput');
    if (!input || !input.value.trim()) return;

    const command = input.value.trim();
    input.value = '';
    addAIChatMessage(command, 'user');
    const loadingMessage = addAIChatMessage(
        '<i class="fa-solid fa-spinner fa-spin mr-2 text-blue-500"></i> Đang chuẩn bị thao tác...',
        'bot_loading',
        `ai_loading_${Date.now()}`
    );

    try {
        if (window.aiContext) {
            if (['HUY', 'HỦY', 'CANCEL'].includes(normalizeSearchText(command))) {
                window.aiContext = null;
                loadingMessage?.remove();
                addAIChatMessage('Đã hủy thao tác.', 'bot_success');
                return;
            }
            const context = window.aiContext;
            const product = exactProduct(context.products, command);
            if (!product) throw new Error('Không tìm thấy đúng mặt hàng trong danh sách lựa chọn.');
            window.aiContext = null;
            prepareAction(product, context.action, loadingMessage);
            return;
        }

        const action = parseProductAssistantCommand(command);
        if (!action) {
            throw new Error('Trợ lý chỉ hỗ trợ: sửa giá bán, sửa giá vốn, xuất bỏ lô và ngừng kinh doanh. Hãy chọn một tag thao tác nhanh.');
        }

        const products = findProducts(action.productQuery);
        if (products.length === 0) {
            throw new Error(`Không tìm thấy mặt hàng phù hợp với “${action.productQuery}”.`);
        }
        const exact = exactProduct(products, action.productQuery);
        if (!exact && products.length > 1) {
            promptProductSelection(products, action, loadingMessage);
            return;
        }
        prepareAction(exact || products[0], action, loadingMessage);
    } catch (error) {
        loadingMessage?.remove();
        addAIChatMessage(
            `<i class="fa-solid fa-triangle-exclamation mr-2 text-red-500"></i> ${escapeAIHtml(error.message)}`,
            'bot_error'
        );
    }
};

export function initAIChat() {
    const aiCommandInput = document.getElementById('aiCommandInput');
    if (aiCommandInput && aiCommandInput.dataset.bound !== 'true') {
        aiCommandInput.dataset.bound = 'true';
        aiCommandInput.addEventListener('keydown', event => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            window.processAICommand();
        });
    }

    const operationTags = document.getElementById('aiOperationTags');
    if (operationTags && operationTags.dataset.bound !== 'true') {
        operationTags.dataset.bound = 'true';
        operationTags.addEventListener('click', event => {
            const tag = event.target.closest('[data-ai-operation]');
            if (tag) window.selectAIQuickOperation(tag.dataset.aiOperation);
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAIChat, { once: true });
} else {
    initAIChat();
}
