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
    submitAuditDocBtn: document.getElementById('submitAuditDocBtn'),
    activityLogDrawer: document.getElementById('activityLogDrawer'),
    activityLogOverlay: document.getElementById('activityLogOverlay'),
    activityLogContent: document.getElementById('activityLogContent'),
    openLogDrawerBtn: document.getElementById('openLogDrawerBtn'),
    closeLogDrawerBtn: document.getElementById('closeLogDrawerBtn'),
    logProgressBar: document.getElementById('logProgressBar'),
    logProgressText: document.getElementById('logProgressText'),
    logBadge: document.getElementById('logBadge')
};

// Global state
let rawProducts = [];
let groupedProducts = []; // Array of { productId, productName, productCode, baseUnit, batches: [...] }
let currentTab = 'normal'; // 'normal' or 'dose'
let activityLogs = [];

const DRAFT_KEY = 'khaihoan_stocktake_draft';
let draftSaveTimeout = null;

function saveDraft() {
    clearTimeout(draftSaveTimeout);
    draftSaveTimeout = setTimeout(() => {
        const draftData = {
            timestamp: Date.now(),
            lines: groupedProducts.map(p => ({
                productId: p.productId,
                batches: p.batches.map(b => ({
                    batchId: b.batchId,
                    batchNumber: b.batchNumber,
                    originalBatchNumber: b.originalBatchNumber,
                    expiryDate: b.expiryDate,
                    countedQuantity: b.countedQuantity,
                    isNewBatch: b.isNewBatch
                }))
            })),
            activityLogs: activityLogs
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
    }, 1000);
}

function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
}

async function promptRestoreDraft() {
    const draftJson = localStorage.getItem(DRAFT_KEY);
    if (!draftJson) return;

    try {
        const draftData = JSON.parse(draftJson);
        const ageHours = (Date.now() - draftData.timestamp) / (1000 * 60 * 60);
        if (ageHours > 48) {
            clearDraft();
            return;
        }

        const confirmRestore = confirm('Bạn có một phiếu kiểm kê đang làm dở. Bạn có muốn tiếp tục làm phiếu này không? (Bấm Hủy để làm phiếu mới)');
        if (confirmRestore) {
            draftData.lines.forEach(dProduct => {
                const product = groupedProducts.find(p => p.productId === dProduct.productId);
                if (product) {
                    dProduct.batches.forEach(dBatch => {
                        let batch = product.batches.find(b => b.batchId === dBatch.batchId);
                        if (batch) {
                            batch.countedQuantity = dBatch.countedQuantity;
                            batch.batchNumber = dBatch.batchNumber;
                            batch.delta = batch.countedQuantity - batch.systemQuantity;
                            batch.deltaValue = batch.delta * batch.costPrice;
                        } else if (dBatch.isNewBatch) {
                            batch = {
                                batchId: dBatch.batchId,
                                batchNumber: dBatch.batchNumber,
                                originalBatchNumber: dBatch.originalBatchNumber,
                                expiryDate: dBatch.expiryDate,
                                systemQuantity: 0,
                                countedQuantity: dBatch.countedQuantity,
                                costPrice: 0,
                                delta: dBatch.countedQuantity,
                                deltaValue: 0,
                                isNewBatch: true
                            };
                            product.batches.push(batch);
                        }
                    });
                }
            });
            
            if (draftData.activityLogs) {
                activityLogs = draftData.activityLogs;
                renderActivityLogs();
            }

            renderLines();
        } else {
            clearDraft();
        }
    } catch (e) {
        clearDraft();
    }
}

// Activity Log Functions
function logActivityAction(actionType, productId, batchId, details) {
    const product = groupedProducts.find(p => p.productId === productId);
    if (!product) return;
    const batch = product.batches.find(b => b.batchId === batchId);
    
    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    
    let message = '';
    let icon = '';
    let iconColor = '';
    
    if (actionType === 'count') {
        if (!batch) return;
        const deltaSign = batch.delta > 0 ? '+' : '';
        message = `<strong class="text-slate-800 dark:text-slate-100">${escapeHTML(product.productName)}</strong> (Lô ${escapeHTML(batch.batchNumber)}): Đã kiểm đếm <strong>${details.countedQuantity}</strong> hộp (Lệch ${deltaSign}${batch.delta})`;
        icon = 'fa-boxes-packing';
        iconColor = batch.delta === 0 ? 'text-slate-500 bg-slate-100 dark:bg-slate-800' : 
                   batch.delta > 0 ? 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40' : 'text-rose-600 bg-rose-100 dark:bg-rose-900/40';
    } else if (actionType === 'add_batch') {
        message = `Đã thêm lô kiểm kê mới cho <strong class="text-slate-800 dark:text-slate-100">${escapeHTML(product.productName)}</strong>`;
        icon = 'fa-plus';
        iconColor = 'text-blue-600 bg-blue-100 dark:bg-blue-900/40';
    } else if (actionType === 'edit_name') {
        message = `<strong class="text-slate-800 dark:text-slate-100">${escapeHTML(product.productName)}</strong>: Đổi tên lô thành <strong>${escapeHTML(details.newName)}</strong>`;
        icon = 'fa-pen-to-square';
        iconColor = 'text-violet-600 bg-violet-100 dark:bg-violet-900/40';
    } else if (actionType === 'edit_expiry') {
        if (!batch) return;
        message = `<strong class="text-slate-800 dark:text-slate-100">${escapeHTML(product.productName)}</strong> (Lô ${escapeHTML(batch.batchNumber)}): Đổi HSD thành <strong>${details.newDate}</strong>`;
        icon = 'fa-calendar-days';
        iconColor = 'text-amber-600 bg-amber-100 dark:bg-amber-900/40';
    }

    const logEntry = { timeStr, message, icon, iconColor, timestamp: now.getTime() };
    activityLogs.unshift(logEntry);
    renderActivityLogs();
}

function renderActivityLogs() {
    if (activityLogs.length === 0) {
        els.activityLogContent.innerHTML = `<div class="text-center text-slate-400 text-xs font-semibold py-8 italic">Chưa có thao tác nào được ghi nhận.</div>`;
        els.logBadge.classList.add('hidden');
        return;
    }

    els.logBadge.textContent = activityLogs.length > 99 ? '99+' : activityLogs.length;
    els.logBadge.classList.remove('hidden');

    let html = '';
    activityLogs.forEach(log => {
        html += `
            <div class="flex gap-3 items-start animate-fade-in">
                <div class="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs ${log.iconColor}">
                    <i class="fa-solid ${log.icon}"></i>
                </div>
                <div class="flex-1 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                    <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">${log.message}</p>
                    <span class="text-[10px] font-bold text-slate-400 mt-1 block">${log.timeStr}</span>
                </div>
            </div>
        `;
    });
    els.activityLogContent.innerHTML = html;
}

function updateProgress() {
    let totalBatches = 0;
    let countedBatches = 0;
    groupedProducts.forEach(p => {
        p.batches.forEach(b => {
            totalBatches++;
            if (b.countedQuantity !== b.systemQuantity || b.isNewBatch || b.batchNumber !== b.originalBatchNumber) {
                countedBatches++;
            }
        });
    });

    const pct = totalBatches === 0 ? 0 : Math.round((countedBatches / totalBatches) * 100);
    els.logProgressBar.style.width = `${pct}%`;
    els.logProgressText.textContent = `${countedBatches} / ${totalBatches} lô`;
}

function toggleLogDrawer(show) {
    if (show) {
        els.activityLogDrawer.classList.remove('translate-x-full');
        els.activityLogOverlay.classList.remove('hidden');
        setTimeout(() => els.activityLogOverlay.classList.remove('opacity-0'), 10);
    } else {
        els.activityLogDrawer.classList.add('translate-x-full');
        els.activityLogOverlay.classList.add('opacity-0');
        setTimeout(() => els.activityLogOverlay.classList.add('hidden'), 300);
    }
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
    await promptRestoreDraft();
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
            const isVirtualDose = (product.name || '').toLowerCase().startsWith('thuốc liều') || (product.product_code || '').startsWith('DOSE-');
            return !isCombo && !isVirtualDose;
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
                        originalBatchNumber: b.batch_number,
                        expiryDate: b.expiry_date,
                        systemQuantity: stockQty,
                        countedQuantity: stockQty, // default counted to current system stock
                        costPrice: Number(b.cost_price || 0),
                        delta: 0,
                        deltaValue: 0,
                        isNewBatch: false
                    });
                }
            });

            if (productBatches.length > 0) {
                groupedProducts.push({
                    productId: product.id,
                    productName: product.name,
                    productCode: product.product_code,
                    categoryName: product.categories?.name || '',
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
    const filteredGrouped = groupedProducts.filter(product => {
        const catName = product.categoryName || '';
        const isDoseCategory = catName.toLowerCase().includes('cắt liều') || catName.toLowerCase().includes('thuốc liều');
        if (currentTab === 'dose') {
            return isDoseCategory;
        } else {
            return !isDoseCategory;
        }
    });

    if (filteredGrouped.length === 0) {
        els.auditCardsContainer.innerHTML = `
            <div class="py-12 text-center text-slate-400 font-semibold w-full">
                Không có mặt hàng nào thuộc nhóm này trong kho để kiểm kê.
            </div>
        `;
        els.auditLinesCount.textContent = '0 lô hàng';
        updateProgress();
        return;
    }

    let html = '';
    let totalItems = 0;

    filteredGrouped.forEach(product => {
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
                                    <input type="text" data-action="edit-batch-name" data-batch-id="${batch.batchId}" data-parent-id="${product.productId}" value="${escapeHTML(batch.batchNumber)}" class="w-32 px-1 py-0.5 text-sm font-black text-slate-700 dark:text-slate-200 bg-transparent border-b border-dashed border-slate-300 dark:border-slate-600 focus:border-violet-500 outline-none transition-colors">
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-[10px] font-bold text-slate-400 uppercase">HSD:</span>
                                    <input type="date" data-action="edit-batch-expiry" data-batch-id="${batch.batchId}" data-parent-id="${product.productId}" value="${batch.expiryDate}" class="w-28 px-1 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-transparent border-b border-dashed border-slate-300 dark:border-slate-600 focus:border-violet-500 outline-none transition-colors [color-scheme:light] dark:[color-scheme:dark]">
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
                <div class="p-3 bg-slate-50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                    <button type="button" data-action="add-batch" data-product-id="${product.productId}" class="px-4 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1.5">
                        <i class="fa-solid fa-plus"></i> Thêm lô thực tế
                    </button>
                </div>
            </div>
        `;
    });

    els.auditCardsContainer.innerHTML = html;
    els.auditLinesCount.textContent = `${totalItems} lô hàng`;
    updateAuditTotals();
    updateProgress();
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
            if (b.countedQuantity !== b.systemQuantity || b.isNewBatch || b.batchNumber !== b.originalBatchNumber) {
                linesToAdjust.push({
                    productId: product.productId,
                    productName: product.productName,
                    productCode: product.productCode,
                    batchId: b.batchId,
                    batchNumber: b.batchNumber,
                    originalBatchNumber: b.originalBatchNumber,
                    isNewBatch: b.isNewBatch,
                    isRenamed: b.batchNumber !== b.originalBatchNumber,
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
                batchNumber: line.batchNumber,
                expiryDate: line.expiryDate,
                isNewBatch: line.isNewBatch,
                isRenamed: line.isRenamed,
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
                    base_unit: line.baseUnit,
                    is_new_batch: line.isNewBatch,
                    is_renamed: line.isRenamed
                }))
            });
        } catch (logErr) {
            console.warn('Lỗi ghi log kiểm kê chênh lệch:', logErr);
        }

        clearDraft();
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
    updateProgress();
    
    // Log the change
    logActivityAction('count', parentId, batchId, { countedQuantity: value });
    
    saveDraft();
}

function handleAddBatchClick(productId) {
    const product = groupedProducts.find(p => p.productId === productId);
    if (!product) return;

    const newBatch = {
        batchId: 'new_' + Math.random().toString(36).substr(2, 9),
        batchNumber: '',
        originalBatchNumber: '',
        expiryDate: new Date().toISOString().substring(0, 10),
        systemQuantity: 0,
        countedQuantity: 0,
        costPrice: 0,
        delta: 0,
        deltaValue: 0,
        isNewBatch: true
    };
    product.batches.push(newBatch);
    renderLines();
    
    logActivityAction('add_batch', productId, newBatch.batchId, {});
    saveDraft();

    // Auto focus the new batch name input
    setTimeout(() => {
        const input = document.querySelector(`input[data-action="edit-batch-name"][data-batch-id="${newBatch.batchId}"]`);
        if (input) {
            input.focus();
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 100);
}

function bindEvents() {
    els.submitAuditDocBtn.addEventListener('click', submitAuditDocument);

    const tabNormal = document.getElementById('tabNormal');
    const tabDose = document.getElementById('tabDose');
    const searchInput = document.getElementById('auditProductSearch');

    if (tabNormal && tabDose) {
        tabNormal.addEventListener('click', () => {
            if (currentTab === 'normal') return;
            currentTab = 'normal';
            tabNormal.className = "flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm";
            tabDose.className = "flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200";
            if (searchInput) searchInput.value = '';
            renderLines();
        });

        tabDose.addEventListener('click', () => {
            if (currentTab === 'dose') return;
            currentTab = 'dose';
            tabDose.className = "flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm";
            tabNormal.className = "flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200";
            if (searchInput) searchInput.value = '';
            renderLines();
        });
    }

    els.auditCardsContainer.addEventListener('click', (e) => {
        const addBtn = e.target.closest('[data-action="add-batch"]');
        if (addBtn) {
            handleAddBatchClick(addBtn.dataset.productId);
        }
    });

    els.auditCardsContainer.addEventListener('input', (e) => {
        if (e.target.dataset.action === 'edit-batch-name') {
            const batchId = e.target.dataset.batchId;
            const parentId = e.target.dataset.parentId;
            const product = groupedProducts.find(p => p.productId === parentId);
            const batch = product?.batches.find(b => b.batchId === batchId);
            if (batch && batch.batchNumber !== e.target.value.trim()) {
                batch.batchNumber = e.target.value.trim();
                logActivityAction('edit_name', parentId, batchId, { newName: batch.batchNumber });
                saveDraft();
            }
        } else if (e.target.dataset.action === 'edit-batch-expiry') {
            const batchId = e.target.dataset.batchId;
            const parentId = e.target.dataset.parentId;
            const product = groupedProducts.find(p => p.productId === parentId);
            const batch = product?.batches.find(b => b.batchId === batchId);
            if (batch && batch.expiryDate !== e.target.value) {
                batch.expiryDate = e.target.value;
                logActivityAction('edit_expiry', parentId, batchId, { newDate: batch.expiryDate });
                saveDraft();
            }
        }
    });

    if (els.openLogDrawerBtn) els.openLogDrawerBtn.addEventListener('click', () => toggleLogDrawer(true));
    if (els.closeLogDrawerBtn) els.closeLogDrawerBtn.addEventListener('click', () => toggleLogDrawer(false));
    if (els.activityLogOverlay) els.activityLogOverlay.addEventListener('click', () => toggleLogDrawer(false));

    // Live search input filtering
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
