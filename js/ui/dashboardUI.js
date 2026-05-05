// js/ui/dashboardUI.js

export function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function initDarkMode() {
    const iconElement = document.getElementById('theme-icon');
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        if (iconElement) iconElement.classList.replace('fa-moon', 'fa-sun');
    } else {
        document.documentElement.classList.remove('dark');
        if (iconElement) iconElement.classList.replace('fa-sun', 'fa-moon');
    }
}

export function toggleDarkMode() {
    const htmlElement = document.documentElement;
    const iconElement = document.getElementById('theme-icon');

    if (htmlElement.classList.contains('dark')) {
        htmlElement.classList.remove('dark');
        localStorage.theme = 'light';
        if (iconElement) iconElement.classList.replace('fa-sun', 'fa-moon');
    } else {
        htmlElement.classList.add('dark');
        localStorage.theme = 'dark';
        if (iconElement) iconElement.classList.replace('fa-moon', 'fa-sun');
    }
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
    if (loadingElement) loadingElement.classList.add('hidden');
}

export function showError(message) {
    const loadingElement = document.getElementById('loading');
    hideProductTable();
    
    if (loadingElement) {
        loadingElement.classList.remove('hidden');
        loadingElement.innerHTML = `
            <div class="text-center text-red-500">
                <i class="fa-solid fa-triangle-exclamation text-3xl mb-2"></i>
                <p class="font-bold">Lỗi:</p>
                <p class="text-sm mt-1">${message}</p>
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
    if (amount === null || amount === undefined || isNaN(amount)) return '0 đ';
    return Number(amount).toLocaleString('en-US') + ' đ';
}

export function renderProducts(productsList) {
    const productContainer = document.getElementById('product-container');
    if (!productContainer) return;

    if (!productsList || productsList.length === 0) {
        productContainer.innerHTML = `
            <tr>
                <td colspan="6" class="py-16 text-center">
                    <div class="flex flex-col items-center justify-center">
                        <i class="fa-solid fa-box-open text-4xl text-gray-300 mb-3"></i>
                        <p class="text-gray-500 font-medium">Chưa có sản phẩm nào trong kho.</p>
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
            pricesHtmlContent = productUnits.map(unit => `
                <div class="text-sm mb-1 last:mb-0">
                    <span class="text-slate-500 dark:text-slate-400">${escapeHTML(unit.unit_name || unit.name || 'ĐVT')}:</span>
                    <span class="font-bold text-blue-600 dark:text-blue-400 ml-1">${escapeHTML(formatCurrency(unit.retail_price))}</span>
                </div>
            `).join('');
        } else {
            pricesHtmlContent = `<span class="text-slate-400 dark:text-slate-500 italic text-sm">Chưa thiết lập giá</span>`;
        }

        const expirationDate = product.expiration_date || '--/--/----';
        const safeName = escapeHTML(product.name || 'Tên thuốc');
        const safeCode = escapeHTML(product.product_code || '---');
        const safeIng = escapeHTML(product.active_ingredient || 'Chưa cập nhật hoạt chất');
        const safeExp = escapeHTML(expirationDate);

        return `
            <tr class="product-row hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
                data-name="${safeName.toLowerCase()}"
                data-code="${safeCode.toLowerCase()}">
                
                <td class="py-4 px-3 text-center border border-gray-300 dark:border-slate-700">
                    <input type="checkbox" class="row-checkbox rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" value="${safeCode}" onchange="window.updateBulkEditButton()">
                </td>
                
                <td class="py-4 px-5 border border-gray-300 dark:border-slate-700">
                    <span class="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-md text-xs font-semibold tracking-wider font-mono">
                        ${safeCode}
                    </span>
                </td>
                
                <td class="py-4 px-5 border border-gray-300 dark:border-slate-700">
                    <div class="font-bold text-slate-800 dark:text-white text-base mb-1">${safeName}</div>
                    <div class="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[250px]" title="${safeIng}">
                        ${safeIng}
                    </div>
                </td>
                
                <td class="py-4 px-5 align-top border border-gray-300 dark:border-slate-700">
                    ${pricesHtmlContent}
                </td>
                
                <td class="py-4 px-5 border border-gray-300 dark:border-slate-700">
                    <span class="text-sm font-medium ${expirationDate !== '--/--/----' ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}">
                        ${safeExp}
                    </span>
                </td>
                
                <td class="py-4 px-5 text-center border border-gray-300 dark:border-slate-700">
                    <button onclick="window.openEditModalByCode('${safeCode}')" class="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-2" title="Chỉnh sửa">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                </td>
            </tr>
        `;
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

export function openEditModal(productDetails) {
    const codeElement = document.getElementById('editProductCode');
    const nameElement = document.getElementById('editName');
    const ingredientElement = document.getElementById('editIngredient');
    const packagingElement = document.getElementById('editPackaging');
    const expirationElement = document.getElementById('editExpDate');
    const modalTitleElement = document.getElementById('modalTitle');
    const modalElement = document.getElementById('editModal');

    if (codeElement) codeElement.value = productDetails.product_code;
    if (nameElement) nameElement.value = productDetails.name || '';
    if (ingredientElement) ingredientElement.value = productDetails.active_ingredient || '';
    if (packagingElement) packagingElement.value = productDetails.packaging || '';
    
    if (expirationElement) {
        const expDateString = productDetails.expiration_date;
        if(expDateString && expDateString.includes('-')) {
            expirationElement.value = expDateString;
        } else {
            expirationElement.value = '';
        }
    }

    if (modalTitleElement) modalTitleElement.textContent = `Sửa: ${productDetails.product_code}`;
    if (modalElement) modalElement.classList.remove('hidden');
}

export function closeEditModal() {
    const modalElement = document.getElementById('editModal');
    if (modalElement) modalElement.classList.add('hidden');
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
                        onclick="window.selectSuggestion('${escapeHTML(product.product_code)}')">
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
