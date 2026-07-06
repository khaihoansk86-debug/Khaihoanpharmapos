// js/features/receive/receiveController.js
import { initLayout } from '../../components/layout.js';
import { supabaseClient } from '../../core/supabase.js';
import { fetchProducts, fetchCategories, createProduct } from '../products/productService.js';
import { receiveStock, saveInventoryDocument } from '../inventory/inventoryService.js';

// DOM Elements cache
const els = {
    receiveDocCode: document.getElementById('receiveDocCode'),
    receiveSupplierSelect: document.getElementById('receiveSupplierSelect'),
    receiveDateInput: document.getElementById('receiveDateInput'),
    receiveReasonSelect: document.getElementById('receiveReasonSelect'),
    receiveNoteInput: document.getElementById('receiveNoteInput'),
    receiveProductSelect: document.getElementById('receiveProductSelect'),
    receiveUnitSelect: document.getElementById('receiveUnitSelect'),
    receiveLinesBody: document.getElementById('receiveLinesBody'),
    receiveLinesCount: document.getElementById('receiveLinesCount'),
    receiveTotalVal: document.getElementById('receiveTotalVal'),
    receivePaidInput: document.getElementById('receivePaidInput'),
    receiveDebtInput: document.getElementById('receiveDebtInput'),
    submitReceiveDocBtn: document.getElementById('submitReceiveDocBtn'),

    // Quick Supplier Modal
    quickSupplierBtn: document.getElementById('quickAddSupplierBtn'),
    quickSupplierModal: document.getElementById('quickSupplierModal'),
    quickSupplierForm: document.getElementById('quickSupplierForm'),
    quickSupplierName: document.getElementById('quickSupplierName'),
    quickSupplierPhone: document.getElementById('quickSupplierPhone'),
    quickSupplierLink: document.getElementById('quickSupplierLink'),
    closeSupplierModalBtn: document.getElementById('closeSupplierModalBtn'),
    cancelSupplierModalBtn: document.getElementById('cancelSupplierModalBtn'),

    // Quick Product Modal
    quickProductBtn: document.getElementById('quickAddProductBtn'),
    quickProductModal: document.getElementById('quickProductModal'),
    quickProductForm: document.getElementById('quickProductForm'),
    quickProductCode: document.getElementById('quickProductCode'),
    quickProductName: document.getElementById('quickProductName'),
    quickProductCategory: document.getElementById('quickProductCategory'),
    closeProductModalBtn: document.getElementById('closeProductModalBtn'),
    cancelProductModalBtn: document.getElementById('cancelProductModalBtn')
};

// Global state
let activeProducts = [];
let activeSuppliers = [];
let receiveLines = [];
let lastEditedField = null; // 'paid' or 'debt'

const DRAFT_KEY = 'khaihoan_receive_draft';
let draftSaveTimeout = null;

function saveDraft() {
    clearTimeout(draftSaveTimeout);
    draftSaveTimeout = setTimeout(() => {
        const draftData = {
            timestamp: Date.now(),
            supplierId: els.receiveSupplierSelect.value,
            date: els.receiveDateInput.value,
            reason: els.receiveReasonSelect.value,
            note: els.receiveNoteInput.value,
            paidAmount: els.receivePaidInput ? els.receivePaidInput.value : '',
            lines: receiveLines
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
    }, 1000);
}

function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
}

async function restoreDraft() {
    const draftJson = localStorage.getItem(DRAFT_KEY);
    if (!draftJson) return;
    try {
        const draftData = JSON.parse(draftJson);
        const ageHours = (Date.now() - draftData.timestamp) / (1000 * 60 * 60);
        if (ageHours <= 48) {
            const wantToContinue = confirm('Bạn có một phiếu NHẬP HÀNG CHƯA HOÀN THÀNH.\n\nBấm [OK] để TIẾP TỤC làm phiếu này.\nBấm [Cancel / Hủy] để XÓA bản nháp và làm phiếu mới.');
            if (wantToContinue) {
                if (draftData.supplierId) els.receiveSupplierSelect.value = draftData.supplierId;
                if (draftData.date) els.receiveDateInput.value = draftData.date;
                if (draftData.reason) els.receiveReasonSelect.value = draftData.reason;
                if (draftData.note) els.receiveNoteInput.value = draftData.note;
                if (draftData.paidAmount && els.receivePaidInput) {
                    els.receivePaidInput.value = draftData.paidAmount;
                    lastEditedField = 'paid';
                }
                if (draftData.lines && Array.isArray(draftData.lines)) {
                    receiveLines = draftData.lines;
                }
                renderLines();
            } else {
                clearDraft();
            }
        } else {
            clearDraft();
        }
    } catch(e) {}
}

// Helper to escape HTML safely
function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Format numbers to currency (VND)
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// Remove Vietnamese diacritics / tones
function removeVietnameseTones(str) {
    if (!str) return '';
    return String(str).normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '')
                      .replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

function getProductDescriptionFlags(product) {
    if (!product?.description) return {};
    try {
        const parsed = JSON.parse(product.description);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
        return {};
    }
}

function isDoseCategoryProduct(product) {
    const categoryName = removeVietnameseTones(product?.product_categories?.name || '').toLowerCase();
    return categoryName.includes('cat lieu') || categoryName.includes('thuoc lieu');
}

function isDoseRetailProduct(product) {
    const flags = getProductDescriptionFlags(product);
    if (flags.is_dose_retail === true) return true;

    const productCode = String(product?.product_code || '').toUpperCase();
    if (productCode.startsWith('DOSE-')) return true;

    const normalizedName = removeVietnameseTones(product?.name || '').toUpperCase();
    const baseUnit = product?.product_units?.find(unit => unit.is_base_unit) || product?.product_units?.[0] || {};
    return normalizedName.includes('THUOC LIEU') && Number(baseUnit.retail_price || 0) > 0;
}

function isDoseIngredientProduct(product) {
    if (isDoseRetailProduct(product)) return false;
    const flags = getProductDescriptionFlags(product);
    return flags.is_dose_cut === true || isDoseCategoryProduct(product);
}

function getReceiveProductType(product) {
    if (isDoseIngredientProduct(product)) {
        return {
            key: 'dose_ingredient',
            label: 'Nguyên liệu thuốc liều',
            badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800'
        };
    }

    return {
        key: 'retail',
        label: 'Hàng hóa bán lẻ',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800'
    };
}

// Generate automatic purchase document code
function generateDocCode() {
    const today = new Date();
    const dateStr = today.getFullYear().toString() +
        (today.getMonth() + 1).toString().padStart(2, '0') +
        today.getDate().toString().padStart(2, '0');
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `PN-${dateStr}-${rand}`;
}

// Initialize Page Data
async function initPage() {
    initLayout('admin', 'inventory');

    // Default dates
    els.receiveDateInput.value = new Date().toISOString().substring(0, 10);
    els.receiveDocCode.value = generateDocCode();

    await loadSuppliers();
    await loadProducts();
    await loadCategoriesForQuickProduct();

    bindEvents();
    
    await restoreDraft();
    if (receiveLines.length === 0) {
        handleQueryParameters();
    }
}

// Load Suppliers from Supabase
async function loadSuppliers(selectedId = '') {
    if (!supabaseClient) return;
    try {
        const { data, error } = await supabaseClient
            .from('suppliers')
            .select('*')
            .eq('is_active', true)
            .order('name');
        
        if (error) throw error;
        activeSuppliers = data || [];

        els.receiveSupplierSelect.innerHTML = '<option value="">-- Chọn nhà cung cấp --</option>' +
            activeSuppliers.map(s => `<option value="${s.id}" ${s.id === selectedId ? 'selected' : ''}>${escapeHTML(s.name)} ${s.contact_info ? `(${s.contact_info})` : ''}</option>`).join('');
    } catch (err) {
        console.error('Lỗi tải danh mục nhà cung cấp:', err);
    }
}

// Load stock-managed products, including dose ingredients.
// Combo and virtual dose-retail packages are not physical purchase items.
async function loadProducts(selectedId = '') {
    try {
        const allProducts = await fetchProducts();
        activeProducts = allProducts.filter(p => {
            const catName = p.product_categories?.name || '';
            const isCombo = catName.toLowerCase().includes('combo');
            return !isCombo && !isDoseRetailProduct(p);
        });

        activeProducts.sort((a, b) => a.name.localeCompare(b.name, 'vi'));

        els.receiveProductSelect.innerHTML = '<option value="">-- Chọn sản phẩm/biệt dược --</option>' +
            activeProducts.map(p => {
                const productType = getReceiveProductType(p);
                return `<option value="${p.id}" ${p.id === selectedId ? 'selected' : ''}>${escapeHTML(p.name)} - ${escapeHTML(p.product_code)} [${productType.label}]</option>`;
            }).join('');
        
        if (selectedId) {
            handleProductChange();
        }
    } catch (err) {
        console.error('Lỗi tải danh sách sản phẩm:', err);
    }
}

// Load Categories for quick product creation (filter out Combos & Doses)
async function loadCategoriesForQuickProduct() {
    try {
        const cats = await fetchCategories();
        const physicalCats = cats.filter(c => {
            const name = c.name || '';
            return !name.toLowerCase().includes('combo') && !name.toLowerCase().includes('cắt liều') && !name.toLowerCase().includes('thuốc liều');
        });

        els.quickProductCategory.innerHTML = '<option value="">-- Chọn nhóm hàng --</option>' +
            physicalCats.map(c => `<option value="${c.id}">${escapeHTML(c.name)}</option>`).join('');
    } catch (err) {
        console.error('Lỗi tải danh mục hàng hóa:', err);
    }
}

// Handle Query Parameters from inventory redirect
function handleQueryParameters() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('productId');
    const batchNumber = params.get('batchNumber') || '';
    const expiryDate = params.get('expiryDate') || '';
    const costPrice = params.get('costPrice') ? Number(params.get('costPrice')) : null;

    if (productId) {
        const product = activeProducts.find(p => p.id === productId);
        if (product) {
            const baseUnit = product.product_units?.find(u => u.is_base_unit) || product.product_units?.[0];
            const uId = baseUnit ? baseUnit.id : '';
            const rate = baseUnit ? Number(baseUnit.conversion_rate || 1) : 1;
            const defaultCost = costPrice !== null ? costPrice : (baseUnit ? Number(baseUnit.cost_price || 0) : 0);

            const line = {
                id: Math.random().toString(36).substring(2, 9),
                productId,
                productName: product.name,
                productCode: product.product_code,
                productType: getReceiveProductType(product),
                unitId: uId,
                unitName: baseUnit ? baseUnit.unit_name : '',
                conversionRate: rate,
                batchNumber: batchNumber,
                expiryDate: expiryDate,
                quantity: 1,
                costPrice: defaultCost,
                subtotal: 1 * defaultCost,
                quantityBase: 1 * rate,
                costPriceBase: defaultCost / rate
            };

            receiveLines.push(line);
            renderLines();

            // Focus the batch or quantity input of the newly added line
            setTimeout(() => {
                const tr = els.receiveLinesBody.querySelector(`tr[data-id="${line.id}"]`);
                if (tr) {
                    const focusInput = batchNumber ? tr.querySelector('.line-qty') : tr.querySelector('.line-batch');
                    if (focusInput) {
                        focusInput.focus();
                        focusInput.select();
                    }
                }
            }, 100);
        }
    }
}

// Render the search results and unit quick-select options
function renderSearchResults(query) {
    const searchResultsDiv = document.getElementById('receiveSearchResults');
    if (!searchResultsDiv) return;

    const normalizedQuery = removeVietnameseTones(query).trim().toLowerCase();

    const matches = activeProducts.filter(p => {
        const nameNorm = removeVietnameseTones(p.name || '').toLowerCase();
        const codeNorm = removeVietnameseTones(p.product_code || '').toLowerCase();
        return nameNorm.includes(normalizedQuery) || codeNorm.includes(normalizedQuery);
    }).slice(0, 10);

    if (matches.length === 0) {
        searchResultsDiv.innerHTML = `
            <div class="p-3 text-center text-xs font-bold text-slate-400 dark:text-slate-500">
                <i class="fa-solid fa-face-frown mb-1 block text-lg"></i>
                Không tìm thấy mặt hàng nào phù hợp
            </div>
        `;
        searchResultsDiv.classList.remove('hidden');
        return;
    }

    let html = '';
    matches.forEach(product => {
        const units = product.product_units || [];
        const productType = getReceiveProductType(product);
        
        let unitButtonsHtml = '';
        units.forEach(u => {
            unitButtonsHtml += `
                <button type="button" 
                        data-action="select-unit-btn"
                        data-product-id="${product.id}"
                        data-unit-id="${u.id}"
                        class="px-2.5 py-1 text-[10px] font-black rounded-lg bg-blue-50 hover:bg-blue-600 dark:bg-slate-800 dark:hover:bg-blue-600 text-blue-700 dark:text-slate-300 hover:text-white dark:hover:text-white border border-blue-200 dark:border-slate-750 ">
                    ${escapeHTML(u.unit_name)} (x${u.conversion_rate})
                </button>
            `;
        });

        html += `
            <div class="p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl ">
                <div>
                    <div class="flex flex-wrap items-center gap-1.5">
                        <span class="text-xs font-black text-slate-800 dark:text-slate-200">${escapeHTML(product.name)}</span>
                        <span class="inline-flex px-2 py-1 rounded-lg border text-[11px] font-bold leading-none ${productType.badgeClass}">
                            ${productType.label}
                        </span>
                    </div>
                    <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mt-0.5">${escapeHTML(product.product_code)}</span>
                </div>
                <div class="flex flex-wrap gap-1.5">
                    ${unitButtonsHtml || '<span class="text-[10px] text-rose-500 font-bold">Chưa cấu hình ĐVT</span>'}
                </div>
            </div>
        `;
    });

    searchResultsDiv.innerHTML = html;
    searchResultsDiv.classList.remove('hidden');

    // Bind clicks to buttons
    const unitBtns = searchResultsDiv.querySelectorAll('[data-action="select-unit-btn"]');
    unitBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const prodId = btn.dataset.productId;
            const uId = btn.dataset.unitId;

            selectProductAndUnit(prodId, uId);
        });
    });
}

// Select product and unit, close search, immediately add to lines, and focus batch input
function selectProductAndUnit(prodId, uId) {
    const product = activeProducts.find(p => p.id === prodId);
    if (!product) return;

    const units = product.product_units || [];
    const selectedUnit = units.find(u => u.id === uId);
    if (!selectedUnit) return;

    const rate = Number(selectedUnit.conversion_rate || 1);
    const defaultCost = Number(selectedUnit.cost_price || 0);

    const line = {
        id: Math.random().toString(36).substring(2, 9),
        productId: prodId,
        productName: product.name,
        productCode: product.product_code,
        productType: getReceiveProductType(product),
        unitId: uId,
        unitName: selectedUnit.unit_name,
        conversionRate: rate,
        batchNumber: '',
        expiryDate: '',
        quantity: 1, // Default quantity
        costPrice: defaultCost, // Default cost price
        subtotal: 1 * defaultCost,
        quantityBase: 1 * rate,
        costPriceBase: defaultCost / rate
    };

    receiveLines.push(line);
    renderLines();
    saveDraft();

    // Clear search input and hide suggestions
    const productSearchInput = document.getElementById('receiveProductSearch');
    if (productSearchInput) {
        productSearchInput.value = '';
    }
    const searchResultsDiv = document.getElementById('receiveSearchResults');
    if (searchResultsDiv) {
        searchResultsDiv.classList.add('hidden');
    }

    // Focus the batch input of the newly added line
    setTimeout(() => {
        const tr = els.receiveLinesBody.querySelector(`tr[data-id="${line.id}"]`);
        if (tr) {
            const batchInput = tr.querySelector('.line-batch');
            if (batchInput) {
                batchInput.focus();
            }
        }
    }, 50);
}

// Render lines in the draft table with editable inputs
function renderLines() {
    if (receiveLines.length === 0) {
        els.receiveLinesBody.innerHTML = `
            <tr>
                <td colspan="7" class="py-12 text-center text-slate-400 font-semibold flex-col gap-2">
                    <i class="fa-solid fa-boxes-packing text-4xl mb-3 opacity-30 block"></i>
                    Chưa có mặt hàng nào trong phiếu nhập.
                </td>
            </tr>
        `;
        els.receiveLinesCount.textContent = '0 mặt hàng';
        els.receiveTotalVal.textContent = formatCurrency(0);
        return;
    }

    let total = 0;
    els.receiveLinesBody.innerHTML = receiveLines.map((line, idx) => {
        total += line.subtotal;
        const productType = line.productType || {
            label: 'Hàng hóa bán lẻ',
            badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800'
        };
        return `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40" data-id="${line.id}">
                <td class="py-3.5 px-5 font-bold">
                    <div class="flex flex-wrap items-center gap-1.5">
                        <span>${escapeHTML(line.productName)}</span>
                        <span class="inline-flex px-2 py-1 rounded-lg border text-[11px] font-bold leading-none ${productType.badgeClass}">
                            ${productType.label}
                        </span>
                    </div>
                    <span class="text-xs text-slate-400 block">${escapeHTML(line.productCode)}</span>
                </td>
                <td class="py-3.5 px-5">
                    <div class="flex flex-col gap-1.5 w-full max-w-[160px]">
                        <input type="text" 
                               class="line-batch w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded uppercase font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none" 
                               value="${escapeHTML(line.batchNumber)}" 
                               placeholder="Mã lô" 
                               data-id="${line.id}">
                        <input type="date" 
                               class="line-expiry w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded font-semibold text-slate-750 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none [color-scheme:light] dark:[color-scheme:dark]" 
                               value="${line.expiryDate}" 
                               data-id="${line.id}">
                    </div>
                </td>
                <td class="py-3.5 px-5 text-right">
                    <div class="flex justify-end">
                        <input type="number" 
                               class="line-qty w-20 px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded text-right font-black text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none" 
                               value="${line.quantity}" 
                               min="1" 
                               step="1" 
                               data-id="${line.id}">
                    </div>
                </td>
                <td class="py-3.5 px-5 text-right font-bold text-slate-500 dark:text-slate-400">${escapeHTML(line.unitName)}</td>
                <td class="py-3.5 px-5 text-right">
                    <div class="flex justify-end">
                        <input type="number" 
                               class="line-cost w-28 px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded text-right font-semibold text-slate-850 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                               value="${line.costPrice}" 
                               min="0" 
                               step="100" 
                               data-id="${line.id}">
                    </div>
                </td>
                <td class="py-3.5 px-5 text-right font-bold text-slate-800 dark:text-white line-subtotal-text">${formatCurrency(line.subtotal)}</td>
                <td class="py-3.5 px-5 text-center">
                    <button type="button" data-action="remove-line" data-id="${line.id}" class="w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 flex items-center justify-center mx-auto"><i class="fa-solid fa-trash-can"></i></button>
                </td>
            </tr>
        `;
    }).join('');

    els.receiveLinesCount.textContent = `${receiveLines.length} mặt hàng`;
    updateOverallTotal();
}

// Reset the line input card
function resetLineInputs() {
    const productSearchInput = document.getElementById('receiveProductSearch');
    if (productSearchInput) productSearchInput.value = '';
    
    const productIndicatorSpan = document.getElementById('selectedProductIndicator');
    if (productIndicatorSpan) {
        productIndicatorSpan.textContent = '';
        productIndicatorSpan.classList.add('hidden');
    }
}

// Save complete Intake Slip to Supabase
async function submitReceiveDocument() {
    if (receiveLines.length === 0) {
        alert('Vui lòng thêm ít nhất một mặt hàng vào phiếu nhập hàng.');
        return;
    }

    const supplierId = els.receiveSupplierSelect.value;
    if (!supplierId) {
        alert('Vui lòng chọn Nhà cung cấp.');
        return;
    }

    // Validation loop for inline inputs
    for (let i = 0; i < receiveLines.length; i++) {
        const line = receiveLines[i];
        if (!line.batchNumber.trim()) {
            alert(`Vui lòng nhập mã lô cho mặt hàng "${line.productName}".`);
            const tr = els.receiveLinesBody.querySelector(`tr[data-id="${line.id}"]`);
            if (tr) {
                const input = tr.querySelector('.line-batch');
                if (input) {
                    input.focus();
                    input.select();
                }
            }
            return;
        }
        if (!line.expiryDate) {
            alert(`Vui lòng nhập hạn dùng cho lô sản phẩm "${line.productName}".`);
            const tr = els.receiveLinesBody.querySelector(`tr[data-id="${line.id}"]`);
            if (tr) {
                const input = tr.querySelector('.line-expiry');
                if (input) {
                    input.focus();
                }
            }
            return;
        }
        if (line.quantity <= 0) {
            alert(`Số lượng nhập của mặt hàng "${line.productName}" phải lớn hơn 0.`);
            const tr = els.receiveLinesBody.querySelector(`tr[data-id="${line.id}"]`);
            if (tr) {
                const input = tr.querySelector('.line-qty');
                if (input) {
                    input.focus();
                    input.select();
                }
            }
            return;
        }
        if (line.costPrice < 0) {
            alert(`Giá vốn nhập của mặt hàng "${line.productName}" không được nhỏ hơn 0.`);
            const tr = els.receiveLinesBody.querySelector(`tr[data-id="${line.id}"]`);
            if (tr) {
                const input = tr.querySelector('.line-cost');
                if (input) {
                    input.focus();
                    input.select();
                }
            }
            return;
        }
    }

    els.submitReceiveDocBtn.disabled = true;
    els.submitReceiveDocBtn.innerHTML = '<i class="fa-solid fa-circle-notch animate-spin"></i> Đang ghi kho...';

    try {
        // 1. Save Document header and lines
        const linesPayload = receiveLines.map(line => ({
            productId: line.productId,
            batchNumber: line.batchNumber,
            expiryDate: line.expiryDate,
            quantity: line.quantityBase,
            costPrice: line.costPriceBase,
            reason: els.receiveReasonSelect.value
        }));

        const paidAmount = els.receivePaidInput ? Number(els.receivePaidInput.value || 0) : 0;
        const debtAmount = els.receiveDebtInput ? Number(els.receiveDebtInput.value || 0) : 0;
        const totalAmount = receiveLines.reduce((sum, line) => sum + (line.quantityBase * line.costPriceBase), 0);

        const documentId = await saveInventoryDocument({
            documentType: 'purchase',
            note: els.receiveNoteInput.value,
            lines: linesPayload,
            supplier_id: supplierId,
            total_amount: totalAmount,
            paid_amount: paidAmount,
            debt_amount: debtAmount
        });

        // Tự động gán nhà cung cấp mặc định cho các sản phẩm chưa có NCC
        if (supabaseClient && supplierId) {
            try {
                const productIds = receiveLines.map(line => line.productId).filter(Boolean);
                if (productIds.length > 0) {
                    await supabaseClient
                        .from('products')
                        .update({ supplier_id: supplierId })
                        .in('id', productIds)
                        .is('supplier_id', null);
                }
            } catch (updateErr) {
                console.warn('Lỗi khi tự động cập nhật nhà cung cấp mặc định:', updateErr.message);
            }
        }

        // 2. Perform inventory receipt additions
        for (const line of receiveLines) {
            await receiveStock({
                productId: line.productId,
                batchNumber: line.batchNumber,
                expiryDate: line.expiryDate,
                quantity: line.quantityBase,
                costPrice: line.costPriceBase,
                reason: els.receiveReasonSelect.value,
                note: els.receiveNoteInput.value
            });
        }

        clearDraft();
        alert('Xác nhận nhập kho thành công!');
        window.location.href = 'inventory.html';
    } catch (err) {
        console.error('Lỗi khi lập phiếu nhập kho:', err);
        alert(`Lập phiếu nhập thất bại: ${err.message}`);
        els.submitReceiveDocBtn.disabled = false;
        els.submitReceiveDocBtn.innerHTML = '<i class="fa-solid fa-check-double"></i> Xác nhận nhập kho';
    }
}

// Update overall total slip value
function updateOverallTotal() {
    let total = 0;
    receiveLines.forEach(line => {
        total += line.subtotal;
    });
    els.receiveTotalVal.textContent = formatCurrency(total);

    if (els.receivePaidInput && els.receiveDebtInput) {
        if (!lastEditedField) {
            els.receivePaidInput.value = total;
            els.receiveDebtInput.value = 0;
        } else if (lastEditedField === 'paid') {
            let paid = Number(els.receivePaidInput.value || 0);
            if (paid > total) {
                paid = total;
                els.receivePaidInput.value = total;
            }
            els.receiveDebtInput.value = Math.max(0, total - paid);
        } else if (lastEditedField === 'debt') {
            let debt = Number(els.receiveDebtInput.value || 0);
            if (debt > total) {
                debt = total;
                els.receiveDebtInput.value = total;
            }
            els.receivePaidInput.value = Math.max(0, total - debt);
        }
    }
}

// Bind Page and Modal Events
function bindEvents() {
    els.submitReceiveDocBtn.addEventListener('click', submitReceiveDocument);

    // Save draft on header input changes
    els.receiveSupplierSelect?.addEventListener('change', saveDraft);
    els.receiveDateInput?.addEventListener('change', saveDraft);
    els.receiveReasonSelect?.addEventListener('change', saveDraft);
    els.receiveNoteInput?.addEventListener('input', saveDraft);

    if (els.receivePaidInput && els.receiveDebtInput) {
        els.receivePaidInput.addEventListener('input', () => {
            const valStr = els.receivePaidInput.value;
            let total = receiveLines.reduce((sum, line) => sum + line.subtotal, 0);

            if (valStr === '') {
                lastEditedField = null;
                els.receivePaidInput.value = total;
                els.receiveDebtInput.value = 0;
            } else {
                lastEditedField = 'paid';
                let paid = Number(valStr || 0);
                if (paid > total) {
                    paid = total;
                    els.receivePaidInput.value = total;
                }
                els.receiveDebtInput.value = Math.max(0, total - paid);
            }
            saveDraft();
        });

        els.receiveDebtInput.addEventListener('input', () => {
            const valStr = els.receiveDebtInput.value;
            let total = receiveLines.reduce((sum, line) => sum + line.subtotal, 0);

            if (valStr === '') {
                lastEditedField = null;
                els.receivePaidInput.value = total;
                els.receiveDebtInput.value = 0;
            } else {
                lastEditedField = 'debt';
                let debt = Number(valStr || 0);
                if (debt > total) {
                    debt = total;
                    els.receiveDebtInput.value = total;
                }
                els.receivePaidInput.value = Math.max(0, total - debt);
            }
            saveDraft();
        });
    }

    // Live search suggestions binding
    const productSearchInput = document.getElementById('receiveProductSearch');
    const searchResultsDiv = document.getElementById('receiveSearchResults');

    if (productSearchInput && searchResultsDiv) {
        // Hide list when clicking outside
        document.addEventListener('click', (e) => {
            if (!productSearchInput.contains(e.target) && !searchResultsDiv.contains(e.target)) {
                searchResultsDiv.classList.add('hidden');
            }
        });

        productSearchInput.addEventListener('focus', () => {
            const query = productSearchInput.value.trim().toLowerCase();
            if (query.length >= 2) {
                renderSearchResults(query);
            }
        });

        let receiveSearchTimeout;
        productSearchInput.addEventListener('input', (e) => {
            clearTimeout(receiveSearchTimeout);
            receiveSearchTimeout = setTimeout(() => {
                const query = e.target.value.trim().toLowerCase();
                if (query.length < 2) {
                    searchResultsDiv.classList.add('hidden');
                    return;
                }
                renderSearchResults(query);
            }, 300);
        });
    }

    // Draft list events: Remove line and Edit line inline
    els.receiveLinesBody.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action="remove-line"]');
        if (!btn) return;
        const id = btn.dataset.id;
        receiveLines = receiveLines.filter(line => line.id !== id);
        renderLines();
        saveDraft();
    });

    els.receiveLinesBody.addEventListener('input', (e) => {
        const input = e.target;
        const lineId = input.dataset.id;
        if (!lineId) return;

        const line = receiveLines.find(l => l.id === lineId);
        if (!line) return;

        if (input.classList.contains('line-batch')) {
            line.batchNumber = input.value.trim().toUpperCase();
        } else if (input.classList.contains('line-expiry')) {
            line.expiryDate = input.value;
        } else if (input.classList.contains('line-qty')) {
            line.quantity = Number(input.value || 0);
            line.subtotal = line.quantity * line.costPrice;
            line.quantityBase = line.quantity * line.conversionRate;

            const tr = input.closest('tr');
            const subtotalText = tr.querySelector('.line-subtotal-text');
            if (subtotalText) {
                subtotalText.textContent = formatCurrency(line.subtotal);
            }
            updateOverallTotal();
        } else if (input.classList.contains('line-cost')) {
            line.costPrice = Number(input.value || 0);
            line.subtotal = line.quantity * line.costPrice;
            line.costPriceBase = line.costPrice / line.conversionRate;

            const tr = input.closest('tr');
            const subtotalText = tr.querySelector('.line-subtotal-text');
            if (subtotalText) {
                subtotalText.textContent = formatCurrency(line.subtotal);
            }
            updateOverallTotal();
        }
        saveDraft();
    });

    // Supplier quick add events
    els.quickSupplierBtn.addEventListener('click', () => {
        els.quickSupplierForm.reset();
        els.quickSupplierModal.classList.remove('hidden');
    });

    const closeSupplierModal = () => els.quickSupplierModal.classList.add('hidden');
    els.closeSupplierModalBtn.addEventListener('click', closeSupplierModal);
    els.cancelSupplierModalBtn.addEventListener('click', closeSupplierModal);

    els.quickSupplierForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = els.quickSupplierName.value.trim();
        const phone = els.quickSupplierPhone.value.trim();
        const link = els.quickSupplierLink.value.trim();

        if (!supabaseClient) return;
        try {
            const payload = {
                name,
                contact_type: 'phone',
                contact_info: phone,
                note: link || null,
                is_active: true
            };

            const { data, error } = await supabaseClient
                .from('suppliers')
                .insert([payload])
                .select()
                .single();

            if (error) throw error;
            alert('Thêm nhà cung cấp mới thành công!');
            closeSupplierModal();
            await loadSuppliers(data.id);
        } catch (err) {
            console.error(err);
            alert(`Lỗi: ${err.message}`);
        }
    });

    // Product quick add events
    const closeProductModal = () => els.quickProductModal.classList.add('hidden');
    els.closeProductModalBtn.addEventListener('click', closeProductModal);
    els.cancelProductModalBtn.addEventListener('click', closeProductModal);

    els.quickProductBtn.addEventListener('click', () => {
        els.quickProductForm.reset();
        
        // Clear conversion units
        const unitsContainer = document.getElementById('quickProductUnitsContainer');
        if (unitsContainer) {
            const extraUnits = unitsContainer.querySelectorAll('.unit-row:not(:first-child)');
            extraUnits.forEach(row => row.remove());
        }

        generateQuickProductCode();
        document.getElementById('quickProductHasBatch').checked = true;
        els.quickProductModal.classList.remove('hidden');
    });

    // Auto code generation button
    const genCodeBtn = document.getElementById('quickProductGenCodeBtn');
    if (genCodeBtn) {
        genCodeBtn.addEventListener('click', generateQuickProductCode);
    }

    // Add conversion unit button
    const addUnitBtn = document.getElementById('quickProductAddUnitBtn');
    if (addUnitBtn) {
        addUnitBtn.addEventListener('click', addQuickProductConversionUnit);
    }

    // Submit quick product creation
    els.quickProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const product_code = els.quickProductCode.value.trim().toUpperCase();
        const name = els.quickProductName.value.trim();
        const category_id = els.quickProductCategory.value;
        const barcode = document.getElementById('quickProductBarcode').value.trim() || null;
        
        const active_ingredient = document.getElementById('quickProductActiveIngredient').value.trim() || null;
        const registration_no = document.getElementById('quickProductRegNo').value.trim() || null;
        const concentration = document.getElementById('quickProductConcentration').value.trim() || null;
        const route_of_admin = document.getElementById('quickProductRoute').value.trim() || null;
        const packaging_spec = document.getElementById('quickProductPackaging').value.trim() || null;
        const manufacturer = document.getElementById('quickProductManufacturer').value.trim() || null;
        const is_tracked = document.getElementById('quickProductHasBatch').checked;

        if (!product_code || !name || !category_id) {
            alert('Vui lòng điền đầy đủ các thông tin bắt buộc (*)');
            return;
        }

        // Get units
        const unitsContainer = document.getElementById('quickProductUnitsContainer');
        const unitRows = unitsContainer.querySelectorAll('.unit-row');
        const unitsData = [];

        unitRows.forEach((row, index) => {
            const unit_name = row.querySelector('input[name="unit_name"]').value.trim();
            const retail_price = Number(row.querySelector('input[name="retail_price"]').value || 0);
            const cost_price = Number(row.querySelector('input[name="cost_price"]').value || 0);
            const conversion_rate = Number(row.querySelector('.unit-conversion').value || 1);
            const is_base_unit = index === 0;

            unitsData.push({
                unit_name,
                retail_price,
                cost_price,
                conversion_rate,
                is_base_unit
            });
        });

        if (unitsData.length === 0 || !unitsData[0].unit_name) {
            alert('Vui lòng nhập đơn vị cơ bản!');
            return;
        }

        const productPayload = {
            product_code,
            name,
            category_id,
            barcode,
            active_ingredient,
            registration_no,
            concentration,
            route_of_admin,
            packaging_spec,
            manufacturer,
            is_active: true
        };

        const batchPayload = is_tracked ? [] : null;

        try {
            await createProduct(productPayload, unitsData, batchPayload);
            alert('Đăng ký mặt hàng mới thành công!');
            closeProductModal();

            // Fetch list from Supabase and select the product
            await loadProducts();
            
            // Auto select product by code
            const found = activeProducts.find(p => p.product_code === product_code);
            if (found) {
                const baseUnitId = found.product_units?.find(u => u.is_base_unit)?.id || found.product_units?.[0]?.id || '';
                selectProductAndUnit(found.id, baseUnitId);
            }
        } catch (err) {
            console.error(err);
            alert(`Lỗi: ${err.message}`);
        }
    });

    const quickSubmitBtn = document.getElementById('quickProductSubmitBtn');
    if (quickSubmitBtn) {
        quickSubmitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            els.quickProductForm.requestSubmit();
        });
    }
}

// Function to add a conversion unit row to the quick add modal
function addQuickProductConversionUnit() {
    const container = document.getElementById('quickProductUnitsContainer');
    if (!container) return;
    const rowId = 'unit_' + Date.now() + '_' + Math.random().toString(16).slice(2);
    const html = `
        <div id="${rowId}" class="unit-row grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-emerald-50/30 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-2xl relative shadow-sm mt-3   ">
            <button type="button" data-action="remove-unit" data-id="${rowId}" class="absolute -top-3 -right-3 bg-red-100 dark:bg-red-900 hover:bg-red-200 text-red-600 dark:text-red-400 rounded-full w-7 h-7 flex items-center justify-center  shadow-sm border-2 border-white dark:border-slate-900">
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

    // Bind remove button
    const newRow = document.getElementById(rowId);
    newRow.querySelector('[data-action="remove-unit"]').addEventListener('click', () => {
        newRow.remove();
    });

    // Auto-calculate logic
    const conversionInput = newRow.querySelector('.unit-conversion');
    const retailInput = newRow.querySelector('.unit-retail');
    const costInput = newRow.querySelector('.unit-cost');

    conversionInput.addEventListener('input', (e) => {
        const rate = parseFloat(e.target.value) || 0;
        if (rate > 0) {
            const baseRow = container.querySelector('.unit-row:first-child');
            const baseRetailInput = baseRow.querySelector('input[name="retail_price"]');
            const baseCostInput = baseRow.querySelector('input[name="cost_price"]');

            if (baseRetailInput && baseRetailInput.value && !retailInput._manualEdit) {
                retailInput.value = (parseFloat(baseRetailInput.value) * rate).toFixed(0);
            }
            if (baseCostInput && baseCostInput.value && !costInput._manualEdit) {
                costInput.value = (parseFloat(baseCostInput.value) * rate).toFixed(0);
            }
        }
    });

    retailInput.addEventListener('input', () => {
        retailInput._manualEdit = true;
    });
    costInput.addEventListener('input', () => {
        costInput._manualEdit = true;
    });
}

function generateQuickProductCode() {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const input = document.getElementById('quickProductCode');
    if (input) input.value = 'SP' + randomNum;
}

// Auto Bootstrapping
document.addEventListener('DOMContentLoaded', initPage);
