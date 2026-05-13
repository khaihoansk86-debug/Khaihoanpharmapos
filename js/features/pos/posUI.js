// js/features/pos/posUI.js

const vnd = (v) => new Intl.NumberFormat('vi-VN').format(v || 0) + 'đ';

/**
 * Render kết quả tìm kiếm sản phẩm trong POS
 */
export function renderPOSSearchResults(products) {
    const suggestions = document.getElementById('posSearchSuggestions');
    if (!suggestions) return;

    if (!products || products.length === 0) {
        suggestions.innerHTML = `
            <div class="p-8 text-center text-slate-400">
                <i class="fa-solid fa-box-open text-4xl mb-3 opacity-20"></i>
                <p class="text-sm font-medium">Không tìm thấy sản phẩm nào</p>
            </div>`;
        suggestions.classList.remove('hidden');
        return;
    }

    suggestions.innerHTML = products.map(p => {
        const baseUnit = p.product_units?.find(u => u.is_base_unit) || p.product_units?.[0] || {};
        const totalStock = p.product_batches?.reduce((sum, b) => sum + (b.stock_quantity || 0), 0) || 0;
        
        return `
        <div onclick="window.selectProduct('${p.product_code}')" 
             class="flex items-center justify-between p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0 group transition-all">
            <div class="flex flex-col gap-0.5">
                <span class="font-bold text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors">${p.name}</span>
                <span class="text-[10px] font-black uppercase text-slate-400 tracking-widest">${p.product_code} | ${p.active_ingredient || ''}</span>
                <div class="flex items-center gap-2 mt-1">
                    <span class="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-800/50">
                        <i class="fa-solid fa-warehouse mr-1"></i>Tồn: ${totalStock.toLocaleString('vi-VN')} ${baseUnit.unit_name || ''}
                    </span>
                </div>
            </div>
            <div class="text-right">
                <div class="font-black text-blue-600 dark:text-blue-400">${vnd(baseUnit.retail_price)}</div>
                <div class="text-[10px] text-slate-400 font-bold uppercase">${baseUnit.unit_name || 'Đơn vị'}</div>
            </div>
        </div>`;
    }).join('');

    suggestions.classList.remove('hidden');
}

/**
 * Render giỏ hàng POS
 */
export function renderCart(cart) {
    const cartBody = document.getElementById('cartBody');
    const emptyCart = document.getElementById('emptyCart');
    const itemCount = document.getElementById('cartItemCount');
    const totalItemsBadge = document.getElementById('totalItemsBadge');

    const returnSection = document.getElementById('returnSection');
    const returnCartBody = document.getElementById('returnCartBody');
    const returnTotalDisplay = document.getElementById('returnTotalDisplay');

    const normalItems = cart.filter(item => item.originalQuantity === undefined);
    const returnItems = cart.filter(item => item.originalQuantity !== undefined);

    if (cart.length === 0) {
        if (cartBody) cartBody.innerHTML = '';
        if (emptyCart) emptyCart.classList.remove('hidden');
        if (itemCount) itemCount.textContent = '0';
        if (totalItemsBadge) totalItemsBadge.textContent = '0 món';
        if (returnSection) returnSection.classList.add('hidden');
        updateTotals(0);
        return;
    }

    if (itemCount) itemCount.textContent = cart.length;
    if (totalItemsBadge) totalItemsBadge.textContent = `${cart.length} món`;

    let subtotal = 0;
    let returnTotal = 0;

    const generateItemHTML = (item, index, isReturn) => {
        const itemTotal = item.price * item.quantity;
        
        const returnInfo = isReturn ? `<div class="text-[10px] text-emerald-600 font-bold uppercase mt-1">Gốc: ${item.originalQuantity} | Có thể trả: ${item.maxReturnQuantity}</div>` : '';
        
        const batchOptions = (item.batches || []).map(b => {
            const expiryStr = b.expiry_date ? new Date(b.expiry_date).toLocaleDateString('vi-VN') : '';
            const selected = String(b.id) === String(item.batchId) ? 'selected' : '';
            return `<option value="${b.id}" ${selected}>Lô: ${b.batch_number} - HSD: ${expiryStr} - Tồn: ${b.stock_quantity}</option>`;
        }).join('');

        const batchDisplay = `
            <select onchange="window.selectBatchForItem('${item.cartId}', this.value)" 
                    class="mt-1 block w-full text-[10px] font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-none rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500 transition-all appearance-none cursor-pointer">
                ${batchOptions || '<option value="">Chưa có lô</option>'}
            </select>
        `;

        const deleteBtn = isReturn ? '' : `<button onclick="window.removeFromCart('${item.cartId}')" class="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><i class="fa-solid fa-circle-xmark"></i></button>`;

        return `
        <div class="grid grid-cols-12 gap-2 px-4 py-3 items-center border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
            <div class="col-span-1 text-center text-xs font-bold text-slate-400">${index + 1}</div>
            
            <div class="col-span-5 flex flex-col min-w-0">
                <div class="flex items-center gap-2">
                    <span class="font-bold text-sm text-slate-800 dark:text-white truncate">${item.name}</span>
                    ${deleteBtn}
                </div>
                <div class="flex items-center gap-2 mt-0.5">
                    <select onchange="window.updateItemUnit('${item.cartId}', this.value)" 
                            class="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 bg-transparent border-none p-0 focus:ring-0 cursor-pointer hover:underline">
                        ${item.units.map(u => `<option value="${u.unit_name}" ${u.unit_name === item.unit ? 'selected' : ''}>${u.unit_name}</option>`).join('')}
                    </select>
                </div>
                ${batchDisplay}
                ${returnInfo}
            </div>

            <div class="col-span-2 flex items-center justify-center">
                <div class="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                    <button onclick="window.updateQuantity('${item.cartId}', -1)" class="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors"><i class="fa-solid fa-minus text-[10px]"></i></button>
                    <input type="number" value="${item.quantity}" 
                           onchange="window.setItemQuantity('${item.cartId}', this.value)"
                           class="w-10 text-center bg-transparent border-none text-sm font-black p-0 focus:ring-0 text-slate-800 dark:text-white">
                    <button onclick="window.updateQuantity('${item.cartId}', 1)" class="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors"><i class="fa-solid fa-plus text-[10px]"></i></button>
                </div>
            </div>

            <div class="col-span-2 text-right font-bold text-xs text-slate-600 dark:text-slate-400">
                ${vnd(item.price)}
            </div>

            <div class="col-span-2 text-right font-black text-sm ${isReturn ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-white'}">
                ${isReturn ? '-' : ''}${vnd(itemTotal)}
            </div>
        </div>`;
    };

    if (normalItems.length > 0) {
        if (emptyCart) emptyCart.classList.add('hidden');
        cartBody.innerHTML = normalItems.map((item, index) => {
            subtotal += item.price * item.quantity;
            return generateItemHTML(item, index, false);
        }).join('');
    } else {
        if (emptyCart) emptyCart.classList.remove('hidden');
        if (cartBody) cartBody.innerHTML = '';
    }

    if (returnItems.length > 0) {
        if (returnSection) returnSection.classList.remove('hidden');
        if (returnCartBody) {
            returnCartBody.innerHTML = returnItems.map((item, index) => {
                returnTotal += item.price * item.quantity;
                return generateItemHTML(item, index, true);
            }).join('');
        }
        if (returnTotalDisplay) returnTotalDisplay.textContent = '-' + vnd(returnTotal);
    } else {
        if (returnSection) returnSection.classList.add('hidden');
    }

    updateTotals(subtotal - returnTotal);
}



/**
 * Render bảng chọn lô hàng cho một mặt hàng trong giỏ
 */
export function renderBatchPicker(item) {
    const pickerBody = document.getElementById('batchPickerBody');
    const productName = document.getElementById('batchPickerProductName');
    if (!pickerBody || !productName) return;

    productName.textContent = item.name;
    
    if (!item.batches || item.batches.length === 0) {
        pickerBody.innerHTML = '<div class="p-8 text-center text-slate-400">Không có dữ liệu lô hàng.</div>';
    } else {
        pickerBody.innerHTML = item.batches.map((batch, index) => {
            const isSelected = String(batch.id) === String(item.batchId);
            const isOldest = index === 0; // Giả định danh sách đã sort theo date tăng dần
            const expiryStr = batch.expiry_date ? new Date(batch.expiry_date).toLocaleDateString('vi-VN') : '---';
            const stockStr = batch.stock_quantity.toLocaleString('vi-VN');
            
            return `
            <div onclick="window.selectBatchForItem('${item.cartId}', '${batch.id}')"
                 class="p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4
                        ${isSelected ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300'}">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="font-black text-slate-800 dark:text-white">${batch.batch_number || 'Không mã'}</span>
                        ${isOldest ? '<span class="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-orange-500 text-white">Gợi ý (Cũ nhất)</span>' : ''}
                        ${isSelected ? '<i class="fa-solid fa-circle-check text-blue-600 text-lg"></i>' : ''}
                    </div>
                    <div class="flex items-center gap-4 text-xs font-bold">
                        <span class="text-slate-500 italic">HSD: <span class="text-orange-500">${expiryStr}</span></span>
                        <span class="text-slate-500 italic">Tồn: <span class="text-blue-600 dark:text-blue-400">${stockStr}</span></span>
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    document.getElementById('batchPickerModal').classList.remove('hidden');
}

function updateTotals(subtotal) {
    const discountEl = document.getElementById('discountAmount');
    const discount = parseInt(discountEl?.value || '0') || 0;
    const total = subtotal - discount;

    const subtotalEl = document.getElementById('subtotal');
    if (subtotalEl) subtotalEl.textContent = vnd(subtotal);

    const discountDisplay = document.getElementById('discount');
    if (discountDisplay) discountDisplay.textContent = vnd(discount);

    const totalDisplay = document.getElementById('totalFinalDisplay');
    if (totalDisplay) totalDisplay.textContent = vnd(total);

    updateChange();
}

export function updateChange() {
    const totalText = document.getElementById('totalFinalDisplay')?.textContent || '0';
    const total = parseInt(totalText.replace(/[^0-9]/g, '')) || 0;
    const received = parseInt(document.getElementById('amountReceived')?.value || '0') || 0;
    const change = Math.max(0, received - total);
    
    const changeEl = document.getElementById('changeAmount');
    if (changeEl) changeEl.textContent = vnd(change);
}

export function showSuccessModal(orderCode) {
    const modal = document.getElementById('paymentSuccessModal');
    const content = document.getElementById('successModalContent');
    const codeEl = document.getElementById('successOrderCode');
    
    if (modal && content && codeEl) {
        codeEl.textContent = `#${orderCode}`;
        modal.classList.remove('hidden');
        setTimeout(() => {
            content.classList.remove('scale-90', 'opacity-0');
            content.classList.add('scale-100', 'opacity-100');
        }, 10);
    }
}

export function closeSuccessModal() {
    const modal = document.getElementById('paymentSuccessModal');
    if (modal) modal.classList.add('hidden');
}
