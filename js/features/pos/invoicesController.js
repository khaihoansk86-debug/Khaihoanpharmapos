// js/features/pos/invoicesController.js
import { fetchOrders, fetchOrderDetail } from './orderService.js';
import { initLayout } from '../../components/layout.js';

// ─── Formatters ───────────────────────────────────────────────────────────────
const vnd = (n) => new Intl.NumberFormat('vi-VN').format(n || 0) + 'đ';
const escHtml = (s) => {
    if (!s) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
};

// ─── Badge trạng thái ─────────────────────────────────────────────────────────
const STATUS_LABEL = { completed: 'Hoàn thành', cancelled: 'Đã huỷ', draft: 'Nháp' };
const STATUS_CLASS = {
    completed: 'status-completed',
    cancelled: 'status-cancelled',
    draft:     'status-draft',
};

function statusBadge(status, extraClass = '') {
    const cls   = STATUS_CLASS[status] || STATUS_CLASS.draft;
    const label = STATUS_LABEL[status] || status || 'Nháp';
    return `<span class="${cls} ${extraClass} px-2.5 py-1 rounded-lg text-xs font-black uppercase">${label}</span>`;
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initLayout('admin', 'invoices');
    loadOrders();

    // ── Event delegation toàn trang ─────────────────────────────
    document.addEventListener('click', (e) => {
        const action = e.target.closest('[data-action]')?.dataset.action;
        if (action) {
            const handlers = {
                'load-orders':        () => loadOrders(),
                'reset-filter':       () => resetFilter(),
                'close-order-detail': () => closeModal(),
                'print-order':        () => printOrder(),
            };
            if (handlers[action]) { handlers[action](); return; }
        }

        // Click row hoặc ô xem để mở modal
        const rowEl = e.target.closest('[data-order-id]');
        if (rowEl && !e.target.closest('[data-action]')) {
            openModal(rowEl.dataset.orderId);
        }
    });

    // Đóng modal khi click backdrop
    document.getElementById('orderDetailModal')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal();
    });

    // Đóng modal bằng Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    // Debounce search khi gõ phím (Enter cũng trigger)
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let debounce;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounce);
            debounce = setTimeout(() => loadOrders(), 400);
        });
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { clearTimeout(debounce); loadOrders(); }
        });
    }

    // Trigger tìm kiếm khi đổi trạng thái
    document.getElementById('statusFilter')?.addEventListener('change', () => loadOrders());
});

// ─── LOAD & RENDER DANH SÁCH ──────────────────────────────────────────────────
async function loadOrders() {
    const search   = document.getElementById('searchInput')?.value.trim()  || '';
    const dateFrom = document.getElementById('dateFrom')?.value             || '';
    const dateTo   = document.getElementById('dateTo')?.value               || '';
    const status   = document.getElementById('statusFilter')?.value         || '';

    setSearchLoading(true);
    showState('loading');

    try {
        let orders = await fetchOrders({ search, dateFrom, dateTo, limit: 200 });

        // Client-side status filter (orderService chưa hỗ trợ param này)
        if (status) orders = orders.filter(o => o.status === status);

        renderTable(orders);
    } catch (err) {
        console.error('[invoices] Lỗi tải hóa đơn:', err);
        showState('empty');
        setLabel('Lỗi tải dữ liệu');
    } finally {
        setSearchLoading(false);
    }
}

function renderTable(orders) {
    const body = document.getElementById('ordersTableBody');
    if (!body) return;

    setLabel(`Tìm thấy ${orders.length} hóa đơn`);

    if (!orders.length) { showState('empty'); return; }

    body.innerHTML = orders.map(order => {
        const date  = new Date(order.created_at).toLocaleString('vi-VN');
        const total = vnd(order.total);
        const customerName  = escHtml(order.customer_name  || 'Khách lẻ');
        const customerPhone = escHtml(order.customer_phone || '—');
        const code          = escHtml(order.order_code);

        return `
        <tr class="hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors cursor-pointer group"
            data-order-id="${escHtml(order.id)}"
            aria-label="Xem hóa đơn ${code}">
            <td class="py-4 px-5">
                <span class="font-mono font-black text-blue-600 dark:text-blue-400 text-sm group-hover:underline">${code}</span>
            </td>
            <td class="py-4 px-5 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">${date}</td>
            <td class="py-4 px-5 font-semibold text-slate-800 dark:text-white">${customerName}</td>
            <td class="py-4 px-5 text-sm text-slate-500 dark:text-slate-400 font-mono">${customerPhone}</td>
            <td class="py-4 px-5 text-center">
                <span class="text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                    ${order.item_count ?? '—'}
                </span>
            </td>
            <td class="py-4 px-5 text-right font-black text-slate-800 dark:text-white whitespace-nowrap">${total}</td>
            <td class="py-4 px-5 text-center">${statusBadge(order.status)}</td>
            <td class="py-4 px-5 text-center">
                <span data-order-id="${escHtml(order.id)}"
                    class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400
                           hover:text-blue-600 hover:bg-blue-100 dark:hover:text-blue-400 dark:hover:bg-blue-900/30
                           transition-colors"
                    title="Xem chi tiết"
                    role="button"
                    aria-label="Xem chi tiết hóa đơn ${code}">
                    <i class="fa-solid fa-eye text-sm pointer-events-none"></i>
                </span>
            </td>
        </tr>`;
    }).join('');

    showState('table');
}

// ─── MODAL CHI TIẾT HÓA ĐƠN ──────────────────────────────────────────────────
let _currentOrder = null; // lưu để dùng khi in

async function openModal(orderId) {
    _currentOrder = null;
    showModalState('loading');
    document.getElementById('orderDetailModal').classList.remove('hidden');
    document.getElementById('orderDetailModal').scrollTop = 0;

    try {
        const order = await fetchOrderDetail(orderId);
        _currentOrder = order;
        populateModal(order);
        showModalState('content');
    } catch (err) {
        console.error('[invoices] Lỗi tải chi tiết:', err);
        closeModal();
        showToast('Không thể tải chi tiết hóa đơn: ' + err.message, 'error');
    }
}

function populateModal(order) {
    // Header
    const code = order.order_code || '—';
    document.getElementById('modalOrderCode').textContent   = code;
    document.getElementById('modalPrintCode').textContent   = code;

    // Thông tin khách
    document.getElementById('modalCustomerName').textContent  = order.customer_name  || 'Khách lẻ';
    document.getElementById('modalCustomerPhone').textContent = order.customer_phone || '—';
    document.getElementById('modalCreatedAt').textContent     = new Date(order.created_at).toLocaleString('vi-VN');

    // Trạng thái
    const statusEl = document.getElementById('modalStatus');
    statusEl.textContent = STATUS_LABEL[order.status] || order.status || 'Nháp';
    statusEl.className   = `text-xs font-black uppercase px-2.5 py-1 rounded-lg ${STATUS_CLASS[order.status] || STATUS_CLASS.draft}`;

    // Danh sách hàng
    const items = order.items || [];
    document.getElementById('modalItemsBody').innerHTML = items.length
        ? items.map(item => `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td class="py-3 px-4 font-medium text-slate-800 dark:text-white">${escHtml(item.product_name)}</td>
                <td class="py-3 px-4 text-center text-xs font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">${escHtml(item.unit_name)}</td>
                <td class="py-3 px-4 text-center font-black text-slate-700 dark:text-slate-200">${item.quantity}</td>
                <td class="py-3 px-4 text-right text-slate-500 dark:text-slate-400 whitespace-nowrap">${vnd(item.unit_price)}</td>
                <td class="py-3 px-4 text-right font-bold text-slate-800 dark:text-white whitespace-nowrap">${vnd(item.total_price)}</td>
            </tr>`).join('')
        : `<tr><td colspan="5" class="py-8 text-center text-slate-400 italic text-sm">Không có mặt hàng</td></tr>`;

    // Tổng tiền
    document.getElementById('modalSubtotal').textContent       = vnd(order.subtotal);
    document.getElementById('modalDiscount').textContent       = '−' + vnd(order.discount || 0);
    document.getElementById('modalTotal').textContent          = vnd(order.total);
    document.getElementById('modalAmountReceived').textContent = vnd(order.amount_received || 0);
    document.getElementById('modalChange').textContent         = vnd(order.change_amount   || 0);

    // Ghi chú
    const noteSection = document.getElementById('modalNoteSection');
    if (order.note) {
        document.getElementById('modalNote').textContent = order.note;
        noteSection.classList.remove('hidden');
    } else {
        noteSection.classList.add('hidden');
    }
}

function closeModal() {
    document.getElementById('orderDetailModal').classList.add('hidden');
    _currentOrder = null;
}

// ─── IN HÓA ĐƠN ──────────────────────────────────────────────────────────────
function printOrder() {
    if (!_currentOrder) return;
    const o = _currentOrder;

    const itemRows = (o.items || []).map(item => `
        <tr>
            <td style="padding:4px 0;vertical-align:top">${escHtml(item.product_name)}</td>
            <td style="padding:4px 4px;text-align:center;white-space:nowrap">${escHtml(item.unit_name)}</td>
            <td style="padding:4px 4px;text-align:center;font-weight:700">${item.quantity}</td>
            <td style="padding:4px 0;text-align:right;white-space:nowrap">${vnd(item.total_price)}</td>
        </tr>`).join('');

    const printEl = document.getElementById('printArea');
    printEl.innerHTML = `
        <div style="max-width:380px;margin:0 auto;font-family:Inter,sans-serif;font-size:13px;color:#111">
            <!-- Header -->
            <div style="text-align:center;margin-bottom:12px">
                <div style="font-size:18px;font-weight:900;letter-spacing:1px">NHÀ THUỐC KHẢI HOÀN</div>
                <div style="font-size:11px;color:#666;margin-top:2px">Hóa đơn bán hàng</div>
            </div>

            <div class="print-divider"></div>

            <!-- Thông tin hóa đơn -->
            <table style="width:100%;font-size:12px;margin:8px 0">
                <tr><td style="color:#555;width:50%">Mã HĐ:</td><td style="font-weight:700;font-family:monospace">${escHtml(o.order_code)}</td></tr>
                <tr><td style="color:#555">Ngày giờ:</td><td>${new Date(o.created_at).toLocaleString('vi-VN')}</td></tr>
                <tr><td style="color:#555">Khách hàng:</td><td style="font-weight:600">${escHtml(o.customer_name || 'Khách lẻ')}</td></tr>
                ${o.customer_phone ? `<tr><td style="color:#555">SĐT:</td><td>${escHtml(o.customer_phone)}</td></tr>` : ''}
            </table>

            <div class="print-divider"></div>

            <!-- Danh sách hàng -->
            <table style="width:100%;font-size:12px;border-collapse:collapse;margin:8px 0">
                <thead>
                    <tr style="border-bottom:1px solid #ccc;font-weight:700;color:#444">
                        <th style="text-align:left;padding:4px 0">Tên hàng</th>
                        <th style="text-align:center;padding:4px 4px">ĐVT</th>
                        <th style="text-align:center;padding:4px 4px">SL</th>
                        <th style="text-align:right;padding:4px 0">Thành tiền</th>
                    </tr>
                </thead>
                <tbody>${itemRows}</tbody>
            </table>

            <div class="print-divider"></div>

            <!-- Tổng tiền -->
            <table style="width:100%;font-size:12px;margin:8px 0">
                <tr><td style="color:#555">Tiền hàng:</td><td style="text-align:right">${vnd(o.subtotal)}</td></tr>
                ${(o.discount || 0) > 0 ? `<tr><td style="color:#555">Giảm giá:</td><td style="text-align:right;color:#c00">−${vnd(o.discount)}</td></tr>` : ''}
                <tr style="font-weight:900;font-size:15px;border-top:2px solid #111;margin-top:4px">
                    <td style="padding-top:6px">TỔNG THANH TOÁN:</td>
                    <td style="text-align:right;padding-top:6px">${vnd(o.total)}</td>
                </tr>
                <tr style="font-size:11px;color:#555;margin-top:4px">
                    <td>Khách đưa:</td>
                    <td style="text-align:right">${vnd(o.amount_received)}</td>
                </tr>
                <tr style="font-size:11px;color:#555">
                    <td>Tiền thừa:</td>
                    <td style="text-align:right">${vnd(o.change_amount)}</td>
                </tr>
            </table>

            ${o.note ? `<div class="print-divider"></div><div style="font-size:11px;color:#666;font-style:italic">Ghi chú: ${escHtml(o.note)}</div>` : ''}

            <div class="print-divider" style="margin-top:12px"></div>
            <div style="text-align:center;font-size:11px;color:#888;margin-top:8px">
                Cảm ơn quý khách đã mua hàng!<br>
                <span style="font-weight:700">Nhà thuốc Khải Hoàn</span>
            </div>
        </div>`;

    window.print();
}

// ─── BỘ LỌC ──────────────────────────────────────────────────────────────────
function resetFilter() {
    const ids = ['searchInput', 'dateFrom', 'dateTo', 'statusFilter'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    loadOrders();
}

// ─── UI HELPERS ───────────────────────────────────────────────────────────────

/** Hiển thị đúng 1 trong 3 trạng thái: 'loading' | 'empty' | 'table' */
function showState(state) {
    document.getElementById('loadingState')?.classList.toggle('hidden',  state !== 'loading');
    document.getElementById('emptyState')?.classList.toggle('hidden',    state !== 'empty');
    document.getElementById('tableWrapper')?.classList.toggle('hidden',  state !== 'table');

    // flex cần được restore vì hidden override nó
    if (state === 'empty') {
        document.getElementById('emptyState')?.classList.add('flex');
    }
}

function showModalState(state) {
    document.getElementById('modalLoadingState')?.classList.toggle('hidden', state !== 'loading');
    document.getElementById('modalContent')?.classList.toggle('hidden',      state !== 'content');
}

function setLabel(text) {
    const el = document.getElementById('totalOrdersLabel');
    if (el) el.textContent = text;
}

function setSearchLoading(loading) {
    const btn  = document.getElementById('searchBtn');
    const icon = btn?.querySelector('i');
    if (!btn) return;
    btn.disabled = loading;
    if (icon) {
        icon.className = loading
            ? 'fa-solid fa-spinner animate-spin'
            : 'fa-solid fa-magnifying-glass';
    }
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('invoiceToast');
    if (!toast) return;

    const colors = {
        success: 'bg-emerald-600 text-white',
        error:   'bg-red-600 text-white',
        info:    'bg-blue-600 text-white',
    };
    const icons = {
        success: 'fa-circle-check',
        error:   'fa-circle-xmark',
        info:    'fa-circle-info',
    };

    toast.className = [
        'fixed top-5 right-5 z-[9999] flex items-center gap-3',
        'px-5 py-3 rounded-xl shadow-2xl text-sm font-bold',
        'transition-all duration-300',
        colors[type] || colors.info,
    ].join(' ');
    toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${message}</span>`;
    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-x-4');
        setTimeout(() => {
            toast.classList.add('hidden');
            toast.classList.remove('opacity-0', 'translate-x-4');
        }, 300);
    }, 3500);
}
