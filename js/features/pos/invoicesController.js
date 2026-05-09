// js/features/pos/invoicesController.js
import { fetchOrders, fetchOrderDetail } from './orderService.js';
import { initLayout } from '../../components/layout.js';

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    initLayout('admin', 'invoices');
    loadOrders();
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
            onclick="window.openOrderDetail('${order.id}')">
            <td class="py-4 px-5 font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">${order.order_code}</td>
            <td class="py-4 px-5 text-sm text-slate-600 dark:text-slate-400">${date}</td>
            <td class="py-4 px-5 font-medium text-slate-800 dark:text-white">${order.customer_name || 'Khách lẻ'}</td>
            <td class="py-4 px-5 text-sm text-slate-500 dark:text-slate-400">${order.customer_phone || '—'}</td>
            <td class="py-4 px-5 text-center text-sm font-bold text-slate-600 dark:text-slate-300">${order.item_count || '—'}</td>
            <td class="py-4 px-5 text-right font-black text-slate-800 dark:text-white">${total}đ</td>
            <td class="py-4 px-5 text-center">${statusHtml}</td>
            <td class="py-4 px-5 text-center">
                <button onclick="event.stopPropagation(); window.openOrderDetail('${order.id}')"
                    class="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30">
                    <i class="fa-solid fa-eye"></i>
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
window.openOrderDetail = async (orderId) => {
    try {
        const order = await fetchOrderDetail(orderId);

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

window.closeOrderDetail = () => {
    document.getElementById('orderDetailModal')?.classList.add('hidden');
};

// ============================================================
// BỘ LỌC
// ============================================================
window.loadOrders   = loadOrders;
window.resetFilter  = () => {
    document.getElementById('searchInput').value = '';
    document.getElementById('dateFrom').value    = '';
    document.getElementById('dateTo').value      = '';
    loadOrders();
};

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
