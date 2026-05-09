// js/features/inventory/inventoryController.js
import { initLayout } from '../../components/layout.js';
import {
    fetchExpiredBatches,
    fetchNearExpiryBatches,
    fetchStockAlerts,
    daysUntilExpiry,
} from './inventoryService.js';

// ─── Constants ────────────────────────────────────────────────────────────────
const DEFAULT_EXPIRY_DAYS     = 90;   // ngưỡng cảnh báo hết hạn (ngày)
const DEFAULT_LOW_STOCK_LIMIT = 10;   // ngưỡng cảnh báo sắp hết (đơn vị)

// ─── Formatters ───────────────────────────────────────────────────────────────
const escHtml = (s) => {
    if (!s) return '—';
    return String(s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

const fmtDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('vi-VN');
};

// ─── State ────────────────────────────────────────────────────────────────────
let state = {
    expired:    [],
    nearExpiry: [],
    outOfStock: [],
    lowStock:   [],
    expiryDays: DEFAULT_EXPIRY_DAYS,
    lowLimit:   DEFAULT_LOW_STOCK_LIMIT,
    loading:    true,
    error:      null,
};

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initLayout('admin', 'inventory');
    bindEvents();
    loadAllAlerts();
});

function bindEvents() {
    // Tất cả click qua event delegation
    document.addEventListener('click', (e) => {
        const action = e.target.closest('[data-action]')?.dataset.action;
        if (!action) return;

        const handlers = {
            'toggle-section': () => {
                const sectionId = e.target.closest('[data-action]').dataset.section;
                toggleSection(sectionId);
            },
            'refresh-alerts': () => loadAllAlerts(),
            'apply-settings': () => applySettings(),
        };

        if (handlers[action]) handlers[action]();
    });
}

// ─── LOAD DATA ────────────────────────────────────────────────────────────────
async function loadAllAlerts() {
    setGlobalLoading(true);

    try {
        const [expired, nearExpiry, stockResult] = await Promise.all([
            fetchExpiredBatches(),
            fetchNearExpiryBatches(state.expiryDays),
            fetchStockAlerts(state.lowLimit),
        ]);

        state.expired    = expired;
        state.nearExpiry = nearExpiry;
        state.outOfStock = stockResult.outOfStock;
        state.lowStock   = stockResult.lowStock;
        state.error      = null;

        renderAll();
    } catch (err) {
        console.error('[inventory] Lỗi tải cảnh báo:', err);
        state.error = err.message;
        renderError(err.message);
    } finally {
        setGlobalLoading(false);
    }
}

// ─── RENDER ───────────────────────────────────────────────────────────────────
function renderAll() {
    renderStatCards();
    renderExpiredSection();
    renderNearExpirySection();
    renderOutOfStockSection();
    renderLowStockSection();

    // Hiện trang, ẩn loader
    document.getElementById('pageLoading')?.classList.add('hidden');
    document.getElementById('pageContent')?.classList.remove('hidden');
}

// ── Stat Cards ────────────────────────────────────────────────────────────────
function renderStatCards() {
    const cards = [
        {
            id:    'statExpired',
            count: state.expired.length,
            label: 'Lô đã hết hạn',
            icon:  'fa-skull-crossbones',
            bg:    'bg-red-600',
            text:  'text-white',
            sub:   'Có tồn kho, cần xử lý',
        },
        {
            id:    'statNearExpiry',
            count: state.nearExpiry.length,
            label: `Lô sắp hết hạn`,
            icon:  'fa-clock',
            bg:    'bg-orange-500',
            text:  'text-white',
            sub:   `Trong ${state.expiryDays} ngày tới`,
        },
        {
            id:    'statOutOfStock',
            count: state.outOfStock.length,
            label: 'Hàng hết tồn',
            icon:  'fa-box-open',
            bg:    'bg-slate-700',
            text:  'text-white',
            sub:   'Cần nhập thêm hàng',
        },
        {
            id:    'statLowStock',
            count: state.lowStock.length,
            label: 'Hàng sắp hết',
            icon:  'fa-triangle-exclamation',
            bg:    'bg-yellow-400',
            text:  'text-slate-900',
            sub:   `Tồn ≤ ${state.lowLimit} đơn vị`,
        },
    ];

    const container = document.getElementById('statCardsRow');
    if (!container) return;

    container.innerHTML = cards.map(c => `
        <div class="flex-1 min-w-[180px] ${c.bg} ${c.text} rounded-2xl p-5 flex items-center gap-4 shadow-md" id="${c.id}">
            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <i class="fa-solid ${c.icon} text-xl"></i>
            </div>
            <div>
                <div class="text-3xl font-black leading-none">${c.count}</div>
                <div class="font-bold text-sm mt-0.5 opacity-95">${c.label}</div>
                <div class="text-xs opacity-75 mt-0.5">${c.sub}</div>
            </div>
        </div>`).join('');
}

// ── Section toggle ────────────────────────────────────────────────────────────
function toggleSection(sectionId) {
    const body = document.getElementById(sectionId + 'Body');
    const icon = document.getElementById(sectionId + 'Icon');
    if (!body) return;
    const isHidden = body.classList.toggle('hidden');
    if (icon) icon.className = `fa-solid ${isHidden ? 'fa-chevron-down' : 'fa-chevron-up'} text-slate-400 transition-transform`;
}

// ── Template: Section wrapper ─────────────────────────────────────────────────
function sectionWrapper({ id, title, count, badgeClass, icon, children }) {
    return `
    <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <!-- Section header -->
        <button type="button" data-action="toggle-section" data-section="${id}"
            class="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
            aria-expanded="true"
            aria-controls="${id}Body">
            <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl ${badgeClass} flex items-center justify-center flex-shrink-0">
                    <i class="fa-solid ${icon} text-sm"></i>
                </div>
                <span class="font-black text-slate-800 dark:text-white text-base">${title}</span>
                <span class="${badgeClass} text-xs font-black px-2.5 py-1 rounded-full">${count}</span>
            </div>
            <i id="${id}Icon" class="fa-solid fa-chevron-up text-slate-400 transition-transform"></i>
        </button>

        <!-- Section body -->
        <div id="${id}Body">
            ${children}
        </div>
    </div>`;
}

// ── Template: empty row ───────────────────────────────────────────────────────
function emptyRow(colspan, message) {
    return `
    <tr>
        <td colspan="${colspan}" class="py-10 text-center text-slate-400 dark:text-slate-500">
            <i class="fa-solid fa-circle-check text-emerald-500 text-2xl mb-2 block"></i>
            <span class="text-sm font-medium">${message}</span>
        </td>
    </tr>`;
}

// ── Section 1: Lô đã hết hạn ─────────────────────────────────────────────────
function renderExpiredSection() {
    const container = document.getElementById('sectionExpired');
    if (!container) return;

    const rows = state.expired.length
        ? state.expired.map(batch => {
            const days   = daysUntilExpiry(batch.expiry_date); // âm = quá hạn
            const p      = batch.products || {};
            return `
            <tr class="hover:bg-red-50/40 dark:hover:bg-red-900/10 transition-colors">
                <td class="py-3.5 px-5">
                    <div class="font-bold text-slate-800 dark:text-white">${escHtml(p.name)}</div>
                    <div class="text-xs text-slate-400 font-mono">${escHtml(p.product_code)}</div>
                </td>
                <td class="py-3.5 px-5 text-xs text-slate-500 dark:text-slate-400">${escHtml(p.categories?.name)}</td>
                <td class="py-3.5 px-5 font-mono text-sm font-bold text-slate-700 dark:text-slate-300">${escHtml(batch.batch_number)}</td>
                <td class="py-3.5 px-5 text-center">
                    <span class="font-black text-red-600 dark:text-red-400">${batch.stock_quantity}</span>
                </td>
                <td class="py-3.5 px-5 text-sm">${fmtDate(batch.expiry_date)}</td>
                <td class="py-3.5 px-5 text-center">
                    <span class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-black px-2.5 py-1 rounded-full whitespace-nowrap">
                        Quá ${Math.abs(days)} ngày
                    </span>
                </td>
            </tr>`;
        }).join('')
        : emptyRow(6, 'Không có lô nào hết hạn còn tồn kho');

    container.innerHTML = sectionWrapper({
        id:         'sectionExpired',
        title:      'Lô đã hết hạn (còn tồn kho)',
        count:      state.expired.length,
        badgeClass: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
        icon:       'fa-skull-crossbones',
        children:   batchTable(rows),
    });
}

// ── Section 2: Lô sắp hết hạn ────────────────────────────────────────────────
function renderNearExpirySection() {
    const container = document.getElementById('sectionNearExpiry');
    if (!container) return;

    const rows = state.nearExpiry.length
        ? state.nearExpiry.map(batch => {
            const days = daysUntilExpiry(batch.expiry_date);
            const p    = batch.products || {};

            let urgency;
            if (days <= 30)      urgency = { cls: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',       label: `Còn ${days} ngày` };
            else if (days <= 60) urgency = { cls: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400', label: `Còn ${days} ngày` };
            else                 urgency = { cls: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400', label: `Còn ${days} ngày` };

            return `
            <tr class="hover:bg-orange-50/40 dark:hover:bg-orange-900/10 transition-colors">
                <td class="py-3.5 px-5">
                    <div class="font-bold text-slate-800 dark:text-white">${escHtml(p.name)}</div>
                    <div class="text-xs text-slate-400 font-mono">${escHtml(p.product_code)}</div>
                </td>
                <td class="py-3.5 px-5 text-xs text-slate-500 dark:text-slate-400">${escHtml(p.categories?.name)}</td>
                <td class="py-3.5 px-5 font-mono text-sm font-bold text-slate-700 dark:text-slate-300">${escHtml(batch.batch_number)}</td>
                <td class="py-3.5 px-5 text-center font-bold text-slate-700 dark:text-slate-300">${batch.stock_quantity}</td>
                <td class="py-3.5 px-5 text-sm">${fmtDate(batch.expiry_date)}</td>
                <td class="py-3.5 px-5 text-center">
                    <span class="${urgency.cls} text-xs font-black px-2.5 py-1 rounded-full whitespace-nowrap">${urgency.label}</span>
                </td>
            </tr>`;
        }).join('')
        : emptyRow(6, 'Không có lô nào sắp hết hạn');

    container.innerHTML = sectionWrapper({
        id:         'sectionNearExpiry',
        title:      `Lô sắp hết hạn (trong ${state.expiryDays} ngày)`,
        count:      state.nearExpiry.length,
        badgeClass: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
        icon:       'fa-clock',
        children:   batchTable(rows),
    });
}

// ── Section 3: Hàng hết tồn ──────────────────────────────────────────────────
function renderOutOfStockSection() {
    const container = document.getElementById('sectionOutOfStock');
    if (!container) return;

    const rows = state.outOfStock.length
        ? state.outOfStock.map(p => `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td class="py-3.5 px-5">
                    <div class="font-bold text-slate-800 dark:text-white">${escHtml(p.name)}</div>
                    <div class="text-xs text-slate-400 font-mono">${escHtml(p.product_code)}</div>
                </td>
                <td class="py-3.5 px-5 text-xs text-slate-500 dark:text-slate-400">${escHtml(p.categories?.name)}</td>
                <td class="py-3.5 px-5 text-center">
                    <span class="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold px-2 py-0.5 rounded">${escHtml(p.base_unit_name)}</span>
                </td>
                <td class="py-3.5 px-5 text-center">
                    <span class="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-black px-3 py-1 rounded-full">0</span>
                </td>
                <td class="py-3.5 px-5 text-center">
                    <span class="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-black px-2.5 py-1 rounded-full">Hết hàng</span>
                </td>
            </tr>`).join('')
        : emptyRow(5, 'Không có sản phẩm nào hết tồn kho');

    container.innerHTML = sectionWrapper({
        id:         'sectionOutOfStock',
        title:      'Hàng hết tồn kho',
        count:      state.outOfStock.length,
        badgeClass: 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
        icon:       'fa-box-open',
        children:   productTable(rows),
    });
}

// ── Section 4: Hàng sắp hết ───────────────────────────────────────────────────
function renderLowStockSection() {
    const container = document.getElementById('sectionLowStock');
    if (!container) return;

    const rows = state.lowStock.length
        ? state.lowStock.map(p => {
            const pct = Math.max(5, Math.round((p.total_stock / state.lowLimit) * 100));
            return `
            <tr class="hover:bg-yellow-50/50 dark:hover:bg-yellow-900/10 transition-colors">
                <td class="py-3.5 px-5">
                    <div class="font-bold text-slate-800 dark:text-white">${escHtml(p.name)}</div>
                    <div class="text-xs text-slate-400 font-mono">${escHtml(p.product_code)}</div>
                </td>
                <td class="py-3.5 px-5 text-xs text-slate-500 dark:text-slate-400">${escHtml(p.categories?.name)}</td>
                <td class="py-3.5 px-5 text-center">
                    <span class="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold px-2 py-0.5 rounded">${escHtml(p.base_unit_name)}</span>
                </td>
                <td class="py-3.5 px-5">
                    <div class="flex items-center gap-2">
                        <span class="font-black text-yellow-700 dark:text-yellow-400 w-8 text-right">${p.total_stock}</span>
                        <div class="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2 min-w-[60px]">
                            <div class="bg-yellow-400 h-2 rounded-full transition-all" style="width:${Math.min(pct, 100)}%"></div>
                        </div>
                        <span class="text-xs text-slate-400">/ ${state.lowLimit}</span>
                    </div>
                </td>
                <td class="py-3.5 px-5 text-center">
                    <span class="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 text-xs font-black px-2.5 py-1 rounded-full">Sắp hết</span>
                </td>
            </tr>`;
        }).join('')
        : emptyRow(5, `Không có sản phẩm nào có tồn ≤ ${state.lowLimit} đơn vị`);

    container.innerHTML = sectionWrapper({
        id:         'sectionLowStock',
        title:      `Hàng sắp hết (tồn ≤ ${state.lowLimit} đơn vị)`,
        count:      state.lowStock.length,
        badgeClass: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
        icon:       'fa-triangle-exclamation',
        children:   productTable(rows),
    });
}

// ── Table templates ───────────────────────────────────────────────────────────
function batchTable(rows) {
    return `
    <div class="overflow-x-auto border-t border-slate-100 dark:border-slate-800">
        <table class="w-full text-left text-sm" aria-label="Danh sách lô">
            <thead class="bg-slate-50 dark:bg-slate-800/60 text-xs font-black text-slate-500 uppercase tracking-wider">
                <tr>
                    <th class="py-3 px-5">Sản phẩm</th>
                    <th class="py-3 px-5">Nhóm hàng</th>
                    <th class="py-3 px-5">Số lô</th>
                    <th class="py-3 px-5 text-center">Tồn lô</th>
                    <th class="py-3 px-5">Hạn SD</th>
                    <th class="py-3 px-5 text-center">Trạng thái</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">${rows}</tbody>
        </table>
    </div>`;
}

function productTable(rows) {
    return `
    <div class="overflow-x-auto border-t border-slate-100 dark:border-slate-800">
        <table class="w-full text-left text-sm" aria-label="Danh sách sản phẩm">
            <thead class="bg-slate-50 dark:bg-slate-800/60 text-xs font-black text-slate-500 uppercase tracking-wider">
                <tr>
                    <th class="py-3 px-5">Sản phẩm</th>
                    <th class="py-3 px-5">Nhóm hàng</th>
                    <th class="py-3 px-5 text-center">ĐVT</th>
                    <th class="py-3 px-5">Tồn kho</th>
                    <th class="py-3 px-5 text-center">Trạng thái</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">${rows}</tbody>
        </table>
    </div>`;
}

// ─── Settings ─────────────────────────────────────────────────────────────────
function applySettings() {
    const expiryInput = document.getElementById('settingExpiryDays');
    const stockInput  = document.getElementById('settingLowStock');

    const newDays  = parseInt(expiryInput?.value, 10);
    const newLimit = parseInt(stockInput?.value, 10);

    if (newDays  > 0) state.expiryDays = newDays;
    if (newLimit > 0) state.lowLimit   = newLimit;

    loadAllAlerts();
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────
function setGlobalLoading(loading) {
    document.getElementById('pageLoading')?.classList.toggle('hidden', !loading);
    document.getElementById('pageContent')?.classList.toggle('hidden', loading);

    const refreshBtn = document.getElementById('refreshBtn');
    const icon       = refreshBtn?.querySelector('i');
    if (refreshBtn) refreshBtn.disabled = loading;
    if (icon) icon.className = loading ? 'fa-solid fa-spinner animate-spin' : 'fa-solid fa-rotate';
}

function renderError(message) {
    document.getElementById('pageLoading')?.classList.add('hidden');
    document.getElementById('pageContent')?.classList.remove('hidden');

    const errorEl = document.getElementById('globalError');
    if (errorEl) {
        errorEl.innerHTML = `
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5 flex items-start gap-3 text-red-700 dark:text-red-400">
                <i class="fa-solid fa-circle-exclamation text-xl mt-0.5 flex-shrink-0"></i>
                <div>
                    <p class="font-bold">Lỗi tải dữ liệu cảnh báo</p>
                    <p class="text-sm mt-1 opacity-80">${escHtml(message)}</p>
                </div>
            </div>`;
        errorEl.classList.remove('hidden');
    }
}
