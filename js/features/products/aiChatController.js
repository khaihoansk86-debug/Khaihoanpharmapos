import { supabaseClient } from '../../core/supabase.js';
import { updateProductFull } from './productService.js';

// We rely on window.currentProductsList and window.loadProductsData from productController.js

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

window.startAIChatReminders = () => {
    const tooltip = document.getElementById('aiFloatingTooltip');
    const textEl = document.getElementById('aiFloatingText');
    if (!tooltip || !textEl) return;

    const today = new Date();
    const todayStr = `${today.getFullYear()}${(today.getMonth()+1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
    const dismissedList = JSON.parse(localStorage.getItem(`dismissed_alerts_${todayStr}`) || '[]');

    today.setHours(0, 0, 0, 0);

    const nearExpiryProducts = [];
    const slowMovingProducts = [];

    (window.currentProductsList || []).forEach(product => {
        const catName = product.product_categories?.name || product.categories?.name || '';
        const isCombo = catName.toLowerCase().includes('combo');
        const isDose = catName.toLowerCase().includes('cắt liều') || catName.toLowerCase().includes('thuốc liều') || product.product_code?.startsWith('DOSE-');
        if (isCombo || isDose) return;

        (product.product_batches || []).forEach(batch => {
            const stock = Number(batch.stock_quantity || 0);
            if (stock <= 0) return;

            // Kiểm tra cận hạn
            if (batch.expiry_date) {
                const expiry = new Date(`${batch.expiry_date}T00:00:00`);
                if (!isNaN(expiry.getTime())) {
                    const daysLeft = Math.ceil((expiry - today) / 86400000);
                    if (daysLeft <= 90) {
                        nearExpiryProducts.push({ product, batch, daysLeft });
                    }
                }
            }

            // Kiểm tra tồn kho lâu
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
            if (catName.toLowerCase().includes('combo') || catName.toLowerCase().includes('cắt liều') || product.product_code?.startsWith('DOSE-')) return;

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

    const messages = [];

    // Cảnh báo hết hạn
    if (nearExpiryProducts.length > 0) {
        const expiredCount = nearExpiryProducts.filter(item => item.daysLeft < 0).length;
        if (expiredCount > 0 && !dismissedList.includes('expired')) {
            messages.push({
                id: 'expired',
                text: `⚠️ Cảnh báo: Có ${expiredCount} lô thuốc ĐÃ HẾT HẠN! Click để xem.`,
                detailHtml: `<div class="space-y-2.5"><div class="flex items-center gap-2 text-red-600 dark:text-red-400 font-extrabold text-base border-b border-red-200 dark:border-red-800/50 pb-2"><i class="fa-solid fa-circle-exclamation text-lg animate-pulse"></i> DANH SÁCH LÔ THUỐC HẾT HẠN</div>` + 
                    `<ul class="space-y-2 text-sm mt-1">` + nearExpiryProducts
                    .filter(item => item.daysLeft < 0)
                    .slice(0, 3)
                    .map(item => `<li class="flex items-start gap-2 bg-red-50/50 dark:bg-red-950/20 p-2 rounded border border-red-100 dark:border-red-900/30"><span>•</span><div><span class="font-extrabold text-slate-800 dark:text-slate-100 text-sm">${item.product.name}</span> <span class="text-xs opacity-80">(Lô: ${item.batch.batch_number})</span><br><span class="text-red-500 font-bold text-xs">Đã hết hạn ${Math.abs(item.daysLeft)} ngày!</span></div></li>`)
                    .join('') + `</ul>` +
                    `<button onclick="window.dismissAlertById('expired', event)" class="mt-2.5 w-full py-1.5 bg-slate-100/80 hover:bg-emerald-500 hover:text-white dark:bg-slate-800/80 dark:hover:bg-emerald-600 transition-all rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1 shadow-sm"><i class="fa-solid fa-circle-check"></i> Đánh dấu đã xem hôm nay</button>` +
                    `</div>`
            });
        }

        // Cảnh báo cận hạn
        const nearCount = nearExpiryProducts.filter(item => item.daysLeft >= 0).length;
        if (nearCount > 0 && !dismissedList.includes('near_expiry')) {
            messages.push({
                id: 'near_expiry',
                text: `⏳ Cảnh báo: Có ${nearCount} lô thuốc cận hạn sử dụng (<90 ngày)!`,
                detailHtml: `<div class="space-y-2.5"><div class="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-extrabold text-base border-b border-amber-200 dark:border-amber-800/50 pb-2"><i class="fa-solid fa-hourglass-half text-lg animate-spin animate-duration-1000"></i> DANH SÁCH LÔ THUỐC CẬN HẠN</div>` + 
                    `<ul class="space-y-2 text-sm mt-1">` + nearExpiryProducts
                    .filter(item => item.daysLeft >= 0)
                    .slice(0, 3)
                    .map(item => `<li class="flex items-start gap-2 bg-amber-50/50 dark:bg-amber-950/20 p-2 rounded border border-amber-100 dark:border-amber-900/30"><span>•</span><div><span class="font-extrabold text-slate-800 dark:text-slate-100 text-sm">${item.product.name}</span> <span class="text-xs opacity-80">(Lô: ${item.batch.batch_number})</span><br><span class="text-amber-600 dark:text-amber-400 font-bold text-xs">Còn ${item.daysLeft} ngày (HSD: ${new Date(item.batch.expiry_date).toLocaleDateString('vi-VN')})</span></div></li>`)
                    .join('') + `</ul>` +
                    `<button onclick="window.dismissAlertById('near_expiry', event)" class="mt-2.5 w-full py-1.5 bg-slate-100/80 hover:bg-emerald-500 hover:text-white dark:bg-slate-800/80 dark:hover:bg-emerald-600 transition-all rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1 shadow-sm"><i class="fa-solid fa-circle-check"></i> Đánh dấu đã xem hôm nay</button>` +
                    `</div>`
            });
        }
    }

    // Nếu không có cảnh báo cận/hết hạn nào hoặc đã bỏ qua hết
    const hasActiveExpiry = nearExpiryProducts.length > 0 && 
        ((nearExpiryProducts.filter(item => item.daysLeft < 0).length > 0 && !dismissedList.includes('expired')) ||
         (nearExpiryProducts.filter(item => item.daysLeft >= 0).length > 0 && !dismissedList.includes('near_expiry')));

    if (!hasActiveExpiry) {
        messages.push({
            id: 'safe_expiry',
            text: `✅ An tâm: Kho hàng của bạn không có lô thuốc cận hạn/hết hạn!`,
            detailHtml: `<div class="space-y-2.5"><div class="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-base border-b border-emerald-200 dark:border-emerald-800/50 pb-2"><i class="fa-solid fa-shield-check text-lg"></i> TÌNH TRẠNG HẠN SỬ DỤNG</div>` + 
                `<div class="text-sm text-slate-600 dark:text-slate-300 mt-1 bg-emerald-50/30 dark:bg-emerald-950/10 p-3 rounded border border-emerald-100 dark:border-emerald-900/20">Tình trạng hạn sử dụng: <b class="text-emerald-600">Tốt!</b><br>Không phát hiện lô thuốc nào cận hạn sử dụng (<90 ngày) hoặc đã hết hạn chưa giải quyết trong kho hàng.</div></div>`
        });
    }

    // Cảnh báo tồn lâu chưa bán
    if (slowMovingProducts.length > 0 && !dismissedList.includes('slow_moving')) {
        messages.push({
            id: 'slow_moving',
            text: `📦 Lưu ý: Có ${slowMovingProducts.length} mặt hàng tồn lâu chưa bán! Click xem.`,
            detailHtml: `<div class="space-y-2.5"><div class="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-extrabold text-base border-b border-violet-200 dark:border-violet-800/50 pb-2"><i class="fa-solid fa-box text-lg"></i> HÀNG TỒN KHO LÂU CHƯA BÁN</div>` + 
                `<ul class="space-y-2 text-sm mt-1">` + slowMovingProducts
                .slice(0, 3)
                .map(item => `<li class="flex items-start gap-2 bg-violet-50/50 dark:bg-violet-950/20 p-2 rounded border border-violet-100 dark:border-violet-900/30"><span>•</span><div><span class="font-extrabold text-slate-800 dark:text-slate-100 text-sm">${item.product.name}</span> <span class="text-xs opacity-80">(Lô: ${item.batch.batch_number})</span><br><span class="text-violet-500 font-bold text-xs">Đã nhập từ ${item.ageInDays > 0 ? item.ageInDays + ' ngày trước' : 'hôm nay (mẫu thử)'} chưa bán hết (Tồn: ${item.batch.stock_quantity})</span></div></li>`)
                .join('') + `</ul>` +
                `<button onclick="window.dismissAlertById('slow_moving', event)" class="mt-2.5 w-full py-1.5 bg-slate-100/80 hover:bg-emerald-500 hover:text-white dark:bg-slate-800/80 dark:hover:bg-emerald-600 transition-all rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1 shadow-sm"><i class="fa-solid fa-circle-check"></i> Đánh dấu đã xem hôm nay</button>` +
                `</div>`
        });
    }

    // Lệnh AI cập nhật giá
    messages.push({
        id: 'ai_guide',
        text: `🤖 Trợ lý AI: Thử gõ 'Sửa Panadol giá bán 20k' để cập nhật nhanh!`,
        detailHtml: `<div class="space-y-2.5"><div class="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-extrabold text-base border-b border-blue-200 dark:border-blue-800/50 pb-2"><i class="fa-solid fa-robot text-lg"></i> TRỢ LÝ AI CẬP NHẬT GIÁ NHANH</div>` + 
            `<div class="text-sm text-slate-600 dark:text-slate-300 mt-1">Bạn có thể gõ trực tiếp các lệnh cập nhật nhanh tại ô nhập liệu:<br>` +
            `<div class="mt-2.5 space-y-1.5 bg-slate-100/50 dark:bg-slate-800/50 p-2.5 rounded border border-slate-200/50 dark:border-slate-700/50 text-xs italic font-semibold">` +
            `• "Sửa Panadol giá bán 20k"<br>` +
            `• "Đổi tên Panadol thành Panadol Extra"<br>` +
            `• "Ngừng kinh doanh thuốc ho"<br>` +
            `• "Nhắc tôi kiểm tra quầy hàng lúc 12h"` +
            `</div></div></div>`
    });

    let currentIndex = 0;
    const updateText = () => {
        if (messages.length === 0) {
            tooltip.classList.add('hidden');
            return;
        }
        if (currentIndex >= messages.length) currentIndex = 0;
        const activeMsg = messages[currentIndex];
        textEl.style.opacity = 0;

        // Cập nhật hiển thị và dữ liệu nút Đã xem trên Tooltip
        const dismissBtn = document.getElementById('aiDismissAlertBtn');
        if (dismissBtn) {
            if (activeMsg.id && ['expired', 'near_expiry', 'slow_moving'].includes(activeMsg.id)) {
                dismissBtn.classList.remove('hidden');
                dismissBtn.dataset.alertId = activeMsg.id;
            } else {
                dismissBtn.classList.add('hidden');
            }
        }

        setTimeout(() => {
            textEl.textContent = activeMsg.text;
            textEl.style.opacity = 1;
            tooltip.dataset.detail = activeMsg.detailHtml;
        }, 200);
        currentIndex = (currentIndex + 1) % messages.length;
    };

    updateText();
    if (window.aiReminderInterval) clearInterval(window.aiReminderInterval);
    window.aiReminderInterval = setInterval(updateText, 5000);
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

        if (isQueryExpired || isQueryNearExpiry || isQuerySlowMoving) {
            if (loadingMsg) loadingMsg.remove();
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const nearExpiryProducts = [];
            const slowMovingProducts = [];

            (window.currentProductsList || []).forEach(product => {
                const catName = product.product_categories?.name || product.categories?.name || '';
                const isCombo = catName.toLowerCase().includes('combo');
                const isDose = catName.toLowerCase().includes('cắt liều') || catName.toLowerCase().includes('thuốc liều') || product.product_code?.startsWith('DOSE-');
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
                    if (catName.toLowerCase().includes('combo') || catName.toLowerCase().includes('cắt liều') || product.product_code?.startsWith('DOSE-')) return;

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

            const matchingProducts = findProductsByKeyword(oldNameRaw);
            if (matchingProducts.length === 0) {
                throw new Error(`Không tìm thấy sản phẩm nào có chứa tên "${oldNameRaw}".`);
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

            const matchingProducts = findProductsByKeyword(productNameRaw);
            if (matchingProducts.length === 0) {
                throw new Error(`Không tìm thấy sản phẩm "${productNameRaw}".`);
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
            const matchingProducts = findProductsByKeyword(productNameRaw);

            if (matchingProducts.length === 0) {
                throw new Error(`Không tìm thấy sản phẩm "${productNameRaw}".`);
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
            const matchingProducts = findProductsByKeyword(productNameRaw);

            if (matchingProducts.length === 0) {
                throw new Error(`Không tìm thấy sản phẩm "${productNameRaw}".`);
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

        // 5. LỆNH: SỬA GIÁ
        if (cmdNoTones.includes('SUA') || cmdNoTones.includes('CHINH') || cmdNoTones.includes('GIA') || /\d+[K]/.test(cmdNoTones)) {
            const priceMatch = cmdNoTones.match(/(\d+[K]?)/);
            if (!priceMatch) throw new Error("Không tìm thấy giá tiền. Thử: 'Sửa Panadol giá 20k'.");
            
            let rawPrice = priceMatch[1];
            let newPrice = rawPrice.includes('K') ? parseInt(rawPrice.replace('K', '')) * 1000 : parseInt(rawPrice);
            
            let productNameRaw = cmdNoTones.replace(/SUA|CHINH|GIA|BAN|VON|THANH/gi, '').replace(priceMatch[1], '').trim();
            if (!productNameRaw) throw new Error("Không nhận diện được tên sản phẩm.");

            const matchingProducts = findProductsByKeyword(productNameRaw);
            
            if (matchingProducts.length === 0) {
                throw new Error(`Không tìm thấy sản phẩm nào tên là "${productNameRaw}".`);
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
