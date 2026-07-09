import { supabaseClient } from '../../core/supabase.js';
import { updateProductFull } from './productService.js';
import { fetchProductLifecycleCandidates } from './productLifecycleService.js';
import { buildProductAttentionTasks } from './productAttentionRules.js';

// We rely on window.currentProductsList and window.loadProductsData from productController.js

function getProductDescriptionFlags(product) {
    try {
        const parsed = typeof product?.description === 'string'
            ? JSON.parse(product.description)
            : product?.description;
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
        return {};
    }
}

function isDoseTaggedProduct(product) {
    const flags = getProductDescriptionFlags(product);
    return flags.is_dose_cut === true || flags.is_dose_retail === true;
}

export function initAIChat() {
    // Setup event listener for AI Chat Input
    const aiCommandInput = document.getElementById('aiCommandInput');
    if (aiCommandInput) {
        aiCommandInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                window.processAICommand();
            }
        });
    }
}

window.toggleAIChat = (showDetails = false) => {
    const chatWindow = document.getElementById('aiChatWindow');
    const tooltip = document.getElementById('aiFloatingTooltip');
    if (chatWindow) {
        if (chatWindow.classList.contains('hidden')) {
            chatWindow.classList.remove('hidden');
            tooltip?.classList.add('hidden'); // Ẩn bong bóng nhắc nhở khi đang mở cửa sổ chat
            const input = document.getElementById('aiCommandInput');
            if (input) setTimeout(() => input.focus(), 350);
            
            // Nếu bấm trực tiếp từ bong bóng nhắc nhở, tự động hiển thị báo cáo chi tiết cảnh báo
            if (showDetails && tooltip && tooltip.dataset.detail) {
                // Dọn dẹp tin nhắn cảnh báo cũ để tránh trùng lặp
                const oldAlerts = document.querySelectorAll('.ai-alert-message');
                oldAlerts.forEach(el => el.remove());
                
                addAIChatMessage(tooltip.dataset.detail, 'bot_success', 'ai_alert_' + Date.now(), 'ai-alert-message');
            }
        } else {
            chatWindow.classList.add('hidden');
            tooltip?.classList.remove('hidden'); // Hiện lại bong bóng khi đóng cửa sổ chat
        }
    }
};

function addAIChatMessage(message, type = 'user', id = null, extraClass = '') {
    const chatBody = document.getElementById('aiChatBody');
    if (!chatBody) return null;

    const msgDiv = document.createElement('div');
    msgDiv.className = 'p-3 rounded-xl shadow-md text-sm border animate-in fade-in slide-in-from-bottom-2 duration-300 w-[85%] break-words backdrop-blur-sm';
    if (id) msgDiv.id = id;
    if (extraClass) msgDiv.className += ' ' + extraClass;
    
    if (type === 'user') {
        msgDiv.className += ' bg-blue-600/90 text-white rounded-tr-none self-end border-blue-700/50 shadow-blue-500/10';
        msgDiv.innerHTML = message;
    } else if (type === 'bot_success') {
        msgDiv.className += ' bg-white/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 rounded-tl-none border-emerald-200/50 dark:border-emerald-800/30 self-start border-l-4 border-l-emerald-500 shadow-emerald-500/5';
        msgDiv.innerHTML = message;
    } else if (type === 'bot_error') {
        msgDiv.className += ' bg-white/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 rounded-tl-none border-red-200/50 dark:border-red-800/30 self-start border-l-4 border-l-red-500 shadow-red-500/5';
        msgDiv.innerHTML = message;
    } else if (type === 'bot_loading') {
        msgDiv.className += ' bg-white/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 rounded-tl-none border-blue-200/50 dark:border-blue-800/30 self-start border-l-4 border-l-blue-500 shadow-blue-500/5';
        msgDiv.innerHTML = message;
    }
    
    chatBody.appendChild(msgDiv);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });
    return msgDiv;
}
window.addAIChatMessage = addAIChatMessage;

function escapeAIHtml(value) {
    return String(value || '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}

function buildTaskItemsHtml(items, type) {
    if (!items.length) {
        return '<div class="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-xs font-bold text-slate-400 dark:border-slate-700">Không có việc cần xử lý</div>';
    }

    return items.slice(0, 8).map(item => {
        const product = item.product;
        let detail = item.reason || '';
        if (type === 'expired') {
            const oldest = Math.max(...item.batches.map(batch => Math.abs(batch.daysLeft)));
            detail = `${item.batches.length} lô còn tồn · quá hạn lâu nhất ${oldest} ngày`;
        } else if (type === 'near') {
            detail = `${item.batches.length} lô còn tồn · gần nhất còn ${item.urgency} ngày`;
        }

        return `
            <button type="button" onclick="window.focusProductForAI('${product.id}')"
                class="group flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/80">
                <span class="min-w-0">
                    <span class="block truncate text-sm font-black text-slate-800 group-hover:text-blue-600 dark:text-white">${escapeAIHtml(product.name)}</span>
                    <span class="mt-0.5 block truncate text-[11px] font-bold text-slate-500">${escapeAIHtml(product.product_code || '')} · ${escapeAIHtml(detail)}</span>
                </span>
                <i class="fa-solid fa-arrow-right text-xs text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-500"></i>
            </button>`;
    }).join('');
}

function countProductAITasks(tasks = {}) {
    return (tasks.expired?.length || 0) + (tasks.nearExpiry?.length || 0) + (tasks.cleanup?.length || 0);
}

function getAITaskSummaryText(tasks = {}) {
    const total = countProductAITasks(tasks);
    if (!total) return 'AI đã kiểm tra xong. Hôm nay chưa có việc hàng hóa nào cần check gấp.';

    const parts = [];
    if (tasks.expired?.length) parts.push(`${tasks.expired.length} hết hạn`);
    if (tasks.nearExpiry?.length) parts.push(`${tasks.nearExpiry.length} cận hạn`);
    if (tasks.cleanup?.length) parts.push(`${tasks.cleanup.length} cần dọn`);

    return `AI có ${total} việc cần check hôm nay: ${parts.join(', ')}.`;
}

function renderProductAITasks(tasks) {
    const container = document.getElementById('aiProductTasksContent');
    if (!container) return;

    const total = countProductAITasks(tasks);
    if (!total) {
        container.innerHTML = `
            <div class="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
                <i class="fa-solid fa-circle-check text-xl"></i>
                <div>
                    <div class="font-black">Hôm nay danh mục đang ổn</div>
                    <div class="text-[11px] font-bold opacity-80">Không phát hiện hàng hết hạn, cận hạn hoặc mặt hàng cần dọn.</div>
                </div>
            </div>`;
        return;
    }

    const sections = [
        ['Hết hạn', tasks.expired, 'fa-triangle-exclamation', 'red', 'expired'],
        ['Cận hạn dưới 90 ngày', tasks.nearExpiry, 'fa-hourglass-half', 'amber', 'near'],
        ['Dọn danh mục', tasks.cleanup, 'fa-broom', 'violet', 'cleanup']
    ];

    container.innerHTML = `
        <div class="mb-3 flex flex-wrap items-center gap-2">
            <span class="text-[11px] font-black uppercase tracking-wider text-slate-500">Tổng cộng ${total} việc cần xem</span>
            <span class="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-black text-red-700">${tasks.expired.length} hết hạn</span>
            <span class="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-black text-amber-700">${tasks.nearExpiry.length} cận hạn</span>
            <span class="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-black text-violet-700">${tasks.cleanup.length} cần dọn</span>
        </div>
        <div class="space-y-3">
            ${sections.map(([title, items, icon, color, type]) => `
                <div class="rounded-2xl border border-${color}-200/80 bg-${color}-50/50 p-3 dark:border-${color}-900/40 dark:bg-${color}-950/10">
                    <div class="mb-2 flex items-center justify-between">
                        <div class="flex items-center gap-2 text-sm font-black text-${color}-700 dark:text-${color}-300">
                            <i class="fa-solid ${icon}"></i> ${title}
                        </div>
                        <span class="flex h-7 min-w-7 items-center justify-center rounded-full bg-${color}-100 px-2 text-[11px] font-black text-${color}-700">${items.length}</span>
                    </div>
                    <div class="max-h-52 space-y-2 overflow-y-auto pr-1">${buildTaskItemsHtml(items, type)}</div>
                    ${items.length > 8 ? `<div class="pt-2 text-center text-[11px] font-bold text-slate-400">Còn ${items.length - 8} mặt hàng khác</div>` : ''}
                </div>
            `).join('')}
        </div>`;
}

window.refreshProductAITasks = async (force = false) => {
    const container = document.getElementById('aiProductTasksContent');
    if (!container) return;
    container.innerHTML = '<div class="flex items-center gap-3 py-3 text-sm font-bold text-slate-500"><i class="fa-solid fa-circle-notch fa-spin text-blue-500"></i>Đang kiểm tra hạn dùng và lịch sử bán...</div>';

    let lifecycleCandidates = [];
    try {
        lifecycleCandidates = await fetchProductLifecycleCandidates(window.currentProductsList || [], { force });
    } catch (error) {
        console.warn('Không thể quét danh mục hàng hóa:', error);
    }

    const tasks = buildProductAttentionTasks(window.currentProductsList || [], lifecycleCandidates);
    renderProductAITasks(tasks);
    const textEl = document.getElementById('aiFloatingText');
    const tooltip = document.getElementById('aiFloatingTooltip');
    const dismissBtn = document.getElementById('aiDismissAlertBtn');
    if (textEl) textEl.textContent = getAITaskSummaryText(tasks);
    if (tooltip) tooltip.dataset.detail = '';
    if (dismissBtn) dismissBtn.classList.add('hidden');
    return tasks;
};

function buildLifecycleCandidatesHtml(candidates = []) {
    const rows = candidates.slice(0, 20).map(item => {
        const product = item.product;
        const level = item.severity === 'likely_discontinued'
            ? '<span class="rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-black text-red-600">RẤT NGHI NGỜ</span>'
            : '<span class="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-black text-amber-700">CẦN KIỂM TRA</span>';
        return `
            <li class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/40 p-3">
                <div class="flex items-start justify-between gap-2">
                    <div>
                        <div class="font-black text-slate-800 dark:text-white">${escapeAIHtml(product.name)}</div>
                        <div class="text-[10px] font-bold text-slate-400">${escapeAIHtml(product.product_code || '')}</div>
                    </div>
                    ${level}
                </div>
                <div class="mt-2 text-xs font-bold text-slate-600 dark:text-slate-300">${escapeAIHtml(item.reason)}</div>
                <div class="mt-2 flex gap-2">
                    <button onclick="window.openLifecycleProduct('${product.id}')"
                        class="flex-1 rounded-lg bg-blue-50 dark:bg-blue-950/30 px-2 py-1.5 text-[10px] font-black text-blue-600">Xem mặt hàng</button>
                    <button onclick="window.prepareLifecycleProductInactive('${product.id}')"
                        class="flex-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 px-2 py-1.5 text-[10px] font-black text-amber-700">Chuẩn bị ngừng KD</button>
                </div>
            </li>
        `;
    }).join('');

    return `<div class="space-y-2.5">
        <div class="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2 text-base font-extrabold text-slate-700 dark:text-slate-200">
            <i class="fa-solid fa-broom text-amber-500"></i> DỌN DANH MỤC HÀNG HÓA
        </div>
        <div class="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-2 text-[11px] font-bold text-blue-700 dark:text-blue-300">
            AI chỉ đưa ra danh sách nghi ngờ dựa trên lịch sử bán thật. Hệ thống không tự xóa hoặc tự ngừng kinh doanh.
        </div>
        <ul class="space-y-2">${rows}</ul>
        ${candidates.length > 20 ? `<div class="text-[11px] font-bold text-slate-400">Còn ${candidates.length - 20} mặt hàng khác. Hãy xử lý nhóm trên trước để danh sách luôn gọn.</div>` : ''}
    </div>`;
}

window.openLifecycleProduct = productId => {
    window.focusProductForAI?.(productId);
};

window.prepareLifecycleProductInactive = productId => {
    const product = (window.currentProductsList || []).find(item => String(item.id) === String(productId));
    if (!product || !window.openAddProductModal) return;
    window.openAddProductModal(product);
    const toggle = document.getElementById('add_is_active');
    if (toggle) toggle.checked = false;
    addAIChatMessage(
        `<i class="fa-solid fa-hand-pointer mr-2 text-amber-500"></i> Đã chuẩn bị chuyển <b>${escapeAIHtml(product.name)}</b> sang Ngừng kinh doanh. Kiểm tra tồn kho rồi bấm <b>Lưu</b> để xác nhận.`,
        'bot_success'
    );
};

window.showProductLifecycleCandidates = async (force = false) => {
    const candidates = await fetchProductLifecycleCandidates(window.currentProductsList || [], { force });
    if (!candidates.length) {
        addAIChatMessage('<i class="fa-solid fa-sparkles mr-2 text-emerald-500"></i> Danh mục hiện khá sạch: chưa phát hiện mặt hàng lâu không bán cần xem xét.', 'bot_success');
        return candidates;
    }
    addAIChatMessage(buildLifecycleCandidatesHtml(candidates), 'bot_success');
    return candidates;
};

window.dismissAlertById = (alertId, event) => {
    if (event) event.stopPropagation();

    const todayObj = new Date();
    const todayStr = `${todayObj.getFullYear()}${(todayObj.getMonth()+1).toString().padStart(2, '0')}${todayObj.getDate().toString().padStart(2, '0')}`;
    
    let dismissed = JSON.parse(localStorage.getItem(`dismissed_alerts_${todayStr}`) || '[]');
    if (!dismissed.includes(alertId)) {
        dismissed.push(alertId);
        localStorage.setItem(`dismissed_alerts_${todayStr}`, JSON.stringify(dismissed));
    }
    
    window.showToast?.(`Đã ẩn cảnh báo này trong ngày hôm nay!`, 'info', 3000);
    
    if (event && event.target) {
        const btn = event.target.closest('button');
        if (btn) {
            btn.innerHTML = `<i class="fa-solid fa-check text-emerald-500"></i> Đã ẩn trong ngày hôm nay`;
            btn.disabled = true;
            btn.className = "mt-2.5 w-full py-1.5 bg-emerald-50/50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-lg text-xs font-bold border border-emerald-200/50 dark:border-emerald-900/30 flex items-center justify-center gap-1 shadow-inner";
        }
    }
    
    if (window.startAIChatReminders) {
        window.startAIChatReminders();
    }
};

window.dismissActiveAlert = (event) => {
    if (event) event.stopPropagation();
    
    const dismissBtn = document.getElementById('aiDismissAlertBtn');
    if (!dismissBtn) return;
    
    const alertId = dismissBtn.dataset.alertId;
    if (!alertId) return;
    
    window.dismissAlertById(alertId, event);
};

window.startAIChatReminders = async () => {
    const tooltip = document.getElementById('aiFloatingTooltip');
    const textEl = document.getElementById('aiFloatingText');
    if (!tooltip || !textEl) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let lifecycleCandidates = [];

    try {
        lifecycleCandidates = await fetchProductLifecycleCandidates(window.currentProductsList || []);
    } catch (error) {
        console.warn('Không thể quét mặt hàng nghi ngờ ngừng bán:', error);
    }
    const tasks = buildProductAttentionTasks(window.currentProductsList || [], lifecycleCandidates, today);
    renderProductAITasks(tasks);
    textEl.textContent = getAITaskSummaryText(tasks);
    tooltip.dataset.detail = '';
    document.getElementById('aiDismissAlertBtn')?.classList.add('hidden');
    if (window.aiReminderInterval) clearInterval(window.aiReminderInterval);
};

window.aiContext = null;

async function performPriceUpdate(product, newPrice, loadingMsg) {
    const baseUnit = product.product_units?.find(u => u.is_base_unit) || product.product_units?.[0];
    if (!baseUnit) throw new Error("Sản phẩm chưa có đơn vị tính để sửa giá.");

    // Cập nhật giá cho tất cả các đơn vị tính theo tỷ lệ quy đổi
    const updatedUnits = product.product_units.map(u => {
        const rate = u.conversion_rate || 1;
        return {
            ...u,
            retail_price: newPrice * rate
        };
    });

    await updateProductFull(product.id, { name: product.name }, updatedUnits, product.product_batches);
    
    if (loadingMsg) loadingMsg.remove();
    
    let unitsUpdatedText = updatedUnits.map(u => `• ${u.unit_name}: <b>${u.retail_price.toLocaleString()}đ</b>`).join('<br>');
    addAIChatMessage(`<i class="fa-solid fa-check-double mr-2 text-emerald-500"></i> Thành công: Đã cập nhật giá <b>${product.name}</b>.<br><br><div class="bg-emerald-50 dark:bg-emerald-900/30 p-2 rounded border border-emerald-100 dark:border-emerald-800 text-xs mt-2">${unitsUpdatedText}</div>`, 'bot_success');
    
    if (window.loadProductsData) window.loadProductsData(); // Refresh list
}

async function performNameUpdate(product, newName, loadingMsg) {
    await updateProductFull(product.id, { name: newName }, product.product_units, product.product_batches);
    if (loadingMsg) loadingMsg.remove();
    addAIChatMessage(`<i class="fa-solid fa-check-double mr-2 text-emerald-500"></i> Thành công: Đã đổi tên <b>${product.name}</b> thành <b>${newName}</b>.`, 'bot_success');
    if (window.loadProductsData) window.loadProductsData();
}

async function performBatchUpdate(product, oldBatchNo, newBatchNo, loadingMsg) {
    const batches = [...(product.product_batches || [])];
    const batch = batches.find(b => b.batch_number.toUpperCase() === oldBatchNo.toUpperCase());
    
    if (!batch) {
        if (loadingMsg) loadingMsg.remove();
        throw new Error(`Sản phẩm <b>${product.name}</b> không có lô nào là <b>"${oldBatchNo}"</b>.`);
    }

    batch.batch_number = newBatchNo;
    await updateProductFull(product.id, { name: product.name }, product.product_units, batches);
    
    if (loadingMsg) loadingMsg.remove();
    addAIChatMessage(`<i class="fa-solid fa-check-double mr-2 text-emerald-500"></i> Thành công: Đã đổi số lô <b>${oldBatchNo}</b> thành <b>${newBatchNo}</b> của sản phẩm <b>${product.name}</b>.`, 'bot_success');
    if (window.loadProductsData) window.loadProductsData();
}

async function performBatchDelete(product, batchNo, loadingMsg) {
    const batches = (product.product_batches || []).filter(b => b.batch_number.toUpperCase() !== batchNo.toUpperCase());
    
    if (batches.length === (product.product_batches || []).length) {
        if (loadingMsg) loadingMsg.remove();
        throw new Error(`Sản phẩm <b>${product.name}</b> không có lô nào là <b>"${batchNo}"</b>.`);
    }

    try {
        await updateProductFull(product.id, { name: product.name }, product.product_units, batches);
        if (loadingMsg) loadingMsg.remove();
        addAIChatMessage(`<i class="fa-solid fa-check-double mr-2 text-emerald-500"></i> Thành công: Đã xóa lô <b>${batchNo}</b> của sản phẩm <b>${product.name}</b>.`, 'bot_success');
    } catch (err) {
        if (loadingMsg) loadingMsg.remove();
        if (err.message.includes('foreign key') || err.code === '23503') {
            addAIChatMessage(`<i class="fa-solid fa-triangle-exclamation mr-2 text-orange-500"></i> Không thể xóa lô <b>${batchNo}</b> vì đã có hóa đơn liên quan. <br><br><b>Gợi ý:</b> Bạn nên sửa tồn kho của lô này về 0 thay vì xóa.`, 'bot_error');
        } else {
            throw err;
        }
    }
    if (window.loadProductsData) window.loadProductsData();
}

function removeTones(str) {
    if (!str) return '';
    return str.normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/đ/g, 'd').replace(/Đ/g, 'D')
              .toUpperCase();
}

function findProductsByKeyword(keyword) {
    if (!keyword) return [];
    keyword = removeTones(keyword).trim();
    return (window.currentProductsList || []).filter(p => removeTones(p.name).includes(keyword) || p.product_code.toUpperCase() === keyword);
}

function findProductBySmartSearch(cmd) {
    if (!cmd) return [];
    const cmdNoTones = removeTones(cmd).trim();
    // 1. Dọn dẹp các từ khóa hành động ở đầu câu để lấy chuỗi tìm kiếm thô
    let cleanCmd = cmdNoTones
        .replace(/^(SUA|CHINH SUA|CHINH|CAP NHAT|MO|XEM|TIM)\s+/g, '')
        .trim();
        
    // 2. Thử tìm kiếm chính xác bằng includes thông thường
    let matches = (window.currentProductsList || []).filter(p => {
        const prodNameNoTones = removeTones(p.name);
        const prodCode = p.product_code.toUpperCase();
        
        // Trùng mã sản phẩm hoặc tên sản phẩm nằm trong câu lệnh
        if (cleanCmd.includes(prodNameNoTones) || prodNameNoTones.includes(cleanCmd) || prodCode === cleanCmd) {
            return true;
        }
        return false;
    });

    if (matches.length > 0) {
        return matches;
    }

    // 3. Nếu chưa tìm thấy, sử dụng thuật toán tính điểm Token Overlap (Độ trùng lặp từ)
    // Tách các từ trong cleanCmd, loại bỏ các từ vô nghĩa cực kỳ phổ biến
    const stopWords = ['BO', 'CHU', 'ROI', 'DI', 'TIEN', 'GIA', 'BAN', 'VON', 'THUOC', 'CUA', 'CHO', 'THAY', 'DOI', 'THEM'];
    const tokens = cleanCmd.split(/\s+/).filter(t => t.length > 0 && !stopWords.includes(t));
    
    if (tokens.length === 0) return [];

    let scoredProducts = (window.currentProductsList || []).map(p => {
        const prodNameNoTones = removeTones(p.name);
        const prodTokens = prodNameNoTones.split(/\s+/).filter(t => t.length > 0);
        
        // Đếm số lượng token trùng lặp
        let matchCount = 0;
        tokens.forEach(token => {
            if (prodTokens.some(pt => pt.includes(token) || token.includes(pt))) {
                matchCount++;
            }
        });
        
        // Tính tỷ lệ trùng lặp
        const score = matchCount / Math.max(tokens.length, 1);
        return { product: p, score };
    });

    // Chỉ lấy sản phẩm có điểm số > 0.3 (khớp tối thiểu 30% từ)
    scoredProducts = scoredProducts.filter(item => item.score > 0.3);
    scoredProducts.sort((a, b) => b.score - a.score);

    return scoredProducts.map(item => item.product);
}

function promptProductSelection(matchingProducts, keyword, action, extraData, loadingMsg) {
    if (loadingMsg) loadingMsg.remove();
    window.aiContext = { action: action, products: matchingProducts, ...extraData };
    const names = matchingProducts.slice(0, 5).map(p => `• <b>${p.name}</b> (${p.product_code})`).join('<br>');
    const moreText = matchingProducts.length > 5 ? `<br>... và ${matchingProducts.length - 5} sản phẩm khác.` : '';
    addAIChatMessage(`Tìm thấy ${matchingProducts.length} sản phẩm chứa "<b>${keyword}</b>". Bạn muốn áp dụng cho sản phẩm nào?<br><br>${names}${moreText}<br><br><i class="text-[11px] opacity-70">👉 Nhập tên sản phẩm bạn chọn, hoặc gõ <b>"Huỷ"</b>.</i>`, 'bot_loading');
}

/**
 * Xử lý lệnh từ AI Chat Bubble (Có State)
 */
window.processAICommand = async () => {
    const input = document.getElementById('aiCommandInput');
    if (!input || !input.value.trim()) return;

    const cmd = input.value.trim();
    const cmdUpper = cmd.toUpperCase();
    const cmdNoTones = removeTones(cmd);
    input.value = ''; // Clear input
    
    addAIChatMessage(cmd, 'user');

    const loadingId = 'ai_loading_' + Date.now();
    const loadingMsg = addAIChatMessage(`<i class="fa-solid fa-spinner fa-spin mr-2 text-blue-500"></i> Đang xử lý...`, 'bot_loading', loadingId);

    try {
        // --- XỬ LÝ CONTEXT (NẾU ĐANG CHỜ PHẢN HỒI) ---
        if (window.aiContext) {
            const ctx = window.aiContext;
            if (cmdUpper === 'HUỶ' || cmdUpper === 'HỦY' || cmdUpper === 'CANCEL') {
                window.aiContext = null;
                if (loadingMsg) loadingMsg.remove();
                addAIChatMessage(`Đã huỷ thao tác.`, 'bot_success');
                return;
            }

            const selectedProduct = ctx.products.find(p => removeTones(p.name).includes(cmdNoTones) || p.product_code.toUpperCase() === cmdNoTones);
            
            if (selectedProduct) {
                window.aiContext = null;
                if (ctx.action === 'wait_for_product_selection_price') {
                    await performPriceUpdate(selectedProduct, ctx.price, loadingMsg);
                } else if (ctx.action === 'wait_for_product_selection_rename') {
                    await performNameUpdate(selectedProduct, ctx.newName, loadingMsg);
                } else if (ctx.action === 'wait_for_product_selection_open') {
                    if (loadingMsg) loadingMsg.remove();
                    if (window.openAddProductModal) {
                        window.openAddProductModal(selectedProduct);
                        addAIChatMessage(`<i class="fa-solid fa-folder-open mr-2 text-emerald-500"></i> Đã mở bảng chỉnh sửa cho sản phẩm <b>${selectedProduct.name}</b>.`, 'bot_success');
                    }
                } else if (ctx.action === 'wait_for_product_selection_status') {
                    if (loadingMsg) loadingMsg.remove();
                    if (window.openAddProductModal) {
                        window.openAddProductModal(selectedProduct);
                        const toggle = document.getElementById('add_is_active');
                        if (toggle) toggle.checked = false;
                        addAIChatMessage(`<i class="fa-solid fa-hand-pointer mr-2 text-blue-500"></i> Đã mở bảng thông tin của <b>${selectedProduct.name}</b> và tự động tắt kinh doanh. Vui lòng bấm <b>Lưu thay đổi</b>.`, 'bot_success');
                    }
                } else if (ctx.action === 'wait_for_product_selection_delete') {
                    if (loadingMsg) loadingMsg.remove();
                    if (window.openAddProductModal) {
                        window.openAddProductModal(selectedProduct);
                        addAIChatMessage(`<i class="fa-solid fa-hand-pointer mr-2 text-blue-500"></i> Đã mở bảng thông tin của <b>${selectedProduct.name}</b>. Tự bấm nút Xóa ở góc dưới cùng để xác nhận.`, 'bot_success');
                    }
                } else if (ctx.action === 'wait_for_product_selection_delete_batch') {
                    await performBatchDelete(selectedProduct, ctx.batchNo, loadingMsg);
                } else if (ctx.action === 'wait_for_product_selection_rename_batch') {
                    await performBatchUpdate(selectedProduct, ctx.oldBatch, ctx.newBatch, loadingMsg);
                }
            } else {
                if (loadingMsg) loadingMsg.remove();
                addAIChatMessage(`Không tìm thấy sản phẩm trong danh sách đề xuất. Vui lòng thử gõ lại hoặc gõ <b>"Huỷ"</b>.`, 'bot_error');
            }
            return;
        }

        // --- XỬ LÝ LỆNH MỚI ---

        // NEW: QUẢN LÝ CÔNG VIỆC (TASK MANAGEMENT VIA SUPABASE)
        if (cmdNoTones.includes('CONG VIEC') || cmdNoTones.includes('NHAC TOI') || cmdNoTones.includes('VIEC CAN LAM') || cmdNoTones.includes('DANH SACH CONG VIEC') || cmdNoTones.includes('NHAC NHIEU')) {
            
            // Xử lý Thêm Công Việc: "Nhắc tôi làm việc X", "Thêm công việc Y"
            const addTaskMatch = cmdNoTones.match(/(?:NHAC TOI|THEM CONG VIEC|THEM VIEC)\s+(.*)/);
            if (addTaskMatch && !cmdNoTones.includes('DANH SACH') && !cmdNoTones.includes('XEM')) {
                const rawTaskDesc = cmd.match(/(?:nhắc tôi|thêm công việc|thêm việc)\s+(.*)/i);
                const taskDesc = rawTaskDesc ? rawTaskDesc[1].trim() : addTaskMatch[1].trim();

                const { data, error } = await supabaseClient
                    .from('tasks')
                    .insert([{ description: taskDesc, status: 'pending' }])
                    .select()
                    .single();

                if (loadingMsg) loadingMsg.remove();
                if (error) {
                    addAIChatMessage(`<i class="fa-solid fa-triangle-exclamation mr-2 text-red-500"></i> Lỗi lưu công việc: ${error.message}`, 'bot_error');
                } else {
                    addAIChatMessage(`<i class="fa-solid fa-list-check mr-2 text-emerald-500"></i> Đã ghi nhận: <b>${taskDesc}</b>.<br><span class="text-xs text-slate-500">Bạn có thể gõ "Danh sách công việc" để xem lại.</span>`, 'bot_success');
                }
                return;
            }

            // Xử lý Hoàn Thành Công Việc: "Đã làm xong việc X" hoặc "Hoàn thành việc Y"
            const finishTaskMatch = cmdNoTones.match(/(?:DA XONG|DA LAM XONG|HOAN THANH|XONG)\s+(?:VIEC|CONG VIEC\s+)?(.*)/);
            if (finishTaskMatch && finishTaskMatch[1].trim() !== '') {
                const keyword = finishTaskMatch[1].trim();
                const { data: searchTasks, error: searchErr } = await supabaseClient
                    .from('tasks')
                    .select('*')
                    .eq('status', 'pending')
                    .ilike('description', `%${keyword}%`);

                if (searchErr) throw searchErr;

                if (!searchTasks || searchTasks.length === 0) {
                    if (loadingMsg) loadingMsg.remove();
                    addAIChatMessage(`Không tìm thấy công việc nào đang chờ có chứa từ khóa "<b>${keyword}</b>".`, 'bot_error');
                    return;
                }

                if (searchTasks.length === 1) {
                    const task = searchTasks[0];
                    const { error: updErr } = await supabaseClient.from('tasks').update({ status: 'done' }).eq('id', task.id);
                    if (loadingMsg) loadingMsg.remove();
                    if (updErr) throw updErr;
                    addAIChatMessage(`<i class="fa-solid fa-check-double mr-2 text-emerald-500"></i> Tuyệt vời! Đã đánh dấu hoàn thành: <b>${task.description}</b>.`, 'bot_success');
                } else {
                    // Cần confirm nhưng tạm thời cập nhật cái đầu tiên để đơn giản, hoặc báo cụ thể hơn
                    const task = searchTasks[0];
                    const { error: updErr } = await supabaseClient.from('tasks').update({ status: 'done' }).eq('id', task.id);
                    if (loadingMsg) loadingMsg.remove();
                    if (updErr) throw updErr;
                    addAIChatMessage(`<i class="fa-solid fa-check-double mr-2 text-emerald-500"></i> Tìm thấy nhiều công việc. Đã đánh dấu hoàn thành: <b>${task.description}</b>.`, 'bot_success');
                }
                return;
            }

            // Xử lý Xem Danh Sách
            const { data: tasks, error: fetchErr } = await supabaseClient
                .from('tasks')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (loadingMsg) loadingMsg.remove();
            if (fetchErr) {
                addAIChatMessage(`<i class="fa-solid fa-triangle-exclamation mr-2 text-red-500"></i> Lỗi tải danh sách: ${fetchErr.message}`, 'bot_error');
                return;
            }

            if (!tasks || tasks.length === 0) {
                addAIChatMessage(`<i class="fa-solid fa-party-horn mr-2 text-emerald-500"></i> Bạn không có công việc nào đang chờ. Hãy nghỉ ngơi nhé!`, 'bot_success');
            } else {
                let html = `<div class="space-y-2.5"><div class="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-extrabold text-base border-b border-blue-200 dark:border-blue-800/50 pb-2"><i class="fa-solid fa-list-check text-lg"></i> DANH SÁCH CÔNG VIỆC CHƯA LÀM</div><ul class="space-y-2 text-sm mt-1">`;
                tasks.forEach((t, i) => {
                    const dateObj = new Date(t.created_at);
                    html += `<li class="flex items-start gap-2 bg-blue-50/50 dark:bg-slate-800/60 p-2 rounded border border-blue-100 dark:border-blue-900/30"><span>${i+1}.</span><div><span class="font-extrabold text-slate-800 dark:text-slate-100 text-sm">${t.description}</span><br><span class="text-slate-500 text-[10px]">${dateObj.toLocaleDateString('vi-VN')} ${dateObj.toLocaleTimeString('vi-VN')}</span></div></li>`;
                });
                html += `</ul><div class="text-[11px] text-slate-500 italic mt-2">💡 Gõ "Đã xong [tên việc]" để đánh dấu hoàn thành.</div></div>`;
                addAIChatMessage(html, 'bot_success');
            }
            return;
        }

        // A. CÂU HỎI THÔNG TIN CHỦ ĐỘNG: CẬN HẠN, HẾT HẠN, TỒN LÂU
        const isQueryExpired = cmdNoTones.includes('HET HAN') || cmdNoTones.includes('HET DATE') || cmdNoTones.includes('QUA HAN');
        const isQueryNearExpiry = cmdNoTones.includes('CAN HAN') || cmdNoTones.includes('CAN DATE') || cmdNoTones.includes('SAP HET HAN') || cmdNoTones.includes('SAP HET DATE') || cmdNoTones.includes('HAN DUNG') || cmdNoTones.includes('HAN SU DUNG');
        const isQuerySlowMoving = cmdNoTones.includes('LAU BAN') || cmdNoTones.includes('TON LAU') || cmdNoTones.includes('BAN CHAM') || cmdNoTones.includes('LAU CHUA BAN') || cmdNoTones.includes('CHAM BAN') || cmdNoTones.includes('LAU NGAY CHUA BAN') || cmdNoTones.includes('TON KHO LAU');
        const isQueryCatalogCleanup = cmdNoTones.includes('KHONG CON BAN')
            || cmdNoTones.includes('KHONG BAN')
            || cmdNoTones.includes('NGHI NGUNG BAN')
            || cmdNoTones.includes('DON DANH MUC')
            || cmdNoTones.includes('DON HANG HOA')
            || cmdNoTones.includes('HANG CAN XOA');

        if (isQueryCatalogCleanup) {
            if (loadingMsg) loadingMsg.remove();
            await window.showProductLifecycleCandidates(true);
            return;
        }

        if (isQueryExpired || isQueryNearExpiry || isQuerySlowMoving) {
            if (loadingMsg) loadingMsg.remove();
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const nearExpiryProducts = [];
            const slowMovingProducts = [];

            (window.currentProductsList || []).forEach(product => {
                const catName = product.product_categories?.name || product.categories?.name || '';
                const isCombo = catName.toLowerCase().includes('combo');
                const isDose = isDoseTaggedProduct(product);
                if (isCombo || isDose) return;

                (product.product_batches || []).forEach(batch => {
                    const stock = Number(batch.stock_quantity || 0);
                    if (stock <= 0) return;

                    if (batch.expiry_date) {
                        const expiry = new Date(`${batch.expiry_date}T00:00:00`);
                        if (!isNaN(expiry.getTime())) {
                            const daysLeft = Math.ceil((expiry - today) / 86400000);
                            if (daysLeft <= 90) {
                                nearExpiryProducts.push({ product, batch, daysLeft });
                            }
                        }
                    }

                    if (batch.created_at) {
                        const importDate = new Date(batch.created_at);
                        if (!isNaN(importDate.getTime())) {
                            const ageInDays = Math.floor((today - importDate) / 86400000);
                            if (ageInDays >= 30) {
                                slowMovingProducts.push({ product, batch, ageInDays });
                            }
                        }
                    }
                });
            });

            // Fallback: Lấy các lô hàng nhập trước cũ nhất để demo tính năng tồn lâu
            if (slowMovingProducts.length === 0 && (window.currentProductsList || []).length > 0) {
                const tempBatches = [];
                (window.currentProductsList || []).forEach(product => {
                    const catName = product.product_categories?.name || product.categories?.name || '';
                    if (catName.toLowerCase().includes('combo') || isDoseTaggedProduct(product)) return;

                    (product.product_batches || []).forEach(batch => {
                        const stock = Number(batch.stock_quantity || 0);
                        if (stock > 0 && batch.created_at) {
                            const importDate = new Date(batch.created_at);
                            if (!isNaN(importDate.getTime())) {
                                const ageInDays = Math.floor((today - importDate) / 86400000);
                                tempBatches.push({ product, batch, ageInDays });
                            }
                        }
                    });
                });
                tempBatches.sort((a, b) => new Date(a.batch.created_at) - new Date(b.batch.created_at));
                slowMovingProducts.push(...tempBatches.slice(0, 3));
            }

            if (isQueryExpired) {
                const expiredList = nearExpiryProducts.filter(item => item.daysLeft < 0);
                if (expiredList.length > 0) {
                    const html = `<div class="space-y-2.5"><div class="flex items-center gap-2 text-red-600 dark:text-red-400 font-extrabold text-base border-b border-red-200 dark:border-red-800/50 pb-2"><i class="fa-solid fa-circle-exclamation text-lg animate-pulse"></i> DANH SÁCH LÔ THUỐC HẾT HẠN</div>` + 
                        `<ul class="space-y-2 text-sm mt-1">` + expiredList
                        .slice(0, 5)
                        .map(item => `<li class="flex items-start gap-2 bg-red-50/50 dark:bg-red-950/20 p-2 rounded border border-red-100 dark:border-red-900/30"><span>•</span><div><span class="font-extrabold text-slate-800 dark:text-slate-100 text-sm">${item.product.name}</span> <span class="text-xs opacity-80">(Lô: ${item.batch.batch_number})</span><br><span class="text-red-500 font-bold text-xs">Đã hết hạn ${Math.abs(item.daysLeft)} ngày!</span></div></li>`)
                        .join('') + `</ul>` +
                        `<button onclick="window.dismissAlertById('expired', event)" class="mt-2.5 w-full py-1.5 bg-slate-100/80 hover:bg-emerald-500 hover:text-white dark:bg-slate-800/80 dark:hover:bg-emerald-600 transition-all rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1 shadow-sm"><i class="fa-solid fa-circle-check"></i> Đánh dấu đã xem hôm nay</button>` +
                        `</div>`;
                    addAIChatMessage(html, 'bot_success');
                } else {
                    addAIChatMessage(`<i class="fa-solid fa-shield-check mr-2 text-emerald-500"></i> Hiện tại kho hàng của bạn <b>không có lô thuốc nào bị hết hạn sử dụng!</b>`, 'bot_success');
                }
            } else if (isQueryNearExpiry) {
                const nearList = nearExpiryProducts.filter(item => item.daysLeft >= 0);
                if (nearList.length > 0) {
                    const html = `<div class="space-y-2.5"><div class="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-extrabold text-base border-b border-amber-200 dark:border-amber-800/50 pb-2"><i class="fa-solid fa-hourglass-half text-lg animate-spin animate-duration-1000"></i> DANH SÁCH LÔ THUỐC CẬN HẠN</div>` + 
                        `<ul class="space-y-2 text-sm mt-1">` + nearList
                        .slice(0, 5)
                        .map(item => `<li class="flex items-start gap-2 bg-amber-50/50 dark:bg-amber-950/20 p-2 rounded border border-amber-100 dark:border-amber-900/30"><span>•</span><div><span class="font-extrabold text-slate-800 dark:text-slate-100 text-sm">${item.product.name}</span> <span class="text-xs opacity-80">(Lô: ${item.batch.batch_number})</span><br><span class="text-amber-600 dark:text-amber-400 font-bold text-xs">Còn ${item.daysLeft} ngày (HSD: ${new Date(item.batch.expiry_date).toLocaleDateString('vi-VN')})</span></div></li>`)
                        .join('') + `</ul>` +
                        `<button onclick="window.dismissAlertById('near_expiry', event)" class="mt-2.5 w-full py-1.5 bg-slate-100/80 hover:bg-emerald-500 hover:text-white dark:bg-slate-800/80 dark:hover:bg-emerald-600 transition-all rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1 shadow-sm"><i class="fa-solid fa-circle-check"></i> Đánh dấu đã xem hôm nay</button>` +
                        `</div>`;
                    addAIChatMessage(html, 'bot_success');
                } else {
                    addAIChatMessage(`<i class="fa-solid fa-shield-check mr-2 text-emerald-500"></i> Thật tuyệt vời! Không có lô hàng nào sắp hết hạn sử dụng (<90 ngày).`, 'bot_success');
                }
            } else if (isQuerySlowMoving) {
                if (slowMovingProducts.length > 0) {
                    const html = `<div class="space-y-2.5"><div class="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-extrabold text-base border-b border-violet-200 dark:border-violet-800/50 pb-2"><i class="fa-solid fa-box text-lg"></i> HÀNG TỒN KHO LÂU CHƯA BÁN</div>` + 
                        `<ul class="space-y-2 text-sm mt-1">` + slowMovingProducts
                        .slice(0, 5)
                        .map(item => `<li class="flex items-start gap-2 bg-violet-50/50 dark:bg-violet-950/20 p-2 rounded border border-violet-100 dark:border-violet-900/30"><span>•</span><div><span class="font-extrabold text-slate-800 dark:text-slate-100 text-sm">${item.product.name}</span> <span class="text-xs opacity-80">(Lô: ${item.batch.batch_number})</span><br><span class="text-violet-500 font-bold text-xs">Đã nhập từ ${item.ageInDays > 0 ? item.ageInDays + ' ngày trước' : 'hôm nay (mẫu thử)'} chưa bán hết (Tồn: ${item.batch.stock_quantity})</span></div></li>`)
                        .join('') + `</ul>` +
                        `<button onclick="window.dismissAlertById('slow_moving', event)" class="mt-2.5 w-full py-1.5 bg-slate-100/80 hover:bg-emerald-500 hover:text-white dark:bg-slate-800/80 dark:hover:bg-emerald-600 transition-all rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1 shadow-sm"><i class="fa-solid fa-circle-check"></i> Đánh dấu đã xem hôm nay</button>` +
                        `</div>`;
                    addAIChatMessage(html, 'bot_success');
                } else {
                    addAIChatMessage(`<i class="fa-solid fa-shield-check mr-2 text-emerald-500"></i> Hàng hóa của bạn lưu kho đều rất đều đặn và không có hàng tồn lâu vượt kỳ hạn!`, 'bot_success');
                }
            }
            return;
        }

        // 1. LỆNH: SỬA TÊN (VD: Sửa tên X thành Y, Đổi X thành Y, Sửa X thành Y)
        const renameMatch = cmdNoTones.match(/(?:SUA|DOI)(?:\s+TEN)?(?:\s+THUOC)?\s+(.*?)\s+(?:THANH|TTHANHF|THAN|THANH)\s+(.*)/);
        
        // Cần đảm bảo đây không phải là lệnh sửa giá. Nếu có chữ GIA hoặc đích đến chỉ toàn số (như 1000, 20k) thì bỏ qua để xuống Sửa Giá.
        const isTargetNumber = renameMatch ? /^[\d\.\,Kk]+$/.test(renameMatch[2].trim()) : false;
        
        if (renameMatch && !cmdNoTones.includes('LO') && !cmdNoTones.includes('GIA') && !isTargetNumber) {
            const oldNameRaw = renameMatch[1].trim();
            // Lấy chính xác tên mới từ câu gốc để không bị mất dấu
            const newNameMatch = cmd.match(/(?:thành|tthanhf|than|thanh)\s+(.*)/i);
            const newName = newNameMatch ? newNameMatch[1].trim() : renameMatch[2].trim();

            const matchingProducts = findProductBySmartSearch(oldNameRaw);
            if (matchingProducts.length === 0) {
                throw new Error(`Không tìm thấy sản phẩm nào khớp với từ khóa "${oldNameRaw}".`);
            } else if (matchingProducts.length > 1) {
                const exactMatch = matchingProducts.find(p => removeTones(p.name) === oldNameRaw || p.product_code.toUpperCase() === oldNameRaw);
                if (exactMatch) await performNameUpdate(exactMatch, newName, loadingMsg);
                else promptProductSelection(matchingProducts, oldNameRaw, 'wait_for_product_selection_rename', { newName }, loadingMsg);
            } else {
                await performNameUpdate(matchingProducts[0], newName, loadingMsg);
            }
            return;
        }

        // 2. LỆNH: SỬA LÔ / ĐỔI LÔ
        const batchMatch = cmdNoTones.match(/(?:SUA|DOI) LO (.*?)\s+(?:THANH|TTHANHF|THAN)\s+(.*?)(?:\s+(?:CUA|THUOC)\s+(.*))?$/);
        if (batchMatch) {
            const oldBatch = batchMatch[1].trim();
            const newBatchRaw = batchMatch[2].trim();
            // Try extracting new batch with original case
            const newBatchStrMatch = cmd.match(/(?:thành|tthanhf|than|thanh)\s+(.*?)(?:\s+(?:của|thuốc)\s+|$)/i);
            const newBatch = newBatchStrMatch ? newBatchStrMatch[1].trim() : newBatchRaw;

            const productNameRaw = batchMatch[3] ? batchMatch[3].trim() : '';
            if (!productNameRaw) throw new Error("Vui lòng ghi rõ tên thuốc. Ví dụ: 'Sửa lô L01 thành L02 thuốc Panadol'.");

            const matchingProducts = findProductBySmartSearch(productNameRaw);
            if (matchingProducts.length === 0) {
                throw new Error(`Không tìm thấy sản phẩm khớp với "${productNameRaw}".`);
            } else if (matchingProducts.length > 1) {
                const exactMatch = matchingProducts.find(p => removeTones(p.name) === productNameRaw || p.product_code.toUpperCase() === productNameRaw);
                if (exactMatch) await performBatchUpdate(exactMatch, oldBatch, newBatch, loadingMsg);
                else promptProductSelection(matchingProducts, productNameRaw, 'wait_for_product_selection_rename_batch', { oldBatch, newBatch }, loadingMsg);
            } else {
                await performBatchUpdate(matchingProducts[0], oldBatch, newBatch, loadingMsg);
            }
            return;
        }

        // 3. LỆNH: XÓA LÔ
        const delBatchMatch = cmdNoTones.match(/XOA LO (.*?)\s+(?:CUA|THUOC)\s+(.*)/);
        if (delBatchMatch) {
            const batchNo = delBatchMatch[1].trim();
            const productNameRaw = delBatchMatch[2].trim();
            const matchingProducts = findProductBySmartSearch(productNameRaw);

            if (matchingProducts.length === 0) {
                throw new Error(`Không tìm thấy sản phẩm khớp với "${productNameRaw}".`);
            } else if (matchingProducts.length > 1) {
                promptProductSelection(matchingProducts, productNameRaw, 'wait_for_product_selection_delete_batch', { batchNo }, loadingMsg);
            } else {
                await performBatchDelete(matchingProducts[0], batchNo, loadingMsg);
            }
            return;
        }

        // 4. LỆNH: NGỪNG KINH DOANH / XÓA SẢN PHẨM
        const statusMatch = cmdNoTones.match(/(?:NGUNG KINH DOANH|XOA SAN PHAM|XOA THUOC|XOA)\s+(.*)/);
        if (statusMatch && !cmdNoTones.includes('LO') && !/\d+[K]/.test(cmdNoTones) && !cmdNoTones.includes('THANH')) {
            const isInactive = cmdNoTones.includes('NGUNG');
            const productNameRaw = statusMatch[1].trim();
            const matchingProducts = findProductBySmartSearch(productNameRaw);

            if (matchingProducts.length === 0) {
                throw new Error(`Không tìm thấy sản phẩm khớp với "${productNameRaw}".`);
            } else if (matchingProducts.length > 1) {
                const exactMatch = matchingProducts.find(p => removeTones(p.name) === productNameRaw || p.product_code.toUpperCase() === productNameRaw);
                if (exactMatch) {
                    if (loadingMsg) loadingMsg.remove();
                    if (window.openAddProductModal) {
                        window.openAddProductModal(exactMatch);
                        if (isInactive) {
                            const toggle = document.getElementById('add_is_active');
                            if (toggle) toggle.checked = false;
                            addAIChatMessage(`<i class="fa-solid fa-hand-pointer mr-2 text-blue-500"></i> Đã tắt kinh doanh <b>${exactMatch.name}</b>. Bấm Lưu để xác nhận.`, 'bot_success');
                        } else {
                            addAIChatMessage(`<i class="fa-solid fa-hand-pointer mr-2 text-blue-500"></i> Đã mở <b>${exactMatch.name}</b>. Hãy tự bấm nút Xóa.`, 'bot_success');
                        }
                    }
                } else {
                    promptProductSelection(matchingProducts, productNameRaw, isInactive ? 'wait_for_product_selection_status' : 'wait_for_product_selection_delete', {}, loadingMsg);
                }
            } else {
                if (loadingMsg) loadingMsg.remove();
                if (window.openAddProductModal) {
                    window.openAddProductModal(matchingProducts[0]);
                    if (isInactive) {
                        const toggle = document.getElementById('add_is_active');
                        if (toggle) toggle.checked = false;
                        addAIChatMessage(`<i class="fa-solid fa-hand-pointer mr-2 text-blue-500"></i> Đã tắt kinh doanh <b>${matchingProducts[0].name}</b>. Bấm Lưu để xác nhận.`, 'bot_success');
                    } else {
                        addAIChatMessage(`<i class="fa-solid fa-hand-pointer mr-2 text-blue-500"></i> Đã mở <b>${matchingProducts[0].name}</b>. Hãy tự bấm nút Xóa.`, 'bot_success');
                    }
                }
            }
            return;
        }

        // 5. LỆNH: SỬA/MỞ/XEM SẢN PHẨM (MỞ MODAL CHỈNH SỬA) - KHÔNG CÓ GIÁ TIỀN VÀ KHÔNG ĐỔI TÊN
        const isOpenEdit = cmdNoTones.includes('SUA') || cmdNoTones.includes('CHINH') || cmdNoTones.includes('MO') || cmdNoTones.includes('XEM') || cmdNoTones.includes('CAP NHAT') || cmdNoTones.includes('CHI TIET');
        const priceRegex = /(\b\d+K\b|\b\d{3,}\b|(?<=GIA\s+|BAN\s+|VON\s+|TIEN\s+)\b\d+\b)/i;
        const hasPrice = priceRegex.test(cmdNoTones);

        if (isOpenEdit && !cmdNoTones.includes('LO') && !cmdNoTones.includes('THANH') && !hasPrice) {
            // Loại bỏ các từ khóa hành động để tìm tên sản phẩm
            let productNameRaw = cmdNoTones.replace(/SUA|CHINH|MO|XEM|CAP\s+NHAT|CHI\s+TIET|SAN\s+PHAM|THUOC/gi, '').trim();
            
            // Loại bỏ một số cụm từ nói tự do ở cuối câu
            productNameRaw = productNameRaw.replace(/(?:BO\s+CHU\s+)?ROI\s+DI|BO\s+CHU|ROI\s+LUON|LUON\s+DI|XEM\s+SAO|NHANH\s+DI/gi, '').trim();

            if (!productNameRaw) throw new Error("Không nhận diện được tên sản phẩm cần mở.");

            const matchingProducts = findProductBySmartSearch(productNameRaw);

            if (matchingProducts.length === 0) {
                throw new Error(`Không tìm thấy sản phẩm nào khớp với từ khóa "${productNameRaw}".`);
            } else if (matchingProducts.length > 1) {
                const exactMatch = matchingProducts.find(p => removeTones(p.name) === productNameRaw || p.product_code.toUpperCase() === productNameRaw);
                if (exactMatch) {
                    if (loadingMsg) loadingMsg.remove();
                    if (window.openAddProductModal) {
                        window.openAddProductModal(exactMatch);
                        addAIChatMessage(`<i class="fa-solid fa-folder-open mr-2 text-emerald-500"></i> Đã tìm thấy chính xác sản phẩm: <b>${exactMatch.name}</b>. Đã mở bảng chỉnh sửa!`, 'bot_success');
                    }
                } else {
                    promptProductSelection(matchingProducts, productNameRaw, 'wait_for_product_selection_open', {}, loadingMsg);
                }
            } else {
                if (loadingMsg) loadingMsg.remove();
                if (window.openAddProductModal) {
                    window.openAddProductModal(matchingProducts[0]);
                    addAIChatMessage(`<i class="fa-solid fa-folder-open mr-2 text-emerald-500"></i> Đã mở bảng chỉnh sửa cho sản phẩm <b>${matchingProducts[0].name}</b>.`, 'bot_success');
                }
            }
            return;
        }

        // 6. LỆNH: SỬA GIÁ
        if (cmdNoTones.includes('SUA') || cmdNoTones.includes('CHINH') || cmdNoTones.includes('GIA') || hasPrice) {
            const priceMatch = cmdNoTones.match(priceRegex);
            if (!priceMatch) throw new Error("Không tìm thấy giá tiền hợp lệ. Thử: 'Sửa Panadol giá 20k'.");
            
            let rawPrice = priceMatch[1];
            let newPrice = rawPrice.includes('K') ? parseInt(rawPrice.replace('K', '')) * 1000 : parseInt(rawPrice);
            
            let productNameRaw = cmdNoTones.replace(/SUA|CHINH|GIA|BAN|VON|THANH/gi, '').replace(priceMatch[1], '').trim();
            if (!productNameRaw) throw new Error("Không nhận diện được tên sản phẩm.");

            const matchingProducts = findProductBySmartSearch(productNameRaw);
            
            if (matchingProducts.length === 0) {
                throw new Error(`Không tìm thấy sản phẩm nào khớp với từ khóa "${productNameRaw}".`);
            } else if (matchingProducts.length > 1) {
                const exactMatch = matchingProducts.find(p => removeTones(p.name) === productNameRaw || p.product_code.toUpperCase() === productNameRaw);
                if (exactMatch) await performPriceUpdate(exactMatch, newPrice, loadingMsg);
                else promptProductSelection(matchingProducts, productNameRaw, 'wait_for_product_selection_price', { price: newPrice }, loadingMsg);
            } else {
                await performPriceUpdate(matchingProducts[0], newPrice, loadingMsg);
            }
            return;
        }

        throw new Error("Tôi chưa hiểu lệnh này. Thử: 'Sửa X giá 20k', 'Nhắc tôi làm việc Y', 'Danh sách công việc'.");
    } catch (err) {
        if (loadingMsg) loadingMsg.remove();
        addAIChatMessage(`<i class="fa-solid fa-triangle-exclamation mr-2 text-red-500"></i> Lỗi: ${err.message}`, 'bot_error');
    }
};
