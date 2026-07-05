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
    auditCardsContainer: document.getElementById('auditCardsContainer'),
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
        els.auditCardsContainer.innerHTML = `
            <div class="py-12 text-center text-slate-400 font-semibold w-full">
                <i class="fa-solid fa-circle-notch animate-spin text-4xl mb-3 text-blue-500 block"></i>
                Không có mặt hàng nào tồn kho để kiểm kê.
            </div>
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
        const deltaClass = totalDelta < 0 ? 'text-rose-600 bg-rose-50 dark:bg-rose-900/30' : totalDelta > 0 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' : 'text-slate-500 bg-slate-100 dark:bg-slate-800';
        const valClass = totalDeltaValue < 0 ? 'text-rose-600' : totalDeltaValue > 0 ? 'text-emerald-600' : 'text-slate-500';

        const rowHighlightClass = totalDelta !== 0 ? 'border-amber-300 dark:border-amber-700/50 shadow-amber-500/10' : 'border-slate-200 dark:border-slate-800';

        // Render parent product card
        html += `
            <div class="product-card flex flex-col bg-white dark:bg-slate-900 rounded-2xl border ${rowHighlightClass} shadow-sm overflow-hidden transition-all duration-300" data-product-id="${product.productId}" data-product-name="${escapeHTML(product.productName.toLowerCase())}" data-product-code="${escapeHTML(product.productCode.toLowerCase())}">
                <!-- Product Header -->
                <div class="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800/50">
                    <div class="flex items-start gap-3">
                        <div class="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-box"></i>
                        </div>
                        <div>
                            <h3 class="text-sm font-black text-slate-800 dark:text-slate-100 leading-tight">${escapeHTML(product.productName)}</h3>
                            <span class="text-[10px] font-black tracking-widest uppercase text-slate-400 mt-1 block">${escapeHTML(product.productCode)}</span>
                        </div>
                    </div>
                    
                    <div class="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:gap-1 mt-2 sm:mt-0">
                        <div class="flex items-center gap-2">
                            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tồn PM:</span>
                            <span class="text-sm font-black text-slate-600 dark:text-slate-300" data-sum-system="${product.productId}">${totalSystem} ${escapeHTML(product.baseUnit)}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="px-2 py-0.5 rounded-md text-xs font-black ${deltaClass}" data-sum-delta="${product.productId}">
                                Lệch: ${deltaSign}${totalDelta} ${escapeHTML(product.baseUnit)}
                            </span>
                            <span class="text-xs font-bold ${valClass}" data-sum-delta-val="${product.productId}">
                                ${totalDeltaValue > 0 ? '+' : ''}${formatCurrency(totalDeltaValue)}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Batches List -->
                <div class="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
        `;

        // Render sub-card for each batch
        product.batches.forEach(batch => {
            const bDeltaSign = batch.delta > 0 ? '+' : '';
            const bDeltaClass = batch.delta < 0 ? 'text-rose-600' : batch.delta > 0 ? 'text-emerald-600' : 'text-slate-500';
            const bValClass = batch.deltaValue < 0 ? 'text-rose-600' : batch.deltaValue > 0 ? 'text-emerald-600' : 'text-slate-500';
            const bHighlightClass = batch.delta !== 0 ? 'bg-amber-50/30 dark:bg-amber-950/20' : '';

            html += `
                    <div class="batch-item p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 transition-colors ${bHighlightClass}" data-batch-row-id="${batch.batchId}" data-parent-id="${product.productId}">
                        
                        <!-- Batch Info -->
                        <div class="flex flex-col gap-1.5 flex-1">
                            <div class="flex items-center justify-between md:justify-start gap-4">
                                <div class="flex items-center gap-2">
                                    <span class="text-[10px] font-bold text-slate-400 uppercase">Lô:</span>
                                    <span class="text-sm font-black text-slate-700 dark:text-slate-200">${escapeHTML(batch.batchNumber)}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-[10px] font-bold text-slate-400 uppercase">HSD:</span>
                                    <span class="text-xs font-semibold text-slate-600 dark:text-slate-300">${batch.expiryDate}</span>
                                </div>
                            </div>
                            <div class="flex items-center gap-4 text-xs mt-1">
                                <span class="font-semibold text-slate-500">Tồn PM: <strong class="text-slate-700 dark:text-slate-300 ml-1">${batch.systemQuantity}</strong></span>
                                <span class="font-semibold text-slate-500">Giá vốn: <strong class="text-slate-700 dark:text-slate-300 ml-1">${formatCurrency(batch.costPrice)}</strong></span>
                            </div>
                        </div>

                        <!-- Count Input & Delta -->
                        <div class="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-2 md:p-0 md:bg-transparent rounded-xl">
                            <div class="flex-1 md:flex-none flex flex-col items-center md:items-end justify-center">
                                <label class="text-[10px] font-bold text-slate-400 uppercase mb-1 md:hidden">Kiểm đếm thực tế</label>
                                <input type="number" min="0" inputmode="numeric" value="${batch.countedQuantity}" data-batch-id="${batch.batchId}" data-parent-id="${product.productId}" class="audit-row-input w-full md:w-28 h-10 px-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-center text-sm font-black text-violet-700 dark:text-violet-400 outline-none focus:ring-2 focus:border-violet-500 transition-all shadow-inner">
                            </div>
                            
                            <div class="flex flex-col items-end w-24 shrink-0">
                                <span class="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Độ lệch</span>
                                <div class="text-sm font-black ${bDeltaClass} row-delta-qty">${bDeltaSign}${batch.delta}</div>
                                <div class="text-[10px] font-bold ${bValClass} row-delta-val">${batch.deltaValue > 0 ? '+' : ''}${formatCurrency(batch.deltaValue)}</div>
                            </div>
                        </div>
                    </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    els.auditCardsContainer.innerHTML = html;
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

        // Ghi log hoạt động kiểm kê chênh lệch
        try {
            const { logActivity } = await import('../logs/auditService.js');
            await logActivity('stocktake_adjustment', {
                reason: els.auditReasonSelect.value,
                note: els.auditNoteInput.value,
                items: linesToAdjust.map(line => ({
                    product_id: line.productId,
                    product_name: line.productName,
                    product_code: line.productCode,
                    batch_number: line.batchNumber,
                    system_quantity: line.systemQuantity,
                    counted_quantity: line.countedQuantity,
                    delta: line.delta,
                    delta_value: line.deltaValue,
                    base_unit: line.baseUnit
                }))
            });
        } catch (logErr) {
            console.warn('Lỗi ghi log kiểm kê chênh lệch:', logErr);
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
    const subRow = input.closest('.batch-item');
    const bDeltaTd = subRow.querySelector('.row-delta-qty');
    const bValTd = subRow.querySelector('.row-delta-val');

    const bDeltaSign = batch.delta > 0 ? '+' : '';
    let bDeltaClass = 'text-slate-500';
    if (batch.delta < 0) bDeltaClass = 'text-rose-600';
    else if (batch.delta > 0) bDeltaClass = 'text-emerald-600';

    let bValClass = 'text-slate-500';
    if (batch.deltaValue < 0) bValClass = 'text-rose-600';
    else if (batch.deltaValue > 0) bValClass = 'text-emerald-600';

    bDeltaTd.className = `text-sm font-black ${bDeltaClass} row-delta-qty`;
    bDeltaTd.textContent = `${bDeltaSign}${batch.delta}`;

    bValTd.className = `text-[10px] font-bold ${bValClass} row-delta-val`;
    bValTd.textContent = `${batch.deltaValue > 0 ? '+' : ''}${formatCurrency(batch.deltaValue)}`;

    // Highlight the batch row if discrepancy
    if (batch.delta !== 0) {
        subRow.classList.add('bg-amber-50/30', 'dark:bg-amber-950/20');
    } else {
        subRow.classList.remove('bg-amber-50/30', 'dark:bg-amber-950/20');
    }

    // 5. Recalculate parent values
    const totalSystem = product.batches.reduce((sum, b) => sum + b.systemQuantity, 0);
    const totalCounted = product.batches.reduce((sum, b) => sum + b.countedQuantity, 0);
    const totalDelta = product.batches.reduce((sum, b) => sum + b.delta, 0);
    const totalDeltaValue = product.batches.reduce((sum, b) => sum + b.deltaValue, 0);

    // 6. Update parent DOM row cells
    const parentRow = els.auditCardsContainer.querySelector(`.product-card[data-product-id="${parentId}"]`);
    if (parentRow) {
        const sumSystemTd = parentRow.querySelector(`[data-sum-system="${parentId}"]`);
        const sumDeltaTd = parentRow.querySelector(`[data-sum-delta="${parentId}"]`);
        const sumDeltaValTd = parentRow.querySelector(`[data-sum-delta-val="${parentId}"]`);

        // Update system/counted text if needed, though card displays Tồn PM directly

        const parentDeltaSign = totalDelta > 0 ? '+' : '';
        let pDeltaClass = 'text-slate-500 bg-slate-100 dark:bg-slate-800';
        if (totalDelta < 0) pDeltaClass = 'text-rose-600 bg-rose-50 dark:bg-rose-900/30';
        else if (totalDelta > 0) pDeltaClass = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30';

        let pValClass = 'text-slate-500';
        if (totalDeltaValue < 0) pValClass = 'text-rose-600';
        else if (totalDeltaValue > 0) pValClass = 'text-emerald-600';

        sumDeltaTd.className = `px-2 py-0.5 rounded-md text-xs font-black ${pDeltaClass}`;
        sumDeltaTd.textContent = `Lệch: ${parentDeltaSign}${totalDelta} ${escapeHTML(product.baseUnit)}`;

        sumDeltaValTd.className = `text-xs font-bold ${pValClass}`;
        sumDeltaValTd.textContent = `${totalDeltaValue > 0 ? '+' : ''}${formatCurrency(totalDeltaValue)}`;

        // Highlight the parent row if there is a discrepancy in any of its batches
        if (totalDelta !== 0) {
            parentRow.classList.add('border-amber-300', 'dark:border-amber-700/50', 'shadow-amber-500/10');
            parentRow.classList.remove('border-slate-200', 'dark:border-slate-800');
        } else {
            parentRow.classList.remove('border-amber-300', 'dark:border-amber-700/50', 'shadow-amber-500/10');
            parentRow.classList.add('border-slate-200', 'dark:border-slate-800');
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
            const cards = els.auditCardsContainer.querySelectorAll('.product-card');

            cards.forEach(card => {
                const productName = card.dataset.productName || '';
                const productCode = card.dataset.productCode || '';
                if (productName.includes(query) || productCode.includes(query)) {
                    card.classList.remove('hidden');
                    card.classList.add('flex');
                } else {
                    card.classList.add('hidden');
                    card.classList.remove('flex');
                }
            });
        });
    }

    // Value confirms on blur/focus loss
    els.auditCardsContainer.addEventListener('change', (e) => {
        const input = e.target.closest('.audit-row-input');
        if (input) {
            handleRowValueChange(input);
        }
    });

    // Enter confirms and speeds navigation
    els.auditCardsContainer.addEventListener('keydown', (e) => {
        const input = e.target.closest('.audit-row-input');
        if (!input) return;

        if (e.key === 'Enter') {
            e.preventDefault();
            handleRowValueChange(input);

            // Shift focus down to the next input cell and highlight its text
            const allInputs = Array.from(els.auditCardsContainer.querySelectorAll('.audit-row-input'));
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
