// js/features/pos/posUI.js

/**
 * Hiển thị kết quả tìm kiếm sản phẩm trong POS
 */
export function renderPOSSearchResults(products, onSelect) {
    const container = document.getElementById('posSearchSuggestions');
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = `
            <div class="p-8 text-center text-slate-500">
                <i class="fa-solid fa-box-open text-4xl mb-2 opacity-20"></i>
                <p>Không tìm thấy sản phẩm nào</p>
            </div>
        `;
        container.classList.remove('hidden');
        return;
    }

    container.innerHTML = products.map(product => {
        const baseUnit = product.product_units?.find(u => u.is_base_unit) || {};
        const price = baseUnit.retail_price || 0;
        const stock = product.product_batches?.reduce((sum, b) => sum + (b.stock_quantity || 0), 0) || 0;
        
        return `
            <div class="p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border-b border-slate-100 dark:border-slate-700 flex items-center justify-between transition-colors group" 
                 onclick="window.selectProduct('${product.product_code}')">
                <div class="flex flex-col">
                    <span class="font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors">${product.name}</span>
                    <div class="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span class="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">${product.product_code}</span>
                        <span>ĐVT: <strong class="text-slate-700 dark:text-slate-300">${baseUnit.unit_name || 'N/A'}</strong></span>
                        <span>Tồn: <strong class="${stock <= 5 ? 'text-red-500' : 'text-green-600'}">${stock}</strong></span>
                    </div>
                </div>
                <div class="text-right">
                    <div class="font-bold text-blue-600 dark:text-blue-400">${new Intl.NumberFormat('vi-VN').format(price)}đ</div>
                </div>
            </div>
        `;
    }).join('');
    
    container.classList.remove('hidden');
}

/**
 * Hiển thị giỏ hàng
 */
export function renderCart(cartItems) {
    const cartBody = document.getElementById('cartBody');
    const emptyCart = document.getElementById('emptyCart');
    const cartItemCount = document.getElementById('cartItemCount');
    
    if (!cartBody) return;

    if (cartItems.length === 0) {
        cartBody.innerHTML = '';
        if (emptyCart) emptyCart.classList.remove('hidden');
        if (cartItemCount) cartItemCount.textContent = '0';
        updateSummary(0, 0);
        updateAIAnalysis([]); // Reset AI
        return;
    }

    if (emptyCart) emptyCart.classList.add('hidden');
    if (cartItemCount) cartItemCount.textContent = cartItems.length;

    let subtotal = 0;
    let totalItems = 0;

    cartBody.innerHTML = cartItems.map((item, index) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        totalItems += item.quantity;

        return `
            <div class="grid grid-cols-12 gap-2 px-4 py-4 items-center border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                <div class="col-span-1 text-center text-xs font-bold text-slate-400">${index + 1}</div>
                
                <div class="col-span-5 flex flex-col">
                    <span class="font-bold text-slate-800 dark:text-slate-200">${item.name}</span>
                    <div class="flex items-center gap-2 mt-1">
                        <select onchange="window.updateItemUnit('${item.id}', this.value)" 
                                class="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 border-none rounded px-1.5 py-0.5 focus:ring-0 outline-none font-bold uppercase">
                            ${item.units.map(u => `<option value="${u.unit_name}" ${u.unit_name === item.unit ? 'selected' : ''}>${u.unit_name}</option>`).join('')}
                        </select>
                        <span class="text-[10px] text-slate-400">${item.code}</span>
                    </div>
                </div>

                <div class="col-span-2 flex items-center justify-center gap-2">
                    <button onclick="window.updateQuantity('${item.id}', -1)" class="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-slate-500 hover:text-blue-600 transition-all">-</button>
                    <input type="number" value="${item.quantity}" onchange="window.setItemQuantity('${item.id}', this.value)"
                           class="w-12 text-center bg-transparent font-bold text-slate-800 dark:text-white border-b-2 border-transparent focus:border-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none">
                    <button onclick="window.updateQuantity('${item.id}', 1)" class="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-slate-500 hover:text-blue-600 transition-all">+</button>
                </div>

                <div class="col-span-2 text-right">
                    <span class="font-medium text-slate-600 dark:text-slate-400 text-sm">${new Intl.NumberFormat('vi-VN').format(item.price)}</span>
                </div>

                <div class="col-span-2 text-right relative flex items-center justify-end gap-3 pr-2">
                    <span class="font-bold text-slate-800 dark:text-white">${new Intl.NumberFormat('vi-VN').format(itemTotal)}</span>
                    <button onclick="window.removeFromCart('${item.id}')" class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all">
                        <i class="fa-solid fa-circle-xmark"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    updateSummary(subtotal, totalItems);
    updateAIAnalysis(cartItems);
}

/**
 * TRỢ LÝ AI: Phân tích giỏ hàng để đưa ra kịch bản tư vấn
 */
export function updateAIAnalysis(cart) {
    const suggestionsContainer = document.getElementById('aiSuggestions');
    if (!suggestionsContainer) return;

    if (cart.length === 0) {
        suggestionsContainer.innerHTML = `
            <div class="p-3 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-white dark:border-slate-700">
                <p class="text-[11px] text-slate-500 italic">Thêm sản phẩm để nhận tư vấn từ AI...</p>
            </div>`;
        return;
    }

    let html = '';
    const AI_RULES = [
        { 
            keyword: ['AUGMENTIN', 'AMOX', 'CEF', 'KHANG SINH'], 
            type: 'cross-sell', 
            content: 'Đơn có Kháng sinh: Mời khách mua thêm <span class="text-emerald-600 font-black underline">Men vi sinh</span> để tránh tiêu chảy.' 
        },
        { 
            keyword: ['PANADOL', 'PARACETAMOL'], 
            type: 'script', 
            content: 'Dặn khách: Không uống quá 8 viên/ngày. Tuyệt đối không uống rượu bia khi dùng thuốc.' 
        },
        { 
            keyword: ['AUGMENTIN'], 
            type: 'script', 
            content: 'Dặn khách: Uống ngay đầu bữa ăn để thuốc hấp thu tốt nhất và đỡ hại dạ dày.' 
        },
        { 
            keyword: ['LIỀU', 'LIEU'], 
            type: 'script', 
            content: 'Kịch bản: Hỏi kỹ khách có tiền sử dị ứng thuốc hay đang dùng thuốc điều trị mạn tính không.' 
        }
    ];

    let foundRules = [];
    cart.forEach(item => {
        const name = item.name.toUpperCase();
        AI_RULES.forEach(rule => {
            if (rule.keyword.some(k => name.includes(k))) {
                if (!foundRules.includes(rule.content)) {
                    foundRules.push(rule.content);
                    const bgColor = rule.type === 'cross-sell' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white';
                    const icon = rule.type === 'cross-sell' ? 'fa-lightbulb' : 'fa-comment-medical';
                    const title = rule.type === 'cross-sell' ? 'Gợi ý bán thêm' : 'Kịch bản tư vấn';
                    
                    html += `
                        <div class="p-3 ${bgColor} rounded-xl shadow-sm animate-in slide-in-from-right-2 duration-300">
                            <div class="flex items-center gap-2 mb-1 opacity-80">
                                <i class="fa-solid ${icon} text-[10px]"></i>
                                <span class="text-[9px] font-black uppercase tracking-tighter">${title}</span>
                            </div>
                            <p class="text-[11px] font-bold leading-tight">${rule.content}</p>
                        </div>`;
                }
            }
        });
    });

    if (!html) {
        html = `
            <div class="p-3 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-white dark:border-slate-700">
                <p class="text-[11px] text-slate-500">Giỏ hàng an toàn. Hãy tập trung tư vấn liều dùng chuẩn cho khách.</p>
            </div>`;
    }

    suggestionsContainer.innerHTML = html;
}

/**
 * Cập nhật bảng tính tiền
 */
export function updateSummary(subtotal, totalItems) {
    const subtotalEl = document.getElementById('subtotal');
    const totalItemsBadge = document.getElementById('totalItemsBadge');
    const totalFinalDisplay = document.getElementById('totalFinalDisplay');
    
    if (subtotalEl) subtotalEl.textContent = new Intl.NumberFormat('vi-VN').format(subtotal) + 'đ';
    if (totalItemsBadge) totalItemsBadge.textContent = totalItems + ' món';
    
    const discount = 0; // Tạm thời chưa xử lý giảm giá
    const final = subtotal - discount;
    
    if (totalFinalDisplay) {
        totalFinalDisplay.textContent = new Intl.NumberFormat('vi-VN').format(final);
    }
    
    updateChange();
}

/**
 * Cập nhật tiền thừa
 */
export function updateChange() {
    const totalFinalDisplay = document.getElementById('totalFinalDisplay');
    if (!totalFinalDisplay) return;
    
    const totalFinal = parseInt(totalFinalDisplay.textContent.replace(/[^0-9]/g, '')) || 0;
    const amountReceived = parseInt(document.getElementById('amountReceived').value) || 0;
    
    const change = amountReceived - totalFinal;
    const changeAmountEl = document.getElementById('changeAmount');
    
    if (changeAmountEl) {
        changeAmountEl.textContent = new Intl.NumberFormat('vi-VN').format(Math.max(0, change)) + 'đ';
        if (change < 0) {
            changeAmountEl.classList.remove('text-green-600', 'dark:text-green-500');
            changeAmountEl.classList.add('text-red-500');
        } else {
            changeAmountEl.classList.remove('text-red-500');
            changeAmountEl.classList.add('text-green-600', 'dark:text-green-500');
        }
    }
}

/**
 * Hiển thị modal thành công
 */
export function showSuccessModal(orderCode) {
    const modal = document.getElementById('paymentSuccessModal');
    const content = document.getElementById('successModalContent');
    const orderCodeEl = document.getElementById('successOrderCode');
    
    if (orderCodeEl) orderCodeEl.textContent = `#${orderCode}`;
    
    modal.classList.remove('hidden');
    setTimeout(() => {
        content.classList.remove('scale-90', 'opacity-0');
    }, 10);
}

/**
 * Đóng modal thành công
 */
export function closeSuccessModal() {
    const modal = document.getElementById('paymentSuccessModal');
    const content = document.getElementById('successModalContent');
    
    content.classList.add('scale-90', 'opacity-0');
    setTimeout(() => {
        modal.classList.add('hidden');
        window.location.reload(); // Reset cho đơn mới
    }, 300);
}
