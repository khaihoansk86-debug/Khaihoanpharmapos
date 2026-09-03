import { supabaseClient } from '../../core/supabase.js';
import { fetchCategories, fetchProducts } from './productService.js';
import { filterComboSearchProducts, parseComboDescription } from './comboRules.js';
import { calculateComboAvailability } from '../pos/comboAvailabilityRules.js';
import { normalizeProductUnits, normalizeUnitName } from '../../core/unitCatalog.js';
import {
    archiveComboCatalogAtomic,
    saveComboCatalogAtomic
} from './comboCatalogService.js';

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

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
        const products = await fetchProducts();
        const combos = (products || []).filter(product =>
            product.is_active !== false && parseComboDescription(product.description)
        );
        const categories = await fetchCategories();
        window.renderComboCategoriesManager?.(categories, combos);

        if (loading) loading.classList.add('hidden');

        if (!combos || combos.length === 0) {
            container.innerHTML = `<tr><td colspan="7" class="py-10 text-center text-slate-500 font-medium italic bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">Chưa có combo nào được thiết lập. Hãy click "Thêm combo mới" để bắt đầu!</td></tr>`;
            return;
        }

        container.innerHTML = combos.map(combo => {
            const baseUnit = combo.product_units?.find(u => u.is_base_unit) || combo.product_units?.[0] || {};
            const comboDefinition = parseComboDescription(combo.description);
            const comboCategoryName = combo.product_categories?.name || combo.categories?.name || 'Chưa phân nhóm';
            const childDisplay = comboDefinition
                ? comboDefinition.items.map(item => `${item.name} (x${item.quantity} ${normalizeUnitName(item.unit, 'Viên')})`).join(', ')
                : 'Chưa liên kết thuốc';
            const componentCount = comboDefinition?.items?.length || 0;

            return `
            <tr class="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 shadow-sm transition-colors rounded-2xl">
                <td class="py-4 px-5 font-mono font-bold text-slate-700 dark:text-slate-350 rounded-l-2xl">${combo.product_code}</td>
                <td class="py-4 px-5 font-bold text-slate-800 dark:text-white">${combo.name}</td>
                <td class="py-4 px-5">
                    <span class="inline-flex items-center gap-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 text-xs font-black text-blue-700 dark:text-blue-300">
                        <i class="fa-solid fa-folder-tree text-[10px]"></i>
                        ${comboCategoryName}
                    </span>
                </td>
                <td class="py-4 px-5 text-xs text-slate-500 max-w-xs truncate" title="${childDisplay}">${childDisplay}</td>
                <td class="py-4 px-5 text-sm font-black text-slate-700 dark:text-slate-250">${componentCount}</td>
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
        container.innerHTML = `<tr><td colspan="7" class="py-10 text-center text-red-500 font-medium">Lỗi tải dữ liệu: ${err.message}</td></tr>`;
        if (loading) loading.classList.add('hidden');
    }
};

window.renderComboCategoriesManager = (categories = [], combos = []) => {
    const container = document.getElementById('combo-categories-container');
    if (!container) return;

    const comboCategories = (categories || [])
        .filter(category => String(category?.name || '').toLowerCase().includes('combo'))
        .sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || ''), 'vi'));

    if (comboCategories.length === 0) {
        container.innerHTML = `
            <div class="md:col-span-2 xl:col-span-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 px-6 py-8 text-center text-slate-500 font-medium">
                Chưa có nhóm combo nào. Hãy bấm "THÊM NHÓM COMBO" để tạo nhóm đầu tiên.
            </div>
        `;
        return;
    }

    const comboCountByCategory = new Map();
    (combos || []).forEach(combo => {
        const key = String(combo?.category_id || '');
        if (!key) return;
        comboCountByCategory.set(key, Number(comboCountByCategory.get(key) || 0) + 1);
    });

    const totalCombos = (combos || []).length;
    const summaryCard = `
        <div class="rounded-2xl border border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-900/70 p-5 shadow-sm">
            <div class="text-[10px] font-black uppercase tracking-[0.18em] text-blue-500">Tổng quan</div>
            <div class="mt-3 flex items-end gap-3">
                <div class="text-3xl font-black text-slate-800 dark:text-white">${comboCategories.length}</div>
                <div class="pb-1 text-sm font-bold text-slate-500">nhóm combo</div>
            </div>
            <div class="mt-2 text-xs font-bold text-slate-500">Đang quản lý ${totalCombos} combo trên hệ thống.</div>
        </div>
    `;

    container.innerHTML = summaryCard + comboCategories.map(category => {
        const comboCount = Number(comboCountByCategory.get(String(category.id)) || 0);
        const safeName = String(category.name || '').replace(/'/g, "\\'");

        return `
            <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-5 shadow-sm hover:border-blue-400 dark:hover:border-blue-700 transition-all">
                <div class="flex items-start justify-between gap-3">
                    <div>
                        <h4 class="text-base font-black text-slate-800 dark:text-white">${category.name}</h4>
                        <div class="mt-3 flex flex-wrap items-center gap-2">
                            <span class="inline-flex items-center gap-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 text-xs font-black text-blue-700 dark:text-blue-300">
                                <i class="fa-solid fa-layer-group"></i>
                                ${comboCount} combo
                            </span>
                            <span class="inline-flex items-center gap-2 rounded-xl bg-slate-200/80 dark:bg-slate-800 px-3 py-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                <i class="fa-solid fa-tag text-[10px]"></i>
                                Nhóm
                            </span>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="window.quickEditCategory('${category.id}', '${safeName}')" class="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-slate-200 dark:border-slate-700" title="Sửa nhóm combo">
                            <i class="fa-solid fa-pen text-[11px]"></i>
                        </button>
                        <button onclick="window.quickDeleteCategory('${category.id}')" class="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm border border-slate-200 dark:border-slate-700" title="Xóa nhóm combo">
                            <i class="fa-solid fa-trash text-[11px]"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
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
        await archiveComboCatalogAtomic(id, supabaseClient);
        window.showToast?.('Đã ẩn combo khỏi danh mục bán hàng!', 'success');
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
        renderComboAvailabilityPreview();
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
            <td class="py-3 font-bold text-slate-700 dark:text-slate-200">${escapeHtml(item.name)}</td>
            <td class="py-3 text-center">
                <input type="number" min="1" value="${item.quantity}" onchange="window.updateComboItemQty(${idx}, this.value)" class="w-16 px-2 py-1 text-center font-bold font-mono border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded text-slate-800 dark:text-white outline-none">
            </td>
            <td class="py-3 text-center">
                <span class="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded">${escapeHtml(normalizeUnitName(item.unit, 'Viên'))}</span>
            </td>
        </tr>
    `).join('');
    renderComboAvailabilityPreview();
}

function renderComboAvailabilityPreview() {
    const preview = document.getElementById('comboAvailabilityPreview');
    const quantityElement = document.getElementById('comboAvailabilityQuantity');
    const detailElement = document.getElementById('comboAvailabilityDetail');
    if (!preview || !quantityElement || !detailElement) return;

    if (selectedComboItems.length === 0) {
        preview.classList.add('hidden');
        return;
    }

    preview.classList.remove('hidden');
    const products = window.currentProductsList || [];
    if (products.length === 0) {
        quantityElement.textContent = 'Đang tải tồn kho thành phần...';
        detailElement.textContent = '';
        return;
    }

    const availability = calculateComboAvailability({
        description: {
            isCombo: true,
            items: selectedComboItems
        }
    }, products);
    quantityElement.textContent = `Có thể bán: ${availability.availableQuantity.toLocaleString('vi-VN')} combo`;
    detailElement.textContent = availability.bottleneck?.name
        ? `Giới hạn bởi: ${availability.bottleneck.name}`
        : 'Chưa xác định được thành phần giới hạn';
}

window.removeComboItem = (idx) => {
    selectedComboItems.splice(idx, 1);
    renderSelectedComboItems();
};

window.updateComboItemQty = (idx, val) => {
    selectedComboItems[idx].quantity = Math.max(1, parseInt(val, 10) || 1);
    renderComboAvailabilityPreview();
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
                        renderComboAvailabilityPreview();
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
                const units = normalizeProductUnits(product.product_units || []);
                const baseUnit = units.find(u => u.is_base_unit) || units[0] || {};
                return `
                <li data-combo-product-id="${escapeHtml(product.id)}" class="px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-slate-850 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer flex justify-between items-center">
                    <span>${escapeHtml(product.name)} <span class="text-[10px] text-slate-400 font-mono">(${escapeHtml(product.product_code || '')})</span></span>
                    <span class="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded">${escapeHtml(normalizeUnitName(baseUnit.unit_name, 'Đơn vị'))}</span>
                </li>`;
            }).join('');

            suggestions.classList.remove('hidden');
        }, 300);
    });

    document.addEventListener('click', (e) => {
        const option = e.target.closest('[data-combo-product-id]');
        if (option && suggestions.contains(option)) {
            window.addComboProduct(option.dataset.comboProductId);
            return;
        }
        if (!e.target.closest('#comboProductSearchInput') && !e.target.closest('#comboProductSuggestions')) {
            suggestions.classList.add('hidden');
        }
    });
}

window.addComboProduct = (id) => {
    const product = (window.currentProductsList || []).find(item => String(item.id) === String(id));
    if (!product) {
        window.showToast?.('Không tìm thấy sản phẩm vừa chọn.', 'error');
        return;
    }
    const units = normalizeProductUnits(product.product_units || []);
    const baseUnit = units.find(item => item.is_base_unit)
        || units[0]
        || {};
    const existing = selectedComboItems.find(item => item.id === id);
    if (existing) {
        existing.quantity += 1;
    } else {
        selectedComboItems.push({
            id,
            name: product.name,
            unit: normalizeUnitName(baseUnit.unit_name, 'Viên'),
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

        await saveComboCatalogAtomic({
            id: id || null,
            name: productData.name,
            code: productData.product_code,
            categoryId: productData.category_id,
            price,
            items: selectedComboItems
        }, supabaseClient);

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
