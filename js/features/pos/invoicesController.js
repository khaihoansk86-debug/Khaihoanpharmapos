// js/features/pos/invoicesController.js
import { fetchOrders, fetchOrderDetail, cancelOrder } from './orderService.js';
import { initLayout } from '../../components/layout.js';

let currentOrder = null;

// Helper format tiền
const vnd = (v) => new Intl.NumberFormat('vi-VN').format(v || 0) + 'đ';
const escHtml = (str) => {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
};

const STATUS_LABEL = { completed: 'Hoàn thành', cancelled: 'Đã hủy', draft: 'Nháp' };
const STATUS_CLASS = {
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    draft:     'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
};

function statusBadge(status) {
    const label = STATUS_LABEL[status] || status || 'Nháp';
    const cls   = STATUS_CLASS[status] || STATUS_CLASS.draft;
    return `<span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${cls}">${label}</span>`;
}

// ============================================================
// KHỞI TẠO (Run immediately as it is a module)
// ============================================================
initLayout('admin', 'invoices');
loadOrders();

// Lắng nghe các sự kiện Click
document.addEventListener('click', (e) => {
    const actionButton = e.target.closest('[data-action]');
    const action = actionButton?.dataset.action;
    if (action) {
        const handlers = {
            'load-orders':        () => loadOrders(),
            'reset-filter':       () => resetFilter(),
            'close-order-detail': () => closeModal(),
            'open-edit-order':    () => openEditOrderInPOS(),
            'open-return-order':  () => openReturnOrderInPOS(),
            'cancel-order':       () => cancelCurrentOrder(),
            'print-order':        () => printOrder(),
        };
        if (handlers[action]) { handlers[action](); return; }
    }

    const returnTarget = e.target.closest('[data-return-order-id]');
    if (returnTarget) {
        e.stopPropagation();
        window.location.href = `pos.html?returnOrder=${encodeURIComponent(returnTarget.dataset.returnOrderId)}`;
        return;
    }

    const rowEl = e.target.closest('[data-order-id]');
    if (rowEl && !e.target.closest('[data-action]')) {
        openModal(rowEl.dataset.orderId);
    }
});

// Đóng modal khi click backdrop
document.getElementById('orderDetailModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
});

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

document.getElementById('statusFilter')?.addEventListener('change', () => loadOrders());

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
            data-order-id="${escHtml(order.id)}">
            <td class="py-4 px-5">
                <span class="font-mono font-black text-blue-600 dark:text-blue-400 text-sm group-hover:underline">${code}</span>
            </td>
            <td class="py-4 px-5 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">${date}</td>
            <td class="py-4 px-5 font-semibold text-slate-800 dark:text-white">${customerName}</td>
            <td class="py-4 px-5 text-sm text-slate-500 dark:text-slate-400 font-mono">${customerPhone}</td>
            <td class="py-4 px-5 text-center">
                <span class="text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                    ${order.item_count ?? (order.items?.length || '—')}
                </span>
            </td>
            <td class="py-4 px-5 text-right font-black text-slate-800 dark:text-white whitespace-nowrap">${total}</td>
            <td class="py-4 px-5 text-center">${statusBadge(order.status)}</td>
            <td class="py-4 px-5 text-center flex items-center justify-center gap-1">
                <button type="button" data-order-id="${order.id}" class="text-slate-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                    <i class="fa-solid fa-eye pointer-events-none"></i>
                </button>
                <button type="button" data-return-order-id="${order.id}" class="text-slate-400 hover:text-emerald-600 p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors">
                    <i class="fa-solid fa-rotate-left pointer-events-none"></i>
                </button>
            </td>
        </tr>`;
    }).join('');

    showState('table');
}

// ─── MODAL CHI TIẾT HÓA ĐƠN ──────────────────────────────────────────────────
async function openModal(orderId) {
    showModalState('loading');
    document.getElementById('orderDetailModal').classList.remove('hidden');

    try {
        const order = await fetchOrderDetail(orderId);
        currentOrder = order;

        // Điền thông tin
        document.getElementById('modalOrderCode').textContent = order.order_code;
        document.getElementById('modalCustomerName').textContent = order.customer_name || 'Khách lẻ';
        document.getElementById('modalCustomerPhone').textContent = order.customer_phone || '—';
        document.getElementById('modalCreatedAt').textContent = new Date(order.created_at).toLocaleString('vi-VN');
        
        const statusEl = document.getElementById('modalStatus');
        statusEl.textContent = STATUS_LABEL[order.status] || order.status;
        statusEl.className = `text-xs font-black uppercase px-2.5 py-1 rounded-lg ${STATUS_CLASS[order.status] || STATUS_CLASS.draft}`;

        // Items
        const itemsBody = document.getElementById('modalItemsBody');
        itemsBody.innerHTML = (order.items || []).map(item => `
            <tr>
                <td class="py-3 px-4 font-medium text-slate-800 dark:text-white">${item.product_name}</td>
                <td class="py-3 px-4 text-center text-xs font-bold text-blue-600">${item.unit_name}</td>
                <td class="py-3 px-4 text-center font-bold">${item.quantity}</td>
                <td class="py-3 px-4 text-right">${vnd(item.unit_price)}</td>
                <td class="py-3 px-4 text-right font-bold">${vnd(item.total_price)}</td>
            </tr>
        `).join('');

        // Tài chính
        document.getElementById('modalSubtotal').textContent = vnd(order.subtotal);
        document.getElementById('modalDiscount').textContent = '−' + vnd(order.discount || 0);
        document.getElementById('modalTotal').textContent = vnd(order.total);
        document.getElementById('modalAmountReceived').textContent = vnd(order.amount_received || 0);
        document.getElementById('modalChange').textContent = vnd(order.change_amount || 0);

        // Nút bấm
        const canModify = order.status !== 'cancelled';
        document.getElementById('modalEditOrderButton')?.classList.toggle('hidden', !canModify);
        document.getElementById('modalCancelOrderButton')?.classList.toggle('hidden', !canModify);
        document.getElementById('modalReturnOrderButton')?.classList.toggle('hidden', !canModify);

        // Ghi chú
        const noteSection = document.getElementById('modalNoteSection');
        if (order.note) {
            document.getElementById('modalNote').textContent = order.note;
            noteSection.classList.remove('hidden');
        } else {
            noteSection.classList.add('hidden');
        }

        showModalState('content');
    } catch (err) {
        console.error('[invoices] Lỗi tải chi tiết:', err);
        alert('Không thể tải chi tiết: ' + err.message);
        closeModal();
    }
}

function closeModal() {
    document.getElementById('orderDetailModal').classList.add('hidden');
    currentOrder = null;
}

function printOrder() {
    if (!currentOrder) return;
    const o = currentOrder;
    const itemRows = (o.items || []).map(item => `
        <tr>
            <td>${escHtml(item.product_name)}</td>
            <td style="text-align:center">${escHtml(item.unit_name)}</td>
            <td style="text-align:center">${item.quantity}</td>
            <td style="text-align:right">${vnd(item.total_price)}</td>
        </tr>`).join('');

    const printEl = document.getElementById('printArea');
    printEl.innerHTML = `
        <div style="max-width:380px;margin:0 auto;font-family:sans-serif;font-size:13px;">
            <div style="text-align:center;margin-bottom:15px">
                <h2 style="margin:0">NHÀ THUỐC KHẢI HOÀN</h2>
                <p style="margin:5px 0">Hóa đơn bán hàng</p>
            </div>
            <div style="margin-bottom:10px">
                <p>Mã HĐ: <b>${o.order_code}</b></p>
                <p>Khách hàng: ${o.customer_name || 'Khách lẻ'}</p>
                <p>Thời gian: ${new Date(o.created_at).toLocaleString('vi-VN')}</p>
            </div>
            <table style="width:100%;border-collapse:collapse;margin-bottom:15px">
                <thead><tr style="border-bottom:1px solid #000"><th style="text-align:left">Tên</th><th>ĐVT</th><th>SL</th><th style="text-align:right">Tiền</th></tr></thead>
                <tbody>${itemRows}</tbody>
            </table>
            <div style="border-top:1px solid #000;padding-top:10px;text-align:right">
                <p>Tiền hàng: ${vnd(o.subtotal)}</p>
                <p>Giảm giá: -${vnd(o.discount)}</p>
                <p><b>Tổng cộng: ${vnd(o.total)}</b></p>
            </div>
        </div>`;
    window.print();
}

function openEditOrderInPOS() { if (currentOrder) window.location.href = `pos.html?editOrder=${currentOrder.id}`; }
function openReturnOrderInPOS() { if (currentOrder) window.location.href = `pos.html?returnOrder=${currentOrder.id}`; }

async function cancelCurrentOrder() {
    if (!currentOrder || currentOrder.status === 'cancelled') return;
    const reason = prompt(`Nhập lý do hủy hóa đơn ${currentOrder.order_code}:`);
    if (!reason?.trim()) return;
    if (!confirm('Xác nhận hủy hóa đơn này?')) return;

    try {
        await cancelOrder(currentOrder.id, reason.trim());
        await openModal(currentOrder.id);
        await loadOrders();
    } catch (err) {
        alert('Lỗi: ' + err.message);
    }
}

function showState(state) {
    document.getElementById('loadingState')?.classList.toggle('hidden', state !== 'loading');
    document.getElementById('emptyState')?.classList.toggle('hidden', state !== 'empty');
    document.getElementById('tableWrapper')?.classList.toggle('hidden', state !== 'table');
    if (state === 'empty') document.getElementById('emptyState')?.classList.add('flex');
}

function showModalState(state) {
    document.getElementById('modalLoadingState')?.classList.toggle('hidden', state !== 'loading');
    document.getElementById('modalContent')?.classList.toggle('hidden', state !== 'content');
}

function setLabel(text) { if (document.getElementById('totalOrdersLabel')) document.getElementById('totalOrdersLabel').textContent = text; }
function setSearchLoading(loading) {
    const btn = document.getElementById('searchBtn');
    if (btn) btn.disabled = loading;
    const icon = btn?.querySelector('i');
    if (icon) icon.className = loading ? 'fa-solid fa-spinner animate-spin' : 'fa-solid fa-magnifying-glass';
}
function resetFilter() {
    ['searchInput', 'dateFrom', 'dateTo', 'statusFilter'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    loadOrders();
}
