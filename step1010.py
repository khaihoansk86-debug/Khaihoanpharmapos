
import os
import re

js_path = r'd:\Khaihoanpharmapos\js\features\products\productUI.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Update variantTagsHtml for parent products
old_variant_tags = '''        if (isParent) {
            variantTagsHtml = `
                <div class="flex flex-wrap gap-1 mt-1.5">
                    <span class="inline-flex px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-905/35 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[9px] font-black rounded uppercase tracking-wider gap-1 items-center">
                        <i class="fa-solid fa-network-wired text-[8px]"></i> Nhóm sản phẩm
                    </span>
            `;
            if (variants.length > 0) {
                variantTagsHtml += variants.map(v => {
                    let label = v.variant_label || v.name;
                    if (label.toLowerCase().startsWith(product.name.toLowerCase())) {
                        label = label.substring(product.name.length).trim().replace(/^[\-\/\+]+/, '').trim();
                    }
                    if (!label) label = 'Mặc định';

                    return `
                        <span onclick="window.openEditModalByCode('${v.product_code}')" class="text-[9px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded cursor-pointer hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500 hover:border-blue-600 transition-all shadow-sm" title="Xem chi tiết biến thể ${escapeHTML(v.name)}">
                            ${escapeHTML(label)}
                        </span>
                    `;
                }).join('');
            }
            variantTagsHtml += `</div>`;
        }'''

new_variant_tags = '''        if (isParent) {
            variantTagsHtml = `
                <div class="flex flex-wrap gap-2 mt-2">
                    <button onclick="window.toggleVariantsRow('${product.id}')" class="inline-flex px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[10px] font-black rounded-lg uppercase tracking-wider items-center gap-1.5 hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors shadow-sm">
                        <i id="icon_${product.id}" class="fa-solid fa-chevron-down transition-transform duration-200"></i> Bật xem chi tiết ${variants.length} biến thể
                    </button>
                </div>
            `;
        }'''
js = js.replace(old_variant_tags, new_variant_tags)

# 2. Add window.toggleVariantsRow
toggle_func = '''window.toggleVariantsRow = function(id) {
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
};'''
if 'window.toggleVariantsRow =' not in js:
    # Add it at the end
    js += '\n\n' + toggle_func

# 3. Modify the return string of renderProducts map
# The old return string is `return \`\n            <tr class="product-row ...> ... </tr>\`;`
old_return = '''        return `
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
                    <div class="flex items-center gap-2 h-8 mb-2">
                        <span class="text-xl font-black text-slate-900 dark:text-white" title="Tổng tồn kho">∑ ${totalStock.toLocaleString('vi-VN')}</span>
                        <div>${stockBadge}</div>
                    </div>
                    <div class="flex flex-col">
                        ${stockBatchesHtml}
                    </div>
                </td>
                <td class="py-4 px-5 border-y border-slate-300 dark:border-slate-700 align-top">
                    <div class="h-8 mb-2 flex items-center justify-center"></div>
                    <div class="flex flex-col items-center">
                        ${expiryBatchesHtml}
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
                        <button onclick="window.deleteProduct('${product.id}', '${safeNameJs}')"
                            class="w-10 h-10 flex items-center justify-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 rounded-xl hover:bg-red-600 hover:text-white hover:border-red-600  shadow-sm"
                            title="Xóa hàng hóa">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;'''
        
new_return = '''        let rowHtml = `
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
                    <div class="flex items-center gap-2 h-8 mb-2">
                        <span class="text-xl font-black text-slate-900 dark:text-white" title="Tổng tồn kho">∑ ${totalStock.toLocaleString('vi-VN')}</span>
                        <div>${stockBadge}</div>
                    </div>
                    <div class="flex flex-col">
                        ${stockBatchesHtml}
                    </div>
                </td>
                <td class="py-4 px-5 border-y border-slate-300 dark:border-slate-700 align-top">
                    <div class="h-8 mb-2 flex items-center justify-center"></div>
                    <div class="flex flex-col items-center">
                        ${expiryBatchesHtml}
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
                        <button onclick="window.deleteProduct('${product.id}', '${safeNameJs}')"
                            class="w-10 h-10 flex items-center justify-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 rounded-xl hover:bg-red-600 hover:text-white hover:border-red-600  shadow-sm"
                            title="Xóa hàng hóa">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;

        if (isParent && variants.length > 0) {
            let subTableRows = variants.map(v => {
                const vStock = (v.product_batches || []).reduce((s, b) => s + (Number(b.stock_quantity) || 0), 0);
                let vRetail = '---';
                let vCost = '---';
                // Find retail and cost from productUnitsSourceList
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
                
                return `
                    <tr class="border-b border-slate-200 dark:border-slate-700 last:border-0 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors">
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

            rowHtml += `
            <tr id="variants_row_${product.id}" class="hidden">
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

        return rowHtml;'''

js = js.replace(old_return, new_return)

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)
print("Updated productUI.js for variant toggle logic on main table!")
