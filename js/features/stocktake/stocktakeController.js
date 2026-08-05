import { initLayout } from '../../components/layout.js';
import { supabaseClient } from '../../core/supabase.js';
import { fetchInventoryProducts } from '../inventory/inventoryService.js';
import { applyStocktakeDocumentAtomic } from './stocktakeAtomicService.js';
import { buildStocktakeCompletionLines } from './stocktakeCompletionRules.js';
import {
    applyStocktakeDraft,
    buildStocktakeDraft,
    canCompleteStocktake,
    getBatchVerificationState,
    summarizeStocktake
} from './stocktakeSessionRules.js';
import {
    STOCKTAKE_DRAFT_KEY,
    deleteStocktakeDraftEverywhere,
    loadNewestStocktakeDraft,
    saveLocalStocktakeDraft,
    saveRemoteStocktakeDraft
} from './stocktakeDraftService.js';

const els = {
    auditDocCode: document.getElementById('auditDocCode'),
    auditDateInput: document.getElementById('auditDateInput'),
    auditReasonSelect: document.getElementById('auditReasonSelect'),
    auditNoteInput: document.getElementById('auditNoteInput'),
    auditCardsContainer: document.getElementById('auditCardsContainer'),
    auditLinesCount: document.getElementById('auditLinesCount'),
    auditProductSearch: document.getElementById('auditProductSearch'),
    auditStatusFilter: document.getElementById('auditStatusFilter'),
    loadMoreAuditBtn: document.getElementById('loadMoreAuditBtn'),
    totalLossVal: document.getElementById('totalLossVal'),
    totalGainVal: document.getElementById('totalGainVal'),
    submitAuditDocBtn: document.getElementById('submitAuditDocBtn'),
    saveAndExitBtn: document.getElementById('saveAndExitBtn'),
    discardAuditBtn: document.getElementById('discardAuditBtn'),
    draftSaveStatus: document.getElementById('draftSaveStatus'),
    activityLogDrawer: document.getElementById('activityLogDrawer'),
    activityLogOverlay: document.getElementById('activityLogOverlay'),
    activityLogContent: document.getElementById('activityLogContent'),
    openLogDrawerBtn: document.getElementById('openLogDrawerBtn'),
    closeLogDrawerBtn: document.getElementById('closeLogDrawerBtn'),
    logProgressTrack: document.getElementById('logProgressTrack'),
    logProgressBar: document.getElementById('logProgressBar'),
    logProgressText: document.getElementById('logProgressText'),
    logProgressPercent: document.getElementById('logProgressPercent'),
    mobileProgressBadge: document.getElementById('mobileProgressBadge'),
    pendingCount: document.getElementById('pendingCount'),
    matchedCount: document.getElementById('matchedCount'),
    discrepancyCount: document.getElementById('discrepancyCount'),
    logBadge: document.getElementById('logBadge'),
    restoreDraftModal: document.getElementById('restoreDraftModal'),
    restoreDraftDescription: document.getElementById('restoreDraftDescription'),
    restoreDraftSummary: document.getElementById('restoreDraftSummary'),
    restoreDraftBtn: document.getElementById('restoreDraftBtn'),
    discardDraftBtn: document.getElementById('discardDraftBtn'),
    completeAuditModal: document.getElementById('completeAuditModal'),
    completeAuditSummary: document.getElementById('completeAuditSummary'),
    pendingAuditWarning: document.getElementById('pendingAuditWarning'),
    allowPendingAudit: document.getElementById('allowPendingAudit'),
    completeAuditError: document.getElementById('completeAuditError'),
    confirmCompleteAuditBtn: document.getElementById('confirmCompleteAuditBtn'),
    cancelCompleteAuditBtn: document.getElementById('cancelCompleteAuditBtn'),
    stocktakeToast: document.getElementById('stocktakeToast')
};

let groupedProducts = [];
let currentFilter = 'all';
let activityLogs = [];
let visibleProductLimit = 40;
let localSaveTimeout = null;
let remoteSaveTimeout = null;
let searchTimeout = null;
let autosaveInterval = null;
let isSubmitting = false;
let hasDraftChanges = false;

function getProductDescriptionFlags(product) {
    try {
        const parsed = typeof product?.description === 'string'
            ? JSON.parse(product.description)
            : product?.description;
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
}

function isDoseIngredientProduct(product) {
    return getProductDescriptionFlags(product).is_dose_cut === true;
}

function isEcommerceProduct(product) {
    return getProductDescriptionFlags(product).is_ecommerce === true;
}

function escapeHTML(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
    }).format(Number(amount || 0));
}

function generateDocCode() {
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `PKK-${dateStr}-${rand}`;
}

function buildCurrentDraft() {
    return buildStocktakeDraft({
        docCode: els.auditDocCode.value,
        auditDate: els.auditDateInput.value,
        reason: els.auditReasonSelect.value,
        note: els.auditNoteInput.value,
        groupedProducts,
        activityLogs
    });
}

function setDraftStatus(message, state = 'saved') {
    if (!els.draftSaveStatus) return;
    const icon = state === 'saving'
        ? 'fa-circle-notch animate-spin'
        : state === 'local'
            ? 'fa-hard-drive'
            : state === 'error'
                ? 'fa-triangle-exclamation'
                : 'fa-cloud-check';
    els.draftSaveStatus.classList.remove('hidden');
    els.draftSaveStatus.classList.add('flex');
    els.draftSaveStatus.innerHTML = `<i class="fa-solid ${icon}" aria-hidden="true"></i><span>${escapeHTML(message)}</span>`;
}

async function persistDraft({ syncRemote = false } = {}) {
    const draft = buildCurrentDraft();
    setDraftStatus('Đang lưu nháp...', 'saving');
    await saveLocalStocktakeDraft(draft);

    if (!syncRemote) {
        setDraftStatus(`Đã lưu trên máy lúc ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`, 'local');
        return { local: true, remote: false };
    }

    try {
        const result = await saveRemoteStocktakeDraft(draft, supabaseClient);
        setDraftStatus(
            result.synced ? 'Đã đồng bộ nháp an toàn' : 'Đã lưu nháp trên máy',
            result.synced ? 'saved' : 'local'
        );
        return { local: true, remote: result.synced };
    } catch (error) {
        console.warn('Không thể đồng bộ nháp kiểm kê:', error?.message || error);
        setDraftStatus('Đã lưu trên máy · Chưa đồng bộ', 'error');
        return { local: true, remote: false, error };
    }
}

function scheduleDraftSave() {
    hasDraftChanges = true;
    clearTimeout(localSaveTimeout);
    clearTimeout(remoteSaveTimeout);
    setDraftStatus('Đang lưu nháp...', 'saving');
    localSaveTimeout = setTimeout(() => persistDraft({ syncRemote: false }), 150);
    remoteSaveTimeout = setTimeout(() => persistDraft({ syncRemote: true }), 1500);
}

function showToast(message, kind = 'info') {
    if (!els.stocktakeToast) return;
    els.stocktakeToast.textContent = message;
    els.stocktakeToast.className = `fixed top-4 left-1/2 -translate-x-1/2 z-[120] max-w-[calc(100vw-2rem)] rounded-xl px-4 py-3 text-white shadow-xl text-sm font-bold ${kind === 'error' ? 'bg-rose-700' : kind === 'success' ? 'bg-emerald-700' : 'bg-slate-900'}`;
    clearTimeout(showToast.timeout);
    showToast.timeout = setTimeout(() => els.stocktakeToast.classList.add('hidden'), 4000);
}

function logActivityAction(actionType, productId, batchId, details = {}) {
    const product = groupedProducts.find(item => item.productId === productId);
    const batch = product?.batches.find(item => item.batchId === batchId);
    if (!product) return;

    let message = '';
    let icon = 'fa-pen';
    let iconColor = 'text-violet-600 bg-violet-100 dark:bg-violet-900/40';
    if (actionType === 'count' && batch) {
        const sign = batch.delta > 0 ? '+' : '';
        message = `${product.productName} · Lô ${batch.batchNumber}: đã kiểm ${batch.countedQuantity} ${product.baseUnit} (lệch ${sign}${batch.delta})`;
        icon = 'fa-boxes-packing';
        iconColor = batch.delta === 0
            ? 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40'
            : 'text-amber-700 bg-amber-100 dark:bg-amber-900/40';
    } else if (actionType === 'add_batch') {
        message = `Đã thêm lô thực tế mới cho ${product.productName}`;
        icon = 'fa-plus';
        iconColor = 'text-blue-600 bg-blue-100 dark:bg-blue-900/40';
    } else if (actionType === 'remove_batch') {
        message = `Đã bỏ lô mới khỏi ${product.productName}`;
        icon = 'fa-trash-can';
        iconColor = 'text-rose-600 bg-rose-100 dark:bg-rose-900/40';
    } else if (actionType === 'edit_name') {
        message = `${product.productName}: cập nhật tên lô thành ${details.newName}`;
        icon = 'fa-pen-to-square';
    } else if (actionType === 'edit_expiry') {
        message = `${product.productName}: cập nhật HSD thành ${details.newDate}`;
        icon = 'fa-calendar-days';
        iconColor = 'text-amber-700 bg-amber-100 dark:bg-amber-900/40';
    } else if (actionType === 'edit_cost') {
        message = `${product.productName}: cập nhật giá vốn lô mới thành ${formatCurrency(details.costPrice)}`;
        icon = 'fa-coins';
    }

    activityLogs.unshift({
        timeStr: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        message,
        icon,
        iconColor,
        timestamp: Date.now()
    });
    activityLogs = activityLogs.slice(0, 200);
    renderActivityLogs();
}

function renderActivityLogs() {
    if (!activityLogs.length) {
        els.activityLogContent.innerHTML = '<div class="text-center text-slate-400 text-sm font-semibold py-8 italic">Chưa có thao tác nào được ghi nhận.</div>';
        els.logBadge.classList.add('hidden');
        els.logBadge.classList.remove('flex');
        return;
    }

    els.logBadge.textContent = activityLogs.length > 99 ? '99+' : activityLogs.length;
    els.logBadge.classList.remove('hidden');
    els.logBadge.classList.add('flex');
    els.activityLogContent.innerHTML = activityLogs.map(log => `
        <div class="flex gap-3 items-start">
            <div class="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-sm ${log.iconColor}"><i class="fa-solid ${log.icon}" aria-hidden="true"></i></div>
            <div class="flex-1 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">${escapeHTML(log.message)}</p>
                <span class="text-xs font-bold text-slate-400 mt-1 block">${escapeHTML(log.timeStr)}</span>
            </div>
        </div>
    `).join('');
}

function updateProgress() {
    const summary = summarizeStocktake(groupedProducts);
    els.logProgressBar.style.width = `${summary.percent}%`;
    els.logProgressTrack.setAttribute('aria-valuenow', String(summary.percent));
    els.logProgressText.textContent = `${summary.verified} / ${summary.total} lô đã kiểm`;
    els.logProgressPercent.textContent = `${summary.percent}%`;
    els.mobileProgressBadge.textContent = `${summary.verified}/${summary.total}`;
    els.pendingCount.textContent = summary.pending;
    els.matchedCount.textContent = summary.matched;
    els.discrepancyCount.textContent = summary.discrepancy;
    return summary;
}

function updateAuditTotals() {
    const summary = summarizeStocktake(groupedProducts);
    els.totalLossVal.textContent = formatCurrency(summary.lossValue);
    els.totalGainVal.textContent = formatCurrency(summary.gainValue);
}

function toggleLogDrawer(show) {
    els.activityLogDrawer.classList.toggle('translate-x-full', !show);
    els.activityLogOverlay.classList.toggle('hidden', !show);
    requestAnimationFrame(() => els.activityLogOverlay.classList.toggle('opacity-0', !show));
    if (show) els.closeLogDrawerBtn.focus();
}

function getFilteredProducts() {
    const query = els.auditProductSearch.value.toLocaleLowerCase('vi').trim();
    const status = els.auditStatusFilter.value;
    return groupedProducts.filter(product => {
        const matchSearch = !query
            || String(product.productName || '').toLocaleLowerCase('vi').includes(query)
            || String(product.productCode || '').toLocaleLowerCase('vi').includes(query);
        let matchCategory = true;
        if (currentFilter === 'dose') matchCategory = product.isDoseCut;
        if (currentFilter === 'eco') matchCategory = product.isEcommerce;
        if (currentFilter === 'normal') matchCategory = !product.isDoseCut && !product.isEcommerce;
        const matchStatus = status === 'all'
            || product.batches.some(batch => getBatchVerificationState(batch) === status);
        return matchSearch && matchCategory && matchStatus;
    });
}

function statusBadge(state) {
    if (state === 'matched') return '<span class="batch-status inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold"><i class="fa-solid fa-check" aria-hidden="true"></i>Đã khớp</span>';
    if (state === 'discrepancy') return '<span class="batch-status inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-bold"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>Có lệch</span>';
    return '<span class="batch-status inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold"><i class="fa-regular fa-circle" aria-hidden="true"></i>Chưa kiểm</span>';
}

function renderLines() {
    const filtered = getFilteredProducts();
    const visible = filtered.slice(0, visibleProductLimit);
    const filteredBatchCount = filtered.reduce((sum, product) => sum + product.batches.length, 0);
    const visibleBatchCount = visible.reduce((sum, product) => sum + product.batches.length, 0);
    els.auditLinesCount.textContent = filteredBatchCount === visibleBatchCount
        ? `${filteredBatchCount} lô hàng`
        : `Đang hiện ${visibleBatchCount}/${filteredBatchCount} lô`;

    if (!visible.length) {
        els.auditCardsContainer.innerHTML = `
            <div class="py-12 text-center text-slate-500 font-semibold w-full">
                <i class="fa-solid fa-magnifying-glass text-3xl mb-3 block text-slate-300" aria-hidden="true"></i>
                Không tìm thấy lô hàng phù hợp. Hãy đổi bộ lọc hoặc từ khóa.
            </div>`;
        els.loadMoreAuditBtn.classList.add('hidden');
        updateAuditTotals();
        updateProgress();
        return;
    }

    els.auditCardsContainer.innerHTML = visible.map(product => {
        const totalSystem = product.batches.reduce((sum, batch) => sum + Number(batch.systemQuantity || 0), 0);
        const totalDelta = product.batches.reduce((sum, batch) => sum + Number(batch.delta || 0), 0);
        const totalDeltaValue = product.batches.reduce((sum, batch) => sum + Number(batch.deltaValue || 0), 0);
        const hasDiscrepancy = product.batches.some(batch => getBatchVerificationState(batch) === 'discrepancy');
        const borderClass = hasDiscrepancy ? 'border-amber-300 dark:border-amber-700/60' : 'border-slate-200 dark:border-slate-800';
        const productId = escapeHTML(product.productId);

        const batchesHtml = product.batches.map(batch => {
            const state = getBatchVerificationState(batch);
            const inputId = `count-${String(batch.batchId).replace(/[^a-zA-Z0-9_-]/g, '')}`;
            const deltaClass = batch.delta < 0 ? 'text-rose-600' : batch.delta > 0 ? 'text-emerald-600' : 'text-slate-500';
            const rowClass = state === 'discrepancy' ? 'bg-amber-50/50 dark:bg-amber-950/20' : '';
            const countValue = batch.isVerified ? escapeHTML(batch.countedQuantity) : '';
            return `
                <div class="batch-item p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${rowClass}" data-batch-row-id="${escapeHTML(batch.batchId)}" data-parent-id="${productId}">
                    <div class="flex flex-col gap-2 flex-1 min-w-0">
                        <div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
                            <label class="flex items-center gap-2 text-sm font-bold"><span class="text-xs text-slate-500">Lô</span><input type="text" maxlength="120" data-action="edit-batch-name" data-batch-id="${escapeHTML(batch.batchId)}" data-parent-id="${productId}" value="${escapeHTML(batch.batchNumber)}" class="h-11 w-full sm:w-40 px-2 text-sm font-black bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"></label>
                            <label class="flex items-center gap-2 text-sm font-bold"><span class="text-xs text-slate-500">HSD</span><input type="date" data-action="edit-batch-expiry" data-batch-id="${escapeHTML(batch.batchId)}" data-parent-id="${productId}" value="${escapeHTML(batch.expiryDate)}" class="h-11 w-full sm:w-40 px-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none [color-scheme:light] dark:[color-scheme:dark]"></label>
                        </div>
                        <div class="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                            <span>Tồn PM: <strong class="tabular-nums">${batch.systemQuantity} ${escapeHTML(product.baseUnit)}</strong></span>
                            ${batch.isNewBatch ? `<label class="flex items-center gap-2">Giá vốn <input type="number" min="0" inputmode="decimal" data-action="edit-batch-cost" data-batch-id="${escapeHTML(batch.batchId)}" data-parent-id="${productId}" value="${escapeHTML(batch.costPrice)}" class="h-11 w-32 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"></label>` : `<span>Giá vốn: <strong>${formatCurrency(batch.costPrice)}</strong></span>`}
                            ${statusBadge(state)}
                            ${batch.isNewBatch ? `<button type="button" data-action="remove-new-batch" data-product-id="${productId}" data-batch-id="${escapeHTML(batch.batchId)}" class="min-h-11 px-3 rounded-lg text-rose-700 dark:text-rose-300 font-bold touch-action"><i class="fa-solid fa-trash-can mr-1" aria-hidden="true"></i>Bỏ lô</button>` : ''}
                        </div>
                    </div>
                    <div class="flex items-end gap-3 bg-slate-100 dark:bg-slate-800/60 p-3 rounded-xl lg:bg-transparent lg:dark:bg-transparent lg:p-0">
                        <div class="flex-1 lg:flex-none">
                            <label for="${inputId}" class="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Số thực tế</label>
                            <input id="${inputId}" type="number" min="0" step="1" inputmode="numeric" placeholder="${batch.systemQuantity}" value="${countValue}" data-batch-id="${escapeHTML(batch.batchId)}" data-parent-id="${productId}" class="audit-row-input w-full lg:w-32 h-12 px-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-center text-base font-black text-violet-700 dark:text-violet-300 outline-none focus:ring-2 focus:ring-violet-500 transition-colors shadow-inner tabular-nums">
                        </div>
                        <div class="w-28 text-right shrink-0">
                            <span class="block text-xs font-bold text-slate-500">Độ lệch</span>
                            <div class="row-delta-qty text-base font-black ${deltaClass}">${batch.delta > 0 ? '+' : ''}${batch.delta}</div>
                            <div class="row-delta-val text-xs font-bold ${deltaClass}">${batch.deltaValue > 0 ? '+' : ''}${formatCurrency(batch.deltaValue)}</div>
                        </div>
                    </div>
                </div>`;
        }).join('');

        return `
            <div class="product-card flex flex-col bg-white dark:bg-slate-900 rounded-2xl border ${borderClass} shadow-sm overflow-hidden" data-product-id="${productId}">
                <div class="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800/50">
                    <div class="flex items-start gap-3 min-w-0">
                        <div class="w-11 h-11 rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 flex items-center justify-center shrink-0"><i class="fa-solid fa-box" aria-hidden="true"></i></div>
                        <div class="min-w-0"><h3 class="text-base font-black text-slate-800 dark:text-slate-100 leading-snug">${escapeHTML(product.productName)}</h3><p class="text-xs font-bold text-slate-500 mt-1">${escapeHTML(product.productCode)}</p></div>
                    </div>
                    <div class="flex flex-wrap items-center gap-2 text-sm">
                        ${product.isDoseCut ? '<span class="px-2 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">Thuốc liều</span>' : ''}
                        ${product.isEcommerce ? '<span class="px-2 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">TMĐT</span>' : ''}
                        <span class="font-bold text-slate-600 dark:text-slate-300">Tồn PM: ${totalSystem} ${escapeHTML(product.baseUnit)}</span>
                        <span data-product-delta="${productId}" class="px-2 py-1 rounded-lg font-black ${totalDelta === 0 ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' : 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'}">Lệch ${totalDelta > 0 ? '+' : ''}${totalDelta} · ${totalDeltaValue > 0 ? '+' : ''}${formatCurrency(totalDeltaValue)}</span>
                    </div>
                </div>
                <div class="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">${batchesHtml}</div>
                <div class="p-3 bg-slate-50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                    <button type="button" data-action="add-batch" data-product-id="${productId}" class="touch-action min-h-11 px-4 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"><i class="fa-solid fa-plus mr-1.5" aria-hidden="true"></i>Thêm lô thực tế</button>
                </div>
            </div>`;
    }).join('');

    els.loadMoreAuditBtn.classList.toggle('hidden', visible.length >= filtered.length);
    updateAuditTotals();
    updateProgress();
}

function updateBatchVisuals(input, batch, product) {
    const row = input.closest('.batch-item');
    if (!row) return;
    const state = getBatchVerificationState(batch);
    const deltaClass = batch.delta < 0 ? 'text-rose-600' : batch.delta > 0 ? 'text-emerald-600' : 'text-slate-500';
    row.querySelector('.row-delta-qty').className = `row-delta-qty text-base font-black ${deltaClass}`;
    row.querySelector('.row-delta-qty').textContent = `${batch.delta > 0 ? '+' : ''}${batch.delta}`;
    row.querySelector('.row-delta-val').className = `row-delta-val text-xs font-bold ${deltaClass}`;
    row.querySelector('.row-delta-val').textContent = `${batch.deltaValue > 0 ? '+' : ''}${formatCurrency(batch.deltaValue)}`;
    row.classList.toggle('bg-amber-50/50', state === 'discrepancy');
    row.classList.toggle('dark:bg-amber-950/20', state === 'discrepancy');
    const badge = row.querySelector('.batch-status');
    if (badge) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = statusBadge(state);
        badge.replaceWith(wrapper.firstElementChild);
    }

    const card = row.closest('.product-card');
    const hasDiscrepancy = product.batches.some(item => getBatchVerificationState(item) === 'discrepancy');
    const totalDelta = product.batches.reduce((sum, item) => sum + Number(item.delta || 0), 0);
    const totalDeltaValue = product.batches.reduce((sum, item) => sum + Number(item.deltaValue || 0), 0);
    const deltaBadge = card?.querySelector(`[data-product-delta="${product.productId}"]`);
    if (deltaBadge) {
        deltaBadge.textContent = `Lệch ${totalDelta > 0 ? '+' : ''}${totalDelta} · ${totalDeltaValue > 0 ? '+' : ''}${formatCurrency(totalDeltaValue)}`;
        deltaBadge.className = `px-2 py-1 rounded-lg font-black ${totalDelta === 0 ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' : 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'}`;
        deltaBadge.dataset.productDelta = product.productId;
    }
    card?.classList.toggle('border-amber-300', hasDiscrepancy);
    card?.classList.toggle('dark:border-amber-700/60', hasDiscrepancy);
    card?.classList.toggle('border-slate-200', !hasDiscrepancy);
    card?.classList.toggle('dark:border-slate-800', !hasDiscrepancy);
}

function handleRowValueChange(input) {
    const product = groupedProducts.find(item => item.productId === input.dataset.parentId);
    const batch = product?.batches.find(item => item.batchId === input.dataset.batchId);
    if (!batch) return false;

    const rawValue = input.value.trim();
    const value = rawValue === '' ? Number(batch.systemQuantity || 0) : Number(rawValue);
    if (!Number.isInteger(value) || value < 0) {
        input.setCustomValidity('Số lượng phải là số nguyên không âm.');
        input.reportValidity();
        return false;
    }

    input.setCustomValidity('');
    input.value = String(value);
    batch.countedQuantity = value;
    batch.isVerified = true;
    batch.delta = value - Number(batch.systemQuantity || 0);
    batch.deltaValue = batch.delta * Number(batch.costPrice || 0);
    updateBatchVisuals(input, batch, product);
    updateAuditTotals();
    updateProgress();
    logActivityAction('count', product.productId, batch.batchId);
    scheduleDraftSave();
    return true;
}

function handleAddBatch(productId) {
    const product = groupedProducts.find(item => item.productId === productId);
    if (!product) return;
    const batch = {
        batchId: `new_${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`,
        batchNumber: '',
        originalBatchNumber: '',
        expiryDate: new Date().toISOString().slice(0, 10),
        systemQuantity: 0,
        countedQuantity: 0,
        costPrice: 0,
        delta: 0,
        deltaValue: 0,
        isNewBatch: true,
        isVerified: false
    };
    product.batches.push(batch);
    els.auditStatusFilter.value = 'all';
    logActivityAction('add_batch', productId, batch.batchId);
    renderLines();
    scheduleDraftSave();
    requestAnimationFrame(() => document.querySelector(`[data-action="edit-batch-name"][data-batch-id="${batch.batchId}"]`)?.focus());
}

function handleRemoveNewBatch(productId, batchId) {
    const product = groupedProducts.find(item => item.productId === productId);
    const batch = product?.batches.find(item => item.batchId === batchId);
    if (!batch?.isNewBatch) return;
    product.batches = product.batches.filter(item => item.batchId !== batchId);
    logActivityAction('remove_batch', productId, batchId);
    renderLines();
    scheduleDraftSave();
}

async function showRestoreDraftPrompt(draft) {
    const batchCount = draft.lines.reduce((sum, product) => sum + (product.batches?.length || 0), 0);
    const verifiedCount = draft.lines.reduce((sum, product) => sum + (product.batches || []).filter(batch => batch.isVerified).length, 0);
    els.restoreDraftDescription.textContent = `Nháp được lưu lúc ${new Date(draft.timestamp).toLocaleString('vi-VN')}. Anh/chị có thể tiếp tục đúng vị trí đang làm.`;
    els.restoreDraftSummary.innerHTML = `
        <div class="rounded-xl bg-slate-100 dark:bg-slate-800 p-3"><span class="block text-xs text-slate-500">Mã phiếu</span><strong>${escapeHTML(draft.docCode || 'Chưa có')}</strong></div>
        <div class="rounded-xl bg-slate-100 dark:bg-slate-800 p-3"><span class="block text-xs text-slate-500">Tiến độ</span><strong>${verifiedCount}/${batchCount} lô</strong></div>`;
    els.restoreDraftModal.classList.remove('hidden');
    els.restoreDraftModal.classList.add('flex');
    els.restoreDraftBtn.focus();
    return new Promise(resolve => {
        els.restoreDraftBtn.onclick = () => resolve(true);
        els.discardDraftBtn.onclick = () => resolve(false);
    }).finally(() => {
        els.restoreDraftModal.classList.add('hidden');
        els.restoreDraftModal.classList.remove('flex');
    });
}

async function restoreDraftIfAvailable() {
    const draft = await loadNewestStocktakeDraft(supabaseClient);
    if (!draft) return;
    const ageDays = (Date.now() - Number(draft.timestamp || 0)) / 86400000;
    if (ageDays > 7) {
        await deleteStocktakeDraftEverywhere(supabaseClient);
        return;
    }

    const shouldRestore = await showRestoreDraftPrompt(draft);
    if (!shouldRestore) {
        await deleteStocktakeDraftEverywhere(supabaseClient);
        setDraftStatus('Đã bỏ nháp cũ', 'local');
        return;
    }

    groupedProducts = applyStocktakeDraft(groupedProducts, draft);
    els.auditDocCode.value = draft.docCode || els.auditDocCode.value;
    els.auditDateInput.value = draft.auditDate || els.auditDateInput.value;
    els.auditReasonSelect.value = ['stocktake', 'correction', 'other'].includes(draft.reason) ? draft.reason : 'stocktake';
    els.auditNoteInput.value = draft.note || '';
    activityLogs = Array.isArray(draft.activityLogs) ? draft.activityLogs : [];
    hasDraftChanges = true;
    renderLines();
    renderActivityLogs();
    setDraftStatus('Đã phục hồi phiếu nháp', 'saved');
}

function summaryCard(label, value, tone = 'slate') {
    const tones = {
        slate: 'bg-slate-100 dark:bg-slate-800',
        emerald: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300',
        amber: 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300',
        rose: 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300'
    };
    return `<div class="rounded-xl p-3 ${tones[tone]}"><span class="block text-xs opacity-75">${escapeHTML(label)}</span><strong class="text-lg tabular-nums">${escapeHTML(value)}</strong></div>`;
}

function openCompletionModal() {
    const { summary } = canCompleteStocktake(groupedProducts);
    if (!summary.total) {
        showToast('Không có lô hàng nào để hoàn thành phiếu kiểm.', 'error');
        return;
    }
    els.completeAuditSummary.innerHTML = [
        summaryCard('Tổng lô', summary.total),
        summaryCard('Đã khớp', summary.matched, 'emerald'),
        summaryCard('Có lệch', summary.discrepancy, 'amber'),
        summaryCard('Chưa kiểm', summary.pending, summary.pending ? 'rose' : 'slate')
    ].join('');
    els.pendingAuditWarning.classList.toggle('hidden', summary.pending === 0);
    els.allowPendingAudit.checked = false;
    els.confirmCompleteAuditBtn.disabled = summary.pending > 0;
    els.completeAuditError.classList.add('hidden');
    els.completeAuditModal.classList.remove('hidden');
    els.completeAuditModal.classList.add('flex');
    (summary.pending ? els.allowPendingAudit : els.confirmCompleteAuditBtn).focus();
}

function closeCompletionModal() {
    els.completeAuditModal.classList.add('hidden');
    els.completeAuditModal.classList.remove('flex');
    els.submitAuditDocBtn.focus();
}

async function submitAuditDocument() {
    if (isSubmitting) return;
    const allowPending = els.allowPendingAudit.checked;
    const completion = canCompleteStocktake(groupedProducts, allowPending);
    if (!completion.allowed) {
        els.completeAuditError.textContent = 'Hãy kiểm đủ các lô hoặc xác nhận rõ việc dùng số tồn phần mềm cho lô chưa kiểm.';
        els.completeAuditError.classList.remove('hidden');
        return;
    }

    const linesToAdjust = buildStocktakeCompletionLines(groupedProducts);
    if (!linesToAdjust.length) {
        els.completeAuditError.textContent = 'Không có dòng hàng hóa hợp lệ để ghi nhận.';
        els.completeAuditError.classList.remove('hidden');
        return;
    }

    isSubmitting = true;
    els.confirmCompleteAuditBtn.disabled = true;
    els.confirmCompleteAuditBtn.innerHTML = '<i class="fa-solid fa-circle-notch animate-spin" aria-hidden="true"></i> Đang ghi phiếu...';
    try {
        await applyStocktakeDocumentAtomic({
            note: els.auditNoteInput.value,
            reason: els.auditReasonSelect.value,
            lines: linesToAdjust
        });

        try {
            const { logActivity } = await import('../logs/auditService.js');
            await logActivity('stocktake_adjustment', {
                reason: els.auditReasonSelect.value,
                note: els.auditNoteInput.value,
                audit_date: els.auditDateInput.value,
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
        } catch (logError) {
            console.warn('Không thể ghi nhật ký phụ của phiếu kiểm:', logError?.message || logError);
        }

        await deleteStocktakeDraftEverywhere(supabaseClient);
        hasDraftChanges = false;
        showToast('Đã hoàn thành và ghi nhận phiếu kiểm kê.', 'success');
        setTimeout(() => { window.location.href = 'inventory.html'; }, 700);
    } catch (error) {
        console.error('Lỗi hoàn thành phiếu kiểm:', error);
        await persistDraft({ syncRemote: true });
        els.completeAuditError.textContent = `Chưa thể ghi phiếu: ${error?.message || 'Vui lòng kiểm tra mạng và thử lại.'} Nháp vẫn được giữ an toàn.`;
        els.completeAuditError.classList.remove('hidden');
        els.confirmCompleteAuditBtn.disabled = false;
    } finally {
        isSubmitting = false;
        els.confirmCompleteAuditBtn.innerHTML = 'Xác nhận điều chỉnh tồn';
    }
}

async function loadInventoryData() {
    const products = await fetchInventoryProducts();
    groupedProducts = (products || [])
        .filter(product => !String(product.categories?.name || '').toLocaleLowerCase('vi').includes('combo'))
        .sort((left, right) => String(left.name || '').localeCompare(String(right.name || ''), 'vi'))
        .map(product => {
            const baseUnit = product.product_units?.find(unit => unit.is_base_unit)?.unit_name || 'ĐV';
            const batches = (product.product_batches || [])
                .filter(batch => Number(batch.stock_quantity || 0) > 0)
                .map(batch => ({
                    batchId: batch.id,
                    batchNumber: batch.batch_number,
                    originalBatchNumber: batch.batch_number,
                    expiryDate: batch.expiry_date,
                    systemQuantity: Number(batch.stock_quantity || 0),
                    countedQuantity: Number(batch.stock_quantity || 0),
                    costPrice: Number(batch.cost_price || 0),
                    delta: 0,
                    deltaValue: 0,
                    isNewBatch: false,
                    isVerified: false
                }));
            return {
                productId: product.id,
                productName: product.name,
                productCode: product.product_code,
                isDoseCut: isDoseIngredientProduct(product),
                isEcommerce: isEcommerceProduct(product),
                baseUnit,
                batches
            };
        })
        .filter(product => product.batches.length > 0);
    renderLines();
}

function handleQueryParameters() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('productId');
    const batchId = params.get('batchId');
    if (!productId || !batchId) return;
    requestAnimationFrame(() => {
        const input = document.querySelector(`.audit-row-input[data-batch-id="${CSS.escape(batchId)}"]`);
        const batchRow = input?.closest('.batch-item');
        const productCard = input?.closest('.product-card');
        if (!input) return;
        input.focus();
        input.select();
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        batchRow?.classList.add('ring-2', 'ring-violet-500/40');
        productCard?.classList.add('shadow-lg', 'shadow-violet-500/10');
    });
}

function updateFilterButtons() {
    document.querySelectorAll('.filter-btn').forEach(button => {
        const active = button.dataset.filter === currentFilter;
        button.setAttribute('aria-pressed', String(active));
        button.classList.toggle('bg-white', active);
        button.classList.toggle('dark:bg-slate-700', active);
        button.classList.toggle('shadow-sm', active);
        button.classList.toggle('text-slate-800', active);
        button.classList.toggle('dark:text-slate-100', active);
        button.classList.toggle('text-slate-600', !active);
        button.classList.toggle('dark:text-slate-300', !active);
    });
}

function bindEvents() {
    els.submitAuditDocBtn.addEventListener('click', openCompletionModal);
    els.cancelCompleteAuditBtn.addEventListener('click', closeCompletionModal);
    els.confirmCompleteAuditBtn.addEventListener('click', submitAuditDocument);
    els.allowPendingAudit.addEventListener('change', () => {
        els.confirmCompleteAuditBtn.disabled = !els.allowPendingAudit.checked;
        els.completeAuditError.classList.add('hidden');
    });

    els.openLogDrawerBtn.addEventListener('click', () => toggleLogDrawer(true));
    els.closeLogDrawerBtn.addEventListener('click', () => toggleLogDrawer(false));
    els.activityLogOverlay.addEventListener('click', () => toggleLogDrawer(false));

    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', () => {
            currentFilter = button.dataset.filter;
            visibleProductLimit = 40;
            updateFilterButtons();
            renderLines();
        });
    });
    els.auditStatusFilter.addEventListener('change', () => {
        visibleProductLimit = 40;
        renderLines();
    });
    els.auditProductSearch.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            visibleProductLimit = 40;
            renderLines();
        }, 120);
    });
    els.loadMoreAuditBtn.addEventListener('click', () => {
        visibleProductLimit += 40;
        renderLines();
    });

    [els.auditDateInput, els.auditReasonSelect, els.auditNoteInput].forEach(input => {
        input.addEventListener('change', scheduleDraftSave);
    });
    els.auditNoteInput.addEventListener('input', scheduleDraftSave);

    els.auditCardsContainer.addEventListener('click', event => {
        const addButton = event.target.closest('[data-action="add-batch"]');
        if (addButton) handleAddBatch(addButton.dataset.productId);
        const removeButton = event.target.closest('[data-action="remove-new-batch"]');
        if (removeButton) handleRemoveNewBatch(removeButton.dataset.productId, removeButton.dataset.batchId);
    });

    els.auditCardsContainer.addEventListener('change', event => {
        const countInput = event.target.closest('.audit-row-input');
        if (countInput) {
            handleRowValueChange(countInput);
            return;
        }
        const action = event.target.dataset.action;
        if (!action) return;
        const product = groupedProducts.find(item => item.productId === event.target.dataset.parentId);
        const batch = product?.batches.find(item => item.batchId === event.target.dataset.batchId);
        if (!batch) return;
        if (action === 'edit-batch-name') {
            batch.batchNumber = event.target.value.trim();
            logActivityAction('edit_name', product.productId, batch.batchId, { newName: batch.batchNumber });
        } else if (action === 'edit-batch-expiry') {
            batch.expiryDate = event.target.value;
            logActivityAction('edit_expiry', product.productId, batch.batchId, { newDate: batch.expiryDate });
        } else if (action === 'edit-batch-cost') {
            const cost = Number(event.target.value);
            if (!Number.isFinite(cost) || cost < 0) {
                event.target.value = batch.costPrice;
                showToast('Giá vốn phải là số không âm.', 'error');
                return;
            }
            batch.costPrice = cost;
            batch.deltaValue = batch.delta * cost;
            logActivityAction('edit_cost', product.productId, batch.batchId, { costPrice: cost });
            renderLines();
        }
        scheduleDraftSave();
    });

    els.auditCardsContainer.addEventListener('keydown', event => {
        const input = event.target.closest('.audit-row-input');
        if (!input || event.key !== 'Enter') return;
        event.preventDefault();
        if (!handleRowValueChange(input)) return;
        const inputs = Array.from(els.auditCardsContainer.querySelectorAll('.audit-row-input'));
        const next = inputs[inputs.indexOf(input) + 1];
        if (next) {
            next.focus();
            next.select();
            next.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
    });

    els.saveAndExitBtn.addEventListener('click', async () => {
        els.saveAndExitBtn.disabled = true;
        await persistDraft({ syncRemote: true });
        window.location.href = 'inventory.html';
    });
    els.discardAuditBtn.addEventListener('click', async () => {
        if (!confirm('Bỏ toàn bộ phiếu kiểm kê đang làm? Nháp trên máy và máy chủ cũng sẽ bị xóa.')) return;
        await deleteStocktakeDraftEverywhere(supabaseClient);
        hasDraftChanges = false;
        window.location.href = 'inventory.html';
    });

    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        if (!els.completeAuditModal.classList.contains('hidden')) closeCompletionModal();
        else if (!els.activityLogDrawer.classList.contains('translate-x-full') && window.innerWidth < 1280) toggleLogDrawer(false);
    });

    window.addEventListener('beforeunload', () => {
        if (!hasDraftChanges) return;
        try {
            localStorage.setItem(STOCKTAKE_DRAFT_KEY, JSON.stringify(buildCurrentDraft()));
        } catch {
            // Best effort only; IndexedDB and remote autosave already run during the session.
        }
    });
    autosaveInterval = setInterval(() => {
        if (hasDraftChanges) persistDraft({ syncRemote: true });
    }, 30000);
}

async function initPage() {
    if (!await initLayout('admin', 'inventory')) return;
    els.auditDateInput.value = new Date().toISOString().slice(0, 10);
    els.auditDocCode.value = generateDocCode();
    try {
        await loadInventoryData();
        await restoreDraftIfAvailable();
        bindEvents();
        handleQueryParameters();
        document.body.dataset.stocktakeReady = 'true';
    } catch (error) {
        console.error('Không thể khởi tạo phiếu kiểm kê:', error);
        els.auditCardsContainer.innerHTML = `<div class="py-12 px-4 text-center text-rose-700 dark:text-rose-300 font-bold" role="alert">Không tải được dữ liệu kiểm kê. ${escapeHTML(error?.message || 'Vui lòng kiểm tra kết nối và tải lại trang.')}</div>`;
    }
}

document.addEventListener('DOMContentLoaded', initPage);

window.addEventListener('pagehide', () => {
    clearInterval(autosaveInterval);
});
