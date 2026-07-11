import { fetchProducts, createCategory, fetchCategories, createProduct } from './productService.js';

let quickRowsCount = 0;

window.loadOneTimeProductsData = async () => {
    try {
        const products = await fetchProducts();
        const oneTimeProducts = products.filter(p => {
            if (p.description) {
                try {
                    const descObj = JSON.parse(p.description);
                    return descObj && descObj.is_one_time === true;
                } catch (e) {}
            }
            return false;
        });

        const pendingProducts = [];
        const bottomListProducts = [];

        oneTimeProducts.forEach(p => {
            const baseUnit = p.product_units?.find(u => u.is_base_unit) || {};
            // Nếu chưa có nhóm hàng, hoặc giá vốn = 0, thì coi là cần cập nhật
            if (!p.category_id || Number(baseUnit.cost_price || 0) === 0) {
                pendingProducts.push(p);
            }
            // Add ALL items (including pending) to the bottom list so they can track them
            bottomListProducts.push(p);
        });

        // Tự động gộp các sản phẩm trùng tên trong danh sách dưới (để hiển thị gọn gàng)
        const bottomMap = new Map();
        bottomListProducts.forEach(p => {
            const cleanName = p.name.replace('[CẦN CẬP NHẬT] ', '').trim().toLowerCase();
            if (!bottomMap.has(cleanName)) {
                bottomMap.set(cleanName, { ...p });
            } else {
                // Merge stock
                const existing = bottomMap.get(cleanName);
                if (!existing.product_batches || existing.product_batches.length === 0) existing.product_batches = [{ stock_quantity: 0 }];
                const existingStock = existing.product_batches.reduce((sum, b) => sum + (b.stock_quantity || 0), 0);
                const addStock = p.product_batches?.reduce((sum, b) => sum + (b.stock_quantity || 0), 0) || 0;
                existing.product_batches[0].stock_quantity = existingStock + addStock;
            }
        });
        
        renderOneTimeProductsList(Array.from(bottomMap.values()));

        const rowsContainer = document.getElementById('quick-add-rows');
        if (rowsContainer) {
            let hasUserInput = false;
            rowsContainer.querySelectorAll('.quick-row-item').forEach(r => {
                if (r.querySelector('.quick-name').value.trim() !== '') hasUserInput = true;
            });
            
            if (!hasUserInput) {
                rowsContainer.innerHTML = '';
                quickRowsCount = 0;
                
                // Hiển thị TẤT CẢ các pending products lên bảng (không giới hạn, không gộp trước)
                pendingProducts.forEach(p => {
                    const baseUnit = p.product_units?.find(u => u.is_base_unit) || {};
                    window.addQuickRow({
                        id: p.id,
                        product_id: p.id,
                        duplicateIds: p.id, // Only itself initially
                        product_name: p.name,
                        unit_name: baseUnit.unit_name || 'Viên',
                        unit_price: baseUnit.retail_price || 0,
                        cost_price: baseUnit.cost_price || 0,
                        stock_quantity: p.product_batches?.[0]?.stock_quantity || 0,
                        category_id: p.category_id
                    });
                });
                
                // Ensure at least 3 rows exist total
                while (rowsContainer.children.length < 3) {
                    window.addQuickRow();
                }
            }
        }

    } catch (error) {
        console.error("Lỗi khi tải dữ liệu hàng bán 1 lần:", error);
        window.showToast?.("Lỗi khi tải danh sách: " + error.message, "error");
    }
};

function renderOneTimeProductsList(products) {
    const container = document.getElementById('one-time-products-list-container');
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="7" class="py-8 text-center text-slate-500 font-medium bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    Chưa có mặt hàng bán một lần nào trong kho.
                </td>
            </tr>
        `;
        return;
    }

    container.innerHTML = products.map(p => {
        const baseUnit = p.product_units?.find(u => u.is_base_unit) || {};
        const batches = p.product_batches || [];
        const totalStock = batches.reduce((sum, b) => sum + Number(b.stock_quantity || 0), 0);
        
        let expiryText = 'Không quản lý lô';
        const expiringBatch = batches.find(b => b.is_tracked);
        if (expiringBatch && expiringBatch.expiry_date !== '2099-12-31') {
            expiryText = new Date(expiringBatch.expiry_date).toLocaleDateString('vi-VN');
        }

        const moneyFmt = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

        return `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <td class="py-3 px-4 font-mono font-bold text-slate-500 text-xs">${p.product_code}</td>
                <td class="py-3 px-4 font-bold text-slate-800 dark:text-white">${p.name}</td>
                <td class="py-3 px-4 text-right font-bold text-slate-600 dark:text-slate-400">${moneyFmt.format(baseUnit.cost_price || 0)}</td>
                <td class="py-3 px-4 text-right font-bold text-blue-600 dark:text-blue-400">${moneyFmt.format(baseUnit.retail_price || 0)}</td>
                <td class="py-3 px-4 text-black ${totalStock > 0 ? 'text-slate-800 dark:text-white' : 'text-red-500'}">${totalStock} ${baseUnit.unit_name || 'ĐVT'}</td>
                <td class="py-3 px-4 text-xs font-bold text-slate-500">${expiryText}</td>
                <td class="py-3 px-4 text-center">
                    <button onclick="window.deleteProduct('${p.id}', '${p.name.replace(/'/g, "\\'")}')" class="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-900/20 text-red-600 flex items-center justify-center transition-colors mx-auto" title="Xóa mặt hàng">
                        <i class="fa-solid fa-trash-can text-xs"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

window.addQuickRow = (posData = null) => {
    const container = document.getElementById('quick-add-rows');
    if (!container) return;

    quickRowsCount++;
    const rowId = `quick-row-${quickRowsCount}`;
    const tr = document.createElement('tr');
    tr.id = rowId;
    tr.className = 'quick-row-item hover:bg-slate-50/70 dark:hover:bg-slate-950/40 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2';
    
    if (posData) {
        tr.dataset.posItemId = posData.id;
        tr.dataset.productId = posData.product_id;
        if (posData.duplicateIds) tr.dataset.duplicateIds = posData.duplicateIds;
        tr.dataset.orderId = posData.order_id;
        tr.dataset.qtySold = posData.quantity;
        // Make it obvious it's from POS
        tr.classList.add('bg-rose-50/30', 'dark:bg-rose-900/10');
    }

    const nameValue = posData ? posData.product_name.replace('[CẦN CẬP NHẬT] ', '').replace(/"/g, '&quot;') : '';
    const unitValue = posData ? (posData.unit_name || 'Viên') : 'Viên';
    const retailValue = posData ? (posData.unit_price || 0) : '';
    const costValue = posData && posData.cost_price ? posData.cost_price : '';
    const stockValue = posData && posData.stock_quantity ? posData.stock_quantity : '';
    
    const orderType = posData?.orders?.order_type || 'sale';
    const isOneTime = true;
    const isDoseCut = orderType === 'dose_cut';
    const isEcommerce = orderType === 'ecommerce';
    const isInternal = orderType === 'internal';

    // Category dropdown options
    const categories = window.categoriesList || [];
    const catOptions = `<option value="">-- Chọn nhóm hàng --</option>` + categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    
    setTimeout(() => {
        if (posData && posData.category_id) {
            const sel = document.getElementById(rowId).querySelector('.quick-category');
            if (sel) sel.value = posData.category_id;
        }
    }, 10);
    
    tr.innerHTML = `
        <td class="py-4 px-4 text-center font-black text-slate-400 text-sm align-top pt-6">${container.children.length + 1}</td>
        <td class="py-3 px-3 align-top">
            <div class="flex flex-col gap-3">
                <input type="text" class="quick-name w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm" required placeholder="Tên mặt hàng..." value="${nameValue}">
                
                <div class="flex items-center gap-3">
                    <select class="quick-category w-1/3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all shadow-sm">
                        ${catOptions}
                    </select>
                    
                    <div class="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                        <label class="cursor-pointer flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white dark:hover:bg-slate-700 transition-colors">
                            <input type="checkbox" class="quick-tag-onetime w-4 h-4 text-emerald-500 border-slate-300 rounded focus:ring-emerald-500" ${isOneTime ? 'checked' : ''}>
                            <span class="text-xs font-black text-slate-600 dark:text-slate-300">1 Lần</span>
                        </label>
                        <label class="cursor-pointer flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white dark:hover:bg-slate-700 transition-colors">
                            <input type="checkbox" class="quick-tag-dose w-4 h-4 text-purple-500 border-slate-300 rounded focus:ring-purple-500" ${isDoseCut ? 'checked' : ''}>
                            <span class="text-xs font-black text-slate-600 dark:text-slate-300">Cắt liều</span>
                        </label>
                        <label class="cursor-pointer flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white dark:hover:bg-slate-700 transition-colors">
                            <input type="checkbox" class="quick-tag-ecom w-4 h-4 text-orange-500 border-slate-300 rounded focus:ring-orange-500" ${isEcommerce ? 'checked' : ''}>
                            <span class="text-xs font-black text-slate-600 dark:text-slate-300">TMĐT</span>
                        </label>
                        <label class="cursor-pointer flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white dark:hover:bg-slate-700 transition-colors">
                            <input type="checkbox" class="quick-tag-internal w-4 h-4 text-slate-500 border-slate-300 rounded focus:ring-slate-500" ${isInternal ? 'checked' : ''}>
                            <span class="text-xs font-black text-slate-600 dark:text-slate-300">Nội bộ</span>
                        </label>
                    </div>
                </div>
            </div>
            ${posData ? `<div class="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-100 dark:bg-rose-900/40 text-[10px] text-rose-600 dark:text-rose-400 font-black border border-rose-200 dark:border-rose-800"><i class="fa-solid fa-bolt animate-pulse"></i> TỪ POS (SL: ${posData.quantity})</div>` : ''}
        </td>
        <td class="py-3 px-2 align-top pt-4">
            <input type="text" class="quick-unit w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm text-center" required value="${unitValue}" placeholder="Viên...">
        </td>
        <td class="py-3 px-2 align-top pt-4">
            <input type="number" class="quick-cost w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-mono font-medium text-right text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm" min="0" placeholder="0" value="">
        </td>
        <td class="py-3 px-2 align-top pt-4">
            <input type="number" class="quick-retail w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-mono font-black text-right text-blue-600 dark:text-blue-400 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm" required min="0" placeholder="0" value="${retailValue}">
        </td>
        <td class="py-3 px-2 align-top pt-4">
            <div class="quick-conversions-list flex flex-col gap-2"></div>
            <button type="button" class="add-conversion-unit-btn mt-2.5 text-xs font-black uppercase text-emerald-600 hover:text-emerald-700 dark:text-emerald-450 dark:hover:text-emerald-400 flex items-center justify-center gap-1.5 transition-colors w-full py-2 rounded-lg border-2 border-dashed border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                <i class="fa-solid fa-plus-circle"></i> Thêm ĐVT
            </button>
        </td>
        <td class="py-3 px-2 align-top pt-4">
            <input type="number" class="quick-stock w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-mono font-black text-right text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm" min="0" placeholder="0" value="">
        </td>
        <td class="py-3 px-2 align-top pt-4">
            <input type="date" class="quick-expiry w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-600 dark:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm">
        </td>
        <td class="py-3 px-4 text-center align-top pt-4">
            <button type="button" onclick="window.removeQuickRow('${rowId}')" class="w-10 h-10 flex items-center justify-center rounded-xl text-rose-500 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors shadow-sm">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </td>
    `;

    container.appendChild(tr);
    
    const addConvBtn = tr.querySelector('.add-conversion-unit-btn');
    if (addConvBtn) {
        addConvBtn.addEventListener('click', () => {
            const convList = tr.querySelector('.quick-conversions-list');
            const convItem = document.createElement('div');
            convItem.className = 'conversion-item flex items-center gap-1.5 animate-in slide-in-from-left-2 p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700';
            convItem.innerHTML = `
                <span class="text-[10px] font-black text-slate-400">1</span>
                <input type="text" class="quick-large-unit w-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded text-xs px-1.5 py-1.5 text-center font-bold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-sm" placeholder="Hộp...">
                <span class="text-[10px] font-black text-slate-400">=</span>
                <input type="number" class="quick-conversion w-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded text-xs px-1.5 py-1.5 text-center font-mono font-black focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-sm" placeholder="SL">
                <button type="button" onclick="this.parentElement.remove()" class="text-rose-400 hover:text-rose-600 dark:hover:text-rose-400 ml-auto mr-1 p-1"><i class="fa-solid fa-times text-sm"></i></button>
            `;
            convList.appendChild(convItem);
        });
    }

    reindexQuickRows();
};

window.removeQuickRow = (rowId) => {
    const row = document.getElementById(rowId);
    if (!row) return;

    row.classList.add('animate-out', 'fade-out', 'slide-out-to-left-4', 'duration-200');
    setTimeout(() => {
        row.remove();
        reindexQuickRows();
        
        // Luôn đảm bảo có ít nhất 1 dòng
        const container = document.getElementById('quick-add-rows');
        if (container && container.children.length === 0) {
            window.addQuickRow();
        }
    }, 180);
};

function reindexQuickRows() {
    const container = document.getElementById('quick-add-rows');
    if (!container) return;

    Array.from(container.children).forEach((tr, index) => {
        const firstTd = tr.querySelector('td');
        if (firstTd) firstTd.textContent = index + 1;
    });

    const badge = document.getElementById('quick-items-count-badge');
    if (badge) {
        badge.textContent = `${container.children.length} dòng đang soạn thảo`;
    }
}

window.submitQuickAddOneTimeProducts = async () => {
    const container = document.getElementById('quick-add-rows');
    if (!container) return;

    const rows = container.querySelectorAll('.quick-row-item');
    const productsToCreate = [];

    // Lọc lấy các hàng có tên sản phẩm hợp lệ và GỘP các hàng trùng tên
    const productsMap = new Map();
    
    rows.forEach(row => {
        const productId = row.dataset.productId;
        const name = row.querySelector('.quick-name').value.trim();
        const categoryId = row.querySelector('.quick-category')?.value;
        const unit = row.querySelector('.quick-unit').value.trim() || 'Viên';
        const costPrice = parseFloat(row.querySelector('.quick-cost').value) || 0;
        const retailPrice = parseFloat(row.querySelector('.quick-retail').value) || 0;
        const stock = parseFloat(row.querySelector('.quick-stock').value) || 0;
        const expiry = row.querySelector('.quick-expiry').value;

        const conversions = [];
        row.querySelectorAll('.conversion-item').forEach(itemEl => {
            const largeUnit = itemEl.querySelector('.quick-large-unit').value.trim();
            const conversionRate = parseFloat(itemEl.querySelector('.quick-conversion').value) || 1;
            if (largeUnit && conversionRate > 1) {
                conversions.push({ largeUnit, conversionRate });
            }
        });

        if (name) {
            const cleanKey = name.toLowerCase();
            if (!productsMap.has(cleanKey)) {
                productsMap.set(cleanKey, {
                    duplicateIds: productId ? [productId] : [],
                    productId: productId, // keep the first one as primary
                    name, unit, costPrice, retailPrice, conversions, stock, expiry, categoryId
                });
            } else {
                // Đã có hàng trùng tên -> Gộp duplicateIds và cộng dồn tồn kho
                const existing = productsMap.get(cleanKey);
                if (productId) existing.duplicateIds.push(productId);
                existing.stock += stock;
                // Nếu dòng trước chưa có category, ưu tiên lấy category của dòng sau
                if (!existing.categoryId && categoryId) existing.categoryId = categoryId;
                if (existing.costPrice === 0 && costPrice > 0) existing.costPrice = costPrice;
            }
        }
    });

    // Chuyển map về array và join duplicateIds
    productsMap.forEach(item => {
        item.duplicateIds = item.duplicateIds.join(',');
        productsToCreate.push(item);
    });

    if (productsToCreate.length === 0) {
        window.showToast?.("Vui lòng điền thông tin của ít nhất 1 mặt hàng!", "error");
        return;
    }

    // Đẩy nút lưu về trạng thái loading
    const submitBtn = document.getElementById('submitQuickAddBtn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Đang tạo sản phẩm...';
    }
    window.showLoading?.("Đang tạo hàng loạt sản phẩm bán 1 lần...");

    try {
        // Tìm hoặc tạo nhóm hàng đặc thù "Quà tặng / Khuyến mãi" để gom nhóm quản lý
        const categories = await fetchCategories();
        let promoCategory = categories.find(cat => cat.name === 'Quà tặng / Khuyến mãi');
        if (!promoCategory) {
            promoCategory = await createCategory('Quà tặng / Khuyến mãi');
        }

        const categoryId = promoCategory.id;

        const defaultCategoryId = promoCategory.id;
        const { supabaseClient } = await import('../../core/supabase.js');

        for (const item of productsToCreate) {
            const finalCategoryId = item.categoryId || defaultCategoryId;
            const cleanName = item.name.replace('[CẦN CẬP NHẬT] ', '');

            const unitsData = [
                {
                    unit_name:       item.unit,
                    retail_price:    item.retailPrice,
                    cost_price:      item.costPrice,
                    conversion_rate: 1,
                    is_base_unit:    true
                }
            ];

            item.conversions.forEach(c => {
                unitsData.push({
                    unit_name:       c.largeUnit,
                    retail_price:    item.retailPrice * c.conversionRate,
                    cost_price:      item.costPrice * c.conversionRate,
                    conversion_rate: c.conversionRate,
                    is_base_unit:    false
                });
            });

            const batchData = [{
                batch_number:   'Lô KM',
                expiry_date:    item.expiry || '2099-12-31',
                stock_quantity: item.stock,
                is_tracked:     Boolean(item.expiry)
            }];

            if (item.productId) {
                // UPDATE existing product(s) (handling duplicates)
                const idsToUpdate = item.duplicateIds ? item.duplicateIds.split(',') : [item.productId];
                
                for (const pid of idsToUpdate) {
                    const productData = {
                        name: cleanName,
                        category_id: finalCategoryId
                    };
                    
                    await supabaseClient.from('products').update(productData).eq('id', pid);
                    
                    await supabaseClient.from('product_units').delete().eq('product_id', pid);
                    await supabaseClient.from('product_units').insert(unitsData.map(u => ({ ...u, product_id: pid })));
                    
                    const { data: existingBatches } = await supabaseClient.from('product_batches').select('id, is_tracked').eq('product_id', pid);
                    if (existingBatches && existingBatches.length > 0) {
                        await supabaseClient.from('product_batches').update({
                            stock_quantity: item.stock,
                            expiry_date: batchData[0].expiry_date,
                            is_tracked: batchData[0].is_tracked
                        }).eq('id', existingBatches[0].id);
                    } else {
                        await supabaseClient.from('product_batches').insert([{ ...batchData[0], product_id: pid }]);
                    }
                }
                
            } else {
                // CREATE new product
                const randomSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
                const productCode = KM;

                const productData = {
                    name:              cleanName,
                    product_code:      productCode,
                    category_id:       finalCategoryId,
                    is_active:         true,
                    is_ecommerce:      false,
                    is_direct_sale:    true,
                    is_component_item: false,
                    description:       JSON.stringify({ is_one_time: true })
                };

                await createProduct(productData, unitsData, batchData);
            }
        }

        window.showToast?.(`Đã thêm thành công ${productsToCreate.length} sản phẩm bán 1 lần!`, "success");
        // Reset bảng nhập nhanh
        container.innerHTML = '';
        quickRowsCount = 0;
        window.addQuickRow();
        window.addQuickRow();
        window.addQuickRow();

        // Tải lại danh sách
        await window.loadOneTimeProductsData();

    } catch (error) {
        console.error("Lỗi khi thêm hàng loạt sản phẩm một lần:", error);
        window.showToast?.("Lỗi: " + error.message, "error", 5000);
    } finally {
        const actualSubmitBtn = document.getElementById('submitQuickAddBtn');
        if (actualSubmitBtn) {
            actualSubmitBtn.disabled = false;
            actualSubmitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> LƯU TẤT CẢ SẢN PHẨM';
        }
        window.hideLoading?.();
    }
};


// --- POS Pending Custom Items Processing Logic ---
window.posPendingCustomItemsList = [];

window.fetchPosPendingCustomItems = async () => {
    try {
        const { supabaseClient } = await import('../../core/supabase.js');
        const todayStr = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabaseClient
            .from('order_items')
            .select('*, orders(order_type)')
            .like('product_name', '[CẦN CẬP NHẬT]%');
            
        if (error) throw error;
        
        window.posPendingCustomItemsList = data || [];
        
        // CLEAR empty rows and inject POS data directly into Quick Add table
        const container = document.getElementById('quick-add-rows');
        if (container) {
            // Only clear if the user hasn't typed anything in the empty rows
            let hasUserInput = false;
            container.querySelectorAll('.quick-row-item').forEach(r => {
                if (r.querySelector('.quick-name').value.trim() !== '') hasUserInput = true;
            });
            if (!hasUserInput) {
                container.innerHTML = '';
                quickRowsCount = 0;
            }
        }
        
        window.posPendingCustomItemsList.forEach(item => {
            window.addQuickRow(item);
        });
        
        // Ensure at least 3 rows exist total
        if (container) {
            while (container.children.length < 3) {
                window.addQuickRow();
            }
        }
    } catch (err) {
        console.error('Lỗi tải hàng ngoài DM chờ xử lý:', err);
    }
};

window.renderPosPendingCustomItemsUI = () => {
    const container = document.getElementById('pos-pending-custom-items-container');
    const section = document.getElementById('pos-pending-custom-items-section');
    if (!container || !section) return;
    
    if (window.posPendingCustomItemsList.length === 0) {
        section.classList.add('hidden');
        return;
    }
    
    section.classList.remove('hidden');
    
    const categories = window.categoriesList || [];
    const catOptions = `<option value="">-- Chá»n nhÃ³m hÃ ng --</option>` + categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    
    container.innerHTML = window.posPendingCustomItemsList.map(item => {
        const orderType = item.orders?.order_type || 'sale';
        
        let typeBadge = '';
        if (orderType === 'dose_cut') typeBadge = '<span class="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-black uppercase tracking-wider">Phiáº¿u xuáº¥t: Cáº¯t liá»u</span>';
        else if (orderType === 'ecommerce') typeBadge = '<span class="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-[10px] font-black uppercase tracking-wider">Phiáº¿u xuáº¥t: TMÄT</span>';
        else if (orderType === 'internal') typeBadge = '<span class="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-black uppercase tracking-wider">Phiáº¿u xuáº¥t: Ná»™i bá»™</span>';
        else typeBadge = '<span class="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-black uppercase tracking-wider">BÃ¡n thÆ°á»ng</span>';
        
        const isOneTime = true;
        const isDoseCut = orderType === 'dose_cut';
        const isEcommerce = orderType === 'ecommerce';
        const isInternal = orderType === 'internal';

        return `
        <div class="p-5 border border-rose-100 dark:border-rose-900/30 rounded-xl bg-white dark:bg-slate-900 hover:shadow-md transition-shadow relative overflow-hidden" id="posPendingItemCard_${item.id}">
            <div class="absolute left-0 top-0 bottom-0 w-1 bg-rose-500"></div>
            <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pl-2">
                
                <!-- Left: Original Order Info -->
                <div class="flex-1 min-w-[250px]">
                    <div class="flex items-center gap-2 mb-2">
                        ${typeBadge}
                        <div class="text-[10px] text-slate-400 flex items-center gap-1"><i class="fa-regular fa-clock"></i> BÃ¡n lÃºc: ${new Date(item.created_at).toLocaleTimeString('vi-VN')}</div>
                    </div>
                    <div class="font-black text-lg text-slate-800 dark:text-white flex items-center gap-2 mb-2">
                        <i class="fa-solid fa-box-open text-rose-500"></i>
                        ${item.product_name.replace('[Cáº¦N Cáº¬P NHáº¬T] ', '')}
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold border border-emerald-200 dark:border-emerald-800/50">ÄÃ£ bÃ¡n: ${item.quantity} ${item.unit_name}</span>
                        <span class="text-xs font-medium text-slate-500">Doanh thu ghi nháº­n: <span class="font-mono font-bold text-blue-600 dark:text-blue-400">${new Intl.NumberFormat('vi-VN').format(item.total_price)}Ä‘</span></span>
                    </div>
                </div>
                
                <!-- Right: Input Form -->
                <div class="flex-1 w-full lg:w-auto bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                    
                    <!-- Top Row: Category and Tags -->
                    <div class="flex flex-col md:flex-row gap-4">
                        <div class="flex-1">
                            <label class="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">NhÃ³m hÃ ng <span class="text-red-500">*</span></label>
                            <select id="pendingCategory_${item.id}" class="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 dark:text-white focus:border-rose-500 transition-all">
                                ${catOptions}
                            </select>
                        </div>
                        <div class="flex-1 flex items-end gap-2 flex-wrap">
                            <label class="cursor-pointer flex items-center gap-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                                <input type="checkbox" id="pendingTag_one_time_${item.id}" ${isOneTime ? 'checked' : ''} class="w-3 h-3 text-rose-500 rounded focus:ring-rose-500">
                                <span class="text-[10px] font-bold text-slate-600 dark:text-slate-300">1 Láº§n</span>
                            </label>
                            <label class="cursor-pointer flex items-center gap-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                                <input type="checkbox" id="pendingTag_dose_cut_${item.id}" ${isDoseCut ? 'checked' : ''} class="w-3 h-3 text-purple-500 rounded focus:ring-purple-500">
                                <span class="text-[10px] font-bold text-slate-600 dark:text-slate-300">Cáº¯t liá»u</span>
                            </label>
                            <label class="cursor-pointer flex items-center gap-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                                <input type="checkbox" id="pendingTag_ecommerce_${item.id}" ${isEcommerce ? 'checked' : ''} class="w-3 h-3 text-orange-500 rounded focus:ring-orange-500">
                                <span class="text-[10px] font-bold text-slate-600 dark:text-slate-300">TMÄT</span>
                            </label>
                            <label class="cursor-pointer flex items-center gap-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                                <input type="checkbox" id="pendingTag_internal_${item.id}" ${isInternal ? 'checked' : ''} class="w-3 h-3 text-slate-500 rounded focus:ring-slate-500">
                                <span class="text-[10px] font-bold text-slate-600 dark:text-slate-300">Ná»™i bá»™</span>
                            </label>
                        </div>
                    </div>

                    <!-- Bottom Row: Units and Cost -->
                    <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div class="col-span-2 md:col-span-1">
                            <label class="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">ÄVT Nhá»</label>
                            <input type="text" id="pendingSmallUnit_${item.id}" value="${item.unit_name}" class="w-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg px-2 py-2 text-xs font-bold text-slate-500" readonly>
                        </div>
                        <div class="col-span-2 md:col-span-1">
                            <label class="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">ÄVT Lá»›n</label>
                            <input type="text" id="pendingLargeUnit_${item.id}" placeholder="VD: Há»™p" class="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-lg px-2 py-2 text-xs font-bold text-slate-800 dark:text-white focus:border-rose-500">
                        </div>
                        <div class="col-span-2 md:col-span-1">
                            <label class="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1" title="1 ÄVT Lá»›n = ? ÄVT Nhá»">Tá»· lá»‡ QÄ</label>
                            <input type="number" id="pendingConversion_${item.id}" placeholder="1" min="1" oninput="window.calcPendingCost('${item.id}')" class="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-lg px-2 py-2 text-xs font-mono font-bold text-center text-slate-800 dark:text-white focus:border-rose-500">
                        </div>
                        <div class="col-span-2 md:col-span-2 relative">
                            <label class="block text-[10px] font-black uppercase tracking-wider text-rose-600 mb-1">GiÃ¡ vá»‘n ÄVT Lá»›n <span class="text-red-500">*</span></label>
                            <input type="number" id="pendingCost_${item.id}" placeholder="0" min="0" oninput="window.calcPendingCost('${item.id}')" class="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-lg px-2 py-2 pr-6 text-xs font-mono font-black text-right text-rose-600 focus:border-rose-500">
                            <span class="absolute right-2 top-7 text-[10px] text-slate-400 font-bold">Ä‘</span>
                            <div id="pendingCostHint_${item.id}" class="text-[9px] text-slate-400 mt-0.5 text-right font-medium italic hidden">1 ${item.unit_name} = <span class="text-rose-500 font-bold">0Ä‘</span></div>
                        </div>
                    </div>
                    
                    <div class="flex items-end justify-between pt-2">
                        <div class="w-1/2">
                            <label class="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Háº¡n dÃ¹ng</label>
                            <input type="date" id="pendingExpiry_${item.id}" class="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-600 focus:border-rose-500">
                        </div>
                        <button id="btn-save-pos-pending-${item.id}" onclick="window.savePosPendingCustomItem('${item.id}')" class="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-black uppercase rounded-lg shadow-md shadow-rose-500/30 transition-all hover:-translate-y-0.5 flex items-center gap-2">
                            <i class="fa-solid fa-check"></i> LÆ°u & Äá»“ng bá»™
                        </button>
                    </div>

                </div>
            </div>
        </div>
        `;
    }).join('');
};

window.calcPendingCost = (itemId) => {
    const costInput = document.getElementById(`pendingCost_${itemId}`);
    const convInput = document.getElementById(`pendingConversion_${itemId}`);
    const hint = document.getElementById(`pendingCostHint_${itemId}`);
    if (!costInput || !convInput || !hint) return;
    
    const cost = Number(costInput.value) || 0;
    const conv = Number(convInput.value) || 1;
    const unitCost = cost / conv;
    
    hint.classList.remove('hidden');
    hint.querySelector('span').textContent = new Intl.NumberFormat('vi-VN').format(Math.round(unitCost)) + 'Ä‘';
};

window.savePosPendingCustomItem = async (itemId) => {
    const btn = document.getElementById(`btn-save-pos-pending-${itemId}`);
    try {
        const item = window.posPendingCustomItemsList.find(i => i.id === itemId);
        if (!item) throw new Error('KhÃ´ng tÃ¬m tháº¥y thÃ´ng tin máº·t hÃ ng.');
        
        if (btn) {
            btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Xá»­ lÃ½...';
            btn.disabled = true;
        }
        
        const catInput = document.getElementById(`pendingCategory_${itemId}`);
        const largeUnitInput = document.getElementById(`pendingLargeUnit_${itemId}`);
        const convInput = document.getElementById(`pendingConversion_${itemId}`);
        const costInput = document.getElementById(`pendingCost_${itemId}`);
        const expiryInput = document.getElementById(`pendingExpiry_${itemId}`);
        
        const isOneTime = document.getElementById(`pendingTag_one_time_${itemId}`)?.checked;
        const isDoseCut = document.getElementById(`pendingTag_dose_cut_${itemId}`)?.checked;
        const isEcommerce = document.getElementById(`pendingTag_ecommerce_${itemId}`)?.checked;
        const isInternal = document.getElementById(`pendingTag_internal_${itemId}`)?.checked;
        
        const category_id = catInput?.value;
        if (!category_id) throw new Error('Vui lÃ²ng chá»n NhÃ³m hÃ ng!');
        
        const costLarge = Number(costInput.value) || 0;
        if (costLarge === 0) throw new Error('Vui lÃ²ng nháº­p GiÃ¡ vá»‘n!');
        
        const conv = Number(convInput.value) || 1;
        const costSmall = costLarge / conv;
        const largeUnit = largeUnitInput.value.trim();
        const expiry = expiryInput.value || null;
        const smallUnit = item.unit_name;
        
        const { supabaseClient } = await import('../../core/supabase.js');
        const userStr = localStorage.getItem('kh_user');
        const user = userStr ? JSON.parse(userStr) : { full_name: 'Há»‡ thá»‘ng' };
        
        const realName = item.product_name.replace('[Cáº¦N Cáº¬P NHáº¬T] ', '');
        
        // 1. Update product tags and category
        const tags = {
            is_one_time: !!isOneTime,
            is_dose_cut: !!isDoseCut,
            is_ecommerce: !!isEcommerce,
            is_internal: !!isInternal,
            note: 'ÄÃ£ khai bÃ¡o tá»« POS'
        };
        const { error: pErr } = await supabaseClient.from('products').update({
            category_id,
            description: JSON.stringify(tags)
        }).eq('id', item.product_id);
        if (pErr) throw new Error('Lá»—i cáº­p nháº­t sáº£n pháº©m: ' + pErr.message);
        
        // 2. Update units
        // XÃ³a cÃ¡c Ä‘Æ¡n vá»‹ cÅ©
        await supabaseClient.from('product_units').delete().eq('product_id', item.product_id);
        // ThÃªm Ä‘Æ¡n vá»‹ má»›i
        const unitsData = [];
        if (largeUnit && conv > 1) {
            unitsData.push({
                product_id: item.product_id,
                unit_name: largeUnit,
                retail_price: item.unit_price * conv, // Approximate retail
                cost_price: costLarge,
                conversion_rate: conv,
                is_base_unit: true
            });
            unitsData.push({
                product_id: item.product_id,
                unit_name: smallUnit,
                retail_price: item.unit_price,
                cost_price: costSmall,
                conversion_rate: 1,
                is_base_unit: false
            });
        } else {
            unitsData.push({
                product_id: item.product_id,
                unit_name: smallUnit,
                retail_price: item.unit_price,
                cost_price: costSmall,
                conversion_rate: 1,
                is_base_unit: true
            });
        }
        const { error: uErr } = await supabaseClient.from('product_units').insert(unitsData);
        if (uErr) throw new Error('Lá»—i cáº­p nháº­t Ä‘Æ¡n vá»‹: ' + uErr.message);
        
        // 3. Update batches
        if (expiry) {
            await supabaseClient.from('product_batches').update({
                expiry_date: expiry,
                is_tracked: true
            }).eq('product_id', item.product_id).eq('is_tracked', false);
        }
        
        // 4. Update order_items
        let finalName = realName;
        if (expiry) finalName += ` (HSD: ${new Date(expiry).toLocaleDateString('vi-VN')})`;
        const { error: updErr } = await supabaseClient.from('order_items').update({ 
            product_name: finalName
        }).eq('id', itemId);
        if (updErr) throw new Error('Lá»—i cáº­p nháº­t hÃ³a Ä‘Æ¡n: ' + updErr.message);
        
        // 5. Generate Cashbook Entry for the COGS of this specific sale!
        const totalCogs = item.quantity * costSmall;
        if (totalCogs > 0) {
            const cbEntry = {
                transaction_code: 'PC' + Date.now().toString().slice(-6) + Math.random().toString(36).substr(2, 4).toUpperCase(),
                transaction_type: 'expense',
                amount: totalCogs,
                description: `Nháº­p giÃ¡ vá»‘n cho máº·t hÃ ng ngoÃ i DM: ${realName} (HÃ³a Ä‘Æ¡n: ${item.order_id})`,
                payment_method: 'cash',
                created_by: user.full_name,
                status: 'completed'
            };
            const { error: cbErr } = await supabaseClient.from('cashbook_transactions').insert([cbEntry]);
            if (cbErr) throw new Error('Lá»—i khi táº¡o Phiáº¿u chi: ' + cbErr.message);
        }
        
        // 6. áº¨n card trÃªn UI
        const card = document.getElementById(`posPendingItemCard_${itemId}`);
        if (card) {
            card.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
            setTimeout(() => {
                card.remove();
                window.posPendingCustomItemsList = window.posPendingCustomItemsList.filter(i => i.id !== itemId);
                if (window.posPendingCustomItemsList.length === 0) {
                    const section = document.getElementById('pos-pending-custom-items-section');
                    if (section) section.classList.add('hidden');
                }
            }, 300);
        }
        
        window.showToast?.('LÆ°u vÃ  Äá»“ng bá»™ luá»“ng dá»¯ liá»‡u thÃ nh cÃ´ng!', 'success');
        window.loadOneTimeProductsData(); // Refresh the main table
        
    } catch (err) {
        console.error(err);
        window.showToast?.('Lá»—i: ' + err.message, 'error');
        if (btn) {
            btn.innerHTML = '<i class="fa-solid fa-check"></i> LÆ°u & Äá»“ng bá»™';
            btn.disabled = false;
        }
    }
};
