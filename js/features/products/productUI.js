// js/features/products/productUI.js
import { removeVietnameseTones } from './productService.js';

export function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

let productCurrentPage = 1;
let productItemsPerPage = 20;
let productLastRenderedList = [];
let productSearchSourceList = [];
let productSearchBound = false;
let productSearchDebounce = null;
let productRenderFrame = null;

function scheduleProductRender(productsList, isPagination = false) {
    if (productRenderFrame) cancelAnimationFrame(productRenderFrame);
    productRenderFrame = requestAnimationFrame(() => {
        productRenderFrame = null;
        renderProducts(productsList, isPagination);
    });
}

window.changeProductPage = (page) => {
    if (page < 1) return;
    productCurrentPage = page;
    renderProducts(productLastRenderedList, true);
};

window.changeProductItemsPerPage = (size) => {
    productItemsPerPage = parseInt(size, 10);
    productCurrentPage = 1;
    renderProducts(productLastRenderedList, true);
};

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
        error: 'bg-red-600 text-white',
        info: 'bg-blue-600 text-white',
    };
    const iconMap = {
        success: 'fa-circle-check',
        error: 'fa-circle-xmark',
        info: 'fa-circle-info',
    };

    const toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = [
        'fixed top-5 right-5 z-[9999] flex items-center gap-3',
        'px-5 py-3 rounded-xl shadow-2xl text-sm font-bold',
        '  translate-x-0 opacity-100',
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
                <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 "> Thử lại </button>
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

export function renderProducts(productsList, isPagination = false) {
    const productContainer = document.getElementById('product-container');
    if (!productContainer) return;

    if (!isPagination) {
        let listToSort = [...(productsList || [])].filter(p => !p.parent_id);
        if (window.currentSortColumn) {
            listToSort.sort((a, b) => {
                let valA = '', valB = '';
                if (window.currentSortColumn === 'code') {
                    valA = (a.product_code || '').toLowerCase();
                    valB = (b.product_code || '').toLowerCase();
                } else if (window.currentSortColumn === 'name') {
                    valA = (a.name || '').toLowerCase();
                    valB = (b.name || '').toLowerCase();
                } else if (window.currentSortColumn === 'stock') {
                    // Cần tính tổng tồn kho từ cả biến thể con (vì master có thể ko có batch riêng)
                    const getStock = (p) => {
                        const variants = (window.currentProductsList || []).filter(v => v.parent_id === p.id);
                        if (variants.length > 0) {
                            return variants.reduce((sum, v) => sum + (v.product_batches || []).reduce((s, b) => s + (Number(b.stock_quantity) || 0), 0), 0);
                        }
                        return (p.product_batches || []).reduce((s, b) => s + (Number(b.stock_quantity) || 0), 0);
                    };
                    valA = getStock(a);
                    valB = getStock(b);
                } else if (window.currentSortColumn === 'expiry') {
                    const getMinExpiry = (p) => {
                        const variants = (window.currentProductsList || []).filter(v => v.parent_id === p.id);
                        let batches = p.product_batches || [];
                        variants.forEach(v => { batches = batches.concat(v.product_batches || []) });
                        const validExpiries = batches.filter(b => b.expiry_date).map(b => new Date(b.expiry_date).getTime());
                        return validExpiries.length > 0 ? Math.min(...validExpiries) : Infinity;
                    };
                    valA = getMinExpiry(a);
                    valB = getMinExpiry(b);
                }
                
                if (valA === valB) return 0;
                let comparison = 0;
                if (typeof valA === 'number' && typeof valB === 'number') {
                    comparison = valA < valB ? -1 : 1;
                } else {
                    valA = String(valA || '');
                    valB = String(valB || '');
                    comparison = valA.localeCompare(valB, 'vi');
                }
                return window.currentSortDirection === 'asc' ? comparison : -comparison;
            });
        }
        productCurrentPage = 1;
        productLastRenderedList = listToSort;
        window.currentProducts = listToSort;
    }
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

    const startIndex = (productCurrentPage - 1) * productItemsPerPage;
    const endIndex = startIndex + productItemsPerPage;
    const renderList = productsList.slice(startIndex, endIndex);
    const totalPages = Math.max(1, Math.ceil(productsList.length / productItemsPerPage));

    const itemsHtml = renderList.map(product => {
        // Kiểm tra mối quan hệ cha - con
        const variants = (window.currentProductsList || []).filter(v => v.parent_id === product.id);
        const isParent = product.is_direct_sale === false || (product.product_code || '').startsWith('PARENT_') || variants.length > 0;
        const parentProduct = product.parent_id ? (window.currentProductsList || []).find(p => p.id === product.parent_id) : null;

        const productUnits = product.product_units || [];
        let pricesHtmlContent = '';

        // Tính tổng tồn kho
        let totalStock = 0;
        let stockBadge = '';
        let batchesHtmlContent = '';
        
        let nearestExpiryDateParent = null;
        let nearestExpiryVariantParent = null;
        let nearestExpiryStrParent = '';
        let nearestExpiryColorParent = '';

        if (isParent) {
            // Tổng hợp tồn kho từ các biến thể con
            totalStock = variants.reduce((sum, v) => {
                const vStock = (v.product_batches || []).reduce((s, b) => s + (Number(b.stock_quantity) || 0), 0);
                return sum + vStock;
            }, 0);

            // Thu thập toàn bộ giá bán từ các biến thể con
            const allPrices = [];
            variants.forEach(v => {
                (v.product_units || []).forEach(u => {
                    if (u.retail_price) allPrices.push(u.retail_price);
                });
            });

            if (allPrices.length > 0) {
                const minPrice = Math.min(...allPrices);
                const maxPrice = Math.max(...allPrices);
                const priceStr = minPrice === maxPrice ? formatCurrency(minPrice) : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`;
                pricesHtmlContent = `
                    <div class="py-1">
                        <span class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">Giá biến thể:</span>
                        <span class="font-extrabold text-blue-600 dark:text-blue-400 text-sm">${priceStr}</span>
                    </div>
                `;
            } else {
                pricesHtmlContent = `<span class="text-slate-400 dark:text-slate-500 italic text-sm">Chưa thiết lập giá</span>`;
            }

            if (totalStock <= 0) {
                stockBadge = '<span class="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Hết hàng</span>';
            } else {
                stockBadge = '<span class="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Còn hàng</span>';
            }

            
            const allValidBatchesParent = [];
            variants.forEach(v => {
                (v.product_batches || []).forEach(b => {
                    if (b.expiry_date) {
                        allValidBatchesParent.push({ date: new Date(b.expiry_date), variant: v });
                    }
                });
            });
            if (allValidBatchesParent.length > 0) {
                allValidBatchesParent.sort((a, b) => a.date - b.date);
                nearestExpiryDateParent = allValidBatchesParent[0].date;
                nearestExpiryVariantParent = allValidBatchesParent[0].variant;
                nearestExpiryStrParent = nearestExpiryDateParent.toLocaleDateString('vi-VN');
                
                const daysLeft = (nearestExpiryDateParent - new Date()) / (1000 * 60 * 60 * 24);
                if (daysLeft < 0) nearestExpiryColorParent = 'text-red-600 dark:text-red-400 font-bold';
                else if (daysLeft < 90) nearestExpiryColorParent = 'text-orange-600 dark:text-orange-400 font-bold';
                else nearestExpiryColorParent = 'text-emerald-600 dark:text-emerald-400 font-medium';
            }
            
            if (nearestExpiryStrParent) {
                const safeVarName = escapeHTML(nearestExpiryVariantParent.variant_label || nearestExpiryVariantParent.name);
                stockBadge += `<div class="ml-3 flex items-center gap-1 group/exp relative cursor-help">
                    <i class="fa-regular fa-clock text-[10px] ${nearestExpiryColorParent}"></i>
                    <span class="${nearestExpiryColorParent} text-[11px]">${nearestExpiryStrParent}</span>
                    <span class="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] px-1.5 py-0.5 rounded shadow-sm border border-slate-200 dark:border-slate-700">Sớm nhất</span>
                    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max max-w-xs bg-slate-800 text-white text-[10px] rounded p-2 opacity-0 invisible group-hover/exp:opacity-100 group-hover/exp:visible transition-all z-50">
                        HSD sớm nhất thuộc về biến thể:<br/>
                        <strong class="text-orange-300">${safeVarName}</strong>
                    </div>
                </div>`;
            }

            if (variants.length > 0) {
                batchesHtmlContent = variants.map(v => {
                    const vStock = (v.product_batches || []).reduce((s, b) => s + (Number(b.stock_quantity) || 0), 0);
                    return `
                        <div class="flex items-center justify-between gap-3 text-xs mb-1.5 last:mb-0 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                            <div class="flex items-center gap-1.5">
                                <span class="font-bold text-slate-800 dark:text-slate-200 text-[11px] uppercase">${escapeHTML(v.variant_label || v.name)}</span>
                                <span class="text-[10px] font-black bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">SL: ${vStock}</span>
                            </div>
                        </div>`;
                }).join('');
            } else {
                batchesHtmlContent = `<span class="text-slate-400 italic text-xs">Chưa có biến thể</span>`;
            }
        } else {
            // Xử lý sản phẩm thường
            if (productUnits.length > 0) {
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

            totalStock = (product.product_batches || []).reduce((sum, b) => sum + (Number(b.stock_quantity) || 0), 0);
            const safeCode = escapeHTML(product.product_code || '---');

            if (totalStock <= 0) {
                stockBadge = '<span class="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Hết hàng</span>';
            } else if (totalStock < 10) {
                stockBadge = '<span class="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Sắp hết</span>';
            } else {
                stockBadge = '<span class="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Còn hàng</span>';
            }

            const activeBatches = (product.product_batches || []).filter(b => Number(b.stock_quantity || 0) > 0 || b.is_tracked); // Hiển thị cả lô = 0 nếu còn track
            const visibleBatches = activeBatches.slice(0, 3);

            if (visibleBatches.length > 0) {
                batchesHtmlContent = visibleBatches.map(b => {
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
                    const actionBtn = stock <= 0 ? `
                        <button onclick="window.deleteZeroBatch('${b.id}', '${escapeHTML(b.batch_number)}')" class="text-red-500 hover:text-red-700 ml-1.5 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30" title="Xóa lô rỗng">
                            <i class="fa-solid fa-trash-can text-[10px]"></i>
                        </button>
                    ` : `
                        <button onclick="window.openInternalIssueModal('${safeCode}')" class="text-orange-500 hover:text-orange-700 ml-1.5 p-1 rounded hover:bg-orange-50 dark:hover:bg-orange-950/30" title="Xuất kho lô này">
                            <i class="fa-solid fa-arrow-right-from-bracket text-[10px]"></i>
                        </button>
                    `;

                    return `
                    <div class="flex items-center justify-between gap-3 text-xs mb-1.5 last:mb-0 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div class="flex items-center gap-1.5">
                            <span class="font-bold text-slate-800 dark:text-slate-200 text-[11px] uppercase">${escapeHTML(b.batch_number || 'MẶC ĐỊNH')}</span>
                            <span class="text-[10px] font-black bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">SL: ${stock}</span>
                            ${actionBtn}
                        </div>
                        <span class="${expColor} text-[11px]">${expStr}</span>
                    </div>`;
                }).join('');
                if (activeBatches.length > visibleBatches.length) {
                    batchesHtmlContent += `<div class="text-[10px] font-black text-slate-400 px-2 pt-1">+${activeBatches.length - visibleBatches.length} lo khac</div>`;
                }
            } else {
                batchesHtmlContent = `<span class="text-slate-400 italic text-xs">Chưa có thông tin lô</span>`;
            }
        }

        const safeName = escapeHTML(product.name || 'Tên thuốc');
        const safeNameJs = String(product.name || 'San pham')
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/\r?\n/g, ' ');
        const safeCode = escapeHTML(product.product_code || '---');
        const safeIng = escapeHTML(product.active_ingredient || '');

        const businessStatus = product.is_active !== false
            ? '<i class="fa-solid fa-circle-check text-emerald-500 text-[10px]" title="Đang kinh doanh"></i>'
            : '<i class="fa-solid fa-circle-pause text-slate-400 text-[10px]" title="Ngừng kinh doanh"></i>';

        let variantTagsHtml = '';
        const isInactiveProduct = product.is_active === false;
        const actionVisibilityClass = isInactiveProduct ? 'opacity-100' : 'opacity-0 group-hover:opacity-100';
        
        let isAutoExpanded = false;
        if (isParent && variants.length > 0) {
            if (window.activeExpiryFilter && window.activeExpiryFilter !== 'all') {
                isAutoExpanded = true;
            }
        }

        if (isParent) {
            variantTagsHtml = `
                <div class="flex flex-wrap gap-2 mt-2">
                    <button onclick="window.toggleVariantsRow('${product.id}')" class="inline-flex px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[10px] font-black rounded-lg uppercase tracking-wider items-center gap-1.5 hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors shadow-sm">
                        <i id="icon_${product.id}" class="fa-solid fa-chevron-down transition-transform duration-200 ${isAutoExpanded ? 'rotate-180' : ''}"></i> Bật xem chi tiết ${variants.length} biến thể
                    </button>
                </div>
            `;
        } else if (parentProduct) {
            variantTagsHtml = `
                <div class="flex flex-wrap gap-1 mt-1.5">
                    <span class="inline-flex px-1.5 py-0.5 bg-purple-50 dark:bg-purple-955/35 border border-purple-200 dark:border-purple-800 text-purple-750 dark:text-purple-300 text-[9px] font-black rounded uppercase tracking-wider gap-1 items-center">
                        <i class="fa-solid fa-tag text-[8px]"></i> Biến thể của: ${escapeHTML(parentProduct.name)}
                    </span>
                </div>
            `;
        } else if (product.description) {
            try {
                const descData = JSON.parse(product.description);
                if (descData && descData.variants) {
                    Object.entries(descData.variants).forEach(([k, vList]) => {
                        const values = Array.isArray(vList) ? vList.join(', ') : vList;
                        variantTagsHtml += `<span class="text-[10px] font-bold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800/50 px-2 py-0.5 rounded-md shadow-sm"><i class="fa-solid fa-tags text-[9px] mr-1"></i>${escapeHTML(k)}: ${escapeHTML(values)}</span>`;
                    });
                }
            } catch (e) { }
        }

        let rowHtml = `
            <tr class="product-row bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 group"
                data-product-id="${escapeHTML(product.id || '')}"
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
                        <div class="font-black text-slate-900 dark:text-white text-base leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 ">
                            ${safeName}
                        </div>
                        ${businessStatus}
                    </div>
                    <div class="flex flex-wrap gap-2 items-center mt-1">
                        ${safeIng ? `<span class="text-[10px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 px-2 py-0.5 rounded-md shadow-sm"><i class="fa-solid fa-vial text-[9px]"></i> ${safeIng}</span>` : ''}
                        <span class="text-[10px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 px-2 py-0.5 rounded-md shadow-sm">${escapeHTML(product.product_categories?.name || 'Chưa phân loại')}</span>
                        ${variantTagsHtml}
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
                        <div class="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                            ${batchesHtmlContent}
                        </div>
                    </div>
                </td>

                <td class="py-4 px-5 text-center rounded-r-2xl border-y border-r border-slate-300 dark:border-slate-700">
                    <div class="flex items-center justify-center gap-2 ${actionVisibilityClass} transition-opacity duration-200">
                        ${isInactiveProduct ? `
                        <button onclick="window.quickIssueInactiveProductStock('${product.id}', '${safeNameJs}')"
                            ${totalStock <= 0 ? 'disabled' : ''}
                            class="w-10 h-10 flex items-center justify-center text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800/50 rounded-xl hover:bg-orange-600 hover:text-white hover:border-orange-600 shadow-sm ${totalStock <= 0 ? 'opacity-40 cursor-not-allowed hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:text-orange-600 dark:hover:text-orange-400 hover:border-orange-200 dark:hover:border-orange-800/50' : ''}"
                            title="${totalStock > 0 ? 'Xuất tồn nhanh toàn bộ các lô còn hàng' : 'Sản phẩm đã hết tồn'}">
                            <i class="fa-solid fa-arrow-up-from-bracket"></i>
                        </button>
                        ` : ''}
                        <button data-edit-product-code="${safeCode}"
                            class="w-10 h-10 flex items-center justify-center text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50 rounded-xl hover:bg-blue-600 hover:text-white hover:border-blue-600  shadow-sm"
                            title="Chỉnh sửa">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        ${isInactiveProduct ? `
                        <button onclick="window.deleteProduct('${product.id}', '${safeNameJs}')"
                            class="w-10 h-10 flex items-center justify-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 rounded-xl hover:bg-red-600 hover:text-white hover:border-red-600  shadow-sm"
                            title="Xóa hàng hóa">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                        ` : ''}
                        <button onclick="window.openPrintLabelModal('${product.id}')"
                            class="w-10 h-10 flex items-center justify-center text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800/50 rounded-xl hover:bg-green-600 hover:text-white hover:border-green-600  shadow-sm"
                            title="In tem mã">
                            <i class="fa-solid fa-print"></i>
                        </button>
                    </div>
                </td>
            </tr>`;

        if (isParent && variants.length > 0) {
            let subTableRows = variants.map(v => {
                const vStock = (v.product_batches || []).reduce((s, b) => s + (Number(b.stock_quantity) || 0), 0);
                let vRetail = '---';
                let vCost = '---';
                if (typeof window.productUnitsSourceList !== 'undefined') {
                    const vUnits = window.productUnitsSourceList.filter(u => u.product_id === v.id);
                    if (vUnits.length > 0) {
                        const sortedU = [...vUnits].sort((a, b) => (a.conversion_rate || 1) - (b.conversion_rate || 1));
                        vRetail = formatCurrency(sortedU[0].retail_price);
                        vCost = formatCurrency(sortedU[0].cost_price);
                    }
                }
                
                let expStr = '--/--/----';
                const activeBatches = (v.product_batches || []).filter(b => Number(b.stock_quantity || 0) > 0 && b.expiry_date);
                if (activeBatches.length > 0) {
                    const nearestDate = new Date(Math.min(...activeBatches.map(b => new Date(b.expiry_date).getTime())));
                    expStr = nearestDate.toLocaleDateString('vi-VN');
                }
                
                let rowClass = "border-b border-slate-200 dark:border-slate-700 last:border-0 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors";
                if (window.activeExpiryFilter && window.activeExpiryFilter !== 'all') {
                    let vPassExpiry = false;
                    if (nearestDate) {
                        const daysLeft = (nearestDate - new Date()) / (1000 * 60 * 60 * 24);
                        if (window.activeExpiryFilter === 'expired') vPassExpiry = daysLeft < 0;
                        else if (window.activeExpiryFilter === 'expiring_soon') vPassExpiry = daysLeft >= 0 && daysLeft < 90;
                        else if (window.activeExpiryFilter === 'valid') vPassExpiry = daysLeft >= 90;
                    }
                    if (vPassExpiry) {
                        rowClass += " bg-red-50 dark:bg-red-900/20 ring-1 ring-inset ring-red-200 dark:ring-red-800";
                    } else {
                        rowClass += " opacity-50 grayscale";
                    }
                }
                
                return `
                    <tr class="${rowClass}">
                        <td class="py-2.5 px-4 font-bold text-slate-800 dark:text-slate-200 w-1/4">${escapeHTML(v.variant_label || v.name)}</td>
                        <td class="py-2.5 px-4 text-blue-600 dark:text-blue-400 font-mono text-xs w-1/6 font-bold">${escapeHTML(v.product_code)}</td>
                        <td class="py-2.5 px-4 font-black text-emerald-600 dark:text-emerald-400 text-right w-1/6">${vRetail}</td>
                        <td class="py-2.5 px-4 font-bold text-orange-600 dark:text-orange-400 text-right w-1/6">${vCost}</td>
                        <td class="py-2.5 px-4 font-black text-slate-800 dark:text-slate-200 text-center w-1/12">${vStock}</td>
                        <td class="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-400 text-center">${expStr}</td>
                        <td class="py-2.5 px-4 text-right">
                            <button onclick="window.openEditModalByCode('${v.product_code}')" class="text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 dark:bg-blue-900/30 dark:hover:bg-blue-600 px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-sm transition-all border border-blue-200 dark:border-blue-800">
                                Sửa
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');

            const displayClass = isAutoExpanded ? "" : "hidden";
            rowHtml += `
            <tr id="variants_row_${product.id}" class="${displayClass}">
                <td colspan="7" class="p-0 border-b border-slate-300 dark:border-slate-700">
                    <div class="px-8 py-5 bg-gradient-to-r from-indigo-50/50 to-blue-50/50 dark:from-slate-900/80 dark:to-slate-800/80 shadow-[inset_0_4px_6px_-4px_rgba(0,0,0,0.1)]">
                        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
                            <table class="w-full text-xs text-left border-collapse">
                                <thead class="text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-100/80 dark:bg-slate-800/80">
                                    <tr>
                                        <th class="py-3 px-4 font-black w-1/4">Tên biến thể</th>
                                        <th class="py-3 px-4 font-black w-1/6">Mã</th>
                                        <th class="py-3 px-4 font-black text-right w-1/6">Giá bán</th>
                                        <th class="py-3 px-4 font-black text-right w-1/6">Giá vốn</th>
                                        <th class="py-3 px-4 font-black text-center w-1/12">Tồn</th>
                                        <th class="py-3 px-4 font-black text-center">Hạn SD</th>
                                        <th class="py-3 px-4 font-black text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${subTableRows}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </td>
            </tr>`;
        }

        return rowHtml;
    }).join('');

    let paginationHtml = '';
    if (productsList.length > 0) {
        paginationHtml = `
            <tr>
                <td colspan="6" class="py-4 px-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
                    <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div class="flex items-center gap-2">
                            <span class="text-sm font-medium text-slate-500 dark:text-slate-400">Hiển thị:</span>
                            <select onchange="window.changeProductItemsPerPage(this.value)" class="text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500  cursor-pointer">
                                <option value="20" ${productItemsPerPage === 20 ? 'selected' : ''}>20 dòng / trang</option>
                                <option value="50" ${productItemsPerPage === 50 ? 'selected' : ''}>50 dòng / trang</option>
                                <option value="100" ${productItemsPerPage === 100 ? 'selected' : ''}>100 dòng / trang</option>
                            </select>
                            <span class="text-sm font-medium text-slate-500 dark:text-slate-400 ml-2">Tổng: ${productsList.length}</span>
                        </div>
                        <div class="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                            <button onclick="window.changeProductPage(${Math.max(1, productCurrentPage - 1)})" class="px-3 py-1.5 rounded-lg text-sm font-bold  ${productCurrentPage === 1 ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95'}"><i class="fa-solid fa-chevron-left mr-1"></i> Trước</button>
                            <div class="px-4 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-black text-sm rounded-lg border border-blue-100 dark:border-blue-800/50">Trang ${productCurrentPage} / ${totalPages}</div>
                            <button onclick="window.changeProductPage(${Math.min(totalPages, productCurrentPage + 1)})" class="px-3 py-1.5 rounded-lg text-sm font-bold  ${productCurrentPage === totalPages ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95'}">Sau <i class="fa-solid fa-chevron-right ml-1"></i></button>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }

    productContainer.innerHTML = itemsHtml + paginationHtml;

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
    productSearchSourceList = productsList || [];

    const searchInputElement = document.getElementById('searchInput');
    const searchSuggestionsElement = document.getElementById('searchSuggestions');

    if (!searchInputElement || !searchSuggestionsElement) return;
    if (productSearchBound) return;
    productSearchBound = true;

    const runSearch = () => {
        const searchTerm = searchInputElement.value.toLowerCase().trim();
        const searchKey = removeVietnameseTones(searchTerm).toUpperCase();

        const filteredProducts = productSearchSourceList.filter(product => {
            // Match Name
            const nameMatch = (product._searchName || '').includes(searchKey);
            if (nameMatch) return true;
            // Match Code
            const codeMatch = (product.product_code || '').toUpperCase().includes(searchKey);
            if (codeMatch) return true;
            // Match Parent Name/Code
            if (product.parent_id) {
                const parent = productSearchSourceList.find(p => p.id === product.parent_id);
                if (parent && ((parent._searchName || '').includes(searchKey) || (parent.product_code || '').toUpperCase().includes(searchKey))) return true;
            }
            // Match Variant Name/Code
            const variants = productSearchSourceList.filter(p => p.parent_id === product.id);
            if (variants.some(v => (v._searchName || '').includes(searchKey) || (v.product_code || '').toUpperCase().includes(searchKey))) return true;

            return false;
        });

        scheduleProductRender(filteredProducts);

        if (searchTerm.length === 0) {
            searchSuggestionsElement.classList.add('hidden');
            return;
        }

        const matchedProductsList = filteredProducts.slice(0, 5);
        if (matchedProductsList.length > 0) {
            searchSuggestionsElement.innerHTML = matchedProductsList.map(product => {
                const isParent = product.is_direct_sale === false || (product.product_code || '').startsWith('PARENT_');
                const parentProduct = product.parent_id ? productSearchSourceList.find(p => p.id === product.parent_id) : null;

                let badgeText = '';
                if (isParent) {
                    badgeText = '<span class="ml-2 px-1.5 py-0.5 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 text-[9px] font-black rounded uppercase">Nhóm</span>';
                } else if (parentProduct) {
                    badgeText = `<span class="ml-2 px-1.5 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 text-[9px] font-black rounded uppercase">Biến thể</span>`;
                }

                return `
                    <li class="px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer border-b border-gray-100 dark:border-slate-700/50 last:border-0"
                        data-suggestion-code="${escapeHTML(product.product_code)}">
                        <div class="flex justify-between items-center">
                            <div>
                                <div class="flex items-center font-bold text-slate-800 dark:text-white text-sm">
                                    <span>${escapeHTML(product.name)}</span>
                                    ${badgeText}
                                </div>
                                <div class="text-xs text-slate-500 dark:text-slate-400">${escapeHTML(product.product_code)}</div>
                            </div>
                            <i class="fa-solid fa-arrow-right text-slate-300 dark:text-slate-500"></i>
                        </div>
                    </li>
                `;
            }).join('');
        } else {
            searchSuggestionsElement.innerHTML = `<li class="px-5 py-3 text-sm text-slate-500 dark:text-slate-400 italic">Không tìm thấy kết quả.</li>`;
        }
        searchSuggestionsElement.classList.remove('hidden');
    };

    searchInputElement.addEventListener('input', () => {
        clearTimeout(productSearchDebounce);
        productSearchDebounce = setTimeout(runSearch, 120);
    });

    searchInputElement.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const firstSuggestion = searchSuggestionsElement.querySelector('li');
            if (firstSuggestion && !searchSuggestionsElement.classList.contains('hidden')) {
                firstSuggestion.click();
            } else {
                searchSuggestionsElement.classList.add('hidden');
            }
        }
    });

    searchSuggestionsElement.addEventListener('click', (e) => {
        const li = e.target.closest('li');
        if (!li) return;
        const code = li.getAttribute('data-suggestion-code');
        if (code) {
            searchInputElement.value = code;
            searchSuggestionsElement.classList.add('hidden');
            runSearch();
        }
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
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30 ">
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

window.toggleDoseCutFields = (categoryName) => {
    const isDose = (categoryName || '').toLowerCase().includes('cắt liều') || (categoryName || '').toLowerCase().includes('thuốc liều');

    // Ẩn/hiện giá bán trong đơn vị tính
    document.querySelectorAll('#unitsContainer .unit-row').forEach(row => {
        const retailInput = row.querySelector('.unit-retail');
        const retailContainer = retailInput?.parentElement?.parentElement;
        if (retailContainer) {
            if (isDose) {
                retailContainer.classList.add('hidden');
                if (retailInput) {
                    retailInput.value = 0;
                    retailInput.required = false;
                }
            } else {
                retailContainer.classList.remove('hidden');
                if (retailInput) {
                    retailInput.required = true;
                }
            }
        }
    });

    // Ẩn/hiện khu vực quản lý lô hàng
    const batchControlsContainer = document.getElementById('batch_controls_container');
    const hasBatchCheckbox = document.getElementById('add_has_batch');
    if (isDose) {
        // Thuốc cắt liều không cần theo dõi lô hàng
        if (batchControlsContainer) batchControlsContainer.classList.add('hidden');
        if (hasBatchCheckbox && hasBatchCheckbox.checked) {
            hasBatchCheckbox.checked = false;
            hasBatchCheckbox.dispatchEvent(new Event('change'));
        }
    } else {
        // Hàng hóa bình thường: hiện lại khu vực quản lý lô
        if (batchControlsContainer) batchControlsContainer.classList.remove('hidden');
    }
};

// "Hàng Thuốc Liều" (add_is_dose_cut): nguyên liệu cắt liều - vẫn giữ giá vốn
// "Bán lẻ thuốc liều" (add_is_dose_retail): gói liều bán lẻ - vẫn giữ giá vốn, ghi nhận doanh thu riêng
window.handleDoseCutToggle = () => {
    // Không ẩn field nào - cả 2 loại đều cần giá vốn
};

export function openAddProductModal(product = null) {
    const modal = document.getElementById('addProductModal');
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

    const platformsContainer = document.getElementById('ecommercePlatformsContainer');
    if (platformsContainer) platformsContainer.innerHTML = '';
    const isEcommerceEl = document.getElementById('add_is_ecommerce');
    if (isEcommerceEl) {
        isEcommerceEl.checked = false;
        window.toggleEcommerceFields();
    }
    const isOneTimeEl = document.getElementById('add_is_one_time');
    if (isOneTimeEl) {
        isOneTimeEl.checked = false;
    }
    const isDoseCutEl = document.getElementById('add_is_dose_cut');
    if (isDoseCutEl) {
        isDoseCutEl.checked = false;
    }
    const isDoseRetailEl = document.getElementById('add_is_dose_retail');
    if (isDoseRetailEl) {
        isDoseRetailEl.checked = false;
    }

    const titleEl = document.getElementById('addProductModalTitle');
    const idEl = document.getElementById('add_product_id');

    if (product) {
        titleEl.textContent = `Cập nhật Hàng Hóa: ${product.product_code}`;
        idEl.value = product.id;

        document.getElementById('add_name').value = product.name || '';
        document.getElementById('add_code').value = product.product_code || '';
        if (product.category_id) document.getElementById('add_category').value = product.category_id;
        document.getElementById('add_is_active').checked = product.is_active;

        document.getElementById('add_barcode').value = product.barcode || '';

        if (isOneTimeEl) {
            let isOneTime = false;
            if (product.description) {
                try {
                    const descObj = JSON.parse(product.description);
                    isOneTime = descObj && descObj.is_one_time === true;
                } catch (e) { }
            }
            isOneTimeEl.checked = isOneTime;
        }

        if (isDoseCutEl) {
            let isDose = false;
            let isDoseRetail = false;
            if (product.description) {
                try {
                    const descObj = JSON.parse(product.description);
                    isDose = descObj && descObj.is_dose_cut === true;
                    isDoseRetail = descObj && descObj.is_dose_retail === true;
                } catch (e) { }
            }
            const catSelect = document.getElementById('add_category');
            const selectedText = catSelect?.options[catSelect.selectedIndex]?.text || '';
            if (!isDoseRetail && (selectedText.toLowerCase().includes('cắt liều') || selectedText.toLowerCase().includes('thuốc liều'))) {
                isDose = true;
            }
            isDoseCutEl.checked = isDose;
        }

        const isDoseRetailEl = document.getElementById('add_is_dose_retail');
        if (isDoseRetailEl) {
            let isDoseRetail = false;
            if (product.description) {
                try {
                    const descObj = JSON.parse(product.description);
                    isDoseRetail = descObj && descObj.is_dose_retail === true;
                } catch (e) { }
            }
            isDoseRetailEl.checked = isDoseRetail;
        }

        if (isEcommerceEl) {
            isEcommerceEl.checked = !!product.is_ecommerce;
            window.toggleEcommerceFields();
            if (platformsContainer) {
                const platforms = product.ecommerce_platforms || [];
                if (platforms.length > 0) {
                    platforms.forEach(p => window.addEcommercePlatformRow(p.platform, p.price));
                } else if (product.is_ecommerce) {
                    window.addEcommercePlatformRow();
                }
            }
        }
        document.getElementById('add_reg_no').value = product.registration_no || '';
        document.getElementById('add_active_ingredient').value = product.active_ingredient || '';
        document.getElementById('add_concentration').value = product.concentration || '';
        document.getElementById('add_route').value = product.route_of_admin || '';
        document.getElementById('add_packaging').value = product.packaging_spec || '';
        document.getElementById('add_manufacturer').value = product.manufacturer || '';

        // Điền Base Unit
        if (product.product_units && product.product_units.length > 0) {
            const baseUnit = product.product_units.find(u => u.is_base_unit) || product.product_units[0];
            const baseRow = container.querySelector('.unit-row:first-child');
            baseRow.querySelector('.unit-name').value = baseUnit.unit_name || '';
            baseRow.querySelector('.unit-retail').value = baseUnit.retail_price || '';
            baseRow.querySelector('.unit-cost').value = baseUnit.cost_price || '';

            // Điền Conversion Units
            // Điền Conversion Units (limit to first 3 for performance)
            const convUnits = product.product_units.filter(u => u.id !== baseUnit.id);
            const maxConv = 3;
            convUnits.slice(0, maxConv).forEach(u => {
                addConversionUnit();
                const newRow = container.lastElementChild;
                newRow.querySelector('.unit-name').value = u.unit_name || '';
                newRow.querySelector('.unit-conversion').value = u.conversion_rate || '';
                newRow.querySelector('.unit-retail').value = u.retail_price || '';
                newRow.querySelector('.unit-cost').value = u.cost_price || '';
            });
            // Additional units can be added manually via UI.
        }

        // Điền Lô hàng — dùng addBatchRowsBatch để chỉ write DOM 1 lần
        if (product.product_batches && product.product_batches.length > 0) {
            document.getElementById('add_has_batch').checked = product.product_batches.some(b => b.is_tracked);
            const maxBatches = 5;
            addBatchRowsBatch(product.product_batches.slice(0, maxBatches));
            // Additional batches can be added via UI
        } else {
            addBatchRow(); // Thêm 1 dòng trống mặc định
        }

        // Check if product has variants (either by description or by having children)
        let hasVariants = false;
        if (product.description) {
            try {
                const descData = JSON.parse(product.description);
                if (descData && descData.has_variants) {
                    hasVariants = true;
                }
            } catch (e) {}
        }
        const actualChildVariants = (window.currentProductsList || []).filter(p => p.parent_id === product.id);
        if (actualChildVariants.length > 0) {
            hasVariants = true;
        }
        
        const hasVariantsCheckbox = document.getElementById('add_has_variants');
        if (hasVariantsCheckbox) {
            hasVariantsCheckbox.checked = hasVariants;
        }
        
        // Gọi hàm toggle UI dựa trên checkbox
        if (typeof window.toggleHasVariants === 'function') {
            window.toggleHasVariants();
        }
        const variantsListSection = document.getElementById('variantsListSection');
        const variantsListContainer = document.getElementById('variantsListContainer');
        const childVariants = (window.currentProductsList || []).filter(p => p.parent_id === product.id);
        
        if (childVariants.length > 0) {
            if (variantsListSection) variantsListSection.classList.remove('hidden');
            if (variantsListContainer) {
                variantsListContainer.innerHTML = childVariants.map(v => {
                    const label = v.variant_label || v.name;
                    const stock = (v.product_batches || []).reduce((sum, b) => sum + (Number(b.stock_quantity) || 0), 0);
                    
                    const vRetailRaw = typeof window.productUnitsSourceList !== 'undefined' ? (window.productUnitsSourceList.filter(u => u.product_id === v.id)[0]?.retail_price || 0) : 0;
                    
                    const vBatches = v.product_batches || [];
                    let vCostRaw = 0;
                    if (vBatches.length > 0) {
                        const validVBatches = vBatches.filter(b => b.cost_price > 0);
                        if(validVBatches.length > 0) vCostRaw = validVBatches[validVBatches.length - 1].cost_price;
                    }


                    let batchesHtml = (v.product_batches || []).map(b => `
                        <div class="flex gap-2 mb-2 inline-batch-item">
                            <input type="hidden" class="batch-id" value="${b.id}">
                            <input type="text" class="batch-name w-1/3 px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800" value="${escapeHTML(b.batch_name || '')}" placeholder="Tên lô">
                            <input type="date" class="batch-exp w-1/3 px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800" value="${b.expiry_date ? b.expiry_date.split('T')[0] : ''}">
                            <input type="number" class="batch-qty w-1/4 px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800" value="${b.stock_quantity || 0}" placeholder="SL">
                            <button type="button" onclick="this.parentElement.remove()" class="w-8 flex items-center justify-center text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-200"><i class="fa-solid fa-trash-can text-xs"></i></button>
                        </div>
                    `).join('');

                    return `
                        <div class="flex flex-col border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 overflow-hidden mb-2">
                            <div id="modal_display_${v.id}" class="flex items-center justify-between p-3">
                                <div class="flex flex-col">
                                    <span class="font-bold text-slate-800 dark:text-white text-sm">${escapeHTML(label)}</span>
                                    <span class="text-[11px] text-slate-500 font-medium">Mã: <span class="font-mono text-blue-600 dark:text-blue-400">${escapeHTML(v.product_code)}</span> | Tồn kho: <span class="font-bold">${stock}</span></span>
                                </div>
                                <button type="button" onclick="window.toggleInlineEditorModal('${v.id}')" class="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition-colors border border-blue-200 dark:border-blue-800/50">
                                    Sửa
                                </button>
                            </div>
                            
                            <div id="modal_edit_${v.id}" class="hidden p-4 bg-indigo-50/80 dark:bg-slate-800/90 border-t border-indigo-200 dark:border-slate-700 shadow-inner">
                                <div class="flex flex-col gap-4">
                                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Mã SKU</label>
                                            <input type="text" id="inline_code_${v.id}" class="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-white" value="${escapeHTML(v.product_code)}">
                                        </div>
                                        <div>
                                            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Giá Vốn</label>
                                            <input type="number" id="inline_cost_${v.id}" class="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-white" value="${vCostRaw}">
                                        </div>
                                        <div>
                                            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Giá Bán</label>
                                            <input type="number" id="inline_retail_${v.id}" class="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-white" value="${vRetailRaw}">
                                        </div>
                                    </div>
                                    
                                    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 shadow-sm">
                                        <div class="flex justify-between items-center mb-2">
                                            <span class="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider"><i class="fa-solid fa-cubes-stacked"></i> Lô Hàng</span>
                                            <button type="button" onclick="window.addInlineBatchRow('${v.id}')" class="text-[9px] font-black px-2 py-1 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded border border-orange-200"><i class="fa-solid fa-plus"></i> Thêm Lô</button>
                                        </div>
                                        <div id="inline_batches_${v.id}" class="flex flex-col gap-1">
                                            ${batchesHtml}
                                        </div>
                                    </div>
                                    
                                    <div class="flex justify-end gap-2">
                                        <button type="button" onclick="window.toggleInlineEditorModal('${v.id}')" class="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-black rounded hover:bg-slate-300">HỦY BỎ</button>
                                        <button type="button" onclick="window.saveInlineVariant('${v.id}')" class="px-4 py-1.5 bg-blue-600 text-white text-[10px] font-black rounded shadow-lg shadow-blue-500/30 hover:bg-blue-700"><i class="fa-solid fa-floppy-disk"></i> LƯU BIẾN THỂ</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }


        const toggleContainer = document.getElementById('statusToggleContainer');
        if (toggleContainer) toggleContainer.classList.remove('hidden');

    } else {
        titleEl.textContent = 'Thêm Hàng Hóa Mới';
        idEl.value = '';
        document.getElementById('addProductForm').reset();
        generateProductCode();
        document.getElementById('add_has_batch').checked = true;

        addBatchRow(); // Thêm 1 dòng trống mặc định

        const toggleContainer = document.getElementById('statusToggleContainer');
        if (toggleContainer) toggleContainer.classList.add('hidden');
    }

    toggleBatchFields();

    // Toggle retail price fields visibility according to selected category
    const catSelect = document.getElementById('add_category');
    if (catSelect) {
        const optionText = catSelect.options[catSelect.selectedIndex]?.text || '';
        window.toggleDoseCutFields(optionText);
    }

    modal.classList.remove('hidden');
    modal.classList.add('modal-open');
    document.body.classList.add('overflow-hidden');

    // === PERFORMANCE: Freeze background while modal is open ===
    // 1. Pause the AI reminder interval (fires every 5s and triggers DOM updates)
    if (window.aiReminderInterval) {
        clearInterval(window.aiReminderInterval);
        window._aiIntervalPaused = true;
    }
    // 2. Add class to body so CSS can kill transitions/animations on everything behind modal
    document.body.classList.add('modal-is-open');
}

export function closeAddProductModal() {
    const modal = document.getElementById('addProductModal');
    modal.classList.add('hidden');
    modal.classList.remove('modal-open');
    document.body.classList.remove('overflow-hidden');
    document.body.classList.remove('modal-is-open');

    // === PERFORMANCE: Resume background after modal closed ===
    if (window._aiIntervalPaused && window.startAIChatReminders) {
        window._aiIntervalPaused = false;
        window.startAIChatReminders();
    }
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
    // No  classes — they cause Tailwind JIT recalculation on every insert
    const html = `
        <div id="${rowId}" class="unit-row grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-emerald-50/30 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-2xl relative shadow-sm mt-3">
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
                    <input type="number" name="retail_price" required min="0" placeholder="0" oninput="if(window.handleUnitRetailChange) window.handleUnitRetailChange(this)" class="unit-retail w-full pl-4 pr-10 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <span class="absolute right-4 top-2.5 text-slate-400 font-black text-[10px]">VNĐ</span>
                </div>
            </div>
            <div>
                <label class="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Giá vốn</label>
                <div class="relative">
                    <input type="number" name="cost_price" min="0" placeholder="0" oninput="if(window.handleUnitCostChange) window.handleUnitCostChange(this)" class="unit-cost w-full pl-4 pr-10 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500">
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
            if(window.handleUnitRetailChange) window.handleUnitRetailChange(retailInput);
            if(window.handleUnitCostChange) window.handleUnitCostChange(costInput);
        }
    });

    retailInput.addEventListener('input', () => {
        retailInput._manualEdit = true;
    });
    costInput.addEventListener('input', () => {
        costInput._manualEdit = true;
    });

    // Hide retail price if currently in dose cut category mode
    const catSelect = document.getElementById('add_category');
    if (catSelect) {
        const optionText = catSelect.options[catSelect.selectedIndex]?.text || '';
        const isDose = optionText.toLowerCase().includes('cắt liều') || optionText.toLowerCase().includes('thuốc liều');
        if (isDose) {
            const retailContainer = retailInput?.parentElement?.parentElement;
            if (retailContainer) {
                retailContainer.classList.add('hidden');
            }
            if (retailInput) {
                retailInput.value = 0;
                retailInput.required = false;
            }
        }
    }
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
    const baseCostPrice = parseFloat(document.querySelector('.unit-cost')?.value) || 0;
    const batchCost = batch.cost_price !== undefined && batch.cost_price !== null ? parseFloat(batch.cost_price) : baseCostPrice;
    const useStandard = batch.cost_price === undefined || batch.cost_price === null || batchCost === baseCostPrice;
    const costValue = batchCost;
    // No  classes — they cause Tailwind JIT recalculation on every insert
    const html = `
        <div id="${rowId}" data-batch-id="${batch.id || ''}" class="batch-row grid grid-cols-1 md:grid-cols-5 gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm relative group">
            <button type="button" onclick="document.getElementById('${rowId}').remove()" class="absolute -top-2 -right-2 w-7 h-7 bg-white dark:bg-slate-700 text-red-500 rounded-full shadow-md border border-slate-200 dark:border-slate-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white z-10">
                <i class="fa-solid fa-xmark text-xs"></i>
            </button>
            <div>
                <label class="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Số lượng tồn</label>
                <input type="number" min="0" value="${batch.stock_quantity || ''}" placeholder="0" class="batch-stock w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-black text-xl focus:outline-none focus:ring-2 focus:ring-orange-500">
            </div>
            <div>
                <label class="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Mã số lô</label>
                <input type="text" value="${batch.batch_number || ''}" placeholder="VD: LO01" class="batch-number w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-orange-500">
            </div>
            <div>
                <div class="flex justify-between items-center mb-2">
                    <label class="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Giá vốn lô</label>
                    <label class="flex items-center gap-1 cursor-pointer">
                        <input type="checkbox" class="batch-use-standard-cost accent-orange-500 w-3 h-3" ${useStandard ? 'checked' : ''} onchange="window.toggleBatchCost(this)">
                        <span class="text-[9px] font-normal lowercase text-slate-500">Lấy giá chuẩn</span>
                    </label>
                </div>
                <input type="number" min="0" value="${costValue}" placeholder="0" class="batch-cost-price w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-black text-xl focus:outline-none focus:ring-2 focus:ring-orange-500" ${useStandard ? 'readonly' : ''}>
            </div>
            <div class="md:col-span-2">
                <label class="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Hạn sử dụng</label>
                <input type="date" value="${expiry}" class="batch-expiry w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 [color-scheme:light] dark:[color-scheme:dark]">
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
}

/**
 * Performance: insert multiple batch rows in ONE DOM write instead of N separate ones.
 * @param {Array} batches - array of batch objects
 */
export function addBatchRowsBatch(batches = []) {
    const container = document.getElementById('batchRowsContainer');
    if (!container) return;

    const allHtml = batches.map(batch => {
        const rowId = 'batch_' + Date.now() + '_' + Math.random().toString(16).slice(2);
        const expiry = batch.expiry_date ? String(batch.expiry_date).substring(0, 10) : '';
        const baseCostPrice = parseFloat(document.querySelector('.unit-cost')?.value) || 0;
        const batchCost = batch.cost_price !== undefined && batch.cost_price !== null ? parseFloat(batch.cost_price) : baseCostPrice;
        const useStandard = batch.cost_price === undefined || batch.cost_price === null || batchCost === baseCostPrice;
        const costValue = batchCost;
        return `
        <div id="${rowId}" data-batch-id="${batch.id || ''}" class="batch-row grid grid-cols-1 md:grid-cols-5 gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm relative group">
            <button type="button" onclick="this.closest('.batch-row').remove()" class="absolute -top-2 -right-2 w-7 h-7 bg-white dark:bg-slate-700 text-red-500 rounded-full shadow-md border border-slate-200 dark:border-slate-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white z-10">
                <i class="fa-solid fa-xmark text-xs"></i>
            </button>
            <div>
                <label class="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Số lượng tồn</label>
                <input type="number" min="0" value="${batch.stock_quantity || ''}" placeholder="0" class="batch-stock w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-black text-xl focus:outline-none focus:ring-2 focus:ring-orange-500">
            </div>
            <div>
                <label class="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Mã số lô</label>
                <input type="text" value="${batch.batch_number || ''}" placeholder="VD: LO01" class="batch-number w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-orange-500">
            </div>
            <div>
                <div class="flex justify-between items-center mb-2">
                    <label class="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Giá vốn lô</label>
                    <label class="flex items-center gap-1 cursor-pointer">
                        <input type="checkbox" class="batch-use-standard-cost accent-orange-500 w-3 h-3" ${useStandard ? 'checked' : ''} onchange="window.toggleBatchCost(this)">
                        <span class="text-[9px] font-normal lowercase text-slate-500">Lấy giá chuẩn</span>
                    </label>
                </div>
                <input type="number" min="0" value="${costValue}" placeholder="0" class="batch-cost-price w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-black text-xl focus:outline-none focus:ring-2 focus:ring-orange-500" ${useStandard ? 'readonly' : ''}>
            </div>
            <div class="md:col-span-2">
                <label class="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Hạn sử dụng</label>
                <input type="date" value="${expiry}" class="batch-expiry w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 [color-scheme:light] dark:[color-scheme:dark]">
            </div>
        </div>`;
    }).join('');
    container.insertAdjacentHTML('beforeend', allHtml);
}

export function removeBatchRow(rowId) {
    document.getElementById(rowId)?.remove();
}

export function addVariantRow(key = '', values = []) {
    const container = document.getElementById('variantsContainer');
    if (!container) return;

    const rowId = 'variant_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const valuesList = Array.isArray(values) ? values : (values ? [values] : []);

    // No  classes — they cause Tailwind JIT recalculation on every insert
    const html = `
        <div id="${rowId}" class="variant-row flex flex-col md:flex-row items-start gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative group hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
            <button type="button" onclick="document.getElementById('${rowId}').remove()" class="absolute -top-2 -right-2 w-7 h-7 bg-white dark:bg-slate-800 text-red-500 rounded-full shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white hover:border-red-500 z-10">
                <i class="fa-solid fa-xmark text-xs"></i>
            </button>
            <div class="w-full md:w-1/3">
                <label class="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Tên phân loại</label>
                <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <i class="fa-solid fa-tag text-slate-400 text-xs"></i>
                    </div>
                    <input type="text" class="variant-key w-full pl-9 pr-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-900 transition-all" placeholder="VD: Màu sắc..." value="${escapeHTML(key)}">
                </div>
            </div>
            <div class="flex-1 w-full">
                <label class="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Giá trị (Nhập và ấn Enter)</label>
                <div class="variant-values-container flex flex-wrap gap-2 items-center bg-slate-50 dark:bg-slate-800/50 p-2 border border-slate-200 dark:border-slate-700 rounded-xl min-h-[46px] focus-within:border-purple-500 transition-all">
                    <input type="text" class="variant-tag-input flex-1 bg-transparent border-none outline-none text-sm font-medium min-w-[120px] text-slate-800 dark:text-white px-2 py-1 placeholder-slate-400 dark:placeholder-slate-500" placeholder="Thêm giá trị...">
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);

    // Attach event directly — no setTimeout needed (element is in DOM immediately after insertAdjacentHTML)
    const newRow = document.getElementById(rowId);
    const inputEl = newRow.querySelector('.variant-tag-input');

    inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const val = inputEl.value.trim();
            if (val) {
                window.addVariantValueToRow(rowId, val);
                inputEl.value = '';
            }
        } else if (e.key === 'Backspace' && inputEl.value === '') {
            const tags = newRow.querySelectorAll('.variant-tag-item');
            if (tags.length > 0) tags[tags.length - 1].remove();
        }
    });

    // Thêm các giá trị hiện có
    if (valuesList.length > 0) {
        valuesList.forEach(v => { if (v) window.addVariantValueToRow(rowId, v); });
    }
}

window.addVariantValueToRow = (rowId, value = '') => {
    if (!value.trim()) return;
    const row = document.getElementById(rowId);
    if (!row) return;
    const container = row.querySelector('.variant-values-container');
    const inputEl = container.querySelector('.variant-tag-input');

    const valId = 'val_' + Date.now() + Math.random().toString(36).substr(2, 5);
    // No  on tags either
    const html = `
        <div id="${valId}" class="variant-tag-item flex items-center gap-1.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800/50 shadow-sm text-sm font-semibold">
            <span>${escapeHTML(value.trim())}</span>
            <input type="hidden" class="variant-value-input" value="${escapeHTML(value.trim())}">
            <button type="button" onclick="document.getElementById('${valId}').remove()" class="text-purple-400 hover:text-white hover:bg-red-500 rounded-full w-4 h-4 flex items-center justify-center transition-colors">
                <i class="fa-solid fa-xmark text-[10px]"></i>
            </button>
        </div>
    `;
    inputEl.insertAdjacentHTML('beforebegin', html);
};

export function removeVariantRow(rowId) {
    document.getElementById(rowId)?.remove();
}

export function toggleBatchCost(checkbox) {
    const row = checkbox.closest('.batch-row');
    const input = row.querySelector('.batch-cost-price');
    if (checkbox.checked) {
        input.readOnly = true;
        const baseCost = parseFloat(document.querySelector('.unit-cost')?.value) || 0;
        input.value = baseCost;
    } else {
        input.readOnly = false;
        input.focus();
    }
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
            if (input) input.value = '';
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

export function generateBarcodeSVG(text) {
    if (!text) return '';
    const cleanText = String(text).toUpperCase().replace(/[^0-9A-Z\-\.\s\$\/\+\%]/g, '');
    const fullText = `*${cleanText}*`;

    const code39Map = {
        '0': '101001101101', '1': '110100101011', '2': '101100101011', '3': '110110010101',
        '4': '101001101011', '5': '110100110101', '6': '101100110101', '7': '101001011011',
        '8': '110100101101', '9': '101100101101', 'A': '110101001011', 'B': '101101001011',
        'C': '110110100101', 'D': '101011001011', 'E': '110101100101', 'F': '101101100101',
        'G': '101010011011', 'H': '110101001101', 'I': '101101001101', 'J': '101011001101',
        'K': '110101010011', 'L': '101101010011', 'M': '110110101001', 'N': '101011010011',
        'O': '110101101001', 'P': '101101101001', 'Q': '101010110011', 'R': '110101011001',
        'S': '101101011001', 'T': '101011011001', 'U': '110010101011', 'V': '100110101011',
        'W': '110011010101', 'X': '100101101011', 'Y': '110010110101', 'Z': '100111010101',
        '-': '100101011011', '.': '110010101101', ' ': '100110101101', '*': '100101101101',
        '+': '100110110100', '$': '100100100101', '/': '100100101001', '%': '101001001001'
    };

    let binaryString = '';
    for (let char of fullText) {
        const pattern = code39Map[char] || code39Map[' '];
        binaryString += pattern + '0';
    }

    const barWidth = 1.5;
    const height = 40;
    const width = binaryString.length * barWidth;

    let rects = '';
    for (let i = 0; i < binaryString.length; i++) {
        if (binaryString[i] === '1') {
            rects += `<rect x="${i * barWidth}" y="0" width="${barWidth}" height="${height}" fill="black" />`;
        }
    }

    return `<svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;
}

export function openPrintLabelModal(productId) {
    const product = (window.currentProductsList || []).find(p => p.id === productId);
    if (!product) {
        showToast('Không tìm thấy thông tin sản phẩm', 'error');
        return;
    }

    const modal = document.getElementById('printLabelModal');
    if (!modal) return;

    // Fill form fields
    document.getElementById('printLabelName').value = product.name || '';
    document.getElementById('printLabelCode').value = product.product_code || '';
    document.getElementById('printLabelQty').value = 1;

    // Fill unit select
    const unitSelect = document.getElementById('printLabelUnitSelect');
    unitSelect.innerHTML = '';

    const units = product.product_units || [];
    if (units.length > 0) {
        units.forEach((unit, idx) => {
            const opt = document.createElement('option');
            opt.value = `${unit.unit_name}|${unit.retail_price || 0}`;
            opt.textContent = `${unit.unit_name} - ${formatCurrency(unit.retail_price)}`;
            if (idx === 0) opt.selected = true;
            unitSelect.appendChild(opt);
        });
    } else {
        const opt = document.createElement('option');
        opt.value = `Cái|0`;
        opt.textContent = `Mặc định - 0đ`;
        unitSelect.appendChild(opt);
    }

    // Set up real-time preview updating
    const previewTriggers = [
        'printLabelUnitSelect',
        'printLabelTemplate',
        'printLabelQty',
        'printShowStoreName',
        'printShowProductName',
        'printShowPrice',
        'printShowBarcode'
    ];

    previewTriggers.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.onchange = updatePrintLabelPreview;
            el.oninput = updatePrintLabelPreview;
        }
    });

    // Show modal
    modal.classList.remove('hidden');

    // Initial preview render
    updatePrintLabelPreview();
}



export function updatePrintLabelPreview() {
    const name = document.getElementById('printLabelName').value;
    const code = document.getElementById('printLabelCode').value;

    const unitSelect = document.getElementById('printLabelUnitSelect');
    let unitName = 'Cái';
    let price = 0;
    if (unitSelect && unitSelect.value) {
        const parts = unitSelect.value.split('|');
        unitName = parts[0];
        price = Number(parts[1]) || 0;
    }

    const template = document.getElementById('printLabelTemplate').value;

    const showStore = document.getElementById('printShowStoreName').checked;
    const showProduct = document.getElementById('printShowProductName').checked;
    const showPrice = document.getElementById('printShowPrice').checked;
    const showBarcode = document.getElementById('printShowBarcode').checked;

    const previewContainer = document.getElementById('printLabelPreviewContainer');
    if (!previewContainer) return;

    let previewHtml = '';
    const barcodeSVG = showBarcode ? generateBarcodeSVG(code) : '';
    const formattedPrice = formatCurrency(price);

    // Dynamic sizing based on how many fields are checked to maximize space utilization (using JIT-safe inline CSS)
    let nameFontSize = '10px';
    let nameLineClamp = '1';
    let priceFontSize = '11px';
    let barcodeHeight = '20px';
    let labelPadding = '4px';

    if (template.startsWith('35x22')) {
        labelPadding = '4px';
        barcodeHeight = '18px'; // Fixed barcode height

        // Count active fields
        const activeCount = (showStore ? 1 : 0) + (showProduct ? 1 : 0) + (showPrice ? 1 : 0) + (showBarcode ? 1 : 0);

        if (activeCount === 4) {
            nameFontSize = '9px';
            nameLineClamp = '1';
            priceFontSize = '11px';
        } else if (activeCount === 3) {
            if (!showStore) {
                nameFontSize = '11px';
                nameLineClamp = '1';
                priceFontSize = '13px';
            } else if (!showPrice) {
                nameFontSize = '11px';
                nameLineClamp = '2';
            } else if (!showBarcode) {
                nameFontSize = '12px';
                nameLineClamp = '2';
                priceFontSize = '14px';
            }
        } else if (activeCount === 2) {
            if (showProduct && showBarcode) {
                nameFontSize = '12px';
                nameLineClamp = '2';
            } else if (showProduct && showPrice) {
                nameFontSize = '14px';
                nameLineClamp = '2';
                priceFontSize = '16px';
            } else if (showPrice && showBarcode) {
                priceFontSize = '15px';
            } else if (showStore && showProduct) {
                nameFontSize = '13px';
                nameLineClamp = '2';
            }
        } else if (activeCount === 1) {
            if (showProduct) {
                nameFontSize = '16px';
                nameLineClamp = '3';
            } else if (showPrice) {
                priceFontSize = '20px';
            }
        }
    } else {
        // Larger template 50x30
        labelPadding = '8px';
        barcodeHeight = '28px'; // Fixed barcode height
        const activeCount = (showStore ? 1 : 0) + (showProduct ? 1 : 0) + (showPrice ? 1 : 0) + (showBarcode ? 1 : 0);

        if (activeCount === 4) {
            nameFontSize = '13px';
            nameLineClamp = '2';
            priceFontSize = '15px';
        } else if (activeCount === 3) {
            nameFontSize = '15px';
            nameLineClamp = '2';
            priceFontSize = '17px';
        } else {
            nameFontSize = '17px';
            nameLineClamp = '3';
            priceFontSize = '19px';
        }
    }

    const labelInnerHtml = `
        <div class="flex flex-col items-center h-full w-full bg-white text-black text-center font-sans select-none overflow-hidden" style="border: 1px solid #cbd5e1; box-sizing: border-box; font-family: 'Inter', sans-serif; padding: ${labelPadding}; justify-content: space-between; gap: ${showBarcode ? '2px' : '4px'};">
            ${showStore ? `<div class="font-black uppercase tracking-wider truncate w-full border-b border-dashed border-slate-300 pb-0.5 mb-0.5" style="font-size: 8px;">NHÀ THUỐC KHẢI HOÀN</div>` : ''}
            ${showProduct ? `<div class="font-black leading-none text-slate-800 w-full text-center mt-0.5 mb-0.5" style="font-size: ${nameFontSize}; display: -webkit-box; -webkit-line-clamp: ${nameLineClamp}; -webkit-box-orient: vertical; overflow: hidden;">${escapeHTML(name)}</div>` : ''}
            ${showPrice ? `<div class="font-black text-blue-700 my-0.5" style="font-size: ${priceFontSize};">${formattedPrice} <span class="font-normal text-slate-500" style="font-size: 8px;">/${escapeHTML(unitName)}</span></div>` : ''}
            
            ${showBarcode ? `
                <div class="w-full flex flex-col items-center mt-auto">
                    <div class="w-[95%] flex items-center justify-center overflow-hidden" style="height: ${barcodeHeight};">
                        ${barcodeSVG}
                    </div>
                    <div class="font-mono tracking-widest mt-0.5 text-slate-600 leading-none" style="font-size: 8px;">${escapeHTML(code)}</div>
                </div>
            ` : ''}
        </div>
    `;

    if (template === '35x22_single') {
        previewHtml = `
            <div class="relative w-[180px] h-[120px] rounded-lg shadow-sm overflow-hidden bg-white">
                ${labelInnerHtml}
            </div>
        `;
    } else if (template === '35x22_double') {
        previewHtml = `
            <div class="flex gap-2 p-1 bg-slate-100 rounded-xl">
                <div class="relative w-[150px] h-[100px] rounded-lg shadow-sm overflow-hidden bg-white">
                    ${labelInnerHtml}
                </div>
                <div class="relative w-[150px] h-[100px] rounded-lg shadow-sm overflow-hidden bg-white opacity-80 border-l border-dashed border-slate-300">
                    ${labelInnerHtml}
                </div>
            </div>
        `;
    } else if (template === '50x30_single') {
        previewHtml = `
            <div class="relative w-[240px] h-[150px] rounded-lg shadow-sm overflow-hidden bg-white">
                ${labelInnerHtml}
            </div>
        `;
    }

    previewContainer.innerHTML = previewHtml;
}

export function printLabel() {
    const name = document.getElementById('printLabelName').value;
    const code = document.getElementById('printLabelCode').value;

    const unitSelect = document.getElementById('printLabelUnitSelect');
    let unitName = 'Cái';
    let price = 0;
    if (unitSelect && unitSelect.value) {
        const parts = unitSelect.value.split('|');
        unitName = parts[0];
        price = Number(parts[1]) || 0;
    }

    const template = document.getElementById('printLabelTemplate').value;
    const qty = parseInt(document.getElementById('printLabelQty').value) || 1;

    const showStore = document.getElementById('printShowStoreName').checked;
    const showProduct = document.getElementById('printShowProductName').checked;
    const showPrice = document.getElementById('printShowPrice').checked;
    const showBarcode = document.getElementById('printShowBarcode').checked;

    // Create the print container
    const printContainer = document.createElement('div');
    printContainer.id = 'khaihoan-print-label-container';

    let contentHtml = '';
    let pageStyle = '';

    // Generate barcode SVG & formatted price
    const barcodeSVG = showBarcode ? generateBarcodeSVG(code) : '';
    const formattedPrice = formatCurrency(price);

    // Determine sizes dynamically based on template & choices
    let nameFontSize = '7.5pt';
    let nameLineClamp = '1';
    let priceFontSize = '8.5pt';
    let barcodeHeight = '5.5mm';
    let labelPadding = '1mm';

    if (template.startsWith('35x22')) {
        labelPadding = '0.6mm';
        barcodeHeight = '4.5mm'; // Fixed height
        const activeCount = (showStore ? 1 : 0) + (showProduct ? 1 : 0) + (showPrice ? 1 : 0) + (showBarcode ? 1 : 0);

        if (activeCount === 4) {
            nameFontSize = '7pt';
            nameLineClamp = '1';
            priceFontSize = '8.5pt';
        } else if (activeCount === 3) {
            if (!showStore) {
                nameFontSize = '8pt';
                nameLineClamp = '1';
                priceFontSize = '9.5pt';
            } else if (!showPrice) {
                nameFontSize = '8pt';
                nameLineClamp = '2';
            } else if (!showBarcode) {
                nameFontSize = '9pt';
                nameLineClamp = '2';
                priceFontSize = '11pt';
            }
        } else if (activeCount === 2) {
            if (showProduct && showBarcode) {
                nameFontSize = '9.5pt';
                nameLineClamp = '2';
            } else if (showProduct && showPrice) {
                nameFontSize = '10.5pt';
                nameLineClamp = '2';
                priceFontSize = '12pt';
            } else if (showPrice && showBarcode) {
                priceFontSize = '11.5pt';
            } else if (showStore && showProduct) {
                nameFontSize = '10pt';
                nameLineClamp = '2';
            }
        } else if (activeCount === 1) {
            if (showProduct) {
                nameFontSize = '12pt';
                nameLineClamp = '3';
            } else if (showPrice) {
                priceFontSize = '15pt';
            }
        }
    } else {
        // 50x30
        labelPadding = '1.5mm';
        barcodeHeight = '7mm'; // Fixed height
        const activeCount = (showStore ? 1 : 0) + (showProduct ? 1 : 0) + (showPrice ? 1 : 0) + (showBarcode ? 1 : 0);

        if (activeCount === 4) {
            nameFontSize = '9.5pt';
            nameLineClamp = '2';
            priceFontSize = '11pt';
        } else if (activeCount === 3) {
            nameFontSize = '10.5pt';
            nameLineClamp = '2';
            priceFontSize = '12pt';
        } else {
            nameFontSize = '12.5pt';
            nameLineClamp = '3';
            priceFontSize = '14pt';
        }
    }

    const getSingleLabelHTML = () => {
        return `
            <div class="khaihoan-single-label" style="padding: ${labelPadding}; display: flex; flex-direction: column; justify-content: space-between; align-items: center; gap: ${showBarcode ? '0.8mm' : '1.2mm'}; height: 100%; box-sizing: border-box;">
                ${showStore ? `<div class="khaihoan-label-store">NHÀ THUỐC KHẢI HOÀN</div>` : ''}
                ${showProduct ? `<div class="khaihoan-label-name" style="font-size: ${nameFontSize}; -webkit-line-clamp: ${nameLineClamp};">${escapeHTML(name)}</div>` : ''}
                ${showPrice ? `<div class="khaihoan-label-price" style="font-size: ${priceFontSize};">${formattedPrice} <span class="khaihoan-label-unit">/${escapeHTML(unitName)}</span></div>` : ''}
                ${showBarcode ? `
                    <div class="khaihoan-label-barcode-container">
                        <div class="khaihoan-label-barcode-svg" style="height: ${barcodeHeight};">${barcodeSVG}</div>
                        <div class="khaihoan-label-code">${escapeHTML(code)}</div>
                    </div>
                ` : ''}
            </div>
        `;
    };

    if (template === '35x22_single') {
        pageStyle = `
            @page {
                size: 35mm 22mm;
                margin: 0;
            }
            body {
                margin: 0;
                padding: 0;
            }
            #khaihoan-print-label-container {
                display: block !important;
                width: 35mm;
            }
            .khaihoan-single-label {
                width: 35mm;
                height: 22mm;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                align-items: center;
                text-align: center;
                background: white;
                color: black;
                page-break-after: always;
                overflow: hidden;
            }
            .khaihoan-label-store {
                font-size: 5.5pt;
                font-weight: 800;
                text-transform: uppercase;
                border-bottom: 0.5px dashed #000;
                width: 100%;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                padding-bottom: 0.2mm;
                font-family: Arial, sans-serif;
            }
            .khaihoan-label-name {
                font-weight: 900;
                line-height: 1.0;
                margin: 0.2mm 0;
                display: -webkit-box;
                -webkit-box-orient: vertical;
                overflow: hidden;
                font-family: Arial, sans-serif;
                width: 100%;
                text-align: center;
            }
            .khaihoan-label-price {
                font-weight: 900;
                color: black;
                margin: 0.2mm 0;
                font-family: Arial, sans-serif;
            }
            .khaihoan-label-unit {
                font-size: 5.5pt;
                font-weight: normal;
            }
            .khaihoan-label-barcode-container {
                width: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                margin-top: auto;
            }
            .khaihoan-label-barcode-svg {
                width: 95%;
            }
            .khaihoan-label-code {
                font-size: 5.5pt;
                font-family: monospace;
                letter-spacing: 1px;
                margin-top: 0.2mm;
                line-height: 1;
            }
        `;

        for (let i = 0; i < qty; i++) {
            contentHtml += getSingleLabelHTML();
        }
    } else if (template === '35x22_double') {
        pageStyle = `
            @page {
                size: 74mm 22mm;
                margin: 0;
            }
            body {
                margin: 0;
                padding: 0;
            }
            #khaihoan-print-label-container {
                display: block !important;
                width: 74mm;
            }
            .khaihoan-double-row {
                display: flex;
                width: 74mm;
                height: 22mm;
                box-sizing: border-box;
                page-break-after: always;
                overflow: hidden;
            }
            .khaihoan-single-label {
                width: 35mm;
                height: 22mm;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                align-items: center;
                text-align: center;
                background: white;
                color: black;
                overflow: hidden;
            }
            .khaihoan-label-gap {
                width: 4mm;
                height: 22mm;
            }
            .khaihoan-label-store {
                font-size: 5.5pt;
                font-weight: 800;
                text-transform: uppercase;
                border-bottom: 0.5px dashed #000;
                width: 100%;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                padding-bottom: 0.2mm;
                font-family: Arial, sans-serif;
            }
            .khaihoan-label-name {
                font-weight: 900;
                line-height: 1.0;
                margin: 0.2mm 0;
                display: -webkit-box;
                -webkit-box-orient: vertical;
                overflow: hidden;
                font-family: Arial, sans-serif;
                width: 100%;
                text-align: center;
            }
            .khaihoan-label-price {
                font-weight: 900;
                color: black;
                margin: 0.2mm 0;
                font-family: Arial, sans-serif;
            }
            .khaihoan-label-unit {
                font-size: 5.5pt;
                font-weight: normal;
            }
            .khaihoan-label-barcode-container {
                width: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                margin-top: auto;
            }
            .khaihoan-label-barcode-svg {
                width: 95%;
            }
            .khaihoan-label-code {
                font-size: 5.5pt;
                font-family: monospace;
                letter-spacing: 1px;
                margin-top: 0.2mm;
                line-height: 1;
            }
        `;

        for (let i = 0; i < qty; i += 2) {
            contentHtml += `
                <div class="khaihoan-double-row">
                    ${getSingleLabelHTML()}
                    <div class="khaihoan-label-gap"></div>
                    ${(i + 1 < qty) ? getSingleLabelHTML() : '<div class="khaihoan-single-label" style="visibility: hidden;"></div>'}
                </div>
            `;
        }
    } else if (template === '50x30_single') {
        pageStyle = `
            @page {
                size: 50mm 30mm;
                margin: 0;
            }
            body {
                margin: 0;
                padding: 0;
            }
            #khaihoan-print-label-container {
                display: block !important;
                width: 50mm;
            }
            .khaihoan-single-label {
                width: 50mm;
                height: 30mm;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                align-items: center;
                text-align: center;
                background: white;
                color: black;
                page-break-after: always;
                overflow: hidden;
            }
            .khaihoan-label-store {
                font-size: 6.5pt;
                font-weight: 800;
                text-transform: uppercase;
                border-bottom: 0.5px dashed #000;
                width: 100%;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                padding-bottom: 0.3mm;
                font-family: Arial, sans-serif;
            }
            .khaihoan-label-name {
                font-weight: 900;
                line-height: 1.0;
                margin: 0.3mm 0;
                display: -webkit-box;
                -webkit-box-orient: vertical;
                overflow: hidden;
                font-family: Arial, sans-serif;
                width: 100%;
                text-align: center;
            }
            .khaihoan-label-price {
                font-weight: 900;
                color: black;
                margin: 0.3mm 0;
                font-family: Arial, sans-serif;
            }
            .khaihoan-label-unit {
                font-size: 6.5pt;
                font-weight: normal;
            }
            .khaihoan-label-barcode-container {
                width: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                margin-top: auto;
            }
            .khaihoan-label-barcode-svg {
                width: 95%;
            }
            .khaihoan-label-code {
                font-size: 6.5pt;
                font-family: monospace;
                letter-spacing: 1px;
                margin-top: 0.3mm;
            }
        `;

        for (let i = 0; i < qty; i++) {
            contentHtml += getSingleLabelHTML();
        }
    }

    printContainer.innerHTML = contentHtml;
    document.body.appendChild(printContainer);

    const styleEl = document.createElement('style');
    styleEl.id = 'khaihoan-print-style';
    styleEl.innerHTML = `
        @media print {
            body > *:not(#khaihoan-print-label-container) {
                display: none !important;
            }
            ${pageStyle}
        }
    `;
    document.head.appendChild(styleEl);

    window.print();

    setTimeout(() => {
        printContainer.remove();
        styleEl.remove();
    }, 500);
}
export function closePrintLabelModal() {
    const modal = document.getElementById('printLabelModal');
    if (modal) modal.classList.add('hidden');
}

// Make globally available (chỉ export những hàm mà HTML gọi trực tiếp)
window.openAddProductModal = openAddProductModal;
window.closeAddProductModal = closeAddProductModal;
window.generateProductCode = generateProductCode;
window.autoGenerateProductCode = autoGenerateProductCode;
window.addConversionUnit = addConversionUnit;
window.removeConversionUnit = removeConversionUnit;
window.addBatchRow = addBatchRow;
window.removeBatchRow = removeBatchRow;

window.toggleEcommerceFields = () => {
    const isEcommerce = document.getElementById('add_is_ecommerce')?.checked;
    const isActive = document.getElementById('add_is_active')?.checked;
    const isEcommerceEl = document.getElementById('add_is_ecommerce');

    // Nếu không kinh doanh thì không được xuất TMĐT
    if (isEcommerce && !isActive) {
        if (isEcommerceEl) isEcommerceEl.checked = false;
        showToast('Sản phẩm ngừng kinh doanh không thể xuất TMĐT', 'info');
    }

    const section = document.getElementById('ecommerceSection');
    if (section) {
        if (isEcommerceEl?.checked) {
            section.classList.remove('hidden');
        } else {
            section.classList.add('hidden');
        }
    }
};

window.handleActiveStatusChange = () => {
    const isActive = document.getElementById('add_is_active')?.checked;
    const isEcommerceEl = document.getElementById('add_is_ecommerce');
    if (!isActive && isEcommerceEl && isEcommerceEl.checked) {
        isEcommerceEl.checked = false;
        window.toggleEcommerceFields();
    }
};

window.addEcommercePlatformRow = (platform = '', price = '') => {
    const container = document.getElementById('ecommercePlatformsContainer');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'ecommerce-platform-row flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-pink-100 dark:border-pink-900/50 shadow-sm';
    row.innerHTML = `
        <div class="flex-1">
            <select class="platform-name w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none">
                <option value="Shopee" ${platform === 'Shopee' ? 'selected' : ''}>Shopee</option>
                <option value="Ngoại sàn" ${platform === 'Ngoại sàn' || !platform ? 'selected' : ''}>Ngoại sàn</option>
            </select>
        </div>
        <div class="flex-[2] relative">
            <input type="number" value="${price}" placeholder="Nhập giá bán (VNĐ)" class="platform-price w-full pl-4 pr-10 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none">
            <span class="absolute right-3 top-2.5 text-slate-400 font-bold text-xs">đ</span>
        </div>
        <button type="button" onclick="this.closest('.ecommerce-platform-row').remove()" class="w-10 h-10 flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white ">
            <i class="fa-solid fa-trash text-sm"></i>
        </button>
    `;
    container.appendChild(row);
};
window.addVariantRow = addVariantRow;
window.removeVariantRow = removeVariantRow;
window.toggleBatchFields = toggleBatchFields;
window.toggleBatchCost = toggleBatchCost;
window.toggleAdvancedFields = toggleAdvancedFields;
window.showToast = showToast;
window.openPrintLabelModal = openPrintLabelModal;
window.closePrintLabelModal = closePrintLabelModal;
window.printLabel = printLabel;


export function syncBatchCostPrice() {
    const baseCost = parseFloat(document.querySelector('.unit-cost')?.value) || 0;
    document.querySelectorAll('.batch-use-standard-cost:checked').forEach(checkbox => {
        const row = checkbox.closest('.batch-row');
        if (row) {
            const input = row.querySelector('.batch-cost-price');
            if (input) input.value = baseCost;
        }
    });
}
window.syncBatchCostPrice = syncBatchCostPrice;



window.toggleVariantsRow = function(id) {
    const row = document.getElementById('variants_row_' + id);
    const icon = document.getElementById('icon_' + id);
    if (!row || !icon) return;
    if (row.classList.contains('hidden')) {
        row.classList.remove('hidden');
        icon.classList.add('rotate-180');
    } else {
        row.classList.add('hidden');
        icon.classList.remove('rotate-180');
    }
};


window.toggleInlineEditor = function(id) {
    const displayRow = document.getElementById('variant_display_' + id);
    const editRow = document.getElementById('variant_edit_' + id);
    if (!displayRow || !editRow) return;
    
    if (editRow.classList.contains('hidden')) {
        displayRow.classList.add('hidden');
        editRow.classList.remove('hidden');
    } else {
        displayRow.classList.remove('hidden');
        editRow.classList.add('hidden');
    }
};

window.addInlineBatchRow = function(id) {
    const container = document.getElementById('inline_batches_' + id);
    if (!container) return;
    const html = `
        <div class="flex gap-2 mb-2 inline-batch-item">
            <input type="hidden" class="batch-id" value="">
            <input type="text" class="batch-name w-1/3 px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800" placeholder="Tên lô">
            <input type="date" class="batch-exp w-1/3 px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800">
            <input type="number" class="batch-qty w-1/4 px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800" value="0" placeholder="SL">
            <button type="button" onclick="this.parentElement.remove()" class="w-8 flex items-center justify-center text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-200"><i class="fa-solid fa-trash-can text-xs"></i></button>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
};

window.saveInlineVariant = async function(id) {
    if (!window.supabase) {
        showToast('Lỗi: Chưa kết nối DB', 'error');
        return;
    }
    
    const isNew = String(id).startsWith('new_');
    const nameEl = document.getElementById('inline_name_' + id);
    const codeEl = document.getElementById('inline_code_' + id);
    const costEl = document.getElementById('inline_cost_' + id);
    const retailEl = document.getElementById('inline_retail_' + id);
    
    if (!codeEl || !costEl || !retailEl) return;
    
    // For new variants, name is required
    if (isNew && (!nameEl || !nameEl.value.trim())) {
        showToast('Vui lòng nhập tên biến thể!', 'warning');
        return;
    }
    
    const newName = isNew ? nameEl.value.trim() : null;
    const newCode = codeEl.value.trim();
    const newCost = Number(costEl.value) || 0;
    const newRetail = Number(retailEl.value) || 0;
    
    // Parse batches
    const batchesContainer = document.getElementById('inline_batches_' + id);
    const batchItems = batchesContainer.querySelectorAll('.inline-batch-item');
    const batchesData = [];
    batchItems.forEach(item => {
        const bId = item.querySelector('.batch-id').value;
        const bName = item.querySelector('.batch-name').value.trim();
        const bExp = item.querySelector('.batch-exp').value;
        const bQty = Number(item.querySelector('.batch-qty').value) || 0;
        
        batchesData.push({
            id: bId || undefined,
            // product_id is set later
            batch_name: bName || 'Mặc định',
            expiry_date: bExp ? bExp + 'T00:00:00Z' : null,
            stock_quantity: bQty,
            is_tracked: true
        });
    });

    try {
        showToast(isNew ? 'Đang tạo biến thể...' : 'Đang lưu biến thể...', 'info');
        
        let actualVariantId = id;
        
        if (isNew) {
            const parentId = document.getElementById('add_product_id').value;
            // Fetch parent product to copy defaults
            const { data: parentData } = await window.supabase.from('products').select('*').eq('id', parentId).single();
            if (!parentData) throw new Error("Parent not found");
            
            const variantData = {
                name: parentData.name + ' - ' + newName,
                variant_label: newName,
                parent_id: parentId,
                category_id: parentData.category_id,
                base_unit_id: parentData.base_unit_id,
                description: null, // Keep description clean
                ingredients: parentData.ingredients,
                usage_instructions: parentData.usage_instructions,
                product_code: newCode || ('VAR-' + Date.now().toString().slice(-6)),
                status: 'active'
            };
            
            const { data: newProd, error: insertError } = await window.supabase.from('products').insert([variantData]).select();
            if (insertError) throw insertError;
            actualVariantId = newProd[0].id;
        } else {
            // 1. Update Product Code
            if (newCode) {
                await window.supabase.from('products').update({ product_code: newCode }).eq('id', actualVariantId);
            }
        }
        
        // 2. Update Units (find existing unit)
        const { data: units } = await window.supabase.from('product_units').select('*').eq('product_id', actualVariantId);
        if (units && units.length > 0) {
            await window.supabase.from('product_units')
                .update({ cost_price: newCost, retail_price: newRetail })
                .eq('id', units[0].id);
        } else {
            await window.supabase.from('product_units').insert([{
                product_id: actualVariantId,
                unit_name: 'Hộp',
                conversion_rate: 1,
                cost_price: newCost,
                retail_price: newRetail,
                is_base_unit: true
            }]);
        }
        
        // 3. Update Batches
        // For simplicity in inline editor, we'll delete old unmentioned batches and upsert new ones
        const { data: oldBatches } = await window.supabase.from('product_batches').select('id').eq('product_id', actualVariantId);
        const oldBatchIds = (oldBatches || []).map(b => b.id);
        const currentIds = batchesData.map(b => b.id).filter(Boolean);
        
        const idsToDelete = oldBatchIds.filter(id => !currentIds.includes(id));
        if (idsToDelete.length > 0) {
            await window.supabase.from('product_batches').delete().in('id', idsToDelete);
        }
        
        for (const b of batchesData) {
            b.product_id = actualVariantId;
            if (b.id) {
                await window.supabase.from('product_batches').update({
                    batch_name: b.batch_name,
                    expiry_date: b.expiry_date,
                    stock_quantity: b.stock_quantity
                }).eq('id', b.id);
            } else {
                await window.supabase.from('product_batches').insert([b]);
            }
        }
        
        showToast('Lưu biến thể thành công!', 'success');
        
        // Reload table
        if (window.loadProductsList) {
            await window.loadProductsList();
        }
        
    } catch (e) {
        console.error("Error saving inline variant:", e);
        showToast('Lỗi khi lưu biến thể!', 'error');
    }
};

window._saveInlineVariantOld = async function(id) {
    if (!window.supabase) {
        showToast('Lỗi: Chưa kết nối DB', 'error');
        return;
    }
    
    const codeEl = document.getElementById('inline_code_' + id);
    const costEl = document.getElementById('inline_cost_' + id);
    const retailEl = document.getElementById('inline_retail_' + id);
    
    if (!codeEl || !costEl || !retailEl) return;
    
    const newCode = codeEl.value.trim();
    const newCost = Number(costEl.value) || 0;
    const newRetail = Number(retailEl.value) || 0;
    
    // Parse batches
    const batchesContainer = document.getElementById('inline_batches_' + id);
    const batchItems = batchesContainer.querySelectorAll('.inline-batch-item');
    const batchesData = [];
    batchItems.forEach(item => {
        const bId = item.querySelector('.batch-id').value;
        const bName = item.querySelector('.batch-name').value.trim();
        const bExp = item.querySelector('.batch-exp').value;
        const bQty = Number(item.querySelector('.batch-qty').value) || 0;
        
        batchesData.push({
            id: bId || undefined,
            product_id: id,
            batch_name: bName || 'Mặc định',
            expiry_date: bExp ? bExp + 'T00:00:00Z' : null,
            stock_quantity: bQty,
            is_tracked: true
        });
    });

    try {
        showToast('Đang lưu biến thể...', 'info');
        
        // 1. Update Product Code
        await window.supabase.from('products').update({ product_code: newCode }).eq('id', id);
        
        // 2. Update Units (find existing unit)
        const { data: units } = await window.supabase.from('product_units').select('*').eq('product_id', id);
        if (units && units.length > 0) {
            await window.supabase.from('product_units')
                .update({ cost_price: newCost, retail_price: newRetail })
                .eq('id', units[0].id);
        } else {
            await window.supabase.from('product_units').insert([{
                product_id: id,
                unit_name: 'Hộp',
                conversion_rate: 1,
                cost_price: newCost,
                retail_price: newRetail,
                is_base_unit: true
            }]);
        }
        
        // 3. Update Batches
        // For simplicity in inline editor, we'll delete old unmentioned batches and upsert new ones
        const { data: oldBatches } = await window.supabase.from('product_batches').select('id').eq('product_id', id);
        const oldBatchIds = (oldBatches || []).map(b => b.id);
        const currentIds = batchesData.map(b => b.id).filter(Boolean);
        
        const idsToDelete = oldBatchIds.filter(id => !currentIds.includes(id));
        if (idsToDelete.length > 0) {
            await window.supabase.from('product_batches').delete().in('id', idsToDelete);
        }
        
        for (const b of batchesData) {
            if (b.id) {
                await window.supabase.from('product_batches').update({
                    batch_name: b.batch_name,
                    expiry_date: b.expiry_date,
                    stock_quantity: b.stock_quantity
                }).eq('id', b.id);
            } else {
                await window.supabase.from('product_batches').insert([b]);
            }
        }
        
        showToast('Lưu biến thể thành công!', 'success');
        
        // Reload table
        if (window.loadProductsList) {
            await window.loadProductsList();
        }
        
    } catch (e) {
        console.error("Error saving inline variant:", e);
        showToast('Lỗi khi lưu biến thể!', 'error');
    }
};



window.toggleInlineEditorModal = function(id) {
    const displayEl = document.getElementById('modal_display_' + id);
    const editEl = document.getElementById('modal_edit_' + id);
    if (!displayEl || !editEl) return;
    
    if (editEl.classList.contains('hidden')) {
        editEl.classList.remove('hidden');
    } else {
        editEl.classList.add('hidden');
    }
};



window.toggleHasVariants = function() {
    const hasVariants = document.getElementById('add_has_variants').checked;

    const section3 = document.getElementById('batchRowsContainer')?.closest('section');
    if (section3) {
        if (hasVariants) section3.classList.add('hidden');
        else section3.classList.remove('hidden');
    }
    
    const variantsListSection = document.getElementById('variantsListSection');
    if (variantsListSection) {
        if (hasVariants) variantsListSection.classList.remove('hidden');
        else variantsListSection.classList.add('hidden');
    }
    
    document.querySelectorAll('#unitsContainer .unit-row').forEach(row => {
        const gridContainer = row.querySelector('.grid');
        if (!gridContainer) return;
        
        const retailInput = row.querySelector('.unit-retail');
        const costInput = row.querySelector('.unit-cost');
        
        if (retailInput) {
            const retailWrapper = retailInput.closest('.relative').parentElement;
            if (hasVariants) {
                retailWrapper.classList.add('hidden');
                retailInput.required = false;
            } else {
                retailWrapper.classList.remove('hidden');
                retailInput.required = true;
            }
        }
        
        if (costInput) {
            const costWrapper = costInput.closest('.relative').parentElement;
            if (hasVariants) costWrapper.classList.add('hidden');
            else costWrapper.classList.remove('hidden');
        }
        
        if (hasVariants) {
            gridContainer.classList.remove('md:grid-cols-3', 'md:grid-cols-4');
            gridContainer.classList.add('md:grid-cols-2'); 
        } else {
            const isBase = row.matches(':first-child');
            gridContainer.classList.remove('md:grid-cols-2');
            gridContainer.classList.add(isBase ? 'md:grid-cols-3' : 'md:grid-cols-4');
        }
    });
};

window.addNewVariantInline = function() {
    const parentId = document.getElementById('add_product_id').value;
    if (!parentId) {
        showToast('Vui lòng Lưu (F9) sản phẩm cha trước khi tạo biến thể!', 'warning');
        return;
    }
    
    const container = document.getElementById('variantsListContainer');
    if (!container) return;
    
    const tempId = 'new_' + Date.now();
    const html = `
        <div id="modal_edit_${tempId}" class="p-4 bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl shadow-inner">
            <div class="flex flex-col gap-4">
                <div class="flex items-center justify-between">
                    <h5 class="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest"><i class="fa-solid fa-sparkles"></i> THÊM BIẾN THỂ MỚI</h5>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Tên biến thể</label>
                        <input type="text" id="inline_name_${tempId}" placeholder="VD: 500mg, Màu đỏ..." class="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Mã SKU</label>
                        <input type="text" id="inline_code_${tempId}" placeholder="Tự động nếu để trống" class="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Giá Vốn</label>
                        <input type="number" id="inline_cost_${tempId}" class="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-white" value="0">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Giá Bán</label>
                        <input type="number" id="inline_retail_${tempId}" class="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-white" value="0">
                    </div>
                </div>
                
                <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 shadow-sm">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider"><i class="fa-solid fa-cubes-stacked"></i> Lô Hàng ban đầu</span>
                        <button type="button" onclick="window.addInlineBatchRow('${tempId}')" class="text-[9px] font-black px-2 py-1 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded border border-orange-200"><i class="fa-solid fa-plus"></i> Thêm Lô</button>
                    </div>
                    <div id="inline_batches_${tempId}" class="flex flex-col gap-1">
                        <!-- Empty initially or 1 default row -->
                    </div>
                </div>
                
                <div class="flex justify-end gap-2">
                    <button type="button" onclick="this.closest('#modal_edit_${tempId}').remove()" class="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-black rounded hover:bg-slate-300">HỦY BỎ</button>
                    <button type="button" onclick="window.saveInlineVariant('${tempId}')" class="px-4 py-1.5 bg-emerald-600 text-white text-[10px] font-black rounded shadow-lg shadow-emerald-500/30 hover:bg-emerald-700"><i class="fa-solid fa-floppy-disk"></i> TẠO BIẾN THỂ</button>
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('afterbegin', html);
    window.addInlineBatchRow(tempId); // Add one empty batch row
};



window.currentSortColumn = null;
window.currentSortDirection = 'asc';

export function setupProductSorting() {
    const headers = document.querySelectorAll('th[data-sort]');
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const column = header.getAttribute('data-sort');
            if (window.currentSortColumn === column) {
                window.currentSortDirection = window.currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                window.currentSortColumn = column;
                window.currentSortDirection = 'asc';
            }
            
            // Update icons
            headers.forEach(h => {
                const icon = h.querySelector('i.fa-solid');
                if (icon) {
                    icon.className = 'fa-solid fa-sort text-slate-300 group-hover:text-blue-400';
                }
            });
            const activeIcon = header.querySelector('i.fa-solid');
            if (activeIcon) {
                activeIcon.className = `fa-solid fa-sort-${window.currentSortDirection === 'asc' ? 'up' : 'down'} text-blue-500`;
            }

            // Re-render
            if (window.currentProducts) {
                renderProducts(window.currentProducts, false);
            }
        });
    });
}


window.handleUnitRetailChange = function(input) {
    input._manualEdit = true;
    const row = input.closest('.unit-row');
    if (!row) return;
    const isBase = row.matches(':first-child');
    const myRate = parseFloat(row.querySelector('.unit-conversion')?.value) || 1;
    const myVal = parseFloat(input.value) || 0;
    
    const baseVal = isBase ? myVal : myVal / myRate;
    
    document.querySelectorAll('#unitsContainer .unit-row').forEach((r) => {
        const rInput = r.querySelector('.unit-retail');
        if (rInput && rInput !== input) {
            const rRate = parseFloat(r.querySelector('.unit-conversion')?.value) || 1;
            const isRBase = r.matches(':first-child');
            const targetVal = isRBase ? baseVal : baseVal * rRate;
            rInput.value = targetVal.toFixed(0);
        }
    });
};

window.handleUnitCostChange = function(input) {
    input._manualEdit = true;
    const row = input.closest('.unit-row');
    if (!row) return;
    const isBase = row.matches(':first-child');
    const myRate = parseFloat(row.querySelector('.unit-conversion')?.value) || 1;
    const myVal = parseFloat(input.value) || 0;
    
    const baseVal = isBase ? myVal : myVal / myRate;
    
    document.querySelectorAll('#unitsContainer .unit-row').forEach((r) => {
        const rInput = r.querySelector('.unit-cost');
        if (rInput && rInput !== input) {
            const rRate = parseFloat(r.querySelector('.unit-conversion')?.value) || 1;
            const isRBase = r.matches(':first-child');
            const targetVal = isRBase ? baseVal : baseVal * rRate;
            rInput.value = targetVal.toFixed(0);
        }
    });
    
    if (window.syncBatchCostPrice) {
        window.syncBatchCostPrice();
    }
};
