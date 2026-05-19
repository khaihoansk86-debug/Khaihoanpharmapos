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
    receiveBatchNumberInput: document.getElementById('receiveBatchNumberInput'),
    receiveExpiryInput: document.getElementById('receiveExpiryInput'),
    receiveQuantityInput: document.getElementById('receiveQuantityInput'),
    receiveCostInput: document.getElementById('receiveCostInput'),
    addReceiveLineBtn: document.getElementById('addReceiveLineBtn'),
    receiveLinesBody: document.getElementById('receiveLinesBody'),
    receiveLinesCount: document.getElementById('receiveLinesCount'),
    receiveTotalVal: document.getElementById('receiveTotalVal'),
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
    quickProductBaseUnit: document.getElementById('quickProductBaseUnit'),
    quickProductCostPrice: document.getElementById('quickProductCostPrice'),
    quickProductRetailPrice: document.getElementById('quickProductRetailPrice'),
    closeProductModalBtn: document.getElementById('closeProductModalBtn'),
    cancelProductModalBtn: document.getElementById('cancelProductModalBtn')
};

// Global state
let activeProducts = [];
let activeSuppliers = [];
let receiveLines = [];

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
    handleQueryParameters();
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

// Load Physical Products (filter out Combos & Doses)
async function loadProducts(selectedId = '') {
    try {
        const allProducts = await fetchProducts();
        activeProducts = allProducts.filter(p => {
            const catName = p.product_categories?.name || '';
            const isCombo = catName.toLowerCase().includes('combo');
            const isDose = catName.toLowerCase().includes('cắt liều') || catName.toLowerCase().includes('thuốc liều');
            return !isCombo && !isDose;
        });

        activeProducts.sort((a, b) => a.name.localeCompare(b.name, 'vi'));

        els.receiveProductSelect.innerHTML = '<option value="">-- Chọn sản phẩm/biệt dược --</option>' +
            activeProducts.map(p => `<option value="${p.id}" ${p.id === selectedId ? 'selected' : ''}>${escapeHTML(p.name)} - ${escapeHTML(p.product_code)}</option>`).join('');
        
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
    const batchNumber = params.get('batchNumber');
    const expiryDate = params.get('expiryDate');
    const costPrice = params.get('costPrice');

    if (productId) {
        els.receiveProductSelect.value = productId;
        handleProductChange();
    }
    if (batchNumber) els.receiveBatchNumberInput.value = batchNumber;
    if (expiryDate) els.receiveExpiryInput.value = expiryDate;
    if (costPrice) els.receiveCostInput.value = costPrice;
}

// Product Dropdown Selection Change handler
function handleProductChange() {
    const productId = els.receiveProductSelect.value;
    if (!productId) {
        els.receiveUnitSelect.innerHTML = '';
        els.receiveCostInput.value = '';
        return;
    }

    const product = activeProducts.find(p => p.id === productId);
    if (!product) return;

    const units = product.product_units || [];
    els.receiveUnitSelect.innerHTML = units.map(u => 
        `<option value="${u.id}" data-rate="${u.conversion_rate}" data-cost="${u.cost_price || 0}">${escapeHTML(u.unit_name)} (Hệ số x${u.conversion_rate})</option>`
    ).join('');

    handleUnitChange();
}

// Unit dropdown change handler
function handleUnitChange() {
    const selectedOpt = els.receiveUnitSelect.selectedOptions[0];
    if (!selectedOpt) return;
    const cost = selectedOpt.dataset.cost;
    els.receiveCostInput.value = cost || '';
}

// Add Intake Line draft to lines array
function addIntakeLine() {
    const productId = els.receiveProductSelect.value;
    const unitId = els.receiveUnitSelect.value;
    const batchNumber = els.receiveBatchNumberInput.value.trim().toUpperCase();
    const expiryDate = els.receiveExpiryInput.value;
    const quantity = Number(els.receiveQuantityInput.value || 0);
    const costPrice = Number(els.receiveCostInput.value || 0);

    if (!productId) { alert('Vui lòng chọn hàng hóa cần nhập.'); return; }
    if (!unitId) { alert('Vui lòng chọn đơn vị tính.'); return; }
    if (!batchNumber) { alert('Vui lòng nhập mã lô sản xuất.'); return; }
    if (!expiryDate) { alert('Vui lòng nhập hạn sử dụng lô.'); return; }
    if (quantity <= 0) { alert('Số lượng nhập phải lớn hơn 0.'); return; }

    const product = activeProducts.find(p => p.id === productId);
    const unitOpt = els.receiveUnitSelect.selectedOptions[0];
    const rate = Number(unitOpt.dataset.rate || 1);

    const line = {
        id: Math.random().toString(36).substring(2, 9),
        productId,
        productName: product.name,
        productCode: product.product_code,
        unitId,
        unitName: unitOpt.textContent.split('(')[0].trim(),
        conversionRate: rate,
        batchNumber,
        expiryDate,
        quantity,
        costPrice,
        subtotal: quantity * costPrice,
        quantityBase: quantity * rate,
        costPriceBase: costPrice / rate
    };

    receiveLines.push(line);
    renderLines();
    resetLineInputs();
}

// Render lines in the draft table
function renderLines() {
    if (receiveLines.length === 0) {
        els.receiveLinesBody.innerHTML = `
            <tr>
                <td colspan="7" class="py-12 text-center text-slate-400 font-semibold">
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
        return `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td class="py-3.5 px-5 font-bold">${escapeHTML(line.productName)} <span class="text-xs text-slate-400 block">${escapeHTML(line.productCode)}</span></td>
                <td class="py-3.5 px-5 font-semibold text-slate-600 dark:text-slate-350">
                    <span class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs font-bold mr-1 border border-slate-200 dark:border-slate-700">${escapeHTML(line.batchNumber)}</span>
                    HSD: ${line.expiryDate}
                </td>
                <td class="py-3.5 px-5 text-right font-black text-blue-600">${line.quantity}</td>
                <td class="py-3.5 px-5 text-right font-bold text-slate-500">${escapeHTML(line.unitName)}</td>
                <td class="py-3.5 px-5 text-right font-semibold">${formatCurrency(line.costPrice)}</td>
                <td class="py-3.5 px-5 text-right font-bold text-slate-800 dark:text-white">${formatCurrency(line.subtotal)}</td>
                <td class="py-3.5 px-5 text-center">
                    <button type="button" data-action="remove-line" data-id="${line.id}" class="w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 flex items-center justify-center transition-all"><i class="fa-solid fa-trash-can"></i></button>
                </td>
            </tr>
        `;
    }).join('');

    els.receiveLinesCount.textContent = `${receiveLines.length} mặt hàng`;
    els.receiveTotalVal.textContent = formatCurrency(total);
}

// Reset the line input card
function resetLineInputs() {
    els.receiveQuantityInput.value = '';
    els.receiveBatchNumberInput.value = '';
    els.receiveExpiryInput.value = '';
    els.receiveCostInput.value = '';
    els.receiveProductSelect.value = '';
    els.receiveUnitSelect.innerHTML = '';
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

        const documentId = await saveInventoryDocument({
            documentType: 'purchase',
            note: els.receiveNoteInput.value,
            lines: linesPayload,
            supplier_id: supplierId
        });

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

        alert('Xác nhận nhập kho thành công!');
        window.location.href = 'inventory.html';
    } catch (err) {
        console.error('Lỗi khi lập phiếu nhập kho:', err);
        alert(`Lập phiếu nhập thất bại: ${err.message}`);
        els.submitReceiveDocBtn.disabled = false;
        els.submitReceiveDocBtn.innerHTML = '<i class="fa-solid fa-check-double"></i> Xác nhận nhập kho';
    }
}

// Bind Page and Modal Events
function bindEvents() {
    els.receiveProductSelect.addEventListener('change', handleProductChange);
    els.receiveUnitSelect.addEventListener('change', handleUnitChange);
    els.addReceiveLineBtn.addEventListener('click', addIntakeLine);
    els.submitReceiveDocBtn.addEventListener('click', submitReceiveDocument);

    // Draft list events
    els.receiveLinesBody.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action="remove-line"]');
        if (!btn) return;
        const id = btn.dataset.id;
        receiveLines = receiveLines.filter(line => line.id !== id);
        renderLines();
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
    els.quickProductBtn.addEventListener('click', () => {
        els.quickProductForm.reset();
        els.quickProductModal.classList.remove('hidden');
    });

    const closeProductModal = () => els.quickProductModal.classList.add('hidden');
    els.closeProductModalBtn.addEventListener('click', closeProductModal);
    els.cancelProductModalBtn.addEventListener('click', closeProductModal);

    els.quickProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const product_code = els.quickProductCode.value.trim().toUpperCase();
        const name = els.quickProductName.value.trim();
        const category_id = els.quickProductCategory.value;
        const base_unit = els.quickProductBaseUnit.value.trim();
        const cost_price = Number(els.quickProductCostPrice.value || 0);
        const retail_price = Number(els.quickProductRetailPrice.value || 0);

        try {
            await createProduct(
                { product_code, name, category_id, is_active: true },
                [{ unit_name: base_unit, cost_price, retail_price, conversion_rate: 1, is_base_unit: true }]
            );

            alert('Đăng ký mặt hàng mới thành công!');
            closeProductModal();

            // Fetch list from Supabase and select the product
            await loadProducts();
            
            // Auto select product by code
            const found = activeProducts.find(p => p.product_code === product_code);
            if (found) {
                els.receiveProductSelect.value = found.id;
                handleProductChange();
            }
        } catch (err) {
            console.error(err);
            alert(`Lỗi: ${err.message}`);
        }
    });
}

// Auto Bootstrapping
document.addEventListener('DOMContentLoaded', initPage);
