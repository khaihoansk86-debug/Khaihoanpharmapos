
import os
import re

js_path = r'd:\Khaihoanpharmapos\js\features\products\productUI.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Update the subTableRows generation in renderProducts (for the accordion)
old_subTableRows = '''                return `
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
                `;'''

new_subTableRows = '''
                const vRetailRaw = typeof window.productUnitsSourceList !== 'undefined' ? (window.productUnitsSourceList.filter(u => u.product_id === v.id)[0]?.retail_price || 0) : 0;
                const vCostRaw = typeof window.productUnitsSourceList !== 'undefined' ? (window.productUnitsSourceList.filter(u => u.product_id === v.id)[0]?.cost_price || 0) : 0;

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
                    <tr id="variant_display_${v.id}" class="border-b border-slate-200 dark:border-slate-700 last:border-0 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors">
                        <td class="py-2.5 px-4 font-bold text-slate-800 dark:text-slate-200 w-1/4">${escapeHTML(v.variant_label || v.name)}</td>
                        <td class="py-2.5 px-4 text-blue-600 dark:text-blue-400 font-mono text-xs w-1/6 font-bold">${escapeHTML(v.product_code)}</td>
                        <td class="py-2.5 px-4 font-black text-emerald-600 dark:text-emerald-400 text-right w-1/6">${vRetail}</td>
                        <td class="py-2.5 px-4 font-bold text-orange-600 dark:text-orange-400 text-right w-1/6">${vCost}</td>
                        <td class="py-2.5 px-4 font-black text-slate-800 dark:text-slate-200 text-center w-1/12">${vStock}</td>
                        <td class="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-400 text-center">${expStr}</td>
                        <td class="py-2.5 px-4 text-right">
                            <button onclick="window.toggleInlineEditor('${v.id}')" class="text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 dark:bg-blue-900/30 dark:hover:bg-blue-600 px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-sm transition-all border border-blue-200 dark:border-blue-800">
                                Sửa
                            </button>
                        </td>
                    </tr>
                    <tr id="variant_edit_${v.id}" class="hidden">
                        <td colspan="7" class="p-4 bg-indigo-50/80 dark:bg-slate-800/90 border-b border-indigo-200 dark:border-slate-700 shadow-inner">
                            <div class="flex flex-col gap-4">
                                <div class="flex items-center justify-between">
                                    <h5 class="text-xs font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest"><i class="fa-solid fa-pen-ruler"></i> Chỉnh sửa biến thể: ${escapeHTML(v.variant_label || v.name)}</h5>
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Mã SKU</label>
                                        <input type="text" id="inline_code_${v.id}" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-white" value="${escapeHTML(v.product_code)}">
                                    </div>
                                    <div>
                                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Giá Vốn (VNĐ)</label>
                                        <input type="number" id="inline_cost_${v.id}" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-white" value="${vCostRaw}">
                                    </div>
                                    <div>
                                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Giá Bán (VNĐ)</label>
                                        <input type="number" id="inline_retail_${v.id}" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-white" value="${vRetailRaw}">
                                    </div>
                                </div>
                                
                                <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-sm">
                                    <div class="flex justify-between items-center mb-3">
                                        <span class="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider"><i class="fa-solid fa-cubes-stacked"></i> Lô Hàng & Tồn Kho</span>
                                        <button type="button" onclick="window.addInlineBatchRow('${v.id}')" class="text-[10px] font-black px-2.5 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg border border-orange-200 transition-colors shadow-sm"><i class="fa-solid fa-plus"></i> Thêm Lô</button>
                                    </div>
                                    <div id="inline_batches_${v.id}" class="flex flex-col gap-1">
                                        ${batchesHtml}
                                    </div>
                                </div>
                                
                                <div class="flex justify-end gap-2 mt-1">
                                    <button type="button" onclick="window.toggleInlineEditor('${v.id}')" class="px-5 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-black rounded-lg hover:bg-slate-300 transition-colors">HỦY BỎ</button>
                                    <button type="button" onclick="window.saveInlineVariant('${v.id}')" class="px-6 py-2 bg-blue-600 text-white text-[11px] font-black rounded-lg shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-colors"><i class="fa-solid fa-floppy-disk"></i> LƯU BIẾN THỂ</button>
                                </div>
                            </div>
                        </td>
                    </tr>
                `;'''
if old_subTableRows in js:
    js = js.replace(old_subTableRows, new_subTableRows)

# 2. Add inline functions
inline_funcs = '''
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
'''
if 'window.toggleInlineEditor =' not in js:
    js += '\n\n' + inline_funcs


# 3. Apply the same logic to the Edit Modal (Section 6) inside openEditModal
old_modal_variants = '''                            <button type="button" onclick="window.openEditModalByCode('${v.product_code}')" class="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition-colors border border-blue-200 dark:border-blue-800/50">
                                Sửa
                            </button>'''
new_modal_variants = '''                            <button type="button" onclick="window.toggleInlineEditorModal('${v.id}')" class="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition-colors border border-blue-200 dark:border-blue-800/50">
                                Sửa
                            </button>'''

if old_modal_variants in js:
    js = js.replace(old_modal_variants, new_modal_variants)

# Add inline forms directly into the variantsListContainer mapping
# We find where variantsListContainer.innerHTML = childVariants.map...
# We will inject the inline form there too!
pattern_map = r'''variantsListContainer\.innerHTML = childVariants\.map\(v => \{.*?return \`(.*?)\`;\s*\}\)\.join\(''\);'''
# We need to manually replace this block for safety
def repl_modal_map(m):
    # This is a bit complex, let's just use string replace on the full function logic
    pass

# A simpler way is to replace the whole childVariants block
old_childVariantsBlock = '''        if (childVariants.length > 0) {
            if (variantsListSection) variantsListSection.classList.remove('hidden');
            if (variantsListContainer) {
                variantsListContainer.innerHTML = childVariants.map(v => {
                    const label = v.variant_label || v.name;
                    const stock = (v.product_batches || []).reduce((sum, b) => sum + (Number(b.stock_quantity) || 0), 0);
                    return `
                        <div class="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                            <div class="flex flex-col">
                                <span class="font-bold text-slate-800 dark:text-white text-sm">${escapeHTML(label)}</span>
                                <span class="text-[11px] text-slate-500 font-medium">Mã: <span class="font-mono text-blue-600 dark:text-blue-400">${escapeHTML(v.product_code)}</span> | Tồn kho: <span class="font-bold">${stock}</span></span>
                            </div>
                            <button type="button" onclick="window.toggleInlineEditorModal('${v.id}')" class="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition-colors border border-blue-200 dark:border-blue-800/50">
                                Sửa
                            </button>
                        </div>
                    `;
                }).join('');
            }
        }'''

# Note: In the previous step I already replaced `window.openEditModalByCode` with `window.toggleInlineEditorModal`. 
# Wait, I didn't actually execute it yet, the code above does it if it finds it. Let's just replace the whole block using the original string to be safe.

old_childVariantsBlock_original = '''        if (childVariants.length > 0) {
            if (variantsListSection) variantsListSection.classList.remove('hidden');
            if (variantsListContainer) {
                variantsListContainer.innerHTML = childVariants.map(v => {
                    const label = v.variant_label || v.name;
                    const stock = (v.product_batches || []).reduce((sum, b) => sum + (Number(b.stock_quantity) || 0), 0);
                    return `
                        <div class="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                            <div class="flex flex-col">
                                <span class="font-bold text-slate-800 dark:text-white text-sm">${escapeHTML(label)}</span>
                                <span class="text-[11px] text-slate-500 font-medium">Mã: <span class="font-mono text-blue-600 dark:text-blue-400">${escapeHTML(v.product_code)}</span> | Tồn kho: <span class="font-bold">${stock}</span></span>
                            </div>
                            <button type="button" onclick="window.openEditModalByCode('${v.product_code}')" class="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition-colors border border-blue-200 dark:border-blue-800/50">
                                Sửa
                            </button>
                        </div>
                    `;
                }).join('');
            }
        }'''

new_childVariantsBlock = '''        if (childVariants.length > 0) {
            if (variantsListSection) variantsListSection.classList.remove('hidden');
            if (variantsListContainer) {
                variantsListContainer.innerHTML = childVariants.map(v => {
                    const label = v.variant_label || v.name;
                    const stock = (v.product_batches || []).reduce((sum, b) => sum + (Number(b.stock_quantity) || 0), 0);
                    
                    const vRetailRaw = typeof window.productUnitsSourceList !== 'undefined' ? (window.productUnitsSourceList.filter(u => u.product_id === v.id)[0]?.retail_price || 0) : 0;
                    const vCostRaw = typeof window.productUnitsSourceList !== 'undefined' ? (window.productUnitsSourceList.filter(u => u.product_id === v.id)[0]?.cost_price || 0) : 0;

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
                        <div class="flex flex-col border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 overflow-hidden">
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
        }'''

if old_childVariantsBlock_original in js:
    js = js.replace(old_childVariantsBlock_original, new_childVariantsBlock)

# Provide the toggle function for modal
modal_toggle_func = '''
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
'''
if 'window.toggleInlineEditorModal =' not in js:
    js += '\n\n' + modal_toggle_func

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)
print("Updated productUI.js for inline editor logic!")
