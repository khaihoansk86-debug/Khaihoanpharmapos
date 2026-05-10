// js/features/pos/invoicesController.js
import { fetchOrders, fetchOrderDetail, cancelOrder } from './orderService.js';
import { initLayout } from '../../components/layout.js';

let currentOrder = null;

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    initLayout('admin', 'invoices');
    const returnButton = document.getElementById('modalReturnOrderButton');
    if (returnButton) {
        returnButton.innerHTML = '<i class="fa-solid fa-rotate-left"></i> Tr&#7843; h&#224;ng';
    }
    loadOrders();

    document.getElementById('searchInput')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') loadOrders();
    });

    // Event delegation — xử lý tất cả button qua data-action và data-order-id
    document.addEventListener('click', (e) => {
        const actionButton = e.target.closest('[data-action]');
        const action = actionButton?.dataset.action;
        if (action) {
            const actionMap = {
                'load-orders':        () => loadOrders(),
                'reset-filter':       () => resetFilter(),
                'close-order-detail': () => closeOrderDetailModal(),
                'open-edit-order':    () => openEditOrderInPOS(),
                'open-return-order':  () => openReturnOrderInPOS(),
                'cancel-order':       () => cancelCurrentOrder(),
                'print-order':        () => window.print(),
            };
            if (actionMap[action]) { actionMap[action](); return; }
        }

        // Click vào row hoặc nút xem của row
        const returnTarget = e.target.closest('[data-return-order-id]');
        if (returnTarget) {
            e.stopPropagation();
            window.location.href = `pos.html?returnOrder=${encodeURIComponent(returnTarget.dataset.returnOrderId)}`;
            return;
        }

        const rowTarget = e.target.closest('[data-order-id]');
        if (rowTarget) {
            openOrderDetailModal(rowTarget.dataset.orderId);
        }
    });
});

// ============================================================
// LOAD & RENDER DANH SÁCH HÓA ĐƠN
// ============================================================
async function loadOrders() {
    const searchVal  = document.getElementById('searchInput')?.value.trim()   || '';
    const dateFrom   = document.getElementById('dateFrom')?.value              || '';
    const dateTo     = document.getElementById('dateTo')?.value                || '';

    showLoadingState();

    try {
        const orders = await fetchOrders({ search: searchVal, dateFrom, dateTo, limit: 100 });
        renderOrdersTable(orders);
    } catch (err) {
        console.error('Lỗi tải hóa đơn:', err);
        showEmptyState();
    }
}

function renderOrdersTable(orders) {
    const body    = document.getElementById('ordersTableBody');
    const wrapper = document.getElementById('tableWrapper');
    const empty   = document.getElementById('emptyState');
    const label   = document.getElementById('totalOrdersLabel');

    if (label) label.textContent = `Tìm thấy ${orders.length} hóa đơn`;

    if (!orders || orders.length === 0) {
        showEmptyState();
        return;
    }

    body.innerHTML = orders.map(order => {
        const date      = new Date(order.created_at).toLocaleString('vi-VN');
        const total     = new Intl.NumberFormat('vi-VN').format(order.total);
        const statusMap = {
            completed: '<span class="status-completed px-2 py-1 rounded-lg text-xs font-black uppercase">Hoàn thành</span>',
            cancelled: '<span class="status-cancelled px-2 py-1 rounded-lg text-xs font-black uppercase">Đã huỷ</span>',
            draft:     '<span class="status-draft px-2 py-1 rounded-lg text-xs font-black uppercase">Nháp</span>',
        };
        const statusHtml = statusMap[order.status] || statusMap.draft;

        return `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
            data-order-id="${order.id}">
            <td class="py-4 px-5 font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">${order.order_code}</td>
            <td class="py-4 px-5 text-sm text-slate-600 dark:text-slate-400">${date}</td>
            <td class="py-4 px-5 font-medium text-slate-800 dark:text-white">${order.customer_name || 'Khách lẻ'}</td>
            <td class="py-4 px-5 text-sm text-slate-500 dark:text-slate-400">${order.customer_phone || '—'}</td>
            <td class="py-4 px-5 text-center text-sm font-bold text-slate-600 dark:text-slate-300">${order.item_count || '—'}</td>
            <td class="py-4 px-5 text-right font-black text-slate-800 dark:text-white">${total}đ</td>
            <td class="py-4 px-5 text-center">${statusHtml}</td>
            <td class="py-4 px-5 text-center">
                <button type="button" data-order-id="${order.id}"
                    class="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 inline-flex items-center"
                    title="Xem chi tiết">
                    <i class="fa-solid fa-eye pointer-events-none"></i>
                </button>
                <button type="button" data-return-order-id="${order.id}"
                    class="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 inline-flex items-center"
                    title="Tr&#7843; h&#224;ng">
                    <i class="fa-solid fa-rotate-left pointer-events-none"></i>
                </button>
            </td>
        </tr>`;
    }).join('');

    document.getElementById('loadingState')?.classList.add('hidden');
    empty?.classList.add('hidden');
    wrapper?.classList.remove('hidden');
}

// ============================================================
// MODAL CHI TIẾT HÓA ĐƠN
// ============================================================
async function openOrderDetailModal(orderId) {
    try {
        const order = await fetchOrderDetail(orderId);
        currentOrder = order;

        document.getElementById('modalOrderCode').textContent    = order.order_code;
        document.getElementById('modalCustomerName').textContent = order.customer_name || 'Khách lẻ';
        document.getElementById('modalCustomerPhone').textContent= order.customer_phone || '—';
        document.getElementById('modalCreatedAt').textContent    = new Date(order.created_at).toLocaleString('vi-VN');

        const statusLabels = { completed: 'Hoàn thành', cancelled: 'Đã huỷ', draft: 'Nháp' };
        const statusClasses = {
            completed: 'status-completed',
            cancelled: 'status-cancelled',
            draft:     'status-draft'
        };
        const statusEl = document.getElementById('modalStatus');
        statusEl.textContent  = statusLabels[order.status] || order.status;
        statusEl.className    = `text-xs font-black uppercase px-2 py-1 rounded-lg ${statusClasses[order.status] || statusClasses.draft}`;

        // Items
        const itemsBody = document.getElementById('modalItemsBody');
        itemsBody.innerHTML = (order.items || []).map(item => `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td class="py-3 px-4 font-medium text-slate-800 dark:text-white">${item.product_name}</td>
                <td class="py-3 px-4 text-center text-xs font-bold text-blue-600 dark:text-blue-400">${item.unit_name}</td>
                <td class="py-3 px-4 text-center font-bold">${item.quantity}</td>
                <td class="py-3 px-4 text-right text-slate-600 dark:text-slate-400">${new Intl.NumberFormat('vi-VN').format(item.unit_price)}đ</td>
                <td class="py-3 px-4 text-right font-bold text-slate-800 dark:text-white">${new Intl.NumberFormat('vi-VN').format(item.total_price)}đ</td>
            </tr>
        `).join('');

        // Tổng tiền
        document.getElementById('modalSubtotal').textContent       = new Intl.NumberFormat('vi-VN').format(order.subtotal) + 'đ';
        document.getElementById('modalDiscount').textContent       = '-' + new Intl.NumberFormat('vi-VN').format(order.discount || 0) + 'đ';
        document.getElementById('modalTotal').textContent          = new Intl.NumberFormat('vi-VN').format(order.total) + 'đ';
        document.getElementById('modalAmountReceived').textContent = new Intl.NumberFormat('vi-VN').format(order.amount_received || 0) + 'đ';
        document.getElementById('modalChange').textContent         = new Intl.NumberFormat('vi-VN').format(order.change_amount || 0) + 'đ';

        const editButton = document.getElementById('modalEditOrderButton');
        const cancelButton = document.getElementById('modalCancelOrderButton');
        const returnButton = document.getElementById('modalReturnOrderButton');
        const canModify = order.status !== 'cancelled';
        editButton?.classList.toggle('hidden', !canModify);
        cancelButton?.classList.toggle('hidden', !canModify);
        returnButton?.classList.toggle('hidden', !canModify);

        // Ghi chú
        const noteSection = document.getElementById('modalNoteSection');
        if (order.note) {
            document.getElementById('modalNote').textContent = order.note;
            noteSection?.classList.remove('hidden');
        } else {
            noteSection?.classList.add('hidden');
        }

        document.getElementById('orderDetailModal')?.classList.remove('hidden');
    } catch (err) {
        console.error('Lỗi tải chi tiết hóa đơn:', err);
        alert('Không thể tải chi tiết hóa đơn: ' + err.message);
    }
};

function closeOrderDetailModal() {
    document.getElementById('orderDetailModal')?.classList.add('hidden');
}

function openEditOrderInPOS() {
    if (!currentOrder || currentOrder.status === 'cancelled') return;
    window.location.href = `pos.html?editOrder=${encodeURIComponent(currentOrder.id)}`;
}

function openReturnOrderInPOS() {
    if (!currentOrder || currentOrder.status === 'cancelled') return;
    window.location.href = `pos.html?returnOrder=${encodeURIComponent(currentOrder.id)}`;
}

async function cancelCurrentOrder() {
    if (!currentOrder || currentOrder.status === 'cancelled') return;

    const reason = prompt(`Nhập lý do hủy hóa đơn ${currentOrder.order_code}:`);
    if (reason === null) return;
    if (!reason.trim()) {
        alert('Vui lòng nhập lý do hủy đơn.');
        return;
    }

    const confirmed = confirm('Xác nhận hủy hóa đơn? Hệ thống sẽ hoàn tồn kho nếu dòng hàng có thông tin lô.');
    if (!confirmed) return;

    try {
        await cancelOrder(currentOrder.id, reason.trim());
        await openOrderDetailModal(currentOrder.id);
        await loadOrders();
    } catch (err) {
        console.error('Lỗi hủy hóa đơn:', err);
        alert('Không thể hủy hóa đơn: ' + err.message);
    }
}

// ============================================================
// BỘ LỌC
// ============================================================
function resetFilter() {
    document.getElementById('searchInput').value = '';
    document.getElementById('dateFrom').value    = '';
    document.getElementById('dateTo').value      = '';
    loadOrders();
}

// ============================================================
// HELPERS
// ============================================================
function showLoadingState() {
    document.getElementById('loadingState')?.classList.remove('hidden');
    document.getElementById('tableWrapper')?.classList.add('hidden');
    document.getElementById('emptyState')?.classList.add('hidden');
}

function showEmptyState() {
    document.getElementById('loadingState')?.classList.add('hidden');
    document.getElementById('tableWrapper')?.classList.add('hidden');
    document.getElementById('emptyState')?.classList.remove('hidden');
    const label = document.getElementById('totalOrdersLabel');
    if (label) label.textContent = '0 hóa đơn';
}
