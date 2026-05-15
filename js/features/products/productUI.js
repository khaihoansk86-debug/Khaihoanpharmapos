// js/features/products/productUI.js

export function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Toast notification — thành công / lỗi / thông tin
 * @param {string} message
 * @param {'success'|'error'|'info'} type
 * @param {number} duration ms
 */
export function showToast(message, type = 'success', duration = 3000) {
    const existing = document.getElementById('app-toast');
    if (existing) existing.remove();

    const colorMap = {
        success: 'bg-emerald-600 text-white',
        error:   'bg-red-600 text-white',
        info:    'bg-blue-600 text-white',
    };
    const iconMap = {
        success: 'fa-circle-check',
        error:   'fa-circle-xmark',
        info:    'fa-circle-info',
    };

    const toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = [
        'fixed top-5 right-5 z-[9999] flex items-center gap-3',
        'px-5 py-3 rounded-xl shadow-2xl text-sm font-bold',
        'transition-all duration-300 translate-x-0 opacity-100',
        colorMap[type] || colorMap.info
    ].join(' ');
    toast.innerHTML = `<i class="fa-solid ${iconMap[type] || iconMap.info}"></i><span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-x-4');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

export function toggleFilter() {
    const filterPanel = document.getElementById('inlineFilterPanel');
    if (filterPanel) filterPanel.classList.toggle('hidden');
}

export function hideProductTable() {
    const tableWrapper = document.getElementById('product-table-wrapper');
    if (tableWrapper) tableWrapper.classList.add('hidden');
}

export function showProductTable() {
    const tableWrapper = document.getElementById('product-table-wrapper');
    if (tableWrapper) tableWrapper.classList.remove('hidden');
}

export function showLoading(message = "Đang tải dữ liệu...") {
    const loadingElement = document.getElementById('loading');
    hideProductTable();
    
    if (loadingElement) {
        loadingElement.classList.remove('hidden');
        loadingElement.innerHTML = `
            <div class="loader mb-4"></div>
            <p class="text-gray-500 font-medium">${message}</p>
        `;
    }
}

export function hideLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.classList.add('hidden');
        console.log("UI: Đã ẩn loading element.");
    } else {
        console.warn("UI: Không tìm thấy loading element để ẩn.");
    }
}

export function showError(message) {
    const loadingElement = document.getElementById('loading');
    hideProductTable();
    
    console.error("UI Error:", message);
    
    if (loadingElement) {
        loadingElement.classList.remove('hidden');
        const errorText = typeof message === 'object' ? JSON.stringify(message) : message;
        loadingElement.innerHTML = `
            <div class="text-center text-red-500 p-6">
                <i class="fa-solid fa-triangle-exclamation text-4xl mb-3"></i>
                <p class="font-bold text-lg">Lỗi hệ thống</p>
                <p class="text-sm mt-2 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800 font-mono text-left overflow-auto max-h-40">${escapeHTML(errorText)}</p>
                <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors"> Thử lại </button>
            </div>`;
    }
}

export function showSupabaseError() {
    const loadingElement = document.getElementById('loading');
    hideProductTable();
    
    if (loadingElement) {
        loadingElement.classList.remove('hidden');
        loadingElement.innerHTML = `
            <div class="bg-red-50 text-red-600 p-6 rounded-lg max-w-lg text-center shadow-sm border border-red-100">
                <i class="fa-solid fa-circle-exclamation text-4xl mb-3"></i>
                <h3 class="font-bold text-lg mb-2">Chưa cấu hình Supabase</h3>
                <p class="text-sm">Vui lòng kiểm tra lại cấu hình Supabase trong file config.</p>
            </div>`;
    }
}

export function formatCurrency(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) return '0đ';
    return Number(amount).toLocaleString('vi-VN') + 'đ';
}

export function renderProducts(productsList) {
    const productContainer = document.getElementById('product-container');
    if (!productContainer) return;

    if (!productsList || productsList.length === 0) {
        productContainer.innerHTML = `
            <tr>
                <td colspan="6" class="py-20 text-center border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
                    <div class="flex flex-col items-center justify-center gap-3">
                        <div class="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                            <i class="fa-solid fa-box-open text-3xl text-slate-300"></i>
                        </div>
                        <p class="text-slate-500 font-bold">Chưa có sản phẩm nào trong kho.</p>
                        <button onclick="openAddProductModal()" class="text-sm text-blue-600 font-bold hover:underline">Thêm sản phẩm đầu tiên</button>
                    </div>
                </td>
            </tr>`;
        showProductTable();
        return;
    }

    productContainer.innerHTML = productsList.map(product => {
        const productUnits = product.product_units || [];
        let pricesHtmlContent = '';

        if (productUnits.length > 0) {
            // Sort units to show base unit first or conversion rates
            const sortedUnits = [...productUnits].sort((a, b) => (a.conversion_rate || 1) - (b.conversion_rate || 1));
            
            pricesHtmlContent = sortedUnits.map(unit => `
                <div class="flex items-center justify-between gap-4 py-1.5 border-b border-slate-200 dark:border-slate-700 last:border-0">
                    <span class="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter">${escapeHTML(unit.unit_name || 'ĐVT')}</span>
                    <span class="font-bold text-slate-900 dark:text-white text-sm">${escapeHTML(formatCurrency(unit.retail_price))}</span>
                </div>
            `).join('');
        } else {
            pricesHtmlContent = `<span class="text-slate-400 dark:text-slate-500 italic text-sm">Chưa thiết lập giá</span>`;
        }

        // Tính tổng tồn kho
        const totalStock = (product.product_batches || [])
            .reduce((sum, b) => sum + (Number(b.stock_quantity) || 0), 0);

        const safeName = escapeHTML(product.name || 'Tên thuốc');
        const safeCode = escapeHTML(product.product_code || '---');
        const safeIng  = escapeHTML(product.active_ingredient || '');

        // Badge trạng thái kinh doanh & Tồn kho
        let stockBadge = '';
        if (totalStock <= 0) {
            stockBadge = '<span class="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Hết hàng</span>';
        } else if (totalStock < 10) {
            stockBadge = '<span class="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Sắp hết</span>';
        } else {
            stockBadge = '<span class="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Còn hàng</span>';
        }

        const businessStatus = product.is_active !== false
            ? '<i class="fa-solid fa-circle-check text-emerald-500 text-[10px]" title="Đang kinh doanh"></i>'
            : '<i class="fa-solid fa-circle-pause text-slate-400 text-[10px]" title="Ngừng kinh doanh"></i>';

        // Màu hạn sử dụng và Danh sách Lô
        let batchesHtmlContent = '';
        if (product.product_batches && product.product_batches.length > 0) {
            batchesHtmlContent = product.product_batches.map(b => {
                const stock = b.stock_quantity || 0;
                let expStr = '--/--/----';
                let expColor = 'text-slate-500 dark:text-slate-400';
                if (b.expiry_date) {
                    expStr = new Date(b.expiry_date).toLocaleDateString('vi-VN');
                    const daysLeft = (new Date(b.expiry_date) - new Date()) / (1000 * 60 * 60 * 24);
                    if (daysLeft < 0) expColor = 'text-red-500 dark:text-red-400 font-bold';
                    else if (daysLeft < 90) expColor = 'text-orange-500 dark:text-orange-400 font-bold';
                    else expColor = 'text-emerald-600 dark:text-emerald-400 font-medium';
                }
                return `
                <div class="flex items-center justify-between gap-3 text-xs mb-1.5 last:mb-0 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div class="flex items-center gap-1.5">
                        <span class="font-bold text-slate-800 dark:text-slate-200 text-[11px] uppercase">${escapeHTML(b.batch_number || 'MẶC ĐỊNH')}</span>
                        <span class="text-[10px] font-black bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">SL: ${stock}</span>
                    </div>
                    <span class="${expColor} text-[11px]">${expStr}</span>
                </div>`;
            }).join('');
        } else {
            batchesHtmlContent = `<span class="text-slate-400 italic text-xs">Chưa có thông tin lô</span>`;
        }

        return `
            <tr class="product-row bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 group shadow-sm hover:shadow"
                data-name="${safeName.toLowerCase()}"
                data-code="${safeCode.toLowerCase()}">

                <td class="py-4 px-4 text-center rounded-l-2xl border-y border-l border-slate-300 dark:border-slate-700">
                    <input type="checkbox" class="row-checkbox rounded-md text-blue-600 focus:ring-blue-500 w-5 h-5 cursor-pointer border-slate-400 dark:border-slate-600 bg-white dark:bg-transparent">
                </td>

                <td class="py-4 px-5 border-y border-slate-300 dark:border-slate-700">
                    <span class="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 px-3 py-1.5 rounded-lg text-[11px] font-black tracking-widest font-mono border border-slate-300 dark:border-slate-600 shadow-sm">${safeCode}</span>
                </td>

                <td class="py-4 px-5 border-y border-slate-300 dark:border-slate-700 max-w-md">
                    <div class="flex items-start gap-2 mb-1.5">
                        <div class="font-black text-slate-900 dark:text-white text-base leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            ${safeName}
                        </div>
                        ${businessStatus}
                    </div>
                    <div class="flex flex-wrap gap-2 items-center">
                        ${safeIng ? `<span class="text-[10px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 px-2 py-0.5 rounded-md"><i class="fa-solid fa-vial text-[9px]"></i> ${safeIng}</span>` : ''}
                        <span class="text-[10px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 px-2 py-0.5 rounded-md">${escapeHTML(product.product_categories?.name || 'Chưa phân loại')}</span>
                    </div>
                </td>

                <td class="py-4 px-5 border-y border-slate-300 dark:border-slate-700 w-48">
                    <div class="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        ${pricesHtmlContent}
                    </div>
                </td>

                <td class="py-4 px-5 border-y border-slate-300 dark:border-slate-700 align-top">
                    <div class="flex flex-col gap-2">
                        <div class="flex items-center mb-1">
                            <span class="text-lg font-black text-slate-900 dark:text-white mr-2" title="Tổng tồn kho">∑ ${totalStock.toLocaleString('vi-VN')}</span>
                            ${stockBadge}
                        </div>
                        <div class="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm max-h-32 overflow-y-auto custom-scrollbar">
                            ${batchesHtmlContent}
                        </div>
                    </div>
                </td>

                <td class="py-4 px-5 text-center rounded-r-2xl border-y border-r border-slate-300 dark:border-slate-700">
                    <div class="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                        <button data-edit-product-code="${safeCode}"
                            class="w-10 h-10 flex items-center justify-center text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50 rounded-xl hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
                            title="Chỉnh sửa">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
    }).join('');

    showProductTable();
}

export function toggleAllCheckboxes(sourceCheckbox) {
    const allCheckboxes = document.querySelectorAll('.row-checkbox');
    allCheckboxes.forEach(checkbox => {
        const tableRow = checkbox.closest('tr');
        if (tableRow && tableRow.style.display !== 'none') {
            checkbox.checked = sourceCheckbox.checked;
        }
    });
    updateBulkEditButton();
}

export function updateBulkEditButton() {
    const checkedCount = document.querySelectorAll('.row-checkbox:checked').length;
    const bulkEditButton = document.getElementById('bulkEditBtn');
    const bulkDividerElement = document.getElementById('bulkEditDivider');
    const selectedCountSpan = document.getElementById('selectedCount');
    
    if (bulkEditButton) {
        if (checkedCount > 0) {
            bulkEditButton.classList.remove('hidden');
            bulkEditButton.classList.add('flex');
            if (window.innerWidth > 768 && bulkDividerElement) bulkDividerElement.classList.remove('hidden');
            if (selectedCountSpan) selectedCountSpan.textContent = checkedCount;
        } else {
            bulkEditButton.classList.add('hidden');
            bulkEditButton.classList.remove('flex');
            if (bulkDividerElement) bulkDividerElement.classList.add('hidden');
        }
    }
}

export function setupSearch(productsList) {
    const searchInputElement = document.getElementById('searchInput');
    const searchTypeElement = document.getElementById('searchType');
    const searchSuggestionsElement = document.getElementById('searchSuggestions');
    
    if (!searchInputElement || !searchTypeElement || !searchSuggestionsElement) return;

    let debounceTimeout = null;

    searchInputElement.addEventListener('input', (event) => {
        clearTimeout(debounceTimeout);
        
        debounceTimeout = setTimeout(() => {
            const searchTerm = event.target.value.toLowerCase().trim();
            const searchTypeValue = searchTypeElement.value;
            
            const tableRows = document.querySelectorAll('.product-row');
            
            tableRows.forEach(row => {
                const matchValue = row.getAttribute(`data-${searchTypeValue}`);
                if (matchValue && matchValue.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });

            if (searchTerm.length === 0) {
                searchSuggestionsElement.classList.add('hidden');
                return;
            }

            const matchedProductsList = productsList.filter(product => {
                const checkValue = searchTypeValue === 'name' ? (product.name || '') : (product.product_code || '');
                return checkValue.toLowerCase().includes(searchTerm);
            }).slice(0, 5);

            if (matchedProductsList.length > 0) {
                searchSuggestionsElement.innerHTML = matchedProductsList.map(product => `
                    <li class="px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer border-b border-gray-100 dark:border-slate-700/50 last:border-0 transition-colors"
                        data-suggestion-code="${escapeHTML(product.product_code)}">
                        <div class="flex justify-between items-center">
                            <div>
                                <div class="font-bold text-slate-800 dark:text-white text-sm">${escapeHTML(product.name)}</div>
                                <div class="text-xs text-slate-500 dark:text-slate-400">${escapeHTML(product.product_code)}</div>
                            </div>
                            <i class="fa-solid fa-arrow-right text-slate-300 dark:text-slate-500"></i>
                        </div>
                    </li>
                `).join('');
                searchSuggestionsElement.classList.remove('hidden');
            } else {
                searchSuggestionsElement.innerHTML = `<li class="px-5 py-3 text-sm text-slate-500 dark:text-slate-400 italic">Không tìm thấy kết quả.</li>`;
                searchSuggestionsElement.classList.remove('hidden');
            }
        }, 300); // 300ms debounce
    });

    searchTypeElement.addEventListener('change', () => {
        searchInputElement.value = '';
        searchInputElement.focus();
        searchInputElement.dispatchEvent(new Event('input'));
    });

    document.addEventListener('click', (event) => {
        if (!searchInputElement.contains(event.target) && !searchSuggestionsElement.contains(event.target)) {
            searchSuggestionsElement.classList.add('hidden');
        }
    });
}

export function openExportModal() {
    const modal = document.getElementById('exportModal');
    if (modal) modal.classList.remove('hidden');
}

export function closeExportModal() {
    const modal = document.getElementById('exportModal');
    if (modal) modal.classList.add('hidden');
}

export function showImportErrorsModal(successCount, errorLogs) {
    const modal = document.getElementById('importErrorModal');
    const summary = document.getElementById('importErrorSummary');
    const list = document.getElementById('importErrorList');
    
    if (!modal || !summary || !list) return;

    summary.innerHTML = `Đã nhập thành công <strong>${successCount}</strong> dòng. Thất bại <strong>${errorLogs.length}</strong> dòng.`;
    
    list.innerHTML = errorLogs.map(err => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
            <td class="py-3 px-4 border-b border-gray-100 dark:border-slate-700 font-mono text-xs font-bold text-slate-500">${err.row}</td>
            <td class="py-3 px-4 border-b border-gray-100 dark:border-slate-700 text-red-600 dark:text-red-400">${escapeHTML(err.reason)}</td>
        </tr>
    `).join('');

    modal.classList.remove('hidden');
}

export function closeImportErrorModal() {
    const modal = document.getElementById('importErrorModal');
    if (modal) modal.classList.add('hidden');
}

/* -------------------------------------------------------------------------- */
/*                        Add Product Modal Handling                          */
/* -------------------------------------------------------------------------- */

export function openAddProductModal(product = null) {
    document.getElementById('addProductForm').reset();
    
    // Clear extra units
    const container = document.getElementById('unitsContainer');
    if (container) {
        const extraUnits = container.querySelectorAll('.unit-row:not(:first-child)');
        extraUnits.forEach(row => row.remove());
    }
    const batchRowsContainer = document.getElementById('batchRowsContainer');
    if (batchRowsContainer) batchRowsContainer.innerHTML = '';
    
    const variantsContainer = document.getElementById('variantsContainer');
    if (variantsContainer) variantsContainer.innerHTML = '';

    const titleEl = document.getElementById('addProductModalTitle');
    const idEl = document.getElementById('add_product_id');

    if (product) {
        titleEl.textContent = `Cập nhật Hàng Hóa: ${product.product_code}`;
        idEl.value = product.id;

        document.getElementById('add_name').value = product.name || '';
        document.getElementById('add_code').value = product.product_code || '';
        if(product.category_id) document.getElementById('add_category').value = product.category_id;
        document.getElementById('add_is_active').checked = product.is_active;

        document.getElementById('add_barcode').value          = product.barcode           || '';
        document.getElementById('add_reg_no').value            = product.registration_no   || '';
        document.getElementById('add_active_ingredient').value = product.active_ingredient || '';
        document.getElementById('add_concentration').value     = product.concentration     || '';
        document.getElementById('add_route').value             = product.route_of_admin    || '';
        document.getElementById('add_packaging').value         = product.packaging_spec    || '';
        document.getElementById('add_manufacturer').value      = product.manufacturer      || '';

        // Điền Base Unit
        if (product.product_units && product.product_units.length > 0) {
            const baseUnit = product.product_units.find(u => u.is_base_unit) || product.product_units[0];
            const baseRow = container.querySelector('.unit-row:first-child');
            baseRow.querySelector('.unit-name').value = baseUnit.unit_name || '';
            baseRow.querySelector('.unit-retail').value = baseUnit.retail_price || '';
            baseRow.querySelector('.unit-cost').value = baseUnit.cost_price || '';

            // Điền Conversion Units
            const convUnits = product.product_units.filter(u => u.id !== baseUnit.id);
            convUnits.forEach(u => {
                addConversionUnit();
                const newRow = container.lastElementChild;
                newRow.querySelector('.unit-name').value = u.unit_name || '';
                newRow.querySelector('.unit-conversion').value = u.conversion_rate || '';
                newRow.querySelector('.unit-retail').value = u.retail_price || '';
                newRow.querySelector('.unit-cost').value = u.cost_price || '';
            });
        }

        // Điền Batch nếu có
        if (product.product_batches && product.product_batches.length > 0) {
            const b = product.product_batches[0];
            document.getElementById('add_has_batch').checked = true;
            document.getElementById('add_stock').value = b.stock_quantity || '';
            document.getElementById('add_batch_no').value = b.batch_number || '';
            document.getElementById('add_expiry').value = b.expiry_date ? b.expiry_date.substring(0, 10) : '';
            product.product_batches.slice(1).forEach(batch => addBatchRow(batch));
            toggleBatchFields();
        } else {
            document.getElementById('add_has_batch').checked = false;
            toggleBatchFields();
        }

        // Điền Variants từ description nếu có
        if (product.description) {
            try {
                const descData = JSON.parse(product.description);
                if (descData && descData.variants) {
                    for (const [k, v] of Object.entries(descData.variants)) {
                        addVariantRow(k, v);
                    }
                }
            } catch (e) {
                // Bỏ qua nếu description không phải là JSON
            }
        }

        const toggleContainer = document.getElementById('statusToggleContainer');
        if (toggleContainer) toggleContainer.classList.remove('hidden');

    } else {
        titleEl.textContent = 'Thêm Hàng Hóa Mới';
        idEl.value = '';
        generateProductCode();
        document.getElementById('add_has_batch').checked = true;
        toggleBatchFields();

        const toggleContainer = document.getElementById('statusToggleContainer');
        if (toggleContainer) toggleContainer.classList.add('hidden');
    }
    
    document.getElementById('addProductModal').classList.remove('hidden');
}

export function closeAddProductModal() {
    document.getElementById('addProductModal').classList.add('hidden');
}

export function generateProductCode() {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    document.getElementById('add_code').value = 'SP' + randomNum;
}

export function autoGenerateProductCode() {
    const nameInput = document.getElementById('add_name').value.trim();
    const codeInput = document.getElementById('add_code');
    
    if (nameInput.length > 0 && codeInput.value.trim() === '') {
        const words = nameInput.split(/\s+/);
        let acronym = '';
        if (words.length === 1) {
            acronym = words[0].substring(0, 3).toUpperCase();
        } else {
            acronym = words.map(w => w[0]).join('').toUpperCase();
        }
        acronym = acronym.replace(/[^A-Z0-9]/g, '').substring(0, 4);
        
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        codeInput.value = (acronym || 'SP') + randomNum;
    }
}

export function addConversionUnit() {
    const container = document.getElementById('unitsContainer');
    const rowId = 'unit_' + Date.now();
    const html = `
        <div id="${rowId}" class="unit-row grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-emerald-50/30 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-2xl relative shadow-sm mt-3 animate-in fade-in slide-in-from-top-1">
            <button type="button" data-remove-unit="${rowId}" class="absolute -top-3 -right-3 bg-red-100 dark:bg-red-900 hover:bg-red-200 text-red-600 dark:text-red-400 rounded-full w-7 h-7 flex items-center justify-center transition-colors shadow-sm border-2 border-white dark:border-slate-900">
                <i class="fa-solid fa-xmark text-xs"></i>
            </button>
            <div>
                <label class="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Tên ĐVT quy đổi <span class="text-red-500">*</span></label>
                <input type="text" name="unit_name" required placeholder="VD: Vỉ, Hộp" class="unit-name w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>
            <div>
                <label class="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Quy đổi <span class="text-red-500">*</span></label>
                <input type="number" name="conversion_rate" required min="2" placeholder="VD: 10" class="unit-conversion w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>
            <div>
                <label class="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Giá bán lẻ <span class="text-red-500">*</span></label>
                <div class="relative">
                    <input type="number" name="retail_price" required min="0" placeholder="0" class="unit-retail w-full pl-4 pr-10 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <span class="absolute right-4 top-2.5 text-slate-400 font-black text-[10px]">VNĐ</span>
                </div>
            </div>
            <div>
                <label class="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Giá vốn</label>
                <div class="relative">
                    <input type="number" name="cost_price" min="0" placeholder="0" class="unit-cost w-full pl-4 pr-10 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <span class="absolute right-4 top-2.5 text-slate-400 font-black text-[10px]">VNĐ</span>
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);

    // Tự động tính giá cho đơn vị quy đổi
    const newRow = document.getElementById(rowId);
    const conversionInput = newRow.querySelector('.unit-conversion');
    const retailInput = newRow.querySelector('.unit-retail');
    const costInput = newRow.querySelector('.unit-cost');

    conversionInput.addEventListener('input', (e) => {
        const rate = parseFloat(e.target.value) || 0;
        if (rate > 0) {
            // Lấy giá trị của đơn vị cơ sở (luôn là input đầu tiên trên form)
            const baseRetailInput = document.querySelector('.unit-retail');
            const baseCostInput = document.querySelector('.unit-cost');

            if (baseRetailInput && baseRetailInput.value && !retailInput.dataset.manualEdit) {
                retailInput.value = (parseFloat(baseRetailInput.value) * rate).toFixed(0);
            }
            if (baseCostInput && baseCostInput.value && !costInput.dataset.manualEdit) {
                costInput.value = (parseFloat(baseCostInput.value) * rate).toFixed(0);
            }
        }
    });

    // Cho phép người dùng ghi đè tự động tính nếu họ tự nhập giá
    retailInput.addEventListener('input', () => retailInput.dataset.manualEdit = 'true');
    costInput.addEventListener('input', () => costInput.dataset.manualEdit = 'true');
}

export function removeConversionUnit(rowId) {
    const row = document.getElementById(rowId);
    if (row) {
        row.remove();
    }
}

export function addBatchRow(batch = {}) {
    const container = document.getElementById('batchRowsContainer');
    if (!container) return;

    const rowId = 'batch_' + Date.now() + '_' + Math.random().toString(16).slice(2);
    const expiry = batch.expiry_date ? String(batch.expiry_date).substring(0, 10) : '';
    const html = `
        <div id="${rowId}" class="batch-extra-row grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-orange-50/30 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/30 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-1">
            <div>
                <label class="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Tồn kho</label>
                <input type="number" min="0" value="${batch.stock_quantity || ''}" placeholder="0" class="batch-stock w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-orange-500">
            </div>
            <div>
                <label class="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Mã lô</label>
                <input type="text" value="${batch.batch_number || ''}" placeholder="VD: LO02" class="batch-number w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-orange-500">
            </div>
            <div>
                <label class="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Hạn sử dụng <span class="text-red-500 batch-req ${batch.is_tracked !== false ? '' : 'hidden'}">*</span></label>
                <input type="date" value="${expiry}" class="batch-expiry w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 [color-scheme:light] dark:[color-scheme:dark]">
            </div>
            <div class="flex items-end">
                <button type="button" data-remove-batch-row="${rowId}" class="w-full px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-all flex items-center justify-center gap-2">
                    <i class="fa-solid fa-trash-can"></i> Xóa lô
                </button>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
}

export function removeBatchRow(rowId) {
    document.getElementById(rowId)?.remove();
}

export function addVariantRow(key = '', val = '') {
    const container = document.getElementById('variantsContainer');
    if (!container) return;

    const rowId = 'variant_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const html = `
        <div id="${rowId}" class="variant-row flex flex-col md:flex-row gap-4 p-4 bg-purple-50/30 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30 rounded-xl relative shadow-sm animate-in fade-in slide-in-from-top-1">
            <button type="button" data-remove-variant="${rowId}" class="absolute -top-3 -right-3 bg-red-100 dark:bg-red-900 hover:bg-red-200 text-red-600 dark:text-red-400 rounded-full w-7 h-7 flex items-center justify-center transition-colors shadow-sm border-2 border-white dark:border-slate-900">
                <i class="fa-solid fa-xmark text-xs"></i>
            </button>
            <div class="flex-1">
                <label class="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Tên phân loại (Thuộc tính)</label>
                <input type="text" class="variant-key w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="VD: Màu sắc, Thể tích, Kích cỡ..." value="${escapeHTML(key)}">
            </div>
            <div class="flex-1">
                <label class="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Giá trị</label>
                <input type="text" class="variant-val w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="VD: Đỏ, 100ml, Lớn..." value="${escapeHTML(val)}">
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
}

export function removeVariantRow(rowId) {
    document.getElementById(rowId)?.remove();
}

export function toggleBatchFields() {
    const hasBatch = document.getElementById('add_has_batch').checked;
    const batchFields = document.querySelectorAll('.batch-field');
    const batchReqs = document.querySelectorAll('.batch-req');

    batchFields.forEach(field => {
        if (hasBatch) {
            field.classList.remove('hidden');
        } else {
            field.classList.add('hidden');
            // Clear inputs inside
            const input = field.querySelector('input');
            if(input) input.value = '';
        }
    });

    batchReqs.forEach(req => {
        if (hasBatch) {
            req.classList.remove('hidden');
        } else {
            req.classList.add('hidden');
        }
    });
}

export function toggleAdvancedFields() {
    const fields = document.getElementById('advancedFields');
    const icon = document.getElementById('advancedIcon');
    if (fields.classList.contains('hidden')) {
        fields.classList.remove('hidden');
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
    } else {
        fields.classList.add('hidden');
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
    }
}

// Make globally available (chỉ export những hàm mà HTML gọi trực tiếp)
window.openAddProductModal  = openAddProductModal;
window.closeAddProductModal = closeAddProductModal;
window.generateProductCode  = generateProductCode;
window.autoGenerateProductCode = autoGenerateProductCode;
window.addConversionUnit    = addConversionUnit;
window.removeConversionUnit = removeConversionUnit;
window.addBatchRow = addBatchRow;
window.removeBatchRow = removeBatchRow;
window.addVariantRow = addVariantRow;
window.removeVariantRow = removeVariantRow;
window.toggleBatchFields = toggleBatchFields;
window.toggleAdvancedFields = toggleAdvancedFields;
window.showToast            = showToast;
