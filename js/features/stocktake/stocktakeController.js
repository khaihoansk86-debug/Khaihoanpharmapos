// js/features/stocktake/stocktakeController.js
import { initLayout } from '../../components/layout.js';
import { supabaseClient } from '../../core/supabase.js';
import { fetchInventoryProducts, adjustStocktake, saveInventoryDocument } from '../inventory/inventoryService.js';

// DOM Elements cache
const els = {
    auditDocCode: document.getElementById('auditDocCode'),
    auditDateInput: document.getElementById('auditDateInput'),
    auditReasonSelect: document.getElementById('auditReasonSelect'),
    auditNoteInput: document.getElementById('auditNoteInput'),
    auditProductSelect: document.getElementById('auditProductSelect'),
    auditBatchSelect: document.getElementById('auditBatchSelect'),
    comparisonCard: document.getElementById('comparisonCard'),
    systemStockVal: document.getElementById('systemStockVal'),
    discrepancyQty: document.getElementById('discrepancyQty'),
    discrepancyValue: document.getElementById('discrepancyValue'),
    auditCountedInput: document.getElementById('auditCountedInput'),
    addAuditLineBtn: document.getElementById('addAuditLineBtn'),
    auditLinesBody: document.getElementById('auditLinesBody'),
    auditLinesCount: document.getElementById('auditLinesCount'),
    totalLossVal: document.getElementById('totalLossVal'),
    totalGainVal: document.getElementById('totalGainVal'),
    submitAuditDocBtn: document.getElementById('submitAuditDocBtn')
};

// Global state
let rawProducts = [];
let normalizedBatches = [];
let auditLines = [];

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

// Generate automatic audit document code
function generateDocCode() {
    const today = new Date();
    const dateStr = today.getFullYear().toString() +
        (today.getMonth() + 1).toString().padStart(2, '0') +
        today.getDate().toString().padStart(2, '0');
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `PKK-${dateStr}-${rand}`;
}

// Initialize Page Data
async function initPage() {
    initLayout('admin', 'inventory');

    // Default dates
    els.auditDateInput.value = new Date().toISOString().substring(0, 10);
    els.auditDocCode.value = generateDocCode();

    await loadInventoryData();

    bindEvents();
    handleQueryParameters();
}

// Load Inventory and normalize batches list (excluding Combos & Doses)
async function loadInventoryData() {
    try {
        const products = await fetchInventoryProducts();
        
        // 1. Filter out virtual items
        rawProducts = products.filter(product => {
            const catName = product.categories?.name || '';
            const isCombo = catName.toLowerCase().includes('combo');
            const isDose = catName.toLowerCase().includes('cắt liều') || catName.toLowerCase().includes('thuốc liều');
            return !isCombo && !isDose;
        });

        rawProducts.sort((a, b) => a.name.localeCompare(b.name, 'vi'));

        // 2. Flatten products into batches mapping
        normalizedBatches = [];
        rawProducts.forEach(product => {
            const batches = product.product_batches || [];
            const baseUnit = product.product_units?.find(u => u.is_base_unit)?.unit_name || 'ĐV';
            
            batches.forEach(b => {
                normalizedBatches.push({
                    productId: product.id,
                    productName: product.name,
                    productCode: product.product_code,
                    batchId: b.id,
                    batchNumber: b.batch_number,
                    expiryDate: b.expiry_date,
                    stockQuantity: Number(b.stock_quantity || 0),
                    costPrice: Number(b.cost_price || 0),
                    baseUnit
                });
            });
        });

        // 3. Populate product selection
        els.auditProductSelect.innerHTML = '<option value="">-- Chọn hàng hóa cần kiểm --</option>' +
            rawProducts.map(p => `<option value="${p.id}">${escapeHTML(p.name)} - ${escapeHTML(p.product_code)}</option>`).join('');

    } catch (err) {
        console.error('Lỗi tải dữ liệu tồn kho:', err);
    }
}

// Handle Query Parameters from inventory redirect
function handleQueryParameters() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('productId');
    const batchId = params.get('batchId');

    if (productId) {
        els.auditProductSelect.value = productId;
        handleProductChange();
    }
    if (batchId) {
        els.auditBatchSelect.value = batchId;
        handleBatchChange();
    }
}

// Product Dropdown Selection Change handler
function handleProductChange() {
    const productId = els.auditProductSelect.value;
    if (!productId) {
        els.auditBatchSelect.innerHTML = '';
        els.comparisonCard.classList.add('hidden');
        els.auditCountedInput.value = '';
        return;
    }

    const batches = normalizedBatches.filter(b => b.productId === productId);
    els.auditBatchSelect.innerHTML = '<option value="">-- Chọn lô cần đối chiếu --</option>' +
        batches.map(b => `<option value="${b.batchId}">Lô: ${escapeHTML(b.batchNumber)} - HSD: ${b.expiryDate} - Tồn PM: ${b.stockQuantity} ${escapeHTML(b.baseUnit)}</option>`).join('');
    
    els.comparisonCard.classList.add('hidden');
    els.auditCountedInput.value = '';
}

// Batch select change handler
function handleBatchChange() {
    const batchId = els.auditBatchSelect.value;
    if (!batchId) {
        els.comparisonCard.classList.add('hidden');
        els.auditCountedInput.value = '';
        return;
    }

    const batch = normalizedBatches.find(b => b.batchId === batchId);
    if (!batch) return;

    els.systemStockVal.textContent = `${batch.stockQuantity} ${batch.baseUnit}`;
    els.auditCountedInput.value = batch.stockQuantity; // default to current stock
    
    calculateDelta();
    els.comparisonCard.classList.remove('hidden');
}

// Calculate discrepencies in real-time
function calculateDelta() {
    const batchId = els.auditBatchSelect.value;
    if (!batchId) return;

    const batch = normalizedBatches.find(b => b.batchId === batchId);
    if (!batch) return;

    const counted = Number(els.auditCountedInput.value || 0);
    const delta = counted - batch.stockQuantity;
    const deltaValue = delta * batch.costPrice;

    // Discrepancy Qty Badge
    let qtyClass = 'text-slate-700 dark:text-slate-200';
    let qtySign = '';
    if (delta < 0) {
        qtyClass = 'text-rose-600 dark:text-rose-400';
    } else if (delta > 0) {
        qtyClass = 'text-emerald-600 dark:text-emerald-400';
        qtySign = '+';
    }
    els.discrepancyQty.className = `text-xl font-black mt-1 ${qtyClass}`;
    els.discrepancyQty.textContent = `${qtySign}${delta} ${batch.baseUnit}`;

    // Discrepancy Value Text
    let valClass = 'text-slate-700 dark:text-slate-200';
    let valSign = '';
    if (deltaValue < 0) {
        valClass = 'text-rose-600 dark:text-rose-400';
    } else if (deltaValue > 0) {
        valClass = 'text-emerald-600 dark:text-emerald-400';
        valSign = '+';
    }
    els.discrepancyValue.className = `text-xl font-black mt-1 ${valClass}`;
    els.discrepancyValue.textContent = `${valSign}${formatCurrency(deltaValue)}`;
}

// Add Audit Line draft to lines array
function addAuditLine() {
    const productId = els.auditProductSelect.value;
    const batchId = els.auditBatchSelect.value;
    const counted = Number(els.auditCountedInput.value);

    if (!productId || !batchId) {
        alert('Vui lòng chọn Hàng hóa và Số lô cần kiểm kê.');
        return;
    }
    if (Number.isNaN(counted) || counted < 0) {
        alert('Tồn thực tế kiểm lẻ phải lớn hơn hoặc bằng 0.');
        return;
    }

    // Check if batch is already in draft list
    const exists = auditLines.find(line => line.batchId === batchId);
    if (exists) {
        alert('Lô hàng này đã được đưa vào danh sách kiểm kê ở dưới.');
        return;
    }

    const batch = normalizedBatches.find(b => b.batchId === batchId);
    const delta = counted - batch.stockQuantity;
    const deltaValue = delta * batch.costPrice;

    const line = {
        id: Math.random().toString(36).substring(2, 9),
        productId,
        productName: batch.productName,
        productCode: batch.productCode,
        batchId,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        costPrice: batch.costPrice,
        systemQuantity: batch.stockQuantity,
        countedQuantity: counted,
        delta,
        deltaValue,
        baseUnit: batch.baseUnit
    };

    auditLines.push(line);
    renderLines();
    resetLineInputs();
}

// Render lines in the draft table
function renderLines() {
    if (auditLines.length === 0) {
        els.auditLinesBody.innerHTML = `
            <tr>
                <td colspan="7" class="py-12 text-center text-slate-400 font-semibold">
                    <i class="fa-solid fa-clipboard-check text-4xl mb-3 opacity-30 block"></i>
                    Chưa có mặt hàng nào được đưa vào phiếu kiểm kê.
                </td>
            </tr>
        `;
        els.auditLinesCount.textContent = '0 mặt hàng';
        els.totalLossVal.textContent = formatCurrency(0);
        els.totalGainVal.textContent = formatCurrency(0);
        return;
    }

    let totalLoss = 0;
    let totalGain = 0;

    els.auditLinesBody.innerHTML = auditLines.map((line, idx) => {
        if (line.deltaValue < 0) {
            totalLoss += Math.abs(line.deltaValue);
        } else {
            totalGain += line.deltaValue;
        }

        const deltaSign = line.delta > 0 ? '+' : '';
        const deltaClass = line.delta < 0 ? 'text-rose-600 font-bold' : line.delta > 0 ? 'text-emerald-600 font-bold' : 'text-slate-500 font-semibold';
        const valClass = line.deltaValue < 0 ? 'text-rose-600' : line.deltaValue > 0 ? 'text-emerald-600' : 'text-slate-500';

        return `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                <td class="py-3.5 px-5 font-bold">
                    ${escapeHTML(line.productName)}
                    <span class="text-xs text-slate-400 block font-normal">
                        Lô: <span class="font-bold text-slate-600 dark:text-slate-350">${escapeHTML(line.batchNumber)}</span> - HSD: ${line.expiryDate}
                    </span>
                </td>
                <td class="py-3.5 px-5 text-right font-bold text-slate-500">${line.systemQuantity} ${escapeHTML(line.baseUnit)}</td>
                <td class="py-3.5 px-5 text-right font-black text-blue-600">${line.countedQuantity} ${escapeHTML(line.baseUnit)}</td>
                <td class="py-3.5 px-5 text-right ${deltaClass}">${deltaSign}${line.delta}</td>
                <td class="py-3.5 px-5 text-right font-semibold text-slate-500">${formatCurrency(line.costPrice)}</td>
                <td class="py-3.5 px-5 text-right font-bold ${valClass}">${line.deltaValue > 0 ? '+' : ''}${formatCurrency(line.deltaValue)}</td>
                <td class="py-3.5 px-5 text-center">
                    <button type="button" data-action="remove-line" data-id="${line.id}" class="w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 flex items-center justify-center transition-all"><i class="fa-solid fa-trash-can"></i></button>
                </td>
            </tr>
        `;
    }).join('');

    els.auditLinesCount.textContent = `${auditLines.length} mặt hàng`;
    els.totalLossVal.textContent = formatCurrency(totalLoss);
    els.totalGainVal.textContent = formatCurrency(totalGain);
}

// Reset the line input card
function resetLineInputs() {
    els.auditProductSelect.value = '';
    els.auditBatchSelect.innerHTML = '';
    els.auditCountedInput.value = '';
    els.comparisonCard.classList.add('hidden');
}

// Save complete Audit Document to Supabase and balance stock levels
async function submitAuditDocument() {
    if (auditLines.length === 0) {
        alert('Vui lòng thêm ít nhất một lô hàng cần đối chiếu vào phiếu kiểm kê.');
        return;
    }

    els.submitAuditDocBtn.disabled = true;
    els.submitAuditDocBtn.innerHTML = '<i class="fa-solid fa-circle-notch animate-spin"></i> Đang cân bằng tồn...';

    try {
        // 1. Save Document header and lines
        const linesPayload = auditLines.map(line => ({
            productId: line.productId,
            batchId: line.batchId,
            batchNumber: line.batchNumber,
            expiryDate: line.expiryDate,
            quantity: line.delta, // delta quantity is logged as change quantity
            costPrice: line.costPrice,
            countedQuantity: line.countedQuantity,
            reason: els.auditReasonSelect.value
        }));

        const documentId = await saveInventoryDocument({
            documentType: 'stocktake_adjustment',
            note: els.auditNoteInput.value,
            lines: linesPayload
        });

        // 2. Perform adjustments for each line
        for (const line of auditLines) {
            await adjustStocktake({
                productId: line.productId,
                batchId: line.batchId,
                countedQuantity: line.countedQuantity,
                reason: els.auditReasonSelect.value,
                note: els.auditNoteInput.value
            });
        }

        alert('Xác nhận và cân bằng tồn kho thành công!');
        window.location.href = 'inventory.html';
    } catch (err) {
        console.error('Lỗi khi cân bằng kho:', err);
        alert(`Cân bằng kho thất bại: ${err.message}`);
        els.submitAuditDocBtn.disabled = false;
        els.submitAuditDocBtn.innerHTML = '<i class="fa-solid fa-check-double"></i> Xác nhận cân bằng kho';
    }
}

// Bind Page Events
function bindEvents() {
    els.auditProductSelect.addEventListener('change', handleProductChange);
    els.auditBatchSelect.addEventListener('change', handleBatchChange);
    els.auditCountedInput.addEventListener('input', calculateDelta);
    els.addAuditLineBtn.addEventListener('click', addAuditLine);
    els.submitAuditDocBtn.addEventListener('click', submitAuditDocument);

    // Draft list events
    els.auditLinesBody.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action="remove-line"]');
        if (!btn) return;
        const id = btn.dataset.id;
        auditLines = auditLines.filter(line => line.id !== id);
        renderLines();
    });
}

// Auto Bootstrapping
document.addEventListener('DOMContentLoaded', initPage);
