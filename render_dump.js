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

        if (isParent) {
            variantTagsHtml = `
                <div class="flex flex-wrap gap-2 mt-2">
                    <button onclick="window.toggleVariantsRow('${product.id}')" class="inline-flex px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[10px] font-black rounded-lg uppercase tracking-wider items-center gap-1.5 hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors shadow-sm">
                        <i id="icon_${product.id}" class="fa-solid fa-chevron-down transition-transform duration-200"></i> Bật xem chi tiết ${variants.length} biến thể
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