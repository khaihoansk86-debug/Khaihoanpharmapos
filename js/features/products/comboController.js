import { supabaseClient } from '../../core/supabase.js';
import { fetchProducts } from './productService.js';
import { filterComboSearchProducts, parseComboDescription } from './comboRules.js';

async function getCombosCategoryId() {
    const { data } = await supabaseClient
        .from('categories')
        .select('id')
        .ilike('name', '%Combo%');
    if (data && data.length > 0) return data[0].id;

    const { data: newCat } = await supabaseClient
        .from('categories')
        .insert([{ name: 'Combo' }])
        .select()
        .single();
    return newCat?.id || 'c1417a86-7a86-4fa2-bf45-c1417a86a345';
}

window.loadCombosData = async () => {
    const container = document.getElementById('combos-container');
    const loading = document.getElementById('combos-loading');
    if (!container) return;
    if (loading) loading.classList.remove('hidden');

    try {
        const catId = await getCombosCategoryId();
        const { data: combos, error } = await supabaseClient
            .from('products')
            .select(`
                *,
                product_units(*),
                categories(name)
            `)
            .eq('category_id', catId);

        if (error) throw error;

        if (loading) loading.classList.add('hidden');

        if (!combos || combos.length === 0) {
            container.innerHTML = `<tr><td colspan="5" class="py-10 text-center text-slate-500 font-medium italic bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">Chưa có combo nào được thiết lập. Hãy click "Thêm combo mới" để bắt đầu!</td></tr>`;
            return;
        }

        container.innerHTML = combos.map(combo => {
            const baseUnit = combo.product_units?.find(u => u.is_base_unit) || combo.product_units?.[0] || {};
            const comboDefinition = parseComboDescription(combo.description);
            const childDisplay = comboDefinition
                ? comboDefinition.items.map(item => `${item.name} (x${item.quantity} ${item.unit})`).join(', ')
                : 'Chưa liên kết thuốc';

            return `
            <tr class="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 shadow-sm transition-colors rounded-2xl">
                <td class="py-4 px-5 font-mono font-bold text-slate-700 dark:text-slate-350 rounded-l-2xl">${combo.product_code}</td>
                <td class="py-4 px-5 font-bold text-slate-800 dark:text-white">${combo.name}</td>
                <td class="py-4 px-5 text-xs text-slate-500 max-w-xs truncate" title="${childDisplay}">${childDisplay}</td>
                <td class="py-4 px-5 font-black text-emerald-600 dark:text-emerald-400 font-mono">${Number(baseUnit.retail_price || 0).toLocaleString()}đ</td>
                <td class="py-4 px-5 text-center rounded-r-2xl">
                    <div class="flex items-center justify-center gap-2">
                        <button onclick="window.openEditComboModal('${combo.id}')" class="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-slate-200 dark:border-slate-700">
                            <i class="fa-solid fa-pen text-[10px]"></i>
                        </button>
                        <button onclick="window.deleteCombo('${combo.id}', '${combo.name}')" class="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm border border-slate-200 dark:border-slate-700">
                            <i class="fa-solid fa-trash text-[10px]"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    } catch (err) {
        console.error('Lỗi khi tải combo:', err);
        container.innerHTML = `<tr><td colspan="5" class="py-10 text-center text-red-500 font-medium">Lỗi tải dữ liệu: ${err.message}</td></tr>`;
        if (loading) loading.classList.add('hidden');
    }
};

let selectedComboItems = [];

window.openAddComboModal = () => {
    document.getElementById('addComboModalTitle').textContent = 'Thêm Combo Mới';
    document.getElementById('add_combo_id').value = '';
    document.getElementById('add_combo_name').value = '';
    const catSelect = document.getElementById('add_combo_category');
    if (catSelect) catSelect.value = '';
    document.getElementById('add_combo_code').value = '';
    document.getElementById('add_combo_price').value = '';
    document.getElementById('comboProductSearchInput').value = '';
    selectedComboItems = [];
    renderSelectedComboItems();
    document.getElementById('addComboModal').classList.remove('hidden');
};

window.openEditComboModal = async (id) => {
    try {
        const { data: combo, error } = await supabaseClient
            .from('products')
            .select('*, product_units(*)')
            .eq('id', id)
            .single();

        if (error) throw error;

        document.getElementById('addComboModalTitle').textContent = 'Cập Nhật Combo';
        document.getElementById('add_combo_id').value = combo.id;
        document.getElementById('add_combo_name').value = combo.name;
        const catSelect = document.getElementById('add_combo_category');
        if (catSelect) catSelect.value = combo.category_id || '';
        document.getElementById('add_combo_code').value = combo.product_code;

        const baseUnit = combo.product_units?.find(u => u.is_base_unit) || combo.product_units?.[0] || {};
        document.getElementById('add_combo_price').value = baseUnit.retail_price || 0;
        document.getElementById('comboProductSearchInput').value = '';

        const comboDefinition = parseComboDescription(combo.description);
        selectedComboItems = comboDefinition?.items || [];

        renderSelectedComboItems();
        document.getElementById('addComboModal').classList.remove('hidden');
    } catch (err) {
        window.showToast?.('Lỗi khi tải thông tin combo: ' + err.message, 'error');
    }
};

window.closeAddComboModal = () => {
    document.getElementById('addComboModal').classList.add('hidden');
};

window.generateComboCode = () => {
    const codeInput = document.getElementById('add_combo_code');
    if (codeInput) {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        codeInput.value = `CB${randomNum}`;
    }
};

window.deleteCombo = async (id, name) => {
    if (!confirm(`Bạn có chắc muốn xóa combo "${name}"?`)) return;
    try {
        const { error } = await supabaseClient
            .from('products')
            .delete()
            .eq('id', id);
        if (error) throw error;
        window.showToast?.('Đã xóa combo thành công!', 'success');
        window.loadCombosData();
    } catch (err) {
        window.showToast?.('Lỗi khi xóa combo: ' + err.message, 'error');
    }
};

function renderSelectedComboItems() {
    const container = document.getElementById('comboSelectedItemsContainer');
    const noItemsText = document.getElementById('comboNoItemsText');
    if (!container) return;

    if (selectedComboItems.length === 0) {
        container.innerHTML = '';
        if (noItemsText) noItemsText.classList.remove('hidden');
        return;
    }

    if (noItemsText) noItemsText.classList.add('hidden');

    container.innerHTML = selectedComboItems.map((item, idx) => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
            <td class="py-3 text-center">
                <button type="button" onclick="window.removeComboItem(${idx})" class="text-red-500 hover:text-red-700 p-1">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>
            <td class="py-3 font-bold text-slate-700 dark:text-slate-200">${item.name}</td>
            <td class="py-3 text-center">
                <input type="number" min="1" value="${item.quantity}" onchange="window.updateComboItemQty(${idx}, this.value)" class="w-16 px-2 py-1 text-center font-bold font-mono border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded text-slate-800 dark:text-white outline-none">
            </td>
            <td class="py-3 text-center">
                <span class="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded">${item.unit}</span>
            </td>
        </tr>
    `).join('');
}

window.removeComboItem = (idx) => {
    selectedComboItems.splice(idx, 1);
    renderSelectedComboItems();
};

window.updateComboItemQty = (idx, val) => {
    selectedComboItems[idx].quantity = Math.max(1, parseInt(val, 10) || 1);
};

export function setupComboProductSearch() {
    const input = document.getElementById('comboProductSearchInput');
    const suggestions = document.getElementById('comboProductSuggestions');
    if (!input || !suggestions) return;

    let comboSearchTimeout;
    input.addEventListener('input', () => {
        clearTimeout(comboSearchTimeout);
        comboSearchTimeout = setTimeout(() => {
            const query = input.value.trim().toLowerCase();
            if (!query) {
                suggestions.classList.add('hidden');
                return;
            }

            const sourceProducts = window.currentProductsList || [];
            if (sourceProducts.length === 0) {
                fetchProducts()
                    .then(products => {
                        window.currentProductsList = products || [];
                        input.dispatchEvent(new Event('input'));
                    })
                    .catch(err => {
                        console.error('Lỗi tải sản phẩm cho tìm kiếm combo:', err);
                        suggestions.innerHTML = `<li class="px-4 py-3 text-red-500 text-xs italic">Không tải được danh sách sản phẩm.</li>`;
                        suggestions.classList.remove('hidden');
                    });
                return;
            }

            const matched = filterComboSearchProducts(sourceProducts, query).slice(0, 10);

            if (matched.length === 0) {
                suggestions.innerHTML = `<li class="px-4 py-3 text-slate-400 text-xs italic">Không tìm thấy sản phẩm phù hợp.</li>`;
                suggestions.classList.remove('hidden');
                return;
            }

            suggestions.innerHTML = matched.map(product => {
                const baseUnit = product.product_units?.find(u => u.is_base_unit) || product.product_units?.[0] || {};
                const safeName = String(product.name || '').replace(/'/g, "\\'");
                return `
                <li onclick="window.addComboProduct('${product.id}', '${safeName}', '${baseUnit.unit_name || 'Viên'}')" class="px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-slate-850 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer flex justify-between items-center">
                    <span>${product.name} <span class="text-[10px] text-slate-400 font-mono">(${product.product_code || ''})</span></span>
                    <span class="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded">${baseUnit.unit_name || 'Đơn vị'}</span>
                </li>`;
            }).join('');

            suggestions.classList.remove('hidden');
        }, 300);
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('#comboProductSearchInput') && !e.target.closest('#comboProductSuggestions')) {
            suggestions.classList.add('hidden');
        }
    });
}

window.addComboProduct = (id, name, unit) => {
    const existing = selectedComboItems.find(item => item.id === id);
    if (existing) {
        existing.quantity += 1;
    } else {
        selectedComboItems.push({
            id,
            name,
            unit,
            quantity: 1
        });
    }

    renderSelectedComboItems();
    document.getElementById('comboProductSearchInput').value = '';
    document.getElementById('comboProductSuggestions').classList.add('hidden');
};

window.submitCombo = async () => {
    const form = document.getElementById('addComboForm');
    if (!form.reportValidity()) return;

    if (selectedComboItems.length === 0) {
        window.showToast?.('Vui lòng thêm ít nhất 1 sản phẩm vào combo.', 'error');
        return;
    }

    const id = document.getElementById('add_combo_id').value;
    const name = document.getElementById('add_combo_name').value.trim();
    const code = document.getElementById('add_combo_code').value.trim().toUpperCase();
    const price = parseFloat(document.getElementById('add_combo_price').value) || 0;

    const submitBtn = document.getElementById('submitComboBtn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Đang lưu...';
    }

    try {
        let catId = document.getElementById('add_combo_category')?.value;
        if (!catId) {
            catId = await getCombosCategoryId();
        }

        const descriptionObj = {
            isCombo: true,
            items: selectedComboItems
        };

        const productData = {
            name,
            product_code: code,
            category_id: catId,
            is_active: true,
            is_direct_sale: true,
            is_component_item: false,
            description: JSON.stringify(descriptionObj)
        };

        let savedProduct;
        if (id) {
            const { data, error } = await supabaseClient
                .from('products')
                .update(productData)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            savedProduct = data;

            await supabaseClient.from('product_units').delete().eq('product_id', id);
        } else {
            const { data, error } = await supabaseClient
                .from('products')
                .insert([productData])
                .select()
                .single();

            if (error) throw error;
            savedProduct = data;
        }

        const unitData = {
            product_id: savedProduct.id,
            unit_name: 'Combo',
            conversion_rate: 1,
            is_base_unit: true,
            cost_price: 0,
            retail_price: price
        };

        const { error: unitErr } = await supabaseClient
            .from('product_units')
            .insert([unitData]);

        if (unitErr) throw unitErr;

        window.showToast?.('Lưu combo thành công!', 'success');
        window.closeAddComboModal();
        window.loadCombosData();
    } catch (err) {
        console.error('Lỗi khi lưu combo:', err);
        window.showToast?.('Lỗi khi lưu combo: ' + err.message, 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Lưu Combo';
        }
    }
};
