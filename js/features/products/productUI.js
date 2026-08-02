// js/features/products/productUI.js
import { removeVietnameseTones } from './productService.js';
import {
    assertSafeVariantBaseUnitChange,
    buildPackagingPlan,
    buildVariantPackagingEditorSeed,
    buildVariantUnitRows,
    groupVariantsByClinicalIdentity
} from './productVariantPackagingRules.js';
import {
    buildCatalogEntryPlan,
    buildExistingVariantIdentityUpdate,
    deriveVariantEditorLabel,
    buildVariantContinuationSeed,
    buildVariantDraftReview,
    buildVariantIdentitySuggestion,
    buildVariantPackagingRequest,
    findCatalogIdentityConflict,
    getVariantPackagingPreset,
    hasProductFormDraftChanged,
    hasVariantDraftChanged,
    listVariantPackagingPresets
} from './productCatalogEntryRules.js';
import {
    fetchCatalogProductSnapshot,
    mergeCatalogProductSnapshot
} from './productCatalogRefreshService.js';
import { saveProductVariantAtomic } from './productVariantPersistenceService.js';
import { assertSafeVariantBatchRemoval } from './productVariantBatchRules.js';
import {
    buildParentProductSummary,
    buildStockBreakdown,
    displayUnitName,
    getProductBaseUnit,
    sortClinicalVariantGroups
} from './productVariantDisplayRules.js';
import {
    buildVariantClassificationLabel,
    buildVariantClassificationPayload,
    listVariantClassificationPresets,
    normalizeVariantValues,
    resolveVariantDefinitions,
    validateVariantValues
} from './productVariantClassificationRules.js';

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
let productModalReturnFocus = null;
let productModalKeyboardBound = false;
let productDraftObserver = null;
let productDraftStatusFrame = null;

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

function variantClassificationInputId(id, key) {
    if (key === 'concentration') return `inline_concentration_${id}`;
    if (key === 'dosage_form') return `inline_dosage_form_${id}`;
    return `inline_variant_value_${key}_${id}`;
}

function getParentVariantDefinitions(parent = {}, variants = []) {
    return resolveVariantDefinitions(parent, variants);
}

function getVariantDefinitionsForEditor(id) {
    const variant = (window.currentProductsList || []).find(product =>
        String(product.id) === String(id)
    );
    const parentId = variant?.parent_id
        || document.getElementById('add_product_id')?.value;
    const parent = (window.currentProductsList || []).find(product =>
        String(product.id) === String(parentId)
    ) || {};
    const siblings = (window.currentProductsList || []).filter(product =>
        String(product.parent_id) === String(parentId)
    );
    return getParentVariantDefinitions(parent, siblings);
}

function collectInlineVariantValues(id, definitions = getVariantDefinitionsForEditor(id)) {
    const values = {};
    definitions.forEach(definition => {
        const value = document.getElementById(
            variantClassificationInputId(id, definition.key)
        )?.value;
        if (String(value || '').trim()) values[definition.key] = value.trim();
    });
    return values;
}

function renderVariantClassificationFields({
    id,
    definitions = [],
    variant = {},
    onInput = ''
} = {}) {
    const values = normalizeVariantValues(
        definitions,
        variant?.variant_values,
        variant
    );
    return definitions.map(definition => {
        const inputId = variantClassificationInputId(id, definition.key);
        const example = definition.key === 'concentration'
            ? 'VD: 650mg'
            : definition.key === 'dosage_form'
                ? 'VD: Viên nén'
                : `Nhập ${definition.label.toLocaleLowerCase('vi-VN')}`;
        return `
            <div>
                <label for="${inputId}" class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">${escapeHTML(definition.label)}</label>
                <input type="text"
                       id="${inputId}"
                       data-variant-value-for="${escapeHTML(id)}"
                       data-variant-classification-key="${escapeHTML(definition.key)}"
                       ${onInput}
                       class="w-full min-h-11 px-3 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                       value="${escapeHTML(values[definition.key] || '')}"
                       placeholder="${escapeHTML(example)}">
            </div>
        `;
    }).join('');
}

function setVariantClassificationControls(definitions = []) {
    const presets = new Set(
        listVariantClassificationPresets().map(preset => preset.key)
    );
    const axes = ['primary', 'secondary'];
    axes.forEach((axis, index) => {
        const definition = definitions[index] || null;
        const select = document.getElementById(`add_variant_axis_${axis}`);
        const custom = document.getElementById(`add_variant_axis_${axis}_custom`);
        if (!select || !custom) return;
        select.value = definition
            ? (presets.has(definition.key) ? definition.key : 'custom')
            : '';
        select.dataset.variantDefinitionKey = definition && !presets.has(definition.key)
            ? definition.key
            : '';
        custom.value = definition && !presets.has(definition.key)
            ? definition.label
            : '';
    });
    window.updateVariantClassificationControls?.();
}

function populateVariantClassificationPresetOptions() {
    const primary = document.getElementById('add_variant_axis_primary');
    const secondary = document.getElementById('add_variant_axis_secondary');
    if (!primary || !secondary) return;

    const presetOptions = listVariantClassificationPresets()
        .map(preset => `<option value="${escapeHTML(preset.key)}">${escapeHTML(preset.label)}</option>`)
        .join('');
    primary.innerHTML = `${presetOptions}<option value="custom">Khác...</option>`;
    secondary.innerHTML = `
        <option value="">Không dùng phân loại phụ</option>
        ${presetOptions}
        <option value="custom">Khác...</option>
    `;
}

function resolveProductValidationControl(issue) {
    if (issue.field === 'base_unit_name') {
        return document.querySelector(
            '#unitsContainer .unit-row:first-child .unit-name'
        );
    }
    if (issue.field === 'base_unit_retail') {
        return document.querySelector(
            '#unitsContainer .unit-row:first-child .unit-retail'
        );
    }
    if (issue.field === 'batch_expiry') {
        return document.querySelectorAll(
            '#batchRowsContainer .batch-row .batch-expiry'
        )[issue.rowIndex] || null;
    }
    return document.getElementById(issue.field);
}

function focusProductValidationControl(control) {
    if (!control) return;
    control.focus();
    control.scrollIntoView({
        behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
            ? 'auto'
            : 'smooth',
        block: 'center'
    });
}

function handleProductValidationSummaryClick(event) {
    const trigger = event.target.closest('[data-product-validation-focus]');
    if (!trigger) return;
    const issueIndex = trigger.dataset.productValidationFocus;
    const control = document.querySelector(
        `#addProductForm [data-product-validation-issue-index="${issueIndex}"]`
    );
    focusProductValidationControl(control);
}

export function clearProductFormValidationIssues() {
    document.querySelectorAll('[data-product-validation-error]')
        .forEach(error => error.remove());
    document.querySelectorAll('#addProductForm [aria-invalid="true"]')
        .forEach(control => {
            control.removeAttribute('aria-invalid');
            control.removeAttribute('aria-describedby');
            delete control.dataset.productValidationField;
            delete control.dataset.productValidationIssueIndex;
            delete control.dataset.productValidationIssueKey;
            delete control.dataset.productValidationRejectedValue;
            control.classList.remove(
                'border-red-500',
                'ring-2',
                'ring-red-500/20'
            );
        });

    const summary = document.getElementById('productValidationSummary');
    const list = summary?.querySelector('[data-product-validation-list]');
    if (list) list.innerHTML = '';
    summary?.classList.add('hidden');
}

export function showProductFormValidationIssues(issues = []) {
    clearProductFormValidationIssues();
    if (!issues.length) return true;

    const summary = document.getElementById('productValidationSummary');
    const list = summary?.querySelector('[data-product-validation-list]');
    if (list) {
        list.innerHTML = issues.map((issue, index) =>
            `<li data-product-validation-summary-issue="${index}">
                <button type="button"
                        data-product-validation-focus="${index}"
                        class="min-h-11 w-full rounded-lg px-2 py-2 text-left font-bold underline decoration-red-300 underline-offset-2 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 dark:hover:bg-red-950/60">
                    ${escapeHTML(issue.message)}
                    <span class="sr-only"> — chuyển đến ô cần sửa</span>
                </button>
            </li>`
        ).join('');
        list.onclick = handleProductValidationSummaryClick;
    }
    summary?.classList.remove('hidden');

    let firstControl = null;
    issues.forEach((issue, index) => {
        const control = resolveProductValidationControl(issue);
        if (!control) return;
        if (!firstControl) firstControl = control;

        const errorId = `product_validation_error_${index}`;
        control.setAttribute('aria-invalid', 'true');
        control.setAttribute('aria-describedby', errorId);
        control.dataset.productValidationField = issue.field;
        control.dataset.productValidationIssueIndex = String(index);
        control.dataset.productValidationIssueKey = issue.key || '';
        control.dataset.productValidationRejectedValue = issue.rejectedValue || '';
        control.classList.add(
            'border-red-500',
            'ring-2',
            'ring-red-500/20'
        );

        const error = document.createElement('p');
        error.id = errorId;
        error.dataset.productValidationError = 'true';
        error.dataset.productValidationIssueIndex = String(index);
        error.className = 'mt-1 text-xs font-bold text-red-600 dark:text-red-400';
        error.textContent = issue.message;
        control.insertAdjacentElement('afterend', error);
    });

    const focusTarget = firstControl || summary;
    focusProductValidationControl(focusTarget);
    return false;
}

function isResolvedProductValidationControl(control) {
    const field = control?.dataset?.productValidationField;
    const issueKey = control?.dataset?.productValidationIssueKey;
    const value = String(control?.value ?? '').trim();
    const rejectedValue = String(
        control?.dataset?.productValidationRejectedValue || ''
    ).trim();
    const hasChangedFromRejectedValue = !rejectedValue
        || value.toLocaleUpperCase('vi-VN')
            !== rejectedValue.toLocaleUpperCase('vi-VN');
    if (issueKey === 'identity-product-code-conflict') {
        const conflict = findCatalogIdentityConflict({
            productCode: value,
            existingProducts: window.currentProductsList || [],
            excludeProductId: document.getElementById('add_product_id')?.value || null
        });
        return Boolean(value)
            && hasChangedFromRejectedValue
            && conflict?.field !== 'product_code';
    }
    if (issueKey === 'identity-barcode-conflict') {
        const conflict = findCatalogIdentityConflict({
            barcode: value,
            existingProducts: window.currentProductsList || [],
            excludeProductId: document.getElementById('add_product_id')?.value || null
        });
        return !value || (
            hasChangedFromRejectedValue
            && conflict?.field !== 'barcode'
        );
    }
    if (['add_name', 'add_code', 'add_category', 'base_unit_name', 'batch_expiry']
        .includes(field)) {
        return Boolean(value);
    }
    if (field === 'base_unit_retail') {
        const number = Number(value);
        return Boolean(value) && Number.isFinite(number) && number >= 0;
    }
    return false;
}

function pruneProductValidationSummary() {
    const summary = document.getElementById('productValidationSummary');
    const list = summary?.querySelector('[data-product-validation-list]');
    if (!summary || !list) return;

    list.querySelectorAll('[data-product-validation-summary-issue]')
        .forEach(item => {
            const index = item.dataset.productValidationSummaryIssue;
            const control = document.querySelector(
                `#addProductForm [data-product-validation-issue-index="${index}"]`
            );
            if (!control) item.remove();
        });
    summary.classList.toggle('hidden', list.children.length === 0);
}

function clearResolvedProductValidationIssue(control) {
    if (!isResolvedProductValidationControl(control)) return;

    const index = control.dataset.productValidationIssueIndex;
    document.getElementById(control.getAttribute('aria-describedby'))?.remove();
    document.querySelector(
        `[data-product-validation-summary-issue="${index}"]`
    )?.remove();
    control.removeAttribute('aria-invalid');
    control.removeAttribute('aria-describedby');
    delete control.dataset.productValidationField;
    delete control.dataset.productValidationIssueIndex;
    delete control.dataset.productValidationIssueKey;
    delete control.dataset.productValidationRejectedValue;
    control.classList.remove(
        'border-red-500',
        'ring-2',
        'ring-red-500/20'
    );
    pruneProductValidationSummary();
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

    // --- Build Hash Map for O(1) Variant Lookups ---
    const variantsMap = {};
    if (window.currentProductsList) {
        window.currentProductsList.forEach(v => {
            if (v.parent_id) {
                if (!variantsMap[v.parent_id]) variantsMap[v.parent_id] = [];
                variantsMap[v.parent_id].push(v);
            }
        });
    }

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
                            const variants = variantsMap[p.id] || [];
                            if (variants.length > 0) {
                                return buildParentProductSummary(p, variants).inStockSkuCount;
                            }
                        return (p.product_batches || []).reduce((s, b) => s + (Number(b.stock_quantity) || 0), 0);
                    };
                    valA = getStock(a);
                    valB = getStock(b);
                } else if (window.currentSortColumn === 'expiry') {
                    const getMinExpiry = (p) => {
                        const variants = variantsMap[p.id] || [];
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
        // Kiểm tra mối quan hệ cha - con bằng Hash Map O(1)
        const variants = variantsMap[product.id] || [];
        const isParent = product.is_direct_sale === false || (product.product_code || '').startsWith('PARENT_') || variants.length > 0;
        const parentProduct = product.parent_id ? (window.currentProductsList || []).find(p => p.id === product.parent_id) : null;

        const productUnits = product.product_units || [];
        let pricesHtmlContent = '';

        // Tính tổng tồn kho
        let totalStock = 0;
        let stockBadge = '';
        let stockHtmlContent = '';
        let expiryHtmlContent = '';
        let stockHeadlineHtml = '';
        
        let nearestExpiryDateParent = null;
        let nearestExpiryVariantParent = null;
        let nearestExpiryStrParent = '';
        let nearestExpiryColorParent = '';

        if (isParent) {
            const parentSummary = buildParentProductSummary(product, variants);
            totalStock = parentSummary.stockByUnit.reduce((sum, item) => sum + item.quantity, 0);
            stockHeadlineHtml = `<span class="text-lg font-black text-slate-900 dark:text-white mr-2">${parentSummary.skuCount} SKU</span>`;

            pricesHtmlContent = parentSummary.priceByUnit.length > 0
                ? parentSummary.priceByUnit.map(item => {
                    const price = item.min === item.max
                        ? formatCurrency(item.min)
                        : `${formatCurrency(item.min)} – ${formatCurrency(item.max)}`;
                    return `
                        <div class="flex items-center justify-between gap-3 py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                            <span class="text-[10px] font-black uppercase text-slate-500">${escapeHTML(item.unitName)}</span>
                            <span class="text-sm font-black text-blue-600 dark:text-blue-400">${price}/${escapeHTML(item.unitName)}</span>
                        </div>`;
                }).join('')
                : `<span class="text-slate-400 dark:text-slate-500 italic text-sm">Chưa thiết lập giá</span>`;

            stockBadge = `<span class="${parentSummary.inStockSkuCount > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'} text-[10px] font-black px-2 py-0.5 rounded-full uppercase">${parentSummary.inStockSkuCount}/${parentSummary.skuCount} SKU còn hàng</span>`;
            stockBadge += parentSummary.warnings.map(warning => `
                <span class="${warning.severity === 'danger' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200'} text-[9px] font-black px-2 py-0.5 rounded-full border">
                    <i class="fa-solid fa-triangle-exclamation mr-1"></i>${escapeHTML(warning.label)}
                </span>
            `).join('');

            stockHtmlContent = parentSummary.stockByUnit.length > 0
                ? parentSummary.stockByUnit.map(item => `
                    <div class="flex items-center justify-between gap-3 text-xs mb-1.5 last:mb-0 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span class="text-[10px] font-black uppercase text-slate-500">Tồn ${escapeHTML(item.unitName)}</span>
                        <span class="text-sm font-black text-slate-900 dark:text-white">${item.quantity.toLocaleString('vi-VN')} ${escapeHTML(item.unitName)}</span>
                    </div>
                `).join('')
                : `<span class="text-slate-400 italic text-xs">Chưa có tồn kho biến thể</span>`;

            
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
                expiryHtmlContent = variants.map(v => {
                    let expStr = '--/--/----';
                    let expColor = 'text-slate-500 dark:text-slate-400';
                    const activeBatches = (v.product_batches || []).filter(b => Number(b.stock_quantity || 0) > 0 && b.expiry_date);
                    if (activeBatches.length > 0) {
                        const nearestDate = new Date(Math.min(...activeBatches.map(b => new Date(b.expiry_date).getTime())));
                        expStr = nearestDate.toLocaleDateString('vi-VN');
                        const daysLeft = (nearestDate - new Date()) / (1000 * 60 * 60 * 24);
                        if (daysLeft < 0) expColor = 'text-red-500 dark:text-red-400 font-bold';
                        else if (daysLeft < 90) expColor = 'text-orange-500 dark:text-orange-400 font-bold';
                        else expColor = 'text-emerald-600 dark:text-emerald-400 font-medium';
                    }
                    return `
                        <div class="flex items-center justify-center gap-3 text-xs mb-1.5 last:mb-0 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm h-[34px]">
                            <span class="${expColor} text-[11px] font-mono">${expStr}</span>
                        </div>`;
                }).join('');
            } else {
                expiryHtmlContent = `<span class="text-slate-400 italic text-xs">---</span>`;
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
            const baseUnit = getProductBaseUnit(product);
            stockHeadlineHtml = `<span class="text-lg font-black text-slate-900 dark:text-white mr-2">${totalStock.toLocaleString('vi-VN')} ${escapeHTML(baseUnit.unit_name || '')}</span>`;
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
                stockHtmlContent = visibleBatches.map(b => {
                    const stock = b.stock_quantity || 0;
                    const actionBtn = stock <= 0 ? `
                        <button onclick="window.deleteZeroBatch('${b.id}', '${escapeHTML(b.batch_number)}')" class="text-red-500 hover:text-red-700 ml-1.5 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30" title="Xóa lô rỗng">
                            <i class="fa-solid fa-trash-can text-[10px]"></i>
                        </button>
                    ` : `
                        <button onclick="window.openInternalIssueModal('${escapeHTML(product.product_code || '---')}')" class="text-orange-500 hover:text-orange-700 ml-1.5 p-1 rounded hover:bg-orange-50 dark:hover:bg-orange-950/30" title="Xuất kho lô này">
                            <i class="fa-solid fa-arrow-right-from-bracket text-[10px]"></i>
                        </button>
                    `;

                    return `
                    <div class="flex items-center justify-between gap-3 text-xs mb-1.5 last:mb-0 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm h-[34px]">
                        <div class="flex items-center gap-1.5 truncate">
                            <span class="font-bold text-slate-800 dark:text-slate-200 text-[11px] uppercase truncate" title="${escapeHTML(b.batch_number || 'Mặc định')}">${escapeHTML(b.batch_number || 'Mặc định')}</span>
                            <span class="text-[10px] font-black bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 shrink-0">SL: ${stock}</span>
                            ${actionBtn}
                        </div>
                    </div>`;
                }).join('');
                
                expiryHtmlContent = visibleBatches.map(b => {
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
                    <div class="flex items-center justify-center gap-3 text-xs mb-1.5 last:mb-0 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm h-[34px]">
                        <span class="${expColor} text-[11px] font-mono">${expStr}</span>
                    </div>`;
                }).join('');
                
                if (activeBatches.length > visibleBatches.length) {
                    const extraStr = `<div class="text-[10px] font-black text-slate-400 px-2 pt-1 h-[20px]">+${activeBatches.length - visibleBatches.length} lô khác</div>`;
                    stockHtmlContent += extraStr;
                    expiryHtmlContent += extraStr;
                }
            } else {
                stockHtmlContent = `<span class="text-slate-400 italic text-xs">Chưa có thông tin lô</span>`;
                expiryHtmlContent = `<span class="text-slate-400 italic text-xs">---</span>`;
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


        const actionsHtml = `
            <div class="flex items-center gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button data-edit-product-code="${safeCode}"
                    class="w-7 h-7 flex items-center justify-center text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50 rounded-lg hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-sm"
                    title="Chỉnh sửa">
                    <i class="fa-solid fa-pen-to-square text-[10px]"></i>
                </button>
                ${isInactiveProduct ? `
                <button onclick="window.toggleProductActiveStatus('${product.id}', true, '${safeNameJs}')"
                    class="w-7 h-7 flex items-center justify-center text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 rounded-lg hover:bg-emerald-600 hover:text-white hover:border-emerald-600 shadow-sm"
                    title="Tiếp tục kinh doanh">
                    <i class="fa-solid fa-rotate-left text-[10px]"></i>
                </button>
                <button onclick="window.quickIssueInactiveProductStock('${product.id}', '${safeNameJs}')"
                    ${totalStock <= 0 ? 'disabled' : ''}
                    class="w-7 h-7 flex items-center justify-center text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800/50 rounded-lg hover:bg-orange-600 hover:text-white hover:border-orange-600 shadow-sm ${totalStock <= 0 ? 'opacity-40 cursor-not-allowed hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:text-orange-600 dark:hover:text-orange-400 hover:border-orange-200 dark:hover:border-orange-800/50' : ''}"
                    title="${totalStock > 0 ? 'Xuất tồn nhanh toàn bộ các lô còn hàng' : 'Sản phẩm đã hết tồn'}">
                    <i class="fa-solid fa-arrow-up-from-bracket text-[10px]"></i>
                </button>
                <button onclick="window.deleteProduct('${product.id}', '${safeNameJs}')"
                    class="w-7 h-7 flex items-center justify-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600 shadow-sm"
                    title="Xóa hàng hóa">
                    <i class="fa-solid fa-trash-can text-[10px]"></i>
                </button>
                ` : `
                <button onclick="window.toggleProductActiveStatus('${product.id}', false, '${safeNameJs}')"
                    class="w-7 h-7 flex items-center justify-center text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800/50 rounded-lg hover:bg-orange-600 hover:text-white hover:border-orange-600 shadow-sm"
                    title="Ngừng kinh doanh">
                    <i class="fa-solid fa-ban text-[10px]"></i>
                </button>
                `}
                <button onclick="window.openPrintLabelModal('${product.id}')"
                    class="w-7 h-7 flex items-center justify-center text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800/50 rounded-lg hover:bg-green-600 hover:text-white hover:border-green-600 shadow-sm"
                    title="In tem mã">
                    <i class="fa-solid fa-print text-[10px]"></i>
                </button>
            </div>
        `;

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
                    ${actionsHtml}
                </td>

                <td class="py-4 px-5 border-y border-slate-300 dark:border-slate-700 w-48">
                    <div class="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        ${pricesHtmlContent}
                    </div>
                </td>

                <td class="py-4 px-5 border-y border-slate-300 dark:border-slate-700 align-top">
                    <div class="flex flex-col gap-2">
                        <div class="flex flex-wrap items-center gap-1.5 mb-1 min-h-[28px]">
                            ${stockHeadlineHtml}
                            ${stockBadge}
                        </div>
                        <div class="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                            ${stockHtmlContent}
                        </div>
                    </div>
                </td>
                
                <td class="py-4 px-5 border-y border-r rounded-r-2xl border-slate-300 dark:border-slate-700 align-top">
                    <div class="flex flex-col gap-2">
                        <div class="flex items-center mb-1 min-h-[28px]">
                            ${nearestExpiryStrParent ? `<span class="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded font-black text-[10px] uppercase border border-rose-200 dark:border-rose-800 shadow-sm"><i class="fa-solid fa-clock mr-1"></i>Sớm nhất: ${nearestExpiryStrParent}</span>` : ''}
                        </div>
                        <div class="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                            ${expiryHtmlContent}
                        </div>
                    </div>
                </td>


            </tr>`;

        if (isParent && variants.length > 0) {
            const clinicalGroups = sortClinicalVariantGroups(
                groupVariantsByClinicalIdentity(variants, product.variant_definitions)
            ).map(group => ({
                ...group,
                variants: [...group.variants].sort((left, right) => {
                    const largestUnitRate = product => Math.max(
                        0,
                        ...(product.product_units || []).map(unit => Number(unit.conversion_rate || 0))
                    );
                    return largestUnitRate(left) - largestUnitRate(right)
                        || String(left.packaging_spec || '').localeCompare(
                            String(right.packaging_spec || ''),
                            'vi'
                        );
                })
            }));
            const clinicalGroupByVariantId = new Map();
            clinicalGroups.forEach(group => {
                group.variants.forEach((variant, index) => {
                    clinicalGroupByVariantId.set(variant.id, {
                        label: group.label,
                        isFirst: index === 0
                    });
                });
            });
            const orderedVariants = clinicalGroups.flatMap(group => group.variants);
            let subTableRows = orderedVariants.map(v => {
                const sourceUnits = (v.product_units || []).length > 0
                    ? v.product_units
                    : (typeof window.productUnitsSourceList !== 'undefined'
                        ? window.productUnitsSourceList.filter(unit => unit.product_id === v.id)
                        : []);
                const stockDisplay = buildStockBreakdown({ ...v, product_units: sourceUnits });
                const sortedUnits = [...sourceUnits].sort(
                    (left, right) => Number(left.conversion_rate || 1) - Number(right.conversion_rate || 1)
                );
                const retailPricesHtml = sortedUnits.length > 0
                    ? sortedUnits.map(unit => `
                        <div class="flex items-center justify-between gap-3 whitespace-nowrap">
                            <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400">${escapeHTML(displayUnitName(unit.unit_name))}</span>
                            <span class="font-black text-emerald-600 dark:text-emerald-400">${formatCurrency(unit.retail_price)}</span>
                        </div>
                    `).join('')
                    : '<span class="text-slate-400 italic">Chưa thiết lập</span>';
                const baseUnit = getProductBaseUnit({ ...v, product_units: sourceUnits });
                const baseCost = Number(baseUnit.cost_price || 0);
                const zeroCostBatchCount = (v.product_batches || []).filter(
                    batch => Number(batch.stock_quantity || 0) > 0 && Number(batch.cost_price || 0) <= 0
                ).length;
                
                let expStr = '--/--/----';
                let expColor = 'text-slate-500 dark:text-slate-400';
                let nearestDate = null;
                const activeBatches = (v.product_batches || []).filter(b => Number(b.stock_quantity || 0) > 0 && b.expiry_date);
                if (activeBatches.length > 0) {
                    nearestDate = new Date(Math.min(...activeBatches.map(b => new Date(b.expiry_date).getTime())));
                    expStr = nearestDate.toLocaleDateString('vi-VN');
                    const daysLeft = (nearestDate - new Date()) / (1000 * 60 * 60 * 24);
                    if (daysLeft < 0) expColor = 'text-red-600 dark:text-red-400';
                    else if (daysLeft < 90) expColor = 'text-orange-600 dark:text-orange-400';
                    else expColor = 'text-emerald-600 dark:text-emerald-400';
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
                
                const clinicalGroup = clinicalGroupByVariantId.get(v.id);
                const clinicalGroupHtml = clinicalGroup?.isFirst
                    ? `<div class="mb-2 inline-flex items-center gap-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-indigo-700 dark:text-indigo-300"><i class="fa-solid fa-layer-group mr-1"></i>${escapeHTML(clinicalGroup.label)}</div>`
                    : '';
                return `
                    <tr class="${rowClass}">
                        <td class="py-3 px-4 align-top min-w-[230px]">
                            ${clinicalGroupHtml}
                            <div class="font-black text-sm text-slate-900 dark:text-white">${escapeHTML(v.packaging_spec || v.variant_label || v.name)}</div>
                            ${!v.packaging_spec ? '<div class="mt-1 text-[10px] font-bold text-amber-600 dark:text-amber-400"><i class="fa-solid fa-triangle-exclamation mr-1"></i>Thiếu quy cách chuẩn</div>' : ''}
                        </td>
                        <td class="py-3 px-4 align-top min-w-[150px]">
                            <div class="text-blue-600 dark:text-blue-400 font-mono text-xs font-black">${escapeHTML(v.product_code || '---')}</div>
                            <div class="mt-1 text-[10px] text-slate-500 dark:text-slate-400 font-mono break-all">${v.barcode ? `<i class="fa-solid fa-barcode mr-1"></i>${escapeHTML(v.barcode)}` : 'Chưa có barcode'}</div>
                        </td>
                        <td class="py-3 px-4 align-top min-w-[145px]"><div class="space-y-1">${retailPricesHtml}</div></td>
                        <td class="py-3 px-4 align-top min-w-[135px]">
                            <div class="font-black ${baseCost > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'}">${formatCurrency(baseCost)}/${escapeHTML(displayUnitName(baseUnit.unit_name))}</div>
                            ${zeroCostBatchCount > 0 ? `<div class="mt-1.5 rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-2 py-1 text-[10px] font-black text-red-700 dark:text-red-400"><i class="fa-solid fa-triangle-exclamation mr-1"></i>${zeroCostBatchCount} lô có tồn thiếu giá vốn</div>` : ''}
                        </td>
                        <td class="py-3 px-4 align-top min-w-[155px]">
                            <div class="font-black text-sm text-slate-900 dark:text-white">${escapeHTML(stockDisplay.totalLabel)}</div>
                            <div class="mt-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">${escapeHTML(stockDisplay.breakdownLabel)}</div>
                        </td>
                        <td class="py-3 px-4 align-top text-center min-w-[120px]">
                            <div class="${expColor} font-black">${expStr}</div>
                            <div class="mt-1 text-[10px] text-slate-400">Lô còn hàng gần nhất</div>
                        </td>
                        <td class="py-3 px-4 align-top text-right min-w-[90px]">
                            <button onclick="window.openEditModalByCode('${v.product_code}')" class="min-h-9 min-w-14 text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 dark:bg-blue-900/30 dark:hover:bg-blue-600 px-3 py-2 rounded-lg text-[11px] font-black shadow-sm transition-all border border-blue-200 dark:border-blue-800">
                                Sửa
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');

            const displayClass = isAutoExpanded ? "" : "hidden";
            rowHtml += `
            <tr id="variants_row_${product.id}" class="${displayClass}">
                <td colspan="6" class="p-0 border-b border-slate-300 dark:border-slate-700">
                    <div class="px-3 sm:px-8 py-5 bg-gradient-to-r from-indigo-50/50 to-blue-50/50 dark:from-slate-900/80 dark:to-slate-800/80 shadow-[inset_0_4px_6px_-4px_rgba(0,0,0,0.1)]">
                        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-x-auto">
                            <table class="w-full min-w-[1080px] text-xs text-left border-collapse">
                                <thead class="text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-100/80 dark:bg-slate-800/80">
                                    <tr>
                                        <th class="py-3 px-4 font-black">Nhóm / Quy cách</th>
                                        <th class="py-3 px-4 font-black">SKU / Barcode</th>
                                        <th class="py-3 px-4 font-black">Giá bán theo đơn vị</th>
                                        <th class="py-3 px-4 font-black">Giá vốn cơ sở</th>
                                        <th class="py-3 px-4 font-black">Tồn quy đổi</th>
                                        <th class="py-3 px-4 font-black text-center">Hạn gần nhất</th>
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

function isVisibleProductModalControl(control, modal) {
    let node = control;
    while (node && node !== modal) {
        if (node.hidden || node.classList?.contains('hidden')) return false;
        node = node.parentElement;
    }
    return true;
}

function getProductModalFocusableControls(modal) {
    return [...modal.querySelectorAll([
        'button:not([disabled])',
        'a[href]',
        'input:not([disabled]):not([type="hidden"])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
    ].join(','))].filter(control =>
        isVisibleProductModalControl(control, modal)
    );
}

function handleProductModalKeydown(event) {
    const modal = document.getElementById('addProductModal');
    if (!modal || modal.classList.contains('hidden')) return;

    if (event.key === 'Escape') {
        event.preventDefault();
        requestCloseAddProductModal();
        return;
    }
    if (event.key !== 'Tab') return;

    const controls = getProductModalFocusableControls(modal);
    if (controls.length === 0) {
        event.preventDefault();
        modal.focus();
        return;
    }

    const firstControl = controls[0];
    const lastControl = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === firstControl) {
        event.preventDefault();
        lastControl.focus();
    } else if (
        !event.shiftKey
        && (
            document.activeElement === lastControl
            || !modal.contains(document.activeElement)
        )
    ) {
        event.preventDefault();
        firstControl.focus();
    }
}

function bindProductModalKeyboard() {
    if (productModalKeyboardBound) return;
    document.addEventListener('keydown', handleProductModalKeydown);
    productModalKeyboardBound = true;
}

function getUnsavedProductDraftState() {
    const modal = document.getElementById('addProductModal');
    const hasProductChanges = hasProductFormDraftChanged(
        readInitialProductFormDraft(modal),
        collectProductFormDraft()
    );
    const changedDraftCount = [...document.querySelectorAll(
        '#variantsListContainer [id^="modal_edit_"]'
    )].filter(draftRoot => {
        const id = draftRoot.id.replace(/^modal_edit_/, '');
        return hasVariantDraftChanged(
            readInlineVariantInitialDraft(draftRoot),
            collectInlineVariantDraft(id)
        );
    }).length;

    return { hasProductChanges, changedDraftCount };
}

function refreshProductDraftStatus() {
    const status = document.getElementById('productDraftStatus');
    const text = status?.querySelector('[data-product-draft-status-text]');
    if (!status || !text) return;

    const { hasProductChanges, changedDraftCount } = getUnsavedProductDraftState();
    const label = hasProductChanges && changedDraftCount > 0
        ? `Chưa lưu: thông tin + ${changedDraftCount} SKU`
        : hasProductChanges
            ? 'Thông tin chưa lưu'
            : changedDraftCount > 0
                ? `${changedDraftCount} SKU chưa lưu`
                : '';

    text.textContent = label;
    status.classList.toggle('hidden', !label);
    status.classList.toggle('inline-flex', Boolean(label));
}

function handleProductDraftActivity(activity) {
    const control = activity?.target;
    const isIdentityIssue = String(
        control?.dataset?.productValidationIssueKey || ''
    ).startsWith('identity-');
    if (
        control?.dataset?.productValidationField
        && (!isIdentityIssue || activity.type !== 'input')
    ) {
        clearResolvedProductValidationIssue(control);
    }
    if (productDraftStatusFrame) return;
    productDraftStatusFrame = requestAnimationFrame(() => {
        productDraftStatusFrame = null;
        pruneProductValidationSummary();
        refreshProductDraftStatus();
    });
}

function unbindProductDraftTracking() {
    const form = document.getElementById('addProductForm');
    form?.removeEventListener('input', handleProductDraftActivity);
    form?.removeEventListener('change', handleProductDraftActivity);
    productDraftObserver?.disconnect();
    productDraftObserver = null;
    if (productDraftStatusFrame) cancelAnimationFrame(productDraftStatusFrame);
    productDraftStatusFrame = null;
}

function bindProductDraftTracking() {
    const form = document.getElementById('addProductForm');
    if (!form) return;

    form.addEventListener('input', handleProductDraftActivity);
    form.addEventListener('change', handleProductDraftActivity);
    if (typeof MutationObserver === 'function') {
        productDraftObserver = new MutationObserver(handleProductDraftActivity);
        productDraftObserver.observe(form, { childList: true, subtree: true });
    }
}

export function openAddProductModal(product = null) {
    const modal = document.getElementById('addProductModal');
    const wasHidden = modal.classList.contains('hidden');
    if (wasHidden) productModalReturnFocus = document.activeElement;
    unbindProductDraftTracking();
    populateVariantClassificationPresetOptions();
    document.getElementById('addProductForm').reset();
    clearProductFormValidationIssues();

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
    setVariantClassificationControls([
        { key: 'concentration', label: 'Hàm lượng' },
        { key: 'dosage_form', label: 'Dạng bào chế' }
    ]);

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
        const dosageFormInput = document.getElementById('add_dosage_form');
        if (dosageFormInput) dosageFormInput.value = product.dosage_form || '';
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
        setVariantClassificationControls(
            getParentVariantDefinitions(product, actualChildVariants)
        );
        
        const hasVariantsCheckbox = document.getElementById('add_has_variants');
        if (hasVariantsCheckbox) {
            hasVariantsCheckbox.checked = hasVariants;
            hasVariantsCheckbox.disabled = actualChildVariants.length > 0;
            hasVariantsCheckbox.title = actualChildVariants.length > 0
                ? 'Nhóm đã có SKU con nên không thể chuyển lại thành hàng hóa đơn.'
                : '';
        }
        
        // Gọi hàm toggle UI dựa trên checkbox
        if (typeof window.toggleHasVariants === 'function') {
            window.toggleHasVariants();
        }
        const variantsListSection = document.getElementById('variantsListSection');
        const variantsListContainer = document.getElementById('variantsListContainer');
        const childVariants = actualChildVariants;
        const variantDefinitions = getParentVariantDefinitions(product, childVariants);
        
        if (childVariants.length > 0) {
            if (variantsListSection) variantsListSection.classList.remove('hidden');
            if (variantsListContainer) {
                variantsListContainer.innerHTML = childVariants.map(v => {
                    const label = deriveVariantEditorLabel({
                        variantLabel: v.variant_label,
                        productName: v.name,
                        parentName: product.name
                    });
                    const stock = (v.product_batches || []).reduce((sum, b) => sum + (Number(b.stock_quantity) || 0), 0);
                    
                    const packagingSeed = buildVariantPackagingEditorSeed(v);
                    const vRetailRaw = packagingSeed.baseRetail;
                    const vCostRaw = packagingSeed.baseCost;
                    const packagingEditorHtml = renderExistingVariantPackagingEditor(
                        v.id,
                        packagingSeed
                    );
                    const classificationFieldsHtml = renderVariantClassificationFields({
                        id: v.id,
                        definitions: variantDefinitions,
                        variant: v
                    });


                    let batchesHtml = (v.product_batches || []).map(b => `
                        <div class="flex gap-2 mb-2 inline-batch-item">
                            <input type="hidden" class="batch-id" value="${b.id}">
                            <input type="text" class="batch-name w-1/3 px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800" value="${escapeHTML(b.batch_number || b.batch_name || '')}" placeholder="Số lô">
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
                                            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Tên biến thể / SKU</label>
                                            <input type="text" id="inline_name_${v.id}" class="w-full min-h-11 px-3 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-white" value="${escapeHTML(label)}">
                                        </div>
                                        <div>
                                            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Mã SKU</label>
                                            <input type="text" id="inline_code_${v.id}" class="w-full min-h-11 px-3 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-white" value="${escapeHTML(v.product_code)}">
                                        </div>
                                        <div>
                                            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Barcode</label>
                                            <input type="text" id="inline_barcode_${v.id}" class="w-full min-h-11 px-3 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-white" value="${escapeHTML(v.barcode || '')}" placeholder="Quét hoặc nhập barcode">
                                        </div>
                                        ${classificationFieldsHtml}
                                        <div>
                                            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Giá vốn / đơn vị nhỏ nhất</label>
                                            <input type="number" id="inline_cost_${v.id}" oninput="window.updateInlinePackagingPreview('${v.id}')" class="w-full min-h-11 px-3 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-white" value="${vCostRaw}">
                                        </div>
                                        <div>
                                            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Giá bán / đơn vị nhỏ nhất</label>
                                            <input type="number" id="inline_retail_${v.id}" oninput="window.updateInlinePackagingPreview('${v.id}')" class="w-full min-h-11 px-3 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-white" value="${vRetailRaw}">
                                        </div>
                                    </div>

                                    ${packagingEditorHtml}
                                    
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
                                        <button type="button" onclick="window.cancelExistingInlineVariantDraft('${v.id}')" class="min-h-11 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-black rounded-lg hover:bg-slate-300">HỦY BỎ</button>
                                        <button type="button" data-save-inline-variant onclick="window.saveInlineVariant('${v.id}')" class="min-h-11 px-4 py-2 bg-blue-600 text-white text-[10px] font-black rounded-lg shadow-lg shadow-blue-500/30 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-wait"><i class="fa-solid fa-floppy-disk"></i> LƯU SKU</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
                childVariants.forEach(variant => {
                    const draftRoot = document.getElementById('modal_edit_' + variant.id);
                    if (draftRoot) {
                        draftRoot.dataset.initialDraft = JSON.stringify(
                            collectInlineVariantDraft(variant.id)
                        );
                    }
                });
            }
        }


        const toggleContainer = document.getElementById('statusToggleContainer');
        if (toggleContainer) toggleContainer.classList.remove('hidden');

    } else {
        titleEl.textContent = 'Thêm Hàng Hóa Mới';
        idEl.value = '';
        document.getElementById('addProductForm').reset();
        const hasVariantsCheckbox = document.getElementById('add_has_variants');
        if (hasVariantsCheckbox) {
            hasVariantsCheckbox.disabled = false;
            hasVariantsCheckbox.title = '';
        }
        generateProductCode();
        document.getElementById('add_has_batch').checked = true;

        addBatchRow(); // Thêm 1 dòng trống mặc định

        const toggleContainer = document.getElementById('statusToggleContainer');
        if (toggleContainer) toggleContainer.classList.add('hidden');
    }

    window.updateProductEntryMode?.();
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

    // Freeze background while modal is open.
    document.body.classList.add('modal-is-open');

    modal.dataset.initialProductDraft = JSON.stringify(
        collectProductFormDraft()
    );
    bindProductDraftTracking();
    refreshProductDraftStatus();
    bindProductModalKeyboard();
    if (wasHidden) {
        requestAnimationFrame(() => {
            document.getElementById('add_name')?.focus();
        });
    }
}

export function closeAddProductModal() {
    const modal = document.getElementById('addProductModal');
    modal.classList.add('hidden');
    modal.classList.remove('modal-open');
    document.body.classList.remove('overflow-hidden');
    document.body.classList.remove('modal-is-open');
    document.removeEventListener('keydown', handleProductModalKeydown);
    productModalKeyboardBound = false;
    unbindProductDraftTracking();
    const draftStatus = document.getElementById('productDraftStatus');
    draftStatus?.classList.add('hidden');
    draftStatus?.classList.remove('inline-flex');

    const focusTarget = productModalReturnFocus;
    productModalReturnFocus = null;
    if (focusTarget?.isConnected && typeof focusTarget.focus === 'function') {
        requestAnimationFrame(() => focusTarget.focus());
    }
}

export function requestCloseAddProductModal() {
    const { hasProductChanges, changedDraftCount } =
        getUnsavedProductDraftState();

    const unsavedMessage = hasProductChanges && changedDraftCount > 0
        ? `Thông tin hàng hóa và ${changedDraftCount} SKU đang có thay đổi chưa lưu.`
        : hasProductChanges
            ? 'Thông tin hàng hóa đang có thay đổi chưa lưu.'
            : changedDraftCount > 0
                ? `Có ${changedDraftCount} SKU đang có thay đổi chưa lưu.`
                : '';

    if (unsavedMessage && !window.confirm(
        `${unsavedMessage} Bạn có chắc muốn đóng cửa sổ?`
    )) {
        return false;
    }

    closeAddProductModal();
    return true;
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
window.requestCloseAddProductModal = requestCloseAddProductModal;
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
            <input type="text" class="batch-name w-1/3 min-h-11 px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800" placeholder="Tên lô">
            <input type="date" class="batch-exp w-1/3 min-h-11 px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800">
            <input type="number" class="batch-qty w-1/4 min-h-11 px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800" value="0" placeholder="SL">
            <button type="button" aria-label="Xóa lô này" onclick="this.parentElement.remove()" class="min-w-11 min-h-11 flex items-center justify-center text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-200"><i class="fa-solid fa-trash-can text-xs"></i></button>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
};

window.saveInlineVariant = async function(id, options = {}) {
    if (!window.supabase) {
        showToast('Lỗi: Chưa kết nối DB', 'error');
        return;
    }
    
    const isNew = String(id).startsWith('new_');
    const addAnother = isNew && options?.addAnother === true;
    const nameEl = document.getElementById('inline_name_' + id);
    const codeEl = document.getElementById('inline_code_' + id);
    const costEl = document.getElementById('inline_cost_' + id);
    const retailEl = document.getElementById('inline_retail_' + id);
    const concentrationEl = document.getElementById('inline_concentration_' + id);
    const dosageFormEl = document.getElementById('inline_dosage_form_' + id);
    const barcodeEl = document.getElementById('inline_barcode_' + id);
    const variantDefinitions = getVariantDefinitionsForEditor(id);
    const variantValues = collectInlineVariantValues(id, variantDefinitions);
    const classificationPayload = buildVariantClassificationPayload({
        definitions: variantDefinitions,
        values: variantValues,
        concentration: concentrationEl?.value,
        dosageForm: dosageFormEl?.value
    });
    const continuationSeed = addAnother
        ? buildVariantContinuationSeed({
            concentration: concentrationEl?.value,
            dosageForm: dosageFormEl?.value,
            variantValues: classificationPayload.variant_values,
            packagingMode: document.getElementById('inline_packaging_mode_' + id)?.value,
            baseUnitName: document.getElementById('inline_base_unit_' + id)?.value,
            innerUnitName: document.getElementById('inline_inner_unit_' + id)?.value,
            baseCost: costEl?.value,
            baseRetail: retailEl?.value
        })
        : null;
    
    if (!codeEl || !costEl || !retailEl) return;
    
    const shouldManagePackaging = isNew
        || document.getElementById('inline_manage_packaging_' + id)?.checked === true;
    let packagingPlan = null;
    if (isNew) {
        const classificationIssues = validateVariantValues(
            variantDefinitions,
            classificationPayload.variant_values
        );
        if (classificationIssues.length > 0) {
            showToast(classificationIssues[0].message, 'warning');
            document.getElementById(
                variantClassificationInputId(id, classificationIssues[0].key)
            )?.focus();
            return;
        }
    }
    if (shouldManagePackaging) {
        try {
            packagingPlan = buildPackagingPlan(buildVariantPackagingRequest({
                mode: document.getElementById('inline_packaging_mode_' + id)?.value,
                baseUnitName: document.getElementById('inline_base_unit_' + id)?.value,
                innerUnitName: document.getElementById('inline_inner_unit_' + id)?.value || 'Vỉ',
                innerCount: document.getElementById('inline_inner_count_' + id)?.value,
                basePerInner: document.getElementById('inline_base_per_inner_' + id)?.value,
                basePerPackage: document.getElementById('inline_base_per_package_' + id)?.value
            }));
        } catch (error) {
            showToast(error.message, 'warning');
            return;
        }
    }
    
    const identitySuggestion = isNew
        ? buildInlineVariantIdentitySuggestion(id, packagingPlan)
        : null;
    const generatedLabel = identitySuggestion?.suggestedLabel || '';
    const newName = nameEl?.value.trim() || generatedLabel;
    const newCode = codeEl.value.trim() || identitySuggestion?.suggestedCode || '';
    const newCost = Number(costEl.value) || 0;
    const newRetail = Number(retailEl.value) || 0;

    if (!newName) {
        showToast('Vui lòng nhập tên biến thể / SKU.', 'warning');
        nameEl?.focus();
        return;
    }

    const identityConflict = findCatalogIdentityConflict({
        productCode: newCode,
        barcode: barcodeEl?.value.trim(),
        existingProducts: window.currentProductsList || [],
        excludeProductId: isNew ? null : id
    });
    if (identityConflict) {
        showToast(identityConflict.message, 'warning');
        document.getElementById(
            identityConflict.field === 'barcode' ? 'inline_barcode_' + id : 'inline_code_' + id
        )?.focus();
        return;
    }
    
    // Parse batches
    const batchesContainer = document.getElementById('inline_batches_' + id);
    const batchItems = batchesContainer.querySelectorAll('.inline-batch-item');
    const batchesData = [];
    batchItems.forEach(item => {
        const bId = item.querySelector('.batch-id').value;
        const bName = item.querySelector('.batch-name').value.trim();
        const bExp = item.querySelector('.batch-exp').value;
        const bQty = Number(item.querySelector('.batch-qty').value) || 0;
        
        if (bName || bExp || bQty > 0 || bId) {
            batchesData.push({
                id: bId || undefined,
                batch_number: bName || 'Mặc định',
                expiry_date: bExp ? bExp + 'T00:00:00Z' : null,
                stock_quantity: bQty,
                is_tracked: true
            });
        }
    });

    const existingVariant = isNew
        ? null
        : (window.currentProductsList || []).find(
            product => String(product.id) === String(id)
        );
    try {
        assertSafeVariantBatchRemoval({
            existingBatches: existingVariant?.product_batches || [],
            nextBatches: batchesData
        });
    } catch (error) {
        showToast(error.message, 'warning');
        return;
    }

    const editor = document.getElementById('modal_edit_' + id);
    const activeSaveButton = document.activeElement?.matches?.('[data-save-inline-variant]')
        ? document.activeElement
        : null;
    const saveButton = activeSaveButton || editor?.querySelector('[data-save-inline-variant]');
    const saveButtons = Array.from(editor?.querySelectorAll('[data-save-inline-variant]') || []);
    const originalButtonHtml = saveButton?.innerHTML || '';
    saveButtons.forEach(button => {
        button.disabled = true;
    });
    if (saveButton) {
        saveButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ĐANG LƯU SKU...';
    }

    try {
        showToast(isNew ? 'Đang tạo SKU...' : 'Đang lưu SKU...', 'info');
        
        const parentId = isNew
            ? document.getElementById('add_product_id')?.value
            : existingVariant?.parent_id;
        const existingParent = (window.currentProductsList || []).find(
            product => String(product.id) === String(parentId || '')
        );
        const identityUpdate = buildExistingVariantIdentityUpdate({
            parentName: existingParent?.name,
            variantLabel: newName,
            productCode: newCode,
            barcode: barcodeEl?.value,
            concentration: classificationPayload.concentration,
            dosageForm: classificationPayload.dosage_form,
            variantValues: classificationPayload.variant_values
        });
        
        let unitRows = [];
        if (packagingPlan) {
            unitRows = buildVariantUnitRows({
                productId: existingVariant?.id || 'pending-variant',
                packagingPlan,
                baseCost: newCost,
                baseRetail: newRetail,
                existingUnits: existingVariant?.product_units || []
            });
            if (existingVariant) {
                assertSafeVariantBaseUnitChange({
                    existingUnits: existingVariant.product_units || [],
                    nextUnits: unitRows,
                    stockQuantity: (existingVariant.product_batches || []).reduce(
                        (sum, batch) => sum + Number(batch.stock_quantity || 0),
                        0
                    )
                });
            }
        }

        const baseUnit = existingVariant?.product_units?.find(unit => unit.is_base_unit)
            || existingVariant?.product_units?.find(
                unit => Number(unit.conversion_rate || 0) === 1
            )
            || existingVariant?.product_units?.[0];
        const actualVariantId = await saveProductVariantAtomic(window.supabase, {
            product_id: isNew ? null : id,
            parent_id: parentId || null,
            ...identityUpdate,
            packaging_spec: packagingPlan?.packagingSpec || null,
            manage_packaging: Boolean(packagingPlan),
            base_unit_name: baseUnit?.unit_name
                || packagingPlan?.baseUnitName
                || 'Đơn vị',
            base_cost: newCost,
            base_retail: newRetail,
            units: unitRows.map(({ product_id, cost_price, retail_price, ...unit }) => unit),
            manage_batches: true,
            batches: batchesData
        });
        
        const freshVariant = await fetchCatalogProductSnapshot(
            window.supabase,
            { id: actualVariantId }
        );
        window.currentProductsList = mergeCatalogProductSnapshot(
            window.currentProductsList || [],
            freshVariant
        );

        let parentProduct = (window.currentProductsList || []).find(
            product => String(product.id) === String(freshVariant.parent_id)
        );
        if (!parentProduct && freshVariant.parent_id) {
            parentProduct = await fetchCatalogProductSnapshot(
                window.supabase,
                { id: freshVariant.parent_id }
            );
            window.currentProductsList = mergeCatalogProductSnapshot(
                window.currentProductsList || [],
                parentProduct
            );
        }

        if (parentProduct) {
            openAddProductModal(parentProduct);
            if (addAnother) {
                window.addNewVariantInline(continuationSeed);
            }
            requestAnimationFrame(() => {
                const savedRow = document.getElementById('modal_display_' + actualVariantId);
                const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
                if (savedRow) {
                    savedRow.classList.add('ring-2', 'ring-emerald-400', 'ring-inset');
                    if (!addAnother) {
                        savedRow.scrollIntoView({
                            behavior: reduceMotion ? 'auto' : 'smooth',
                            block: 'nearest'
                        });
                    }
                    window.setTimeout(() => {
                        savedRow.classList.remove('ring-2', 'ring-emerald-400', 'ring-inset');
                    }, 2500);
                }
                if (addAnother) {
                    document.querySelector('#variantsListContainer [id^="inline_concentration_new_"]')?.focus();
                }
            });
        }

        showToast(
            addAnother
                ? 'Đã tạo SKU. Hãy nhập quy cách tiếp theo.'
                : (isNew ? 'Tạo SKU thành công!' : 'Cập nhật SKU thành công!'),
            'success'
        );
    } catch (e) {
        console.error("Error saving inline variant:", e);
        showToast('Không thể lưu SKU: ' + (e.message || 'Lỗi không xác định.'), 'error', 6000);
    } finally {
        saveButtons.forEach(button => {
            if (button.isConnected) button.disabled = false;
        });
        if (saveButton?.isConnected) {
            saveButton.innerHTML = originalButtonHtml;
        }
    }
};

window.toggleInlineEditorModal = function(id) {
    const displayEl = document.getElementById('modal_display_' + id);
    const editEl = document.getElementById('modal_edit_' + id);
    if (!displayEl || !editEl) return;
    
    if (editEl.classList.contains('hidden')) {
        editEl.classList.remove('hidden');
        window.toggleExistingVariantPackaging(id);
    } else {
        window.cancelExistingInlineVariantDraft(id);
    }
};

window.updateVariantClassificationControls = function() {
    const primary = document.getElementById('add_variant_axis_primary');
    const secondary = document.getElementById('add_variant_axis_secondary');
    const primaryCustom = document.getElementById('add_variant_axis_primary_custom');
    const secondaryCustom = document.getElementById('add_variant_axis_secondary_custom');

    primaryCustom?.classList.toggle('hidden', primary?.value !== 'custom');
    secondaryCustom?.classList.toggle('hidden', secondary?.value !== 'custom');
    if (primary?.value !== 'custom') primary.dataset.variantDefinitionKey = '';
    if (secondary?.value !== 'custom') secondary.dataset.variantDefinitionKey = '';

    if (
        primary?.value
        && primary.value !== 'custom'
        && secondary?.value === primary.value
    ) {
        secondary.value = '';
        secondaryCustom?.classList.add('hidden');
        showToast('Phân loại phụ phải khác phân loại chính.', 'info');
    }

    const labelFor = (select, custom) => {
        if (!select?.value) return '';
        if (select.value === 'custom') return custom?.value.trim() || 'Tiêu chí khác';
        return select.options[select.selectedIndex]?.text || '';
    };
    const labels = [
        labelFor(primary, primaryCustom),
        labelFor(secondary, secondaryCustom)
    ].filter(Boolean);
    const hint = document.getElementById('variantClassificationHint');
    if (hint) {
        hint.textContent = labels.length > 0
            ? `SKU con sẽ nhập theo: ${labels.join(' + ')}. Quy cách đóng gói vẫn quản lý riêng.`
            : 'Hãy chọn ít nhất một tiêu chí phân loại.';
    }
};



window.updateProductEntryMode = function() {
    const hasVariants = Boolean(document.getElementById('add_has_variants')?.checked);
    const plan = buildCatalogEntryPlan({ hasVariants });
    const parentId = document.getElementById('add_product_id')?.value || '';

    const section3 = document.getElementById('batchRowsContainer')?.closest('section');
    if (section3) {
        section3.classList.toggle('hidden', !plan.usesBatches);
    }
    
    const variantsListSection = document.getElementById('variantsListSection');
    if (variantsListSection) {
        variantsListSection.classList.toggle('hidden', !hasVariants);
    }

    const unitsSection = document.getElementById('globalUnitsSectionWrapper');
    if (unitsSection) unitsSection.classList.toggle('hidden', !plan.usesPhysicalUnits);
    const classificationSection = document.getElementById('variantClassificationSection');
    if (classificationSection) {
        classificationSection.classList.toggle('hidden', !hasVariants);
    }
    window.updateVariantClassificationControls();

    const modeNotice = document.getElementById('productEntryModeNotice');
    if (modeNotice) {
        modeNotice.classList.toggle('hidden', !hasVariants);
        const helper = modeNotice.querySelector('[data-entry-mode-helper]');
        if (helper) helper.textContent = plan.helperText;
    }

    document.getElementById('productBarcodeField')?.classList.toggle('hidden', hasVariants);
    document.querySelectorAll('.sku-specific-field').forEach(field => {
        field.classList.toggle('hidden', hasVariants);
    });

    const nameLabel = document.getElementById('productNameFieldLabel');
    if (nameLabel) nameLabel.innerHTML = hasVariants
        ? 'Tên nhóm sản phẩm <span class="text-red-500">*</span>'
        : 'Tên hàng hóa <span class="text-red-500">*</span>';
    const codeLabel = document.getElementById('productCodeFieldLabel');
    if (codeLabel) codeLabel.innerHTML = hasVariants
        ? 'Mã nhóm <span class="text-red-500">*</span>'
        : 'Mã hàng hóa <span class="text-red-500">*</span>';

    const addVariantButton = document.getElementById('addVariantInlineBtn');
    if (addVariantButton) {
        addVariantButton.disabled = !parentId;
        addVariantButton.classList.toggle('opacity-50', !parentId);
        addVariantButton.classList.toggle('cursor-not-allowed', !parentId);
        addVariantButton.innerHTML = parentId
            ? '<i class="fa-solid fa-plus"></i> Thêm SKU theo quy cách'
            : '<i class="fa-solid fa-floppy-disk"></i> Lưu nhóm trước';
    }

    const submitButton = document.querySelector('[data-action="submit-add-product"]');
    if (submitButton && !submitButton.disabled) submitButton.textContent = plan.submitLabel;

    document.querySelectorAll('#unitsContainer .unit-row').forEach(row => {
        const gridContainer = row.querySelector('.grid');
        if (!gridContainer) return;
        
        const unitNameInput = row.querySelector('.unit-name');
        const retailInput = row.querySelector('.unit-retail');
        const costInput = row.querySelector('.unit-cost');
        if (unitNameInput) unitNameInput.required = !hasVariants;
        
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

window.toggleHasVariants = window.updateProductEntryMode;

function renderExistingVariantPackagingEditor(id, seed = {}) {
    const hasPackagingStructure = Boolean(
        Number(seed.basePerPackage || 0) > 0
        || (
            Number(seed.innerCount || 0) > 0
            && Number(seed.basePerInner || 0) > 0
        )
    );
    const mode = seed.mode === 'with_inner' ? 'with_inner' : 'direct';
    const baseUnitName = seed.baseUnitName || 'Viên';
    const innerUnitName = seed.innerUnitName || 'Vỉ';
    const innerCount = Number(seed.innerCount || 10);
    const basePerInner = Number(seed.basePerInner || 5);
    const basePerPackage = Number(seed.basePerPackage || 24);
    const presetButtons = listVariantPackagingPresets().map(preset => `
        <button type="button"
                data-packaging-preset-for="${id}"
                data-packaging-preset="${preset.id}"
                onclick="window.applyVariantPackagingPreset('${id}', '${preset.id}')"
                class="min-h-11 px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 text-xs font-black hover:border-blue-500">
            ${escapeHTML(preset.label)}
        </button>
    `).join('');

    return `
        <section class="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/20 p-3">
            <label class="flex min-h-11 items-center gap-3 cursor-pointer">
                <input type="checkbox"
                       id="inline_manage_packaging_${id}"
                       ${hasPackagingStructure ? 'checked' : ''}
                       onchange="window.toggleExistingVariantPackaging('${id}')"
                       class="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500">
                <span>
                    <span class="block text-xs font-black text-blue-800 dark:text-blue-200">Quy cách và giá theo đơn vị của SKU này</span>
                    <span class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400">Giá vốn và giá bán của đơn vị tồn nhỏ nhất sẽ tự quy đổi ra Vỉ/Hộp.</span>
                </span>
            </label>

            <div id="inline_packaging_fields_${id}" class="${hasPackagingStructure ? '' : 'hidden'} mt-3 space-y-3">
                <div>
                    <p class="text-[10px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-300">Chọn nhanh quy cách</p>
                    <div class="mt-2 grid grid-cols-2 lg:grid-cols-4 gap-2">${presetButtons}</div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Đơn vị tồn nhỏ nhất</label>
                        <input type="text" id="inline_base_unit_${id}" value="${escapeHTML(baseUnitName)}"
                               oninput="window.updateInlinePackagingPreview('${id}')"
                               class="w-full min-h-11 px-3 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Kiểu đóng gói</label>
                        <select id="inline_packaging_mode_${id}" onchange="window.toggleVariantPackagingMode('${id}')"
                                class="w-full min-h-11 px-3 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                            <option value="with_inner" ${mode === 'with_inner' ? 'selected' : ''}>Hộp → Vỉ → đơn vị nhỏ</option>
                            <option value="direct" ${mode === 'direct' ? 'selected' : ''}>Hộp → đơn vị nhỏ</option>
                        </select>
                    </div>
                    <div id="inline_inner_fields_${id}" class="${mode === 'direct' ? 'hidden ' : ''}md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Đơn vị trung gian</label>
                            <input type="text" id="inline_inner_unit_${id}" value="${escapeHTML(innerUnitName)}"
                                   oninput="window.updateInlinePackagingPreview('${id}')"
                                   class="w-full min-h-11 px-3 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Số đơn vị trung gian / hộp</label>
                            <input type="number" min="1" step="1" id="inline_inner_count_${id}" value="${innerCount}"
                                   oninput="window.updateInlinePackagingPreview('${id}')"
                                   class="w-full min-h-11 px-3 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Số đơn vị nhỏ / trung gian</label>
                            <input type="number" min="1" step="1" id="inline_base_per_inner_${id}" value="${basePerInner}"
                                   oninput="window.updateInlinePackagingPreview('${id}')"
                                   class="w-full min-h-11 px-3 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                        </div>
                    </div>
                    <div id="inline_direct_fields_${id}" class="${mode === 'direct' ? '' : 'hidden '}md:col-span-2">
                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Số đơn vị nhỏ / hộp</label>
                        <input type="number" min="1" step="1" id="inline_base_per_package_${id}" value="${basePerPackage}"
                               oninput="window.updateInlinePackagingPreview('${id}')"
                               class="w-full min-h-11 px-3 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                    </div>
                </div>
                <div id="inline_packaging_preview_${id}"
                     class="w-full rounded-lg bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 px-3 py-2 text-xs font-black text-blue-700 dark:text-blue-300">
                    Đang kiểm tra quy cách...
                </div>
            </div>
        </section>
        <section id="inline_draft_review_${id}"
                 aria-live="polite"
                 aria-label="Kiểm tra SKU trước khi lưu"
                 class="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4">
            <p class="text-xs font-bold text-slate-500">Mở phần quy cách để xem giá tự quy đổi theo từng đơn vị.</p>
        </section>
    `;
}

window.toggleExistingVariantPackaging = function(id) {
    const enabled = document.getElementById('inline_manage_packaging_' + id)?.checked === true;
    document.getElementById('inline_packaging_fields_' + id)?.classList.toggle('hidden', !enabled);
    if (enabled) window.toggleVariantPackagingMode(id);
};

window.updateInlinePackagingPreview = function(id) {
    const preview = document.getElementById('inline_packaging_preview_' + id);
    if (!preview) return;
    try {
        const request = buildVariantPackagingRequest({
            mode: document.getElementById('inline_packaging_mode_' + id)?.value,
            baseUnitName: document.getElementById('inline_base_unit_' + id)?.value,
            innerUnitName: document.getElementById('inline_inner_unit_' + id)?.value || 'Vỉ',
            innerCount: document.getElementById('inline_inner_count_' + id)?.value,
            basePerInner: document.getElementById('inline_base_per_inner_' + id)?.value,
            basePerPackage: document.getElementById('inline_base_per_package_' + id)?.value
        });
        const plan = buildPackagingPlan(request);
        preview.textContent = plan.equation;
        preview.classList.remove('text-red-600', 'border-red-300');
        preview.classList.add('text-blue-700', 'border-blue-200');
        window.updateInlineVariantDraftReview(id, plan);
    } catch (error) {
        preview.textContent = error.message;
        preview.classList.remove('text-blue-700', 'border-blue-200');
        preview.classList.add('text-red-600', 'border-red-300');
        window.updateInlineVariantDraftReview(id, null, error.message);
    }
};

function buildInlineVariantIdentitySuggestion(id, packagingPlan) {
    const parentId = document.getElementById('add_product_id')?.value || '';
    const parentProduct = (window.currentProductsList || []).find(
        product => String(product.id) === String(parentId)
    );
    const definitions = getVariantDefinitionsForEditor(id);
    const values = collectInlineVariantValues(id, definitions);
    return buildVariantIdentitySuggestion({
        parentCode: parentProduct?.product_code || document.getElementById('add_code')?.value,
        parentName: parentProduct?.name || document.getElementById('add_name')?.value,
        concentration: document.getElementById('inline_concentration_' + id)?.value,
        dosageForm: document.getElementById('inline_dosage_form_' + id)?.value,
        classificationLabel: buildVariantClassificationLabel(definitions, values),
        packagingPlan,
        existingProducts: window.currentProductsList || []
    });
}

window.updateInlineVariantDraftReview = function(id, packagingPlan = null, packagingError = '') {
    const reviewContainer = document.getElementById('inline_draft_review_' + id);
    if (!reviewContainer) return;

    let plan = packagingPlan;
    let planError = packagingError;
    if (!plan && !planError) {
        try {
            plan = buildPackagingPlan(buildVariantPackagingRequest({
                mode: document.getElementById('inline_packaging_mode_' + id)?.value,
                baseUnitName: document.getElementById('inline_base_unit_' + id)?.value,
                innerUnitName: document.getElementById('inline_inner_unit_' + id)?.value || 'Vỉ',
                innerCount: document.getElementById('inline_inner_count_' + id)?.value,
                basePerInner: document.getElementById('inline_base_per_inner_' + id)?.value,
                basePerPackage: document.getElementById('inline_base_per_package_' + id)?.value
            }));
        } catch (error) {
            planError = error.message;
        }
    }

    const definitions = getVariantDefinitionsForEditor(id);
    const values = collectInlineVariantValues(id, definitions);
    const classificationLabel = buildVariantClassificationLabel(definitions, values);
    const classificationWarnings = validateVariantValues(definitions, values).map(issue => ({
        key: `missing-${issue.key}`,
        severity: 'danger',
        label: issue.message
    }));
    const review = buildVariantDraftReview({
        concentration: document.getElementById('inline_concentration_' + id)?.value,
        dosageForm: document.getElementById('inline_dosage_form_' + id)?.value,
        classificationLabel,
        productCode: document.getElementById('inline_code_' + id)?.value,
        barcode: document.getElementById('inline_barcode_' + id)?.value,
        packagingPlan: plan,
        baseCost: document.getElementById('inline_cost_' + id)?.value,
        baseRetail: document.getElementById('inline_retail_' + id)?.value
    });
    const identitySuggestion = buildInlineVariantIdentitySuggestion(id, plan);
    const codeInput = document.getElementById('inline_code_' + id);
    if (codeInput && !codeInput.value.trim()) {
        codeInput.placeholder = identitySuggestion.suggestedCode;
    }

    const allWarnings = planError
        ? [{
            key: 'invalid-packaging',
            severity: 'danger',
            label: planError
        }, ...classificationWarnings, ...review.warnings]
        : [...classificationWarnings, ...review.warnings];
    const isReady = review.isReady && classificationWarnings.length === 0 && !planError;
    const priceRows = review.unitPrices.length > 0
        ? review.unitPrices.map(unit => `
            <div class="grid grid-cols-[minmax(70px,1fr)_1fr_1fr] gap-2 items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2">
                <span class="text-xs font-black text-slate-700 dark:text-slate-200">${escapeHTML(unit.unitName)}</span>
                <span class="text-right text-xs font-bold text-amber-700 dark:text-amber-300">${formatCurrency(unit.costPrice)} vốn</span>
                <span class="text-right text-xs font-black text-emerald-700 dark:text-emerald-300">${formatCurrency(unit.retailPrice)} bán</span>
            </div>
        `).join('')
        : '<p class="text-xs font-semibold text-slate-500">Hoàn tất quy cách để xem giá theo từng đơn vị.</p>';
    const warningRows = allWarnings.length > 0
        ? allWarnings.map(warning => {
            const classes = warning.severity === 'danger'
                ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300'
                : warning.severity === 'warning'
                    ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300'
                    : 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300';
            return `<span class="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold ${classes}">
                <i class="fa-solid ${warning.severity === 'danger' ? 'fa-circle-exclamation' : warning.severity === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-info'}"></i>
                ${escapeHTML(warning.label)}
            </span>`;
        }).join('')
        : '<span class="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"><i class="fa-solid fa-circle-check"></i>Dữ liệu SKU đã đầy đủ</span>';

    reviewContainer.innerHTML = `
        <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">SKU sắp tạo</p>
                <p class="mt-1 text-sm font-black text-slate-900 dark:text-white">${escapeHTML(review.identityLabel)}</p>
                <p class="mt-1 text-xs font-bold text-blue-700 dark:text-blue-300">${escapeHTML(review.equation || planError || 'Chưa hoàn tất quy cách')}</p>
                <p class="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Mã đề xuất: <span class="font-mono font-black text-indigo-700 dark:text-indigo-300">${escapeHTML(identitySuggestion.suggestedCode)}</span></p>
            </div>
            <span class="rounded-full px-3 py-1.5 text-[10px] font-black uppercase ${isReady ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'}">
                ${isReady ? 'Có thể lưu' : 'Cần kiểm tra'}
            </span>
        </div>
        <div class="mt-3 space-y-2">${priceRows}</div>
        <div class="mt-3 flex flex-wrap gap-2">${warningRows}</div>
    `;
};

window.toggleVariantPackagingMode = function(id) {
    const mode = document.getElementById('inline_packaging_mode_' + id)?.value || 'with_inner';
    document.getElementById('inline_inner_fields_' + id)?.classList.toggle('hidden', mode === 'direct');
    document.getElementById('inline_direct_fields_' + id)?.classList.toggle('hidden', mode !== 'direct');
    window.updateInlinePackagingPreview(id);
};

window.applyVariantPackagingPreset = function(id, presetId) {
    let preset;
    try {
        preset = getVariantPackagingPreset(presetId);
    } catch (error) {
        showToast(error.message, 'warning');
        return;
    }

    const setValue = (field, value) => {
        const input = document.getElementById(field + '_' + id);
        if (input && value !== null && value !== undefined) input.value = value;
    };

    setValue('inline_packaging_mode', preset.mode);
    setValue('inline_base_unit', preset.baseUnitName);
    setValue('inline_inner_unit', preset.innerUnitName);
    setValue('inline_inner_count', preset.innerCount);
    setValue('inline_base_per_inner', preset.basePerInner);
    setValue('inline_base_per_package', preset.basePerPackage);
    window.toggleVariantPackagingMode(id);

    document.querySelectorAll(`[data-packaging-preset-for="${id}"]`).forEach(button => {
        const isSelected = button.dataset.packagingPreset === presetId;
        button.classList.toggle('bg-blue-600', isSelected);
        button.classList.toggle('text-white', isSelected);
        button.classList.toggle('border-blue-600', isSelected);
        button.classList.toggle('bg-white', !isSelected);
        button.classList.toggle('dark:bg-slate-900', !isSelected);
        button.classList.toggle('text-blue-700', !isSelected);
    });
};

function collectInlineVariantDraft(id) {
    const valueOf = field =>
        document.getElementById(field + '_' + id)?.value ?? '';
    const batchesContainer = document.getElementById('inline_batches_' + id);
    const batches = [...(batchesContainer?.querySelectorAll('.inline-batch-item') || [])]
        .map(item => ({
            batchId: item.querySelector('.batch-id')?.value || '',
            batchNumber: item.querySelector('.batch-name')?.value || '',
            expiryDate: item.querySelector('.batch-exp')?.value || '',
            quantity: item.querySelector('.batch-qty')?.value || 0
        }));

    const variantValues = {};
    document.querySelectorAll(`[data-variant-value-for="${CSS.escape(String(id))}"]`)
        .forEach(input => {
            const key = input.dataset.variantClassificationKey;
            if (key) variantValues[key] = input.value || '';
        });

    return {
        name: valueOf('inline_name'),
        productCode: valueOf('inline_code'),
        barcode: valueOf('inline_barcode'),
        concentration: valueOf('inline_concentration'),
        dosageForm: valueOf('inline_dosage_form'),
        variantValues,
        managePackaging: document.getElementById('inline_manage_packaging_' + id)?.checked ?? true,
        packagingMode: valueOf('inline_packaging_mode'),
        baseUnitName: valueOf('inline_base_unit'),
        innerUnitName: valueOf('inline_inner_unit'),
        innerCount: valueOf('inline_inner_count'),
        basePerInner: valueOf('inline_base_per_inner'),
        basePerPackage: valueOf('inline_base_per_package'),
        baseCost: valueOf('inline_cost'),
        baseRetail: valueOf('inline_retail'),
        batches
    };
}

function collectProductFormDraft() {
    const form = document.getElementById('addProductForm');
    if (!form) return [];

    return [...form.querySelectorAll('input, select, textarea')]
        .filter(control =>
            control.type !== 'file'
            && !control.closest('#variantsListContainer')
        )
        .map((control, index) => ({
            key: control.id || control.name || `control-${index}`,
            type: control.type || control.tagName.toLowerCase(),
            value: control.value,
            checked: ['checkbox', 'radio'].includes(control.type)
                ? control.checked
                : false
        }));
}

function readInitialProductFormDraft(modal) {
    try {
        return JSON.parse(modal?.dataset.initialProductDraft || '[]');
    } catch {
        return [];
    }
}

function readInlineVariantInitialDraft(draftRoot) {
    try {
        return JSON.parse(draftRoot?.dataset.initialDraft || '{}');
    } catch {
        return {};
    }
}

function restoreInlineVariantDraft(id, draft = {}) {
    const setValue = (field, value) => {
        const control = document.getElementById(field + '_' + id);
        if (control) control.value = value ?? '';
    };

    setValue('inline_name', draft.name);
    setValue('inline_code', draft.productCode);
    setValue('inline_barcode', draft.barcode);
    setValue('inline_concentration', draft.concentration);
    setValue('inline_dosage_form', draft.dosageForm);
    Object.entries(draft.variantValues || {}).forEach(([key, value]) => {
        const control = document.getElementById(
            variantClassificationInputId(id, key)
        );
        if (control) control.value = value ?? '';
    });
    const managePackagingControl = document.getElementById('inline_manage_packaging_' + id);
    if (managePackagingControl) {
        managePackagingControl.checked = draft.managePackaging !== false;
    }
    setValue('inline_packaging_mode', draft.packagingMode);
    setValue('inline_base_unit', draft.baseUnitName);
    setValue('inline_inner_unit', draft.innerUnitName);
    setValue('inline_inner_count', draft.innerCount);
    setValue('inline_base_per_inner', draft.basePerInner);
    setValue('inline_base_per_package', draft.basePerPackage);
    setValue('inline_cost', draft.baseCost);
    setValue('inline_retail', draft.baseRetail);
    window.toggleExistingVariantPackaging?.(id);

    const batchesContainer = document.getElementById('inline_batches_' + id);
    if (batchesContainer) {
        batchesContainer.innerHTML = '';
        (draft.batches || []).forEach(batch => {
            window.addInlineBatchRow(id);
            const row = batchesContainer.lastElementChild;
            if (!row) return;
            const batchIdInput = row.querySelector('.batch-id');
            const batchNameInput = row.querySelector('.batch-name');
            const batchExpiryInput = row.querySelector('.batch-exp');
            const batchQuantityInput = row.querySelector('.batch-qty');
            if (batchIdInput) batchIdInput.value = batch.batchId || '';
            if (batchNameInput) batchNameInput.value = batch.batchNumber || '';
            if (batchExpiryInput) batchExpiryInput.value = batch.expiryDate || '';
            if (batchQuantityInput) batchQuantityInput.value = batch.quantity ?? 0;
        });
    }
}

window.cancelExistingInlineVariantDraft = function(id) {
    const draftRoot = document.getElementById('modal_edit_' + id);
    if (!draftRoot) return false;

    const initialDraft = readInlineVariantInitialDraft(draftRoot);
    if (
        hasVariantDraftChanged(initialDraft, collectInlineVariantDraft(id))
        && !window.confirm('SKU này đang có thay đổi chưa lưu. Bạn có chắc muốn hủy các thay đổi?')
    ) {
        return false;
    }

    restoreInlineVariantDraft(id, initialDraft);
    draftRoot.classList.add('hidden');
    refreshProductDraftStatus();
    return true;
};

window.cancelInlineVariantDraft = function(id) {
    const draftRoot = document.getElementById('modal_edit_' + id);
    if (!draftRoot) return false;

    if (
        hasVariantDraftChanged(
            readInlineVariantInitialDraft(draftRoot),
            collectInlineVariantDraft(id)
        )
        && !window.confirm('SKU này đang có dữ liệu chưa lưu. Bạn có chắc muốn hủy bỏ?')
    ) {
        return false;
    }

    draftRoot.remove();
    refreshProductDraftStatus();
    return true;
};

window.addNewVariantInline = function(seed = null) {
    const parentId = document.getElementById('add_product_id').value;
    if (!parentId) {
        showToast('Vui lòng Lưu (F9) sản phẩm cha trước khi tạo biến thể!', 'warning');
        return;
    }
    
    const container = document.getElementById('variantsListContainer');
    if (!container) return;
    
    const tempId = 'new_' + Date.now();
    const parent = (window.currentProductsList || []).find(product =>
        String(product.id) === String(parentId)
    ) || {};
    const siblings = (window.currentProductsList || []).filter(product =>
        String(product.parent_id) === String(parentId)
    );
    const variantDefinitions = getParentVariantDefinitions(parent, siblings);
    const seededValues = normalizeVariantValues(
        variantDefinitions,
        seed?.variantValues,
        {
            concentration: seed?.concentration,
            dosage_form: seed?.dosageForm
        }
    );
    const seededClassificationLabel = buildVariantClassificationLabel(
        variantDefinitions,
        seededValues
    );
    const hasContinuationSeed = Boolean(seededClassificationLabel);
    const continuationNoticeHtml = hasContinuationSeed ? `
        <div class="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            <i class="fa-solid fa-link mr-1"></i>
            Đã giữ lại ${escapeHTML(seededClassificationLabel)} và giá theo đơn vị cơ sở. Mã SKU, barcode và lô đang để trống.
        </div>
    ` : '';
    const classificationFieldsHtml = renderVariantClassificationFields({
        id: tempId,
        definitions: variantDefinitions,
        variant: {
            variant_values: seededValues,
            concentration: seed?.concentration,
            dosage_form: seed?.dosageForm
        },
        onInput: `oninput="window.updateInlineVariantDraftReview('${tempId}')"`
    });
    const packagingPresetButtonsHtml = listVariantPackagingPresets().map(preset => `
        <button type="button"
                data-packaging-preset-for="${tempId}"
                data-packaging-preset="${preset.id}"
                onclick="window.applyVariantPackagingPreset('${tempId}', '${preset.id}')"
                class="min-h-11 px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 text-xs font-black hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500">
            ${escapeHTML(preset.label)}
        </button>
    `).join('');
    const html = `
        <div id="modal_edit_${tempId}" class="p-4 bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl shadow-inner">
            <div class="flex flex-col gap-4">
                <div class="flex items-center justify-between">
                    <h5 class="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest"><i class="fa-solid fa-sparkles"></i> THÊM BIẾN THỂ MỚI</h5>
                </div>
                ${continuationNoticeHtml}
                <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Tên biến thể</label>
                        <input type="text" id="inline_name_${tempId}" placeholder="VD: 500mg, Màu đỏ..." class="w-full min-h-11 px-3 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Mã SKU</label>
                        <input type="text" id="inline_code_${tempId}" oninput="window.updateInlineVariantDraftReview('${tempId}')" placeholder="Tự động nếu để trống" class="w-full min-h-11 px-3 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Giá Vốn</label>
                        <input type="number" id="inline_cost_${tempId}" oninput="window.updateInlineVariantDraftReview('${tempId}')" class="w-full min-h-11 px-3 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-white" value="0">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Giá Bán</label>
                        <input type="number" id="inline_retail_${tempId}" oninput="window.updateInlineVariantDraftReview('${tempId}')" class="w-full min-h-11 px-3 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-white" value="0">
                    </div>
                </div>

                <div class="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-900/20 p-3">
                    <div class="mb-4">
                        <p class="text-[10px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-300">Chọn nhanh quy cách thường dùng</p>
                        <div class="mt-2 grid grid-cols-2 lg:grid-cols-4 gap-2">
                            ${packagingPresetButtonsHtml}
                        </div>
                        <p class="mt-2 text-xs text-slate-600 dark:text-slate-400">Có thể chọn mẫu rồi chỉnh lại số vỉ hoặc số viên nếu quy cách thực tế khác.</p>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                        ${classificationFieldsHtml}
                        <div>
                            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Barcode</label>
                                <input type="text" id="inline_barcode_${tempId}" oninput="window.updateInlineVariantDraftReview('${tempId}')" placeholder="Quét hoặc nhập barcode" class="w-full min-h-11 px-3 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Đơn vị tồn nhỏ nhất</label>
                            <input type="text" id="inline_base_unit_${tempId}" value="Viên" oninput="window.updateInlinePackagingPreview('${tempId}')" class="w-full min-h-11 px-3 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Kiểu đóng gói</label>
                            <select id="inline_packaging_mode_${tempId}" onchange="window.toggleVariantPackagingMode('${tempId}')" class="w-full min-h-11 px-3 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                                <option value="with_inner">Hộp → Vỉ → Viên</option>
                                <option value="direct">Hộp → Gói/đơn vị nhỏ</option>
                            </select>
                        </div>
                        <div id="inline_inner_fields_${tempId}" class="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Đơn vị trung gian</label>
                                <input type="text" id="inline_inner_unit_${tempId}" value="Vỉ" oninput="window.updateInlinePackagingPreview('${tempId}')" class="w-full min-h-11 px-3 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                            </div>
                            <div>
                                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Số vỉ / hộp</label>
                                <input type="number" min="1" step="1" id="inline_inner_count_${tempId}" value="10" oninput="window.updateInlinePackagingPreview('${tempId}')" class="w-full min-h-11 px-3 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                            </div>
                            <div>
                                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Số viên / vỉ</label>
                                <input type="number" min="1" step="1" id="inline_base_per_inner_${tempId}" value="5" oninput="window.updateInlinePackagingPreview('${tempId}')" class="w-full min-h-11 px-3 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                            </div>
                        </div>
                        <div id="inline_direct_fields_${tempId}" class="hidden md:col-span-2">
                            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Số đơn vị nhỏ trong một hộp</label>
                            <input type="number" min="1" step="1" id="inline_base_per_package_${tempId}" value="24" oninput="window.updateInlinePackagingPreview('${tempId}')" class="w-full min-h-11 px-3 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                        </div>
                    </div>
                    <div id="inline_packaging_preview_${tempId}" class="mt-3 w-full rounded-lg bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 px-3 py-2 text-xs font-black text-blue-700 dark:text-blue-300">1 Hộp = 10 Vỉ = 50 Viên</div>
                    <p class="mt-2 text-[10px] font-semibold text-slate-500">Chọn đúng kiểu đóng gói; hệ thống sẽ tự tạo các đơn vị và hệ số quy đổi. Giá phía trên là giá của một đơn vị tồn nhỏ nhất.</p>
                </div>

                <section id="inline_draft_review_${tempId}"
                         aria-live="polite"
                         aria-label="Kiểm tra SKU trước khi lưu"
                         class="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4">
                    <p class="text-xs font-bold text-slate-500">Đang chuẩn bị bản kiểm tra SKU...</p>
                </section>
                
                <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 shadow-sm">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider"><i class="fa-solid fa-cubes-stacked"></i> Lô Hàng ban đầu</span>
                        <button type="button" onclick="window.addInlineBatchRow('${tempId}')" class="min-h-11 text-[10px] font-black px-3 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg border border-orange-200"><i class="fa-solid fa-plus"></i> Thêm Lô</button>
                    </div>
                    <div id="inline_batches_${tempId}" class="flex flex-col gap-1">
                        <!-- Empty initially or 1 default row -->
                    </div>
                </div>
                
                <div class="flex flex-wrap justify-end gap-2">
                    <button type="button" onclick="window.cancelInlineVariantDraft('${tempId}')" class="min-h-11 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-black rounded-lg hover:bg-slate-300">HỦY BỎ</button>
                    <button type="button" data-save-inline-variant onclick="window.saveInlineVariant('${tempId}', { addAnother: true })" class="min-h-11 px-4 py-2 border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 text-[10px] font-black rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 disabled:opacity-50 disabled:cursor-wait"><i class="fa-solid fa-plus"></i> LƯU & THÊM SKU TIẾP</button>
                    <button type="button" data-save-inline-variant onclick="window.saveInlineVariant('${tempId}')" class="min-h-11 px-4 py-2 bg-emerald-600 text-white text-[10px] font-black rounded-lg shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-wait"><i class="fa-solid fa-floppy-disk"></i> TẠO SKU</button>
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('afterbegin', html);
    window.addInlineBatchRow(tempId); // Add one empty batch row
    window.applyVariantPackagingPreset(tempId, 'box_10x5');
    if (seed) {
        const setSeedValue = (field, value) => {
            const input = document.getElementById(field + '_' + tempId);
            if (input && value !== null && value !== undefined) input.value = value;
        };
        setSeedValue('inline_concentration', seed.concentration);
        setSeedValue('inline_dosage_form', seed.dosageForm);
        setSeedValue('inline_packaging_mode', seed.packagingMode);
        setSeedValue('inline_base_unit', seed.baseUnitName);
        setSeedValue('inline_inner_unit', seed.innerUnitName);
        setSeedValue('inline_cost', seed.baseCost);
        setSeedValue('inline_retail', seed.baseRetail);
        variantDefinitions.forEach(definition => {
            const input = document.getElementById(
                variantClassificationInputId(tempId, definition.key)
            );
            if (input && seededValues[definition.key]) {
                input.value = seededValues[definition.key];
            }
        });
        window.toggleVariantPackagingMode(tempId);
    }
    const draftRoot = document.getElementById('modal_edit_' + tempId);
    if (draftRoot) {
        draftRoot.dataset.initialDraft = JSON.stringify(
            collectInlineVariantDraft(tempId)
        );
    }
    refreshProductDraftStatus();
    return tempId;
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
