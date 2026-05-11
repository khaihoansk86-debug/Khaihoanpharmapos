// js/features/pos/invoicesController.js
import { fetchOrders, fetchOrderDetail, cancelOrder } from './orderService.js';
import { initLayout } from '../../components/layout.js';

let currentOrder = null;

const vnd = (v) => new Intl.NumberFormat('vi-VN').format(Math.abs(v || 0)) + 'đ';
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
// KHỞI TẠO
// ============================================================
initLayout('admin', 'invoices');
loadOrders();

document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    const action = btn?.dataset.action;
    if (action) {
        const handlers = {
            'load-orders':        () => loadOrders(),
            'reset-filter':       () => resetFilter(),
            'close-order-detail': () => closeModal(),
            'open-edit-order':    () => openEditOrderInPOS(),
            'open-return-order':  () => openReturnOrderInPOS(),
            'cancel-order':       () => cancelCurrentOrder(),
            'print-order':        () => printOrder(),
            'toggle-filter':      () => toggleSidebar()
        };
        if (handlers[action]) { handlers[action](); return; }
    }

    const row = e.target.closest('[data-order-id]');
    if (row && !e.target.closest('[data-action]')) {
        openModal(row.dataset.orderId);
    }
});

function toggleSidebar() {
    const sidebar = document.getElementById('invoiceFilterSidebar');
    if (sidebar) sidebar.classList.toggle('hidden');
}

const searchInput = document.getElementById('searchInput');
if (searchInput) {
    let debounce;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => loadOrders(), 400);
    });
}

// ─── LOAD & RENDER ──────────────────────────────────────────────────
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
        const isReturn = order.total < 0;
        const total = (isReturn ? '-' : '') + vnd(order.total);
        const customerName  = escHtml(order.customer_name  || 'Khách lẻ');
        const code          = escHtml(order.order_code);

        return `
        <tr class="hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors cursor-pointer group" data-order-id="${escHtml(order.id)}">
            <td class="py-4 px-6">
                <span class="font-mono font-black ${isReturn ? 'text-emerald-600' : 'text-blue-600'} text-xs group-hover:underline">${code}</span>
            </td>
            <td class="py-4 px-6 text-xs font-medium text-slate-500 dark:text-slate-400">${date}</td>
            <td class="py-4 px-6 font-bold text-slate-800 dark:text-white text-sm">${customerName}</td>
            <td class="py-4 px-6 text-right font-black text-slate-800 dark:text-white text-sm whitespace-nowrap">${total}</td>
            <td class="py-4 px-6 text-center">${statusBadge(order.status)}</td>
            <td class="py-4 px-6 text-center">
                <i class="fa-solid fa-chevron-right text-[10px] text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all"></i>
            </td>
        </tr>`;
    }).join('');

    showState('table');
}

// ─── MODAL ─────────────────────────────────────────────────────────
async function openModal(orderId) {
    showModalState('loading');
    document.getElementById('orderDetailModal').classList.remove('hidden');

    try {
        const order = await fetchOrderDetail(orderId);
        currentOrder = order;

        document.getElementById('modalOrderCode').textContent = order.order_code;
        document.getElementById('modalCustomerName').textContent = order.customer_name || 'Khách lẻ';
        document.getElementById('modalCustomerPhone').textContent = order.customer_phone || '---';
        document.getElementById('modalCreatedAt').textContent = new Date(order.created_at).toLocaleString('vi-VN');
        
        const statusEl = document.getElementById('modalStatus');
        statusEl.textContent = STATUS_LABEL[order.status] || order.status;
        statusEl.className = `inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${STATUS_CLASS[order.status] || STATUS_CLASS.draft}`;

        const itemsBody = document.getElementById('modalItemsBody');
        itemsBody.innerHTML = (order.items || []).map(item => {
            const isReturn = item.total_price < 0;
            // Hiển thị thông tin lô nếu có
            const batchInfo = item.batch_id ? `<div class="text-[10px] text-slate-400 font-medium">Lô: <span class="font-bold text-blue-500">${item.batch_no || '---'}</span> | Hạn dùng: <span class="font-bold text-orange-500">${item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('vi-VN') : '---'}</span></div>` : '';
            
            return `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td class="py-3 px-4">
                    <div class="font-bold text-slate-800 dark:text-white text-xs">${item.product_name}</div>
                    ${batchInfo}
                </td>
                <td class="py-3 px-4 text-center text-[10px] font-black text-slate-400 uppercase">${item.unit_name}</td>
                <td class="py-3 px-4 text-center font-black text-xs">${item.quantity}</td>
                <td class="py-3 px-4 text-right font-black text-xs ${isReturn ? 'text-emerald-600' : 'text-slate-800 dark:text-white'}">${(isReturn ? '-' : '') + vnd(item.total_price)}</td>
            </tr>
        `}).join('');

        document.getElementById('modalSubtotal').textContent = vnd(order.subtotal);
        document.getElementById('modalDiscount').textContent = '-' + vnd(order.discount || 0);
        document.getElementById('modalTotal').textContent = (order.total < 0 ? '-' : '') + vnd(order.total);

        const canModify = order.status !== 'cancelled';
        document.getElementById('modalEditOrderButton')?.classList.toggle('hidden', !canModify || order.total < 0);
        document.getElementById('modalCancelOrderButton')?.classList.toggle('hidden', !canModify);
        document.getElementById('modalReturnOrderButton')?.classList.toggle('hidden', !canModify || order.total < 0);

        const noteSection = document.getElementById('modalNoteSection');
        if (order.note) {
            document.getElementById('modalNote').textContent = order.note;
            noteSection.classList.remove('hidden');
        } else {
            noteSection.classList.add('hidden');
        }

        showModalState('content');
    } catch (err) {
        alert('Lỗi: ' + err.message);
        closeModal();
    }
}

function closeModal() { document.getElementById('orderDetailModal').classList.add('hidden'); currentOrder = null; }
function printOrder() { if (currentOrder) window.print(); }
function openEditOrderInPOS() { if (currentOrder) window.location.href = `pos.html?editOrder=${currentOrder.id}`; }
function openReturnOrderInPOS() { if (currentOrder) window.location.href = `pos.html?returnOrder=${currentOrder.id}`; }

async function cancelCurrentOrder() {
    if (!currentOrder || currentOrder.status === 'cancelled') return;
    const reason = prompt(`Lý do hủy ${currentOrder.order_code}:`);
    if (!reason?.trim()) return;
    try {
        await cancelOrder(currentOrder.id, reason.trim());
        await openModal(currentOrder.id);
        await loadOrders();
    } catch (err) { alert('Lỗi: ' + err.message); }
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
function setLabel(text) { const el = document.getElementById('totalOrdersLabel'); if (el) el.textContent = text; }
function setSearchLoading(loading) {
    const btn = document.getElementById('searchBtn'); if (btn) btn.disabled = loading;
    const icon = btn?.querySelector('i'); if (icon) icon.className = loading ? 'fa-solid fa-spinner animate-spin' : 'fa-solid fa-magnifying-glass';
}
function resetFilter() {
    ['searchInput', 'dateFrom', 'dateTo', 'statusFilter'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    loadOrders();
}
