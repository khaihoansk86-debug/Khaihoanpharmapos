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
    auditLinesBody: document.getElementById('auditLinesBody'),
    auditLinesCount: document.getElementById('auditLinesCount'),
    totalLossVal: document.getElementById('totalLossVal'),
    totalGainVal: document.getElementById('totalGainVal'),
    submitAuditDocBtn: document.getElementById('submitAuditDocBtn')
};

// Global state
let rawProducts = [];
let groupedProducts = []; // Array of { productId, productName, productCode, baseUnit, batches: [...] }

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

// Handle Query Parameters from inventory redirect
function handleQueryParameters() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('productId');
    const batchId = params.get('batchId');

    if (productId && batchId) {
        setTimeout(() => {
            const input = document.querySelector(`.audit-row-input[data-batch-id="${batchId}"]`);
            if (input) {
                input.focus();
                input.select();
                input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Highlight rows with beautiful theme-matching violet glows
                const subRow = input.closest('tr.sub-row');
                const parentRow = document.querySelector(`tr.parent-row[data-product-id="${productId}"]`);
                if (subRow) {
                    subRow.classList.add('bg-violet-50/50', 'dark:bg-violet-950/20', 'ring-2', 'ring-violet-500/30');
                }
                if (parentRow) {
                    parentRow.classList.add('bg-violet-50/20', 'dark:bg-violet-950/10');
                }
            }
        }, 300);
    }
}

// Load Inventory and normalize batches list grouped by products
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

        // 2. Group products and their active batches (only include batches with positive stock)
        groupedProducts = [];
        rawProducts.forEach(product => {
            const productBatches = [];
            const baseUnit = product.product_units?.find(u => u.is_base_unit)?.unit_name || 'ĐV';
            
            (product.product_batches || []).forEach(b => {
                const stockQty = Number(b.stock_quantity || 0);
                if (stockQty > 0) {
                    productBatches.push({
                        batchId: b.id,
                        batchNumber: b.batch_number,
                        expiryDate: b.expiry_date,
                        systemQuantity: stockQty,
                        countedQuantity: stockQty, // default counted to current system stock
                        costPrice: Number(b.cost_price || 0),
                        delta: 0,
                        deltaValue: 0
                    });
                }
            });

            if (productBatches.length > 0) {
                groupedProducts.push({
                    productId: product.id,
                    productName: product.name,
                    productCode: product.product_code,
                    baseUnit,
                    batches: productBatches
                });
            }
        });

        renderLines();

    } catch (err) {
        console.error('Lỗi tải dữ liệu tồn kho:', err);
    }
}

// Render parent products and sub-rows in the table
function renderLines() {
    if (groupedProducts.length === 0) {
        els.auditLinesBody.innerHTML = `
            <tr>
                <td colspan="6" class="py-12 text-center text-slate-400 font-semibold">
                    <i class="fa-solid fa-circle-notch animate-spin text-4xl mb-3 text-blue-500 block"></i>
                    Không có mặt hàng nào tồn kho để kiểm kê.
                </td>
            </tr>
        `;
        els.auditLinesCount.textContent = '0 mặt hàng';
        els.totalLossVal.textContent = formatCurrency(0);
        els.totalGainVal.textContent = formatCurrency(0);
        return;
    }

    let html = '';
    let totalItems = 0;

    groupedProducts.forEach(product => {
        const totalSystem = product.batches.reduce((sum, b) => sum + b.systemQuantity, 0);
        const totalCounted = product.batches.reduce((sum, b) => sum + b.countedQuantity, 0);
        const totalDelta = product.batches.reduce((sum, b) => sum + b.delta, 0);
        const totalDeltaValue = product.batches.reduce((sum, b) => sum + b.deltaValue, 0);
        totalItems += product.batches.length;

        const deltaSign = totalDelta > 0 ? '+' : '';
        const deltaClass = totalDelta < 0 ? 'text-rose-600 font-bold' : totalDelta > 0 ? 'text-emerald-600 font-bold' : 'text-slate-500 font-semibold';
        const valClass = totalDeltaValue < 0 ? 'text-rose-600 font-bold' : totalDeltaValue > 0 ? 'text-emerald-600 font-bold' : 'text-slate-500 font-semibold';

        const rowHighlightClass = totalDelta !== 0 ? 'bg-amber-50/10 dark:bg-amber-950/5' : '';

        // Render parent product row
        html += `
            <tr class="bg-slate-100/60 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white parent-row ${rowHighlightClass}" data-product-id="${product.productId}" data-product-name="${escapeHTML(product.productName.toLowerCase())}" data-product-code="${escapeHTML(product.productCode.toLowerCase())}">
                <td class="py-3 px-5 font-black flex items-center gap-2">
                    <i class="fa-solid fa-box text-violet-500 text-xs"></i>
                    <div>
                        ${escapeHTML(product.productName)}
                        <span class="text-[10px] text-slate-400 block font-bold mt-0.5">${escapeHTML(product.productCode)}</span>
                    </div>
                </td>
                <td class="py-3 px-5 text-right font-black text-slate-600 dark:text-slate-350" data-sum-system="${product.productId}">
                    ${totalSystem} ${escapeHTML(product.baseUnit)}
                </td>
                <td class="py-3 px-5 text-right font-black text-slate-800 dark:text-slate-100" data-sum-counted="${product.productId}">
                    ${totalCounted} ${escapeHTML(product.baseUnit)}
                </td>
                <td class="py-3 px-5 text-right ${deltaClass}" data-sum-delta="${product.productId}">
                    ${deltaSign}${totalDelta}
                </td>
                <td class="py-3 px-5 text-right text-slate-400 font-normal">---</td>
                <td class="py-3 px-5 text-right ${valClass}" data-sum-delta-val="${product.productId}">
                    ${totalDeltaValue > 0 ? '+' : ''}${formatCurrency(totalDeltaValue)}
                </td>
            </tr>
        `;

        // Render sub-row for each batch
        product.batches.forEach(batch => {
            const bDeltaSign = batch.delta > 0 ? '+' : '';
            const bDeltaClass = batch.delta < 0 ? 'text-rose-600 font-bold' : batch.delta > 0 ? 'text-emerald-600 font-bold' : 'text-slate-500 font-semibold';
            const bValClass = batch.deltaValue < 0 ? 'text-rose-600 font-bold' : batch.deltaValue > 0 ? 'text-emerald-600 font-bold' : 'text-slate-500 font-semibold';

            const bHighlightClass = batch.delta !== 0 ? 'bg-amber-50/20 dark:bg-amber-950/10' : '';

            html += `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 transition-all sub-row ${bHighlightClass}" data-batch-row-id="${batch.batchId}" data-parent-id="${product.productId}" data-product-name="${escapeHTML(product.productName.toLowerCase())}" data-product-code="${escapeHTML(product.productCode.toLowerCase())}">
                    <td class="py-2.5 pl-10 pr-5 text-xs text-slate-600 dark:text-slate-350">
                        <span class="text-slate-400 mr-1.5 font-bold">↳ Lô:</span>
                        <span class="font-bold text-slate-700 dark:text-slate-200">${escapeHTML(batch.batchNumber)}</span>
                        <span class="text-slate-400 mx-2">|</span>
                        <span class="text-slate-400 font-semibold">HSD:</span>
                        <span class="font-semibold text-slate-600 dark:text-slate-300">${batch.expiryDate}</span>
                    </td>
                    <td class="py-2.5 px-5 text-right text-xs text-slate-500 font-bold">${batch.systemQuantity} ${escapeHTML(product.baseUnit)}</td>
                    <td class="py-2.5 px-5 text-right flex justify-end">
                        <div class="relative w-28">
                            <input type="number" min="0" value="${batch.countedQuantity}" data-batch-id="${batch.batchId}" data-parent-id="${product.productId}" class="audit-row-input w-full h-7 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-center text-xs font-black outline-none focus:ring-2 focus:ring-violet-500">
                        </div>
                    </td>
                    <td class="py-2.5 px-5 text-right text-xs ${bDeltaClass} row-delta-qty">${bDeltaSign}${batch.delta}</td>
                    <td class="py-2.5 px-5 text-right text-xs text-slate-500 font-semibold">${formatCurrency(batch.costPrice)}</td>
                    <td class="py-2.5 px-5 text-right text-xs ${bValClass} row-delta-val">${batch.deltaValue > 0 ? '+' : ''}${formatCurrency(batch.deltaValue)}</td>
                </tr>
            `;
        });
    });

    els.auditLinesBody.innerHTML = html;
    els.auditLinesCount.textContent = `${totalItems} lô hàng`;
    updateAuditTotals();
}

// Calculate grand totals across all grouped products and batches
function updateAuditTotals() {
    let totalLoss = 0;
    let totalGain = 0;

    groupedProducts.forEach(product => {
        product.batches.forEach(batch => {
            if (batch.deltaValue < 0) {
                totalLoss += Math.abs(batch.deltaValue);
            } else {
                totalGain += batch.deltaValue;
            }
        });
    });

    els.totalLossVal.textContent = formatCurrency(totalLoss);
    els.totalGainVal.textContent = formatCurrency(totalGain);
}

// Save complete Audit Document to Supabase and balance stock levels
async function submitAuditDocument() {
    const linesToAdjust = [];
    groupedProducts.forEach(product => {
        product.batches.forEach(b => {
            if (b.countedQuantity !== b.systemQuantity) {
                linesToAdjust.push({
                    productId: product.productId,
                    productName: product.productName,
                    productCode: product.productCode,
                    batchId: b.batchId,
                    batchNumber: b.batchNumber,
                    expiryDate: b.expiryDate,
                    costPrice: b.costPrice,
                    systemQuantity: b.systemQuantity,
                    countedQuantity: b.countedQuantity,
                    delta: b.delta,
                    deltaValue: b.deltaValue,
                    baseUnit: product.baseUnit
                });
            }
        });
    });

    if (linesToAdjust.length === 0) {
        alert('Tất cả lô hàng đều khớp số liệu tồn kho hệ thống, không cần cân bằng kho.');
        return;
    }

    els.submitAuditDocBtn.disabled = true;
    els.submitAuditDocBtn.innerHTML = '<i class="fa-solid fa-circle-notch animate-spin"></i> Đang cân bằng tồn...';

    try {
        // 1. Save Document header and lines
        const linesPayload = linesToAdjust.map(line => ({
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
        for (const line of linesToAdjust) {
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

// Calculate and apply changes to a specific batch input
function handleRowValueChange(input) {
    const batchId = input.dataset.batchId;
    const parentId = input.dataset.parentId;

    // 1. Find product and batch
    const product = groupedProducts.find(p => p.productId === parentId);
    if (!product) return;

    const batch = product.batches.find(b => b.batchId === batchId);
    if (!batch) return;

    // 2. Resolve target counted quantity
    let value;
    if (input.value.trim() === "") {
        value = batch.systemQuantity; // revert to system stock if field is deleted/cleared
        input.value = batch.systemQuantity; // update visually
    } else {
        value = parseInt(input.value);
        if (Number.isNaN(value) || value < 0) {
            // Restore visual input to whatever was last saved/stored
            input.value = batch.countedQuantity;
            return;
        }
    }

    // 3. Update batch values
    batch.countedQuantity = value;
    batch.delta = value - batch.systemQuantity;
    batch.deltaValue = batch.delta * batch.costPrice;

    // 4. Update batch DOM row cells
    const subRow = input.closest('tr.sub-row');
    const bDeltaTd = subRow.querySelector('.row-delta-qty');
    const bValTd = subRow.querySelector('.row-delta-val');

    const bDeltaSign = batch.delta > 0 ? '+' : '';
    let bDeltaClass = 'text-slate-500 font-semibold';
    if (batch.delta < 0) bDeltaClass = 'text-rose-600 font-bold';
    else if (batch.delta > 0) bDeltaClass = 'text-emerald-600 font-bold';

    let bValClass = 'text-slate-500 font-semibold';
    if (batch.deltaValue < 0) bValClass = 'text-rose-600 font-bold';
    else if (batch.deltaValue > 0) bValClass = 'text-emerald-600 font-bold';

    bDeltaTd.className = `py-2.5 px-5 text-right text-xs ${bDeltaClass} row-delta-qty`;
    bDeltaTd.textContent = `${bDeltaSign}${batch.delta}`;

    bValTd.className = `py-2.5 px-5 text-right text-xs ${bValClass} row-delta-val`;
    bValTd.textContent = `${batch.deltaValue > 0 ? '+' : ''}${formatCurrency(batch.deltaValue)}`;

    // Highlight the batch row if discrepancy
    if (batch.delta !== 0) {
        subRow.classList.add('bg-amber-50/20', 'dark:bg-amber-950/10');
    } else {
        subRow.classList.remove('bg-amber-50/20', 'dark:bg-amber-950/10');
    }

    // 5. Recalculate parent values
    const totalSystem = product.batches.reduce((sum, b) => sum + b.systemQuantity, 0);
    const totalCounted = product.batches.reduce((sum, b) => sum + b.countedQuantity, 0);
    const totalDelta = product.batches.reduce((sum, b) => sum + b.delta, 0);
    const totalDeltaValue = product.batches.reduce((sum, b) => sum + b.deltaValue, 0);

    // 6. Update parent DOM row cells
    const parentRow = els.auditLinesBody.querySelector(`tr.parent-row[data-product-id="${parentId}"]`);
    if (parentRow) {
        const sumCountedTd = parentRow.querySelector(`[data-sum-counted="${parentId}"]`);
        const sumDeltaTd = parentRow.querySelector(`[data-sum-delta="${parentId}"]`);
        const sumDeltaValTd = parentRow.querySelector(`[data-sum-delta-val="${parentId}"]`);

        sumCountedTd.textContent = `${totalCounted} ${escapeHTML(product.baseUnit)}`;

        const parentDeltaSign = totalDelta > 0 ? '+' : '';
        let pDeltaClass = 'text-slate-500 font-semibold';
        if (totalDelta < 0) pDeltaClass = 'text-rose-600 font-bold';
        else if (totalDelta > 0) pDeltaClass = 'text-emerald-600 font-bold';

        let pValClass = 'text-slate-500 font-semibold';
        if (totalDeltaValue < 0) pValClass = 'text-rose-600 font-bold';
        else if (totalDeltaValue > 0) pValClass = 'text-emerald-600 font-bold';

        sumDeltaTd.className = `py-3 px-5 text-right font-black ${pDeltaClass}`;
        sumDeltaTd.textContent = `${parentDeltaSign}${totalDelta}`;

        sumDeltaValTd.className = `py-3 px-5 text-right font-black ${pValClass}`;
        sumDeltaValTd.textContent = `${totalDeltaValue > 0 ? '+' : ''}${formatCurrency(totalDeltaValue)}`;

        // Highlight the parent row if there is a discrepancy in any of its batches
        if (totalDelta !== 0) {
            parentRow.classList.add('bg-amber-50/10', 'dark:bg-amber-950/5');
        } else {
            parentRow.classList.remove('bg-amber-50/10', 'dark:bg-amber-950/5');
        }
    }

    // 7. Update grand totals at footer
    updateAuditTotals();
}

// Bind Page Events
function bindEvents() {
    els.submitAuditDocBtn.addEventListener('click', submitAuditDocument);

    // Live search input filtering
    const searchInput = document.getElementById('auditProductSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const rows = els.auditLinesBody.querySelectorAll('tr');

            rows.forEach(row => {
                const productName = row.dataset.productName || '';
                const productCode = row.dataset.productCode || '';
                if (productName.includes(query) || productCode.includes(query)) {
                    row.classList.remove('hidden');
                } else {
                    row.classList.add('hidden');
                }
            });
        });
    }

    // Value confirms on blur/focus loss
    els.auditLinesBody.addEventListener('change', (e) => {
        const input = e.target.closest('.audit-row-input');
        if (input) {
            handleRowValueChange(input);
        }
    });

    // Enter confirms and speeds navigation
    els.auditLinesBody.addEventListener('keydown', (e) => {
        const input = e.target.closest('.audit-row-input');
        if (!input) return;

        if (e.key === 'Enter') {
            e.preventDefault();
            handleRowValueChange(input);

            // Shift focus down to the next input cell and highlight its text
            const allInputs = Array.from(els.auditLinesBody.querySelectorAll('.audit-row-input'));
            const idx = allInputs.indexOf(input);
            if (idx !== -1 && idx < allInputs.length - 1) {
                const nextInput = allInputs[idx + 1];
                nextInput.focus();
                nextInput.select();
            }
        }
    });
}

// Auto Bootstrapping
document.addEventListener('DOMContentLoaded', initPage);
