// js/features/logs/logsController.js
import { initLayout } from '../../components/layout.js';
import { supabaseClient } from '../../core/supabase.js';

// DOM Cache
const els = {
    totalLogsLabel: document.getElementById('totalLogsLabel'),
    searchInput: document.getElementById('searchInput'),
    actionTypeFilter: document.getElementById('actionTypeFilter'),
    dateFrom: document.getElementById('dateFrom'),
    dateTo: document.getElementById('dateTo'),
    applyFilterBtn: document.getElementById('applyFilterBtn'),
    resetFilterBtn: document.getElementById('resetFilterBtn'),
    toggleFilterBtn: document.getElementById('toggleFilterBtn'),
    logFilterSidebar: document.getElementById('logFilterSidebar'),
    loadingState: document.getElementById('loadingState'),
    emptyState: document.getElementById('emptyState'),
    tableWrapper: document.getElementById('tableWrapper'),
    logsTableBody: document.getElementById('logsTableBody'),
    paginationWrapper: document.getElementById('paginationWrapper'),

    // Modal
    logDetailModal: document.getElementById('logDetailModal'),
    modalLogTime: document.getElementById('modalLogTime'),
    modalPerformerName: document.getElementById('modalPerformerName'),
    modalPerformerRole: document.getElementById('modalPerformerRole'),
    modalStructuredContent: document.getElementById('modalStructuredContent'),
    modalRawJson: document.getElementById('modalRawJson'),
    closeDetailBtn: document.getElementById('closeDetailBtn'),
    closeDetailFooterBtn: document.getElementById('closeDetailFooterBtn')
};

// State
let currentPage = 1;
const itemsPerPage = 20;
let totalLogsCount = 0;
let currentFilters = {
    search: '',
    actionType: '',
    dateFrom: '',
    dateTo: ''
};

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    if (!await initLayout('admin', 'logs')) return;
    
    // Set default dates (past 7 days by default)
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);
    
    els.dateFrom.value = lastWeek.toISOString().split('T')[0];
    els.dateTo.value = today.toISOString().split('T')[0];
    
    currentFilters.dateFrom = els.dateFrom.value;
    currentFilters.dateTo = els.dateTo.value;

    bindEvents();
    loadLogs();
});

// Format date to local Vietnamese style (DD/MM/YYYY HH:MM:SS)
function formatDateTime(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// Bind event listeners
function bindEvents() {
    els.applyFilterBtn.addEventListener('click', () => {
        currentPage = 1;
        currentFilters.search = els.searchInput.value.trim();
        currentFilters.actionType = els.actionTypeFilter.value;
        currentFilters.dateFrom = els.dateFrom.value;
        currentFilters.dateTo = els.dateTo.value;
        loadLogs();
    });

    els.resetFilterBtn.addEventListener('click', () => {
        els.searchInput.value = '';
        els.actionTypeFilter.value = '';
        
        // Reset to past 7 days
        const today = new Date();
        const lastWeek = new Date();
        lastWeek.setDate(today.getDate() - 7);
        els.dateFrom.value = lastWeek.toISOString().split('T')[0];
        els.dateTo.value = today.toISOString().split('T')[0];

        currentPage = 1;
        currentFilters = {
            search: '',
            actionType: '',
            dateFrom: els.dateFrom.value,
            dateTo: els.dateTo.value
        };
        loadLogs();
    });

    els.toggleFilterBtn.addEventListener('click', () => {
        els.logFilterSidebar.classList.toggle('hidden');
        els.logFilterSidebar.classList.toggle('flex');
    });

    // Close modal handlers
    const closeModal = () => els.logDetailModal.classList.add('hidden');
    els.closeDetailBtn.addEventListener('click', closeModal);
    els.closeDetailFooterBtn.addEventListener('click', closeModal);
}

// Load logs count and list from Supabase
async function loadLogs() {
    if (!supabaseClient) {
        console.error('Supabase is not configured.');
        showError('Không thể kết nối cơ sở dữ liệu Supabase.');
        return;
    }

    setLoading(true);

    try {
        // Build base query
        let query = supabaseClient.from('audit_logs').select('*', { count: 'exact' });

        // Apply action type filter
        if (currentFilters.actionType) {
            query = query.eq('action_type', currentFilters.actionType);
        }

        // Apply date range filter
        if (currentFilters.dateFrom) {
            query = query.gte('created_at', currentFilters.dateFrom + 'T00:00:00Z');
        }
        if (currentFilters.dateTo) {
            query = query.lte('created_at', currentFilters.dateTo + 'T23:59:59Z');
        }

        // Apply search keyword filter
        if (currentFilters.search) {
            const s = `%${currentFilters.search}%`;
            query = query.or(`performer_name.ilike.${s},details->>message.ilike.${s},details->>order_code.ilike.${s},details->>note.ilike.${s}`);
        }

        // Pagination and Sorting
        const fromOffset = (currentPage - 1) * itemsPerPage;
        const toOffset = fromOffset + itemsPerPage - 1;
        
        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(fromOffset, toOffset);

        if (error) throw error;

        totalLogsCount = count || 0;
        els.totalLogsLabel.textContent = `Tổng số: ${totalLogsCount} logs`;

        renderLogsTable(data || []);
        renderPagination();
    } catch (err) {
        console.error('Error fetching logs:', err);
        showError(err.message || 'Lỗi khi tải nhật ký hoạt động.');
    } finally {
        setLoading(false);
    }
}

// Show/hide loading indicator
function setLoading(isLoading) {
    if (isLoading) {
        els.loadingState.classList.remove('hidden');
        els.emptyState.classList.add('hidden');
        els.tableWrapper.classList.add('hidden');
        els.paginationWrapper.classList.add('hidden');
    } else {
        els.loadingState.classList.add('hidden');
    }
}

// Show error state
function showError(message) {
    els.loadingState.classList.add('hidden');
    els.emptyState.classList.remove('hidden');
    els.tableWrapper.classList.add('hidden');
    els.paginationWrapper.classList.add('hidden');
    
    const p = els.emptyState.querySelector('p.font-black');
    if (p) p.textContent = 'Có lỗi xảy ra!';
    const sub = els.emptyState.querySelector('p.text-xs');
    if (sub) sub.textContent = message;
}

// Render the logs rows
function renderLogsTable(logs) {
    if (logs.length === 0) {
        els.emptyState.classList.remove('hidden');
        els.tableWrapper.classList.add('hidden');
        els.paginationWrapper.classList.add('hidden');
        
        const p = els.emptyState.querySelector('p.font-black');
        if (p) p.textContent = 'Không tìm thấy hoạt động nào';
        const sub = els.emptyState.querySelector('p.text-xs');
        if (sub) sub.textContent = 'Hệ thống chưa ghi nhận log nào khớp với điều kiện lọc';
        return;
    }

    els.emptyState.classList.add('hidden');
    els.tableWrapper.classList.remove('hidden');
    els.paginationWrapper.classList.remove('hidden');

    let html = '';
    logs.forEach(log => {
        let badgeClass = 'bg-slate-100 text-slate-700';
        let actionLabel = log.action_type;
        let summaryText = '';

        if (log.action_type === 'login') {
            badgeClass = 'badge-login';
            actionLabel = 'Đăng nhập';
            summaryText = log.details.message || `Đăng nhập hệ thống (User: ${log.details.username})`;
        } else if (log.action_type === 'return') {
            badgeClass = 'badge-return';
            actionLabel = 'Trả hàng';
            summaryText = `Trả hàng từ HĐ ${log.details.source_order_code || 'N/A'} - Trả lại khách: ${formatCurrency(log.details.total_amount || 0)}`;
        } else if (log.action_type === 'internal_use') {
            badgeClass = 'badge-internal';
            actionLabel = 'Xuất nội bộ / Xuất hủy';
            const reasonMap = { dose_cutting: 'Cắt liều', damage: 'Hỏng vỡ', sample: 'Dùng mẫu', other: 'Khác' };
            const reasonText = reasonMap[log.details.reason] || log.details.reason || 'Khác';
            summaryText = `Xuất dùng (${reasonText}) - ${log.details.items?.length || 0} sản phẩm. Lý do: ${log.details.note || 'Không có'}`;
        } else if (log.action_type === 'stocktake_adjustment') {
            badgeClass = 'badge-stocktake';
            actionLabel = 'Kiểm kê';
            const itemsWithDiff = log.details.items?.filter(item => item.delta !== 0) || [];
            summaryText = `Kiểm kho chênh lệch - Có ${itemsWithDiff.length} lô bị lệch.`;
        }

        html += `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer select-none" data-id="${log.id}">
                <td class="py-3.5 px-6 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    ${formatDateTime(log.created_at)}
                </td>
                <td class="py-3.5 px-6">
                    <span class="inline-flex px-2.5 py-1 rounded-lg text-xs font-black uppercase ${badgeClass}">
                        ${actionLabel}
                    </span>
                </td>
                <td class="py-3.5 px-6 font-bold text-sm text-slate-800 dark:text-slate-200">
                    ${log.performer_name}
                    <span class="text-[10px] font-semibold text-slate-450 dark:text-slate-500 block">${log.performer_role}</span>
                </td>
                <td class="py-3.5 px-6 text-sm text-slate-600 dark:text-slate-350 max-w-[400px] truncate" title="${summaryText.replace(/"/g, '&quot;')}">
                    ${summaryText}
                </td>
                <td class="py-3.5 px-6 text-center">
                    <button class="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors flex items-center justify-center mx-auto" title="Xem chi tiết">
                        <i class="fa-solid fa-eye text-xs"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    els.logsTableBody.innerHTML = html;

    // Bind details opening when row clicked
    const rows = els.logsTableBody.querySelectorAll('tr');
    rows.forEach(row => {
        row.addEventListener('click', () => {
            const logId = row.dataset.id;
            const log = logs.find(l => l.id === logId);
            if (log) showLogDetails(log);
        });
    });
}

// Show dynamic details formatted inside the modal
function showLogDetails(log) {
    els.modalLogTime.textContent = formatDateTime(log.created_at);
    els.modalPerformerName.textContent = log.performer_name;
    els.modalPerformerRole.textContent = log.performer_role;
    
    // Format JSON
    els.modalRawJson.textContent = JSON.stringify(log, null, 4);

    // Dynamic structured rendering
    let contentHtml = '';
    
    if (log.action_type === 'login') {
        contentHtml = `
            <div class="space-y-3">
                <div class="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2 text-sm">
                    <span class="text-slate-400">Tài khoản đăng nhập:</span>
                    <span class="font-bold text-slate-800 dark:text-white">${log.details.username || 'N/A'}</span>
                </div>
                <div class="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2 text-sm">
                    <span class="text-slate-400">Trạng thái:</span>
                    <span class="font-bold text-emerald-600 dark:text-emerald-400"><i class="fa-solid fa-circle-check"></i> Đăng nhập thành công</span>
                </div>
            </div>
        `;
    } else if (log.action_type === 'return') {
        const items = log.details.returned_items || [];
        let itemsHtml = items.map((item, index) => `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs">
                <td class="py-2.5 px-4 font-bold">${index + 1}</td>
                <td class="py-2.5 px-4">
                    <div class="font-bold text-slate-800 dark:text-slate-200">${item.product_name}</div>
                    <div class="text-[10px] font-mono text-slate-500">${item.product_code || ''}</div>
                </td>
                <td class="py-2.5 px-4 text-center font-semibold text-slate-600 dark:text-slate-400">${item.unit || 'ĐVT'}</td>
                <td class="py-2.5 px-4 text-right font-bold text-rose-500">${item.quantity || 0}</td>
                <td class="py-2.5 px-4 text-right font-bold text-slate-700 dark:text-slate-300">${formatCurrency(item.price || 0)}</td>
                <td class="py-2.5 px-4 text-right font-black text-slate-800 dark:text-white">${formatCurrency((item.price || 0) * (item.quantity || 0))}</td>
            </tr>
        `).join('');

        contentHtml = `
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4 text-sm bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div>
                        <span class="text-slate-400 text-xs block">Mã hóa đơn trả hàng</span>
                        <span class="font-black text-slate-800 dark:text-white">${log.details.order_code || 'N/A'}</span>
                    </div>
                    <div>
                        <span class="text-slate-400 text-xs block">Trả từ hóa đơn gốc</span>
                        <span class="font-black text-blue-600 dark:text-blue-400">${log.details.source_order_code || 'N/A'}</span>
                    </div>
                    <div>
                        <span class="text-slate-400 text-xs block">Tên khách hàng</span>
                        <span class="font-bold text-slate-800 dark:text-white">${log.details.customer_name || 'Khách lẻ'}</span>
                    </div>
                    <div>
                        <span class="text-slate-400 text-xs block">Số điện thoại</span>
                        <span class="font-bold text-slate-800 dark:text-white">${log.details.customer_phone || 'Khách lẻ'}</span>
                    </div>
                </div>

                <div class="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                    <table class="w-full text-left text-xs">
                        <thead class="bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase text-slate-550 dark:text-slate-400 border-b border-slate-200 dark:border-slate-750">
                            <tr>
                                <th class="py-2.5 px-4 w-10">#</th>
                                <th class="py-2.5 px-4">Mặt hàng</th>
                                <th class="py-2.5 px-4 text-center">ĐVT</th>
                                <th class="py-2.5 px-4 text-right">SL Trả</th>
                                <th class="py-2.5 px-4 text-right">Đơn giá</th>
                                <th class="py-2.5 px-4 text-right">Hoàn trả</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">${itemsHtml}</tbody>
                    </table>
                </div>

                <div class="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex justify-between items-center text-rose-600 dark:text-rose-400">
                    <span class="font-black text-sm">TỔNG TIỀN HOÀN TRẢ KHÁCH:</span>
                    <span class="text-lg font-black">${formatCurrency(log.details.total_amount || 0)}</span>
                </div>
            </div>
        `;
    } else if (log.action_type === 'internal_use') {
        const items = log.details.items || [];
        const reasonMap = { dose_cutting: 'Cắt liều', damage: 'Hỏng/vỡ', sample: 'Dùng mẫu', other: 'Khác' };
        
        let itemsHtml = items.map((item, index) => `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs">
                <td class="py-2.5 px-4 font-bold">${index + 1}</td>
                <td class="py-2.5 px-4">
                    <div class="font-bold text-slate-800 dark:text-slate-200">${item.product_name}</div>
                    <div class="text-[10px] font-mono text-slate-500">${item.product_code || ''}</div>
                </td>
                <td class="py-2.5 px-4">
                    <span class="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">${item.batch_number || 'Mặc định'}</span>
                </td>
                <td class="py-2.5 px-4 text-center font-bold text-orange-500">${item.quantity || 0} ${item.base_unit || 'ĐV'}</td>
                <td class="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-400">${reasonMap[item.reason] || item.reason || 'Khác'}</td>
            </tr>
        `).join('');

        contentHtml = `
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4 text-sm bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div>
                        <span class="text-slate-400 text-xs block">Mã chứng từ xuất kho</span>
                        <span class="font-black text-slate-800 dark:text-white">${log.details.order_code || log.details.document_code || 'N/A'}</span>
                    </div>
                    <div>
                        <span class="text-slate-400 text-xs block">Lý do xuất</span>
                        <span class="font-black text-orange-500">${reasonMap[log.details.reason] || log.details.reason || 'Xuất hủy / Hao hụt'}</span>
                    </div>
                    <div class="col-span-2">
                        <span class="text-slate-400 text-xs block">Ghi chú chi tiết</span>
                        <span class="font-bold text-slate-700 dark:text-slate-300 italic">"${log.details.note || 'Không có ghi chú'}"</span>
                    </div>
                </div>

                <div class="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                    <table class="w-full text-left text-xs">
                        <thead class="bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase text-slate-550 dark:text-slate-400 border-b border-slate-200 dark:border-slate-750">
                            <tr>
                                <th class="py-2.5 px-4 w-10">#</th>
                                <th class="py-2.5 px-4">Mặt hàng</th>
                                <th class="py-2.5 px-4">Mã lô</th>
                                <th class="py-2.5 px-4 text-center">SL Xuất</th>
                                <th class="py-2.5 px-4">Phân loại lý do</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">${itemsHtml}</tbody>
                    </table>
                </div>
            </div>
        `;
    } else if (log.action_type === 'stocktake_adjustment') {
        const items = log.details.items || [];
        let itemsHtml = items.map((item, index) => {
            const isDiff = item.delta !== 0;
            const rowClass = isDiff ? 'bg-amber-50/20 dark:bg-amber-950/10' : '';
            const deltaSign = item.delta > 0 ? '+' : '';
            const deltaClass = item.delta < 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : item.delta > 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400';
            const valueClass = item.delta_value < 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : item.delta_value > 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400';

            return `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs ${rowClass}">
                    <td class="py-2.5 px-4 font-bold">${index + 1}</td>
                    <td class="py-2.5 px-4">
                        <div class="font-bold text-slate-800 dark:text-slate-200">${item.product_name}</div>
                        <div class="text-[10px] font-mono text-slate-500">${item.product_code || ''}</div>
                    </td>
                    <td class="py-2.5 px-4"><span class="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] border border-slate-200 dark:border-slate-700">${item.batch_number || 'Mặc định'}</span></td>
                    <td class="py-2.5 px-4 text-right font-medium text-slate-500">${item.system_quantity || 0}</td>
                    <td class="py-2.5 px-4 text-right font-bold text-slate-800 dark:text-white">${item.counted_quantity || 0}</td>
                    <td class="py-2.5 px-4 text-right ${deltaClass}">${deltaSign}${item.delta}</td>
                    <td class="py-2.5 px-4 text-right ${valueClass}">${item.delta_value > 0 ? '+' : ''}${formatCurrency(item.delta_value || 0)}</td>
                </tr>
            `;
        }).join('');

        contentHtml = `
            <div class="space-y-4">
                <div class="text-sm bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span class="text-slate-400 text-xs block">Ghi chú kiểm kê</span>
                    <span class="font-bold text-slate-750 dark:text-slate-200 italic">"${log.details.note || 'Không có ghi chú'}"</span>
                </div>

                <div class="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                    <table class="w-full text-left text-xs">
                        <thead class="bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase text-slate-550 dark:text-slate-400 border-b border-slate-200 dark:border-slate-750">
                            <tr>
                                <th class="py-2.5 px-4 w-10">#</th>
                                <th class="py-2.5 px-4">Mặt hàng</th>
                                <th class="py-2.5 px-4">Lô</th>
                                <th class="py-2.5 px-4 text-right">Tồn hệ thống</th>
                                <th class="py-2.5 px-4 text-right">Tồn thực tế</th>
                                <th class="py-2.5 px-4 text-right">Lệch SL</th>
                                <th class="py-2.5 px-4 text-right">Lệch giá trị</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">${itemsHtml}</tbody>
                    </table>
                </div>
            </div>
        `;
    }

    els.modalStructuredContent.innerHTML = contentHtml;
    els.logDetailModal.classList.remove('hidden');
}

// Render dynamic pagination UI
function renderPagination() {
    const totalPages = Math.ceil(totalLogsCount / itemsPerPage) || 1;
    
    if (totalLogsCount === 0) {
        els.paginationWrapper.innerHTML = '';
        els.paginationWrapper.classList.add('hidden');
        return;
    }

    els.paginationWrapper.classList.remove('hidden');
    
    const startIdx = (currentPage - 1) * itemsPerPage + 1;
    const endIdx = Math.min(currentPage * itemsPerPage, totalLogsCount);

    els.paginationWrapper.innerHTML = `
        <div class="text-sm text-slate-500 dark:text-slate-400 font-medium text-center sm:text-left">
            Hiển thị <span class="font-bold text-slate-700 dark:text-slate-200">${startIdx}</span> - <span class="font-bold text-slate-700 dark:text-slate-200">${endIdx}</span> trong tổng số <span class="font-bold text-slate-700 dark:text-slate-200">${totalLogsCount}</span> nhật ký
        </div>
        <div class="flex items-center justify-center gap-2">
            <button id="prevPageBtn" class="px-4 py-2 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}">
                <i class="fa-solid fa-chevron-left mr-1"></i> Trước
            </button>
            <div class="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-black text-sm rounded-xl border border-blue-100 dark:border-blue-800/50">
                Trang ${currentPage} / ${totalPages}
            </div>
            <button id="nextPageBtn" class="px-4 py-2 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}">
                Sau <i class="fa-solid fa-chevron-right ml-1"></i>
            </button>
        </div>
    `;

    // Bind page change events
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');

    if (prevBtn && currentPage > 1) {
        prevBtn.addEventListener('click', () => {
            currentPage--;
            loadLogs();
        });
    }

    if (nextBtn && currentPage < totalPages) {
        nextBtn.addEventListener('click', () => {
            currentPage++;
            loadLogs();
        });
    }
}
