// js/features/pos/invoicesController.js
import { fetchOrders, fetchOrderDetail, cancelOrder } from './orderService.js';
import { initLayout } from '../../components/layout.js';
import { supabaseClient } from '../../core/supabase.js';
import { getEmployees, getShifts } from '../employees/employeeService.js';

let currentOrder = null;
let activeSubTab = 'invoices';
let modalType = 'income'; // 'income' or 'expense'
let incomeMode = 'shift_close'; // 'shift_close' or 'other'
let shiftIncomeOptions = [];

const vnd = (v) => new Intl.NumberFormat('vi-VN').format(Math.abs(v || 0)) + 'đ';
const escHtml = (str) => {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
};
const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ''));

const STATUS_LABEL = { completed: 'Hoàn thành', cancelled: 'Đã hủy', draft: 'Nháp' };
const STATUS_CLASS = {
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    draft:     'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
};

const PAYMENT_METHOD_LABEL = {
    cash: 'Tiền mặt',
    bank_transfer: 'Chuyển khoản',
    card: 'Thẻ',
    other: 'Khác'
};

const EXPENSE_CATEGORIES = [
    'Chi phí tiền điện',
    'Chi phí tiền nước',
    'Chi phí mặt bằng',
    'Chi phí văn phòng phẩm / vật tư',
    'Chi lương nhân viên',
    'Chi khác'
];

function statusBadge(status) {
    const label = STATUS_LABEL[status] || status || 'Nháp';
    const cls   = STATUS_CLASS[status] || STATUS_CLASS.draft;
    return `<span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${cls}">${label}</span>`;
}

// ============================================================
// KHỞI TẠO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    try {
        initLayout('admin', 'invoices');
    } catch (err) {
        console.error('[invoices] Lỗi khởi tạo layout:', err);
    }
    
    // Sub-tab toggling initialization
    initSubTabs();
    
    loadOrders();

    // Event Listeners
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

        // Hủy phiếu thu/chi thủ công
        const cancelTxBtn = e.target.closest('[data-action="cancel-tx"]');
        if (cancelTxBtn) {
            const txId = cancelTxBtn.dataset.txId;
            cancelCashbookTransaction(txId);
            return;
        }

        const row = e.target.closest('[data-order-id]');
        if (row && !e.target.closest('[data-action]')) {
            openModal(row.dataset.orderId);
        }
    });

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let debounce;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounce);
            debounce = setTimeout(() => {
                if (activeSubTab === 'invoices') {
                    loadOrders();
                } else {
                    loadCashbook();
                }
            }, 400);
        });
    }

    // Modal Events
    const btnCreateIncome = document.getElementById('btnCreateIncome');
    const btnCreateExpense = document.getElementById('btnCreateExpense');
    const btnCloseCashbookModal = document.getElementById('btnCloseCashbookModal');
    const cashbookForm = document.getElementById('cashbookForm');

    if (btnCreateIncome) btnCreateIncome.addEventListener('click', () => openCashbookModal('income'));
    if (btnCreateExpense) btnCreateExpense.addEventListener('click', () => openCashbookModal('expense'));
    if (btnCloseCashbookModal) btnCloseCashbookModal.addEventListener('click', closeCashbookModal);
    if (cashbookForm) cashbookForm.addEventListener('submit', handleCashbookSubmit);

    document.querySelectorAll('.income-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => setIncomeMode(btn.dataset.incomeMode || 'other'));
    });
    document.getElementById('cbShiftSource')?.addEventListener('change', applySelectedShiftIncome);
});

function initSubTabs() {
    const tabInvoices = document.getElementById('tabInvoices');
    const tabCashbook = document.getElementById('tabCashbook');
    
    if (!tabInvoices || !tabCashbook) return;

    tabInvoices.addEventListener('click', () => {
        if (activeSubTab === 'invoices') return;
        activeSubTab = 'invoices';
        switchSubTab();
    });

    tabCashbook.addEventListener('click', () => {
        if (activeSubTab === 'cashbook') return;
        activeSubTab = 'cashbook';
        switchSubTab();
    });
}

function switchSubTab() {
    const tabInvoices = document.getElementById('tabInvoices');
    const tabCashbook = document.getElementById('tabCashbook');
    const pageTitle = document.getElementById('pageTitle');
    const cashbookHeaderActions = document.getElementById('cashbookHeaderActions');
    const cashbookStats = document.getElementById('cashbookStats');
    const tableWrapper = document.getElementById('tableWrapper');
    const cashbookTableWrapper = document.getElementById('cashbookTableWrapper');
    
    const invoiceFilterItems = document.querySelectorAll('.invoice-filter-item');
    const cashbookFilterItems = document.querySelectorAll('.cashbook-filter-item');

    if (activeSubTab === 'invoices') {
        tabInvoices.className = 'px-5 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 shadow-sm';
        tabCashbook.className = 'px-5 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-350';
        
        if (pageTitle) pageTitle.innerHTML = `<i class="fa-solid fa-receipt text-blue-600"></i> Lịch sử Hóa đơn`;
        if (cashbookHeaderActions) cashbookHeaderActions.classList.add('hidden');
        if (cashbookStats) cashbookStats.classList.add('hidden');
        
        invoiceFilterItems.forEach(el => el.classList.remove('hidden'));
        cashbookFilterItems.forEach(el => el.classList.add('hidden'));

        if (tableWrapper) tableWrapper.classList.remove('hidden');
        if (cashbookTableWrapper) cashbookTableWrapper.classList.add('hidden');

        loadOrders();
    } else {
        tabCashbook.className = 'px-5 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 shadow-sm';
        tabInvoices.className = 'px-5 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-350';
        
        if (pageTitle) pageTitle.innerHTML = `<i class="fa-solid fa-wallet text-emerald-600"></i> Sổ Quỹ Thu Chi`;
        if (cashbookHeaderActions) cashbookHeaderActions.classList.remove('hidden');
        if (cashbookStats) cashbookStats.classList.remove('hidden');
        
        invoiceFilterItems.forEach(el => el.classList.add('hidden'));
        cashbookFilterItems.forEach(el => el.classList.remove('hidden'));

        if (tableWrapper) tableWrapper.classList.add('hidden');
        if (cashbookTableWrapper) cashbookTableWrapper.classList.remove('hidden');

        loadCashbook();
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('invoiceFilterSidebar');
    if (sidebar) sidebar.classList.toggle('hidden');
}

// ─── LOAD & RENDER INVOICES ──────────────────────────────────────────
async function loadOrders() {
    if (activeSubTab === 'cashbook') {
        loadCashbook();
        return;
    }
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
        setLabel('Lỗi kết nối dữ liệu');
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

// ─── LOAD & RENDER CASHBOOK ──────────────────────────────────────────
async function loadCashbook() {
    const search = document.getElementById('searchInput')?.value.trim() || '';
    const dateFrom = document.getElementById('dateFrom')?.value || '';
    const dateTo = document.getElementById('dateTo')?.value || '';
    const type = document.getElementById('cbTypeFilter')?.value || '';
    const source = document.getElementById('cbSourceFilter')?.value || '';
    const method = document.getElementById('cbMethodFilter')?.value || '';
    const status = document.getElementById('cbStatusFilter')?.value || '';

    setSearchLoading(true);
    showState('loading');

    try {
        if (!supabaseClient) throw new Error('Supabase client chưa được khởi tạo.');

        let query = supabaseClient
            .from('cashbook_transactions')
            .select('*')
            .order('transaction_date', { ascending: false });

        if (type) query = query.eq('type', type);
        if (source) query = query.eq('ref_type', source);
        if (method) query = query.eq('payment_method', method);
        if (status) query = query.eq('status', status);
        if (dateFrom) query = query.gte('transaction_date', `${dateFrom}T00:00:00Z`);
        if (dateTo) query = query.lte('transaction_date', `${dateTo}T23:59:59Z`);

        const { data: txs, error } = await query;
        if (error) throw error;

        let filteredTxs = txs || [];
        if (search) {
            const lowerSearch = search.toLowerCase();
            filteredTxs = filteredTxs.filter(tx => 
                (tx.transaction_code && tx.transaction_code.toLowerCase().includes(lowerSearch)) ||
                (tx.category && tx.category.toLowerCase().includes(lowerSearch)) ||
                (tx.performer && tx.performer.toLowerCase().includes(lowerSearch)) ||
                (tx.description && tx.description.toLowerCase().includes(lowerSearch))
            );
        }

        calculateStats(filteredTxs);
        renderCashbookTable(filteredTxs);
    } catch (err) {
        console.error('[cashbook] Lỗi tải sổ quỹ:', err);
        showState('empty');
        setLabel('Lỗi kết nối dữ liệu');
    } finally {
        setSearchLoading(false);
    }
}

function calculateStats(txs) {
    const activeTxs = txs.filter(t => t.status === 'completed');
    const totalIncome = activeTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpense = activeTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
    const balance = totalIncome - totalExpense;

    document.getElementById('cashbookTotalIncome').textContent = vnd(totalIncome);
    document.getElementById('cashbookTotalExpense').textContent = vnd(totalExpense);
    
    const balanceEl = document.getElementById('cashbookBalance');
    balanceEl.textContent = (balance < 0 ? '-' : '') + vnd(balance);
    if (balance < 0) {
        balanceEl.className = 'text-2xl font-black text-rose-600 dark:text-rose-400';
    } else {
        balanceEl.className = 'text-2xl font-black text-blue-600 dark:text-blue-400';
    }
}

function renderCashbookTable(txs) {
    const body = document.getElementById('cashbookTableBody');
    if (!body) return;

    setLabel(`Tìm thấy ${txs.length} giao dịch`);
    if (!txs.length) { showState('empty'); return; }

    body.innerHTML = txs.map(tx => {
        const date = new Date(tx.transaction_date).toLocaleString('vi-VN');
        const isIncome = tx.type === 'income';
        const statusLabel = tx.status === 'completed' ? 'Hoàn thành' : 'Đã hủy';
        const statusCls = tx.status === 'completed' 
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
        
        const typeLabel = isIncome ? 'Phiếu Thu' : 'Phiếu Chi';
        const typeCls = isIncome 
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
            : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-450';

        const amountSign = isIncome ? '+' : '-';
        const amountColor = isIncome ? 'text-emerald-650 dark:text-emerald-400' : 'text-rose-650 dark:text-rose-400';
        const amountFormatted = `${amountSign}${vnd(tx.amount)}`;

        const methodLabel = PAYMENT_METHOD_LABEL[tx.payment_method] || tx.payment_method || 'Khác';

        let actionHtml = '<span class="text-slate-400 italic text-xs">Tự động</span>';
        if (tx.ref_type === 'manual') {
            if (tx.status === 'completed') {
                actionHtml = `<button data-action="cancel-tx" data-tx-id="${escHtml(tx.id)}" class="text-xs font-black text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 mx-auto transition-all"><i class="fa-solid fa-ban"></i> Hủy</button>`;
            } else {
                actionHtml = '<span class="text-slate-400 font-medium text-xs">Đã hủy</span>';
            }
        }

        const noteInfo = tx.description ? `<div class="text-[10px] text-slate-400 italic font-medium mt-1">Ghi chú: ${escHtml(tx.description)}</div>` : '';

        return `
        <tr class="hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors">
            <td class="py-4 px-6 font-mono font-black text-xs text-blue-600 dark:text-blue-400">
                ${escHtml(tx.transaction_code)}
            </td>
            <td class="py-4 px-6 text-xs font-medium text-slate-500 dark:text-slate-400">${date}</td>
            <td class="py-4 px-6">
                <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${typeCls}">${typeLabel}</span>
            </td>
            <td class="py-4 px-6">
                <div class="font-bold text-slate-800 dark:text-white text-sm">${escHtml(tx.category)}</div>
                <div class="text-xs text-slate-400 font-medium">Người thực hiện: <span class="font-semibold text-slate-600 dark:text-slate-350">${escHtml(tx.performer || 'Hệ thống')}</span></div>
                ${noteInfo}
            </td>
            <td class="py-4 px-6 text-right font-black text-sm whitespace-nowrap ${amountColor}">
                ${amountFormatted}
            </td>
            <td class="py-4 px-6 text-center text-xs font-bold text-slate-500 dark:text-slate-400">${methodLabel}</td>
            <td class="py-4 px-6 text-center">
                <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${statusCls}">${statusLabel}</span>
            </td>
            <td class="py-4 px-6 text-center">
                ${actionHtml}
            </td>
        </tr>`;
    }).join('');

    showState('table');
}

// ─── MANUAL TRANSACTIONS MODAL ───────────────────────────────────────
function setIncomeMode(mode) {
    incomeMode = mode === 'shift_close' ? 'shift_close' : 'other';
    const isShiftClose = incomeMode === 'shift_close';
    document.querySelectorAll('.income-mode-btn').forEach(btn => {
        const active = btn.dataset.incomeMode === incomeMode;
        btn.className = active
            ? 'income-mode-btn px-3 py-2.5 rounded-xl text-xs font-black transition-all bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-sm'
            : 'income-mode-btn px-3 py-2.5 rounded-xl text-xs font-black transition-all text-slate-500 hover:text-slate-800 dark:hover:text-white';
    });
    document.getElementById('shiftIncomeGroup')?.classList.toggle('hidden', !isShiftClose);

    const categorySelect = document.getElementById('cbCategory');
    const amountInput = document.getElementById('cbAmount');
    const descriptionInput = document.getElementById('cbDescription');
    if (categorySelect) {
        categorySelect.innerHTML = isShiftClose
            ? '<option value="Thu kết ca">Thu kết ca</option>'
            : '<option value="Thu khác">Thu khác</option>';
        categorySelect.disabled = isShiftClose;
    }
    if (amountInput) {
        amountInput.readOnly = isShiftClose;
        amountInput.classList.toggle('cursor-not-allowed', isShiftClose);
    }
    if (!isShiftClose) {
        const shiftSelect = document.getElementById('cbShiftSource');
        if (shiftSelect) shiftSelect.value = '';
        if (amountInput) amountInput.value = '';
        if (descriptionInput) descriptionInput.value = '';
    } else {
        applySelectedShiftIncome();
    }
}

async function loadShiftIncomeOptions() {
    const shiftSelect = document.getElementById('cbShiftSource');
    if (!shiftSelect) return;
    shiftSelect.innerHTML = '<option value="">Đang tải danh sách ca...</option>';

    try {
        const todayIso = new Date().toISOString().slice(0, 10);
        const [employees, shifts] = await Promise.all([
            getEmployees(),
            getShifts({ from: todayIso, to: todayIso })
        ]);
        const nameById = new Map(employees.map(emp => [emp.id, emp.name]));
        shiftIncomeOptions = (shifts || [])
            .filter(shift => shift.status === 'worked' && Number(shift.sales_amount || 0) > 0)
            .map(shift => ({
                ...shift,
                employee_name: nameById.get(shift.employee_id) || 'Không rõ nhân viên'
            }));

        if (!shiftIncomeOptions.length) {
            shiftSelect.innerHTML = '<option value="">Chưa có ca nào nhập doanh thu hôm nay</option>';
            applySelectedShiftIncome();
            return;
        }

        shiftSelect.innerHTML = '<option value="">-- Chọn ca kết ca --</option>' + shiftIncomeOptions.map(shift => {
            const time = `${String(shift.start_time || '').slice(0, 5) || '--:--'}-${String(shift.end_time || '').slice(0, 5) || '--:--'}`;
            return `<option value="${escHtml(shift.id)}">${escHtml(shift.employee_name)} | ${escHtml(shift.shift_name || 'Ca')} ${time} | ${vnd(shift.sales_amount)}</option>`;
        }).join('');
    } catch (err) {
        console.error('[cashbook] Lỗi tải doanh thu ca:', err);
        shiftSelect.innerHTML = '<option value="">Không tải được doanh thu ca</option>';
    }
}

function applySelectedShiftIncome() {
    if (modalType !== 'income' || incomeMode !== 'shift_close') return;
    const selectedId = document.getElementById('cbShiftSource')?.value || '';
    const shift = shiftIncomeOptions.find(item => item.id === selectedId);
    const amountInput = document.getElementById('cbAmount');
    const performerInput = document.getElementById('cbPerformer');
    const descriptionInput = document.getElementById('cbDescription');
    const preview = document.getElementById('shiftIncomePreview');

    if (!shift) {
        if (amountInput) amountInput.value = '';
        if (preview) preview.textContent = 'Chọn một ca để tự lấy số tiền doanh thu nhân viên đã nhập ở tab Nhân viên.';
        return;
    }

    const time = `${String(shift.start_time || '').slice(0, 5) || '--:--'} - ${String(shift.end_time || '').slice(0, 5) || '--:--'}`;
    if (amountInput) amountInput.value = Number(shift.sales_amount || 0);
    if (performerInput) performerInput.value = shift.employee_name || performerInput.value;
    if (descriptionInput) descriptionInput.value = `Thu kết ca ${shift.shift_name || ''} ngày ${shift.shift_date}, ${time}.`;
    if (preview) preview.innerHTML = `Tự lấy doanh thu: <span class="text-emerald-700 dark:text-emerald-300">${vnd(shift.sales_amount)}</span> từ ca ${escHtml(shift.shift_name || 'ca làm')} của ${escHtml(shift.employee_name)}.`;
}

function openCashbookModal(type) {
    modalType = type;
    const modal = document.getElementById('cashbookModal');
    const title = document.getElementById('cashbookModalTitle');
    const icon = document.getElementById('cashbookModalIcon');
    const categorySelect = document.getElementById('cbCategory');
    const btnSave = document.getElementById('btnSaveCashbook');

    if (!modal || !categorySelect) return;

    const incomeModeGroup = document.getElementById('incomeModeGroup');
    const categories = type === 'income' ? ['Thu kết ca', 'Thu khác'] : EXPENSE_CATEGORIES;
    categorySelect.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    if (type !== 'income') {
        incomeModeGroup?.classList.add('hidden');
        document.getElementById('shiftIncomeGroup')?.classList.add('hidden');
        categorySelect.disabled = false;
        const amountInput = document.getElementById('cbAmount');
        if (amountInput) {
            amountInput.readOnly = false;
            amountInput.classList.remove('cursor-not-allowed');
        }
    }

    if (type === 'income') {
        incomeModeGroup?.classList.remove('hidden');
        loadShiftIncomeOptions();
        setIncomeMode('shift_close');
        title.textContent = 'Lập Phiếu Thu';
        icon.className = 'w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20';
        icon.innerHTML = '<i class="fa-solid fa-circle-plus text-base"></i>';
        btnSave.className = 'w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-black text-sm shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 mt-4';
    } else {
        title.textContent = 'Lập Phiếu Chi';
        icon.className = 'w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/20';
        icon.innerHTML = '<i class="fa-solid fa-circle-minus text-base"></i>';
        btnSave.className = 'w-full bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-black text-sm shadow-lg shadow-rose-500/30 transition-all flex items-center justify-center gap-2 mt-4';
    }

    const performerInput = document.getElementById('cbPerformer');
    if (performerInput) {
        const userStr = localStorage.getItem('pos_user');
        if (userStr) {
            const user = JSON.parse(userStr);
            performerInput.value = user.name || '';
        }
    }

    modal.classList.remove('hidden');
}

function closeCashbookModal() {
    const modal = document.getElementById('cashbookModal');
    const form = document.getElementById('cashbookForm');
    if (modal) modal.classList.add('hidden');
    if (form) form.reset();
}

async function handleCashbookSubmit(e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('cbAmount').value);
    const category = document.getElementById('cbCategory').value;
    const paymentMethod = document.getElementById('cbPaymentMethod').value;
    const performer = document.getElementById('cbPerformer').value.trim() || 'Nhân viên';
    const description = document.getElementById('cbDescription').value.trim();
    const selectedShiftId = document.getElementById('cbShiftSource')?.value || '';
    const selectedShift = shiftIncomeOptions.find(item => item.id === selectedShiftId);

    // Validate
    if (modalType === 'income' && incomeMode === 'shift_close' && !selectedShift) {
        alert('Vui lòng chọn ca đã nhập doanh thu trước khi lập phiếu thu kết ca.');
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        alert('Số tiền nhập vào phải lớn hơn 0. Vui lòng kiểm tra lại.');
        document.getElementById('cbAmount')?.focus();
        return;
    }

    const prefix = modalType === 'income' ? 'PT' : 'PC';
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const code = `${prefix}-${yy}${mm}${dd}-${rand}`;

    const saveBtn = document.getElementById('btnSaveCashbook');
    const originalText = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> ĐANG LƯU...';

    try {
        if (!supabaseClient) throw new Error('Supabase client chưa được khởi tạo.');

        const newTx = {
            transaction_code: code,
            type: modalType,
            amount: amount,
            category: category,
            ref_type: 'manual',
            ref_id: selectedShift && isUuid(selectedShift.id) ? selectedShift.id : null,
            payment_method: paymentMethod,
            performer: selectedShift?.employee_name || performer,
            description: selectedShift
                ? `${description} Doanh thu nhân viên nhập ở tab Nhân viên: ${vnd(selectedShift.sales_amount)}.`
                : description,
            status: 'completed',
            transaction_date: now.toISOString()
        };

        const { error } = await supabaseClient
            .from('cashbook_transactions')
            .insert([newTx]);

        if (error) {
            // Phân tích lỗi DB cụ thể để báo rõ hơn
            if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
                throw new Error('Bảng cashbook_transactions chưa được tạo trong Supabase. Vui lòng chạy file SQL migration 015_create_cashbook.sql trong Supabase Dashboard → SQL Editor.');
            }
            throw error;
        }

        closeCashbookModal();
        loadCashbook();
        showToast(`Lập phiếu ${modalType === 'income' ? 'thu' : 'chi'} thành công!`);
    } catch (err) {
        console.error('[cashbook] Lỗi lập phiếu:', err);
        alert('❌ Lỗi lập phiếu:\n\n' + err.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalText;
    }
}

async function cancelCashbookTransaction(txId) {
    if (!confirm('Bạn có chắc chắn muốn hủy phiếu giao dịch này?')) return;
    try {
        if (!supabaseClient) throw new Error('Supabase client chưa được khởi tạo.');
        
        const { error } = await supabaseClient
            .from('cashbook_transactions')
            .update({ status: 'cancelled', updated_at: new Date().toISOString() })
            .eq('id', txId);

        if (error) throw error;

        loadCashbook();
        showToast('Hủy phiếu giao dịch thành công!');
    } catch (err) {
        console.error('[cashbook] Lỗi hủy phiếu:', err);
        alert('Lỗi: ' + err.message);
    }
}

function showToast(msg) {
    const toast = document.getElementById('invoiceToast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = "fixed top-5 right-5 z-[9999] px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm bg-emerald-600 text-white animate-in fade-in slide-in-from-top-4";
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// ─── MODAL DETAILS ───────────────────────────────────────────────────
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
            const batchInfo = item.batch_id ? `<div class="text-[10px] text-slate-400 font-medium">Lô: <span class="font-bold text-blue-500">${item.batch_no || '---'}</span> | Hạn dùng: <span class="font-bold text-orange-500">${item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('vi-VN') : '---'}</span></div>` : '';
            
            const productStatusNote = item.product_status_note ? `<div class="text-[10px] text-amber-600 dark:text-amber-300 font-bold mt-1"><i class="fa-solid fa-circle-info mr-1"></i>${escHtml(item.product_status_note)}</div>` : '';

            return `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td class="py-3 px-4">
                    <div class="font-bold text-slate-800 dark:text-white text-xs">${item.product_name}</div>
                    ${batchInfo}
                    ${productStatusNote}
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
    if (activeSubTab === 'invoices') {
        document.getElementById('tableWrapper')?.classList.toggle('hidden', state !== 'table');
        document.getElementById('cashbookTableWrapper')?.classList.add('hidden');
    } else {
        document.getElementById('cashbookTableWrapper')?.classList.toggle('hidden', state !== 'table');
        document.getElementById('tableWrapper')?.classList.add('hidden');
    }
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
    ['searchInput', 'dateFrom', 'dateTo', 'statusFilter', 'cbTypeFilter', 'cbSourceFilter', 'cbMethodFilter', 'cbStatusFilter'].forEach(id => { 
        const el = document.getElementById(id); 
        if (el) el.value = ''; 
    });
    if (activeSubTab === 'invoices') {
        loadOrders();
    } else {
        loadCashbook();
    }
}
