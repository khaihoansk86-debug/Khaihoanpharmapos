// js/features/pos/invoicesController.js
import { fetchOrders, fetchOrderDetail, cancelOrder } from './orderService.js';
import { initLayout } from '../../components/layout.js';
import { supabaseClient } from '../../core/supabase.js';
import { createCustomer } from '../customers/customerService.js';
import { expandComboItems, parseComboDescription } from '../products/comboRules.js';

let currentOrder = null;
let activeSubTab = 'invoices';
let activeDebtMode = 'customer';
let modalType = 'income'; // 'income' or 'expense'
let incomeMode = 'shift_close'; // 'shift_close' or 'other'
let realtimePosSuggestion = null;
let cashbookCurrentPage = 1;
let cashbookItemsPerPage = 20;
let debtModalMode = 'customer'; // 'customer' or 'supplier'
let loadedDebtTargets = []; // stores active customers or suppliers

const vnd = (v) => new Intl.NumberFormat('vi-VN').format(Math.abs(v || 0)) + 'đ';
const formatDateInputValue = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};
const startOfTodayIso = () => {
    const now = new Date();
    return `${formatDateInputValue(now)}T00:00:00`;
};
const escHtml = (str) => {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
};

const STATUS_LABEL = { completed: 'Hoàn thành', cancelled: 'Đã hủy', draft: 'Nháp' };
const STATUS_CLASS = {
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
};

const PAYMENT_METHOD_LABEL = {
    cash: 'Tiền mặt',
    bank_transfer: 'Chuyển khoản',
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
    const cls = STATUS_CLASS[status] || STATUS_CLASS.draft;
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
    initDebtModeToggles();

    loadOrders();

    // Event Listeners
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        const action = btn?.dataset.action;
        if (action) {
            const handlers = {
                'load-orders': () => loadOrders(),
                'reset-filter': () => resetFilter(),
                'close-order-detail': () => closeModal(),
                'open-return-order': () => openReturnOrderInPOS(),
                'cancel-order': () => cancelCurrentOrder(),
                'print-order': () => printOrder(),
                'toggle-filter': () => toggleSidebar(),
                'collect-debt': () => {
                    const orderId = btn.dataset.orderId;
                    const orderCode = btn.dataset.orderCode;
                    const debtAmount = parseFloat(btn.dataset.debt || '0');
                    handleCollectDebt(orderId, orderCode, debtAmount);
                },
                'pay-supplier-debt': () => {
                    const docId = btn.dataset.docId;
                    const docCode = btn.dataset.docCode;
                    const debtAmount = parseFloat(btn.dataset.debt || '0');
                    handlePaySupplierDebt(docId, docCode, debtAmount);
                }
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

        // In nhãn cọc tiền
        const printLabelBtn = e.target.closest('[data-action="print-cashbook-label"]');
        if (printLabelBtn) {
            const txId = printLabelBtn.dataset.txId;
            printCashbookLabel(txId);
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
                if (activeSubTab === 'invoices' || activeSubTab === 'ecommerce') {
                    loadOrders();
                } else if (activeSubTab === 'cashbook') {
                    loadCashbook();
                } else if (activeSubTab === 'debts') {
                    loadDebts();
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

    const btnCreateCustomerDebt = document.getElementById('btnCreateCustomerDebt');
    const btnCreateSupplierDebt = document.getElementById('btnCreateSupplierDebt');
    const btnCloseDebtModal = document.getElementById('btnCloseDebtModal');
    const debtForm = document.getElementById('debtForm');

    if (btnCreateCustomerDebt) btnCreateCustomerDebt.addEventListener('click', () => openDebtModal('customer'));
    if (btnCreateSupplierDebt) btnCreateSupplierDebt.addEventListener('click', () => openDebtModal('supplier'));
    if (btnCloseDebtModal) btnCloseDebtModal.addEventListener('click', closeDebtModal);
    if (debtForm) debtForm.addEventListener('submit', handleDebtSubmit);

    const btnQuickAddCustomer = document.getElementById('btnQuickAddCustomer');
    const quickCustomerForm = document.getElementById('quickCustomerForm');

    if (btnQuickAddCustomer) {
        btnQuickAddCustomer.addEventListener('click', () => {
            const modal = document.getElementById('quickCustomerModal');
            if (modal) {
                document.getElementById('qc_phone').value = '';
                document.getElementById('qc_name').value = '';
                document.getElementById('qc_note').value = '';
                modal.classList.remove('hidden');
            }
        });
    }

    if (quickCustomerForm) {
        quickCustomerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = e.submitter || quickCustomerForm.querySelector('button[type="submit"]');
            const originalText = submitBtn ? submitBtn.innerHTML : 'Lưu & Chọn';

            try {
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Đang lưu...';
                }

                const payload = {
                    phone: document.getElementById('qc_phone').value.trim(),
                    full_name: document.getElementById('qc_name').value.trim(),
                    note: document.getElementById('qc_note').value.trim()
                };

                const newCustomer = await createCustomer(payload);

                // Add to loadedDebtTargets and reload dropdown
                loadedDebtTargets.unshift(newCustomer);

                const targetSelect = document.getElementById('debtTargetSelect');
                if (targetSelect) {
                    targetSelect.innerHTML = '<option value="">-- Chọn khách hàng --</option>' + loadedDebtTargets.map(c => {
                        const phoneStr = c.phone ? ` - ${c.phone}` : '';
                        return `<option value="${c.id}">${escHtml(c.full_name)} (${escHtml(c.customer_code)}${escHtml(phoneStr)})</option>`;
                    }).join('');
                    targetSelect.value = newCustomer.id;
                    targetSelect.disabled = false;
                }

                document.getElementById('quickCustomerModal').classList.add('hidden');
                showToast('Đã thêm khách hàng thành công!');

            } catch (err) {
                alert('Lỗi: ' + err.message);
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            }
        });
    }

    document.querySelectorAll('.income-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => setIncomeMode(btn.dataset.incomeMode || 'other'));
    });
    document.getElementById('cbAmount')?.addEventListener('input', updateRealtimeDifferencePreview);
    document.getElementById('cbCashAmount')?.addEventListener('input', updateRealtimeDifferencePreview);

    // Chọn khổ giấy in nhãn cọc tiền
    const cbPrintTemplateSelect = document.getElementById('cbPrintTemplateSelect');
    if (cbPrintTemplateSelect) {
        // Tải lại từ localStorage
        const saved = localStorage.getItem('cashbook_print_template') || '35x22';
        cbPrintTemplateSelect.value = saved;
        window._cashbookPrintTemplate = saved;
        cbPrintTemplateSelect.addEventListener('change', () => {
            window._cashbookPrintTemplate = cbPrintTemplateSelect.value;
            localStorage.setItem('cashbook_print_template', cbPrintTemplateSelect.value);
        });
    } else {
        // Mặc định từ localStorage nếu không có select
        window._cashbookPrintTemplate = localStorage.getItem('cashbook_print_template') || '35x22';
    }
});

window.changeCashbookPage = (page) => {
    if (page < 1) return;
    cashbookCurrentPage = page;
    loadCashbook();
};

window.changeCashbookItemsPerPage = (size) => {
    cashbookItemsPerPage = parseInt(size, 10) || 20;
    cashbookCurrentPage = 1;
    loadCashbook();
};

window.applySuggestionAmount = (amount, method) => {
    const amountInput = document.getElementById('cbAmount');
    const paymentMethodSelect = document.getElementById('cbPaymentMethod');
    if (amountInput) {
        amountInput.value = amount;
        amountInput.dispatchEvent(new Event('input'));
        amountInput.focus();
    }
    if (paymentMethodSelect) {
        paymentMethodSelect.value = method;
        paymentMethodSelect.dispatchEvent(new Event('change'));
    }
};

function initSubTabs() {
    const tabInvoices = document.getElementById('tabInvoices');
    const tabEcommerce = document.getElementById('tabEcommerce');
    const tabCashbook = document.getElementById('tabCashbook');
    const tabDebts = document.getElementById('tabDebts');

    if (!tabInvoices || !tabCashbook) return;

    tabInvoices.addEventListener('click', () => {
        if (activeSubTab === 'invoices') return;
        activeSubTab = 'invoices';
        switchSubTab();
    });

    tabEcommerce?.addEventListener('click', () => {
        if (activeSubTab === 'ecommerce') return;
        activeSubTab = 'ecommerce';
        switchSubTab();
    });

    tabCashbook.addEventListener('click', () => {
        if (activeSubTab === 'cashbook') return;
        activeSubTab = 'cashbook';
        switchSubTab();
    });

    tabDebts?.addEventListener('click', () => {
        if (activeSubTab === 'debts') return;
        activeSubTab = 'debts';
        switchSubTab();
    });
}

function setSubTabClass(tab, active) {
    if (!tab) return;
    tab.className = active
        ? 'px-5 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 shadow-sm'
        : 'px-5 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-350';
}

function updateOrderTableLabels() {
    const customerHeader = document.querySelector('#tableWrapper thead th:nth-child(3)');
    const amountHeader = document.querySelector('#tableWrapper thead th:nth-child(4)');
    if (customerHeader) customerHeader.textContent = activeSubTab === 'ecommerce' ? 'Kênh / Người lập' : 'Khách hàng';
    if (amountHeader) amountHeader.textContent = activeSubTab === 'ecommerce' ? 'Giá vốn xuất' : 'Tổng tiền';
}

function switchSubTab() {
    const tabInvoices = document.getElementById('tabInvoices');
    const tabEcommerce = document.getElementById('tabEcommerce');
    const tabCashbook = document.getElementById('tabCashbook');
    const tabDebts = document.getElementById('tabDebts');
    const pageTitle = document.getElementById('pageTitle');
    const cashbookHeaderActions = document.getElementById('cashbookHeaderActions');
    const debtHeaderActions = document.getElementById('debtHeaderActions');
    const cashbookStats = document.getElementById('cashbookStats');
    const debtsStats = document.getElementById('debtsStats');
    const tableWrapper = document.getElementById('tableWrapper');
    const cashbookTableWrapper = document.getElementById('cashbookTableWrapper');
    const debtsWrapper = document.getElementById('debtsWrapper');

    const invoiceFilterItems = document.querySelectorAll('.invoice-filter-item');
    const cashbookFilterItems = document.querySelectorAll('.cashbook-filter-item');

    setSubTabClass(tabInvoices, activeSubTab === 'invoices');
    setSubTabClass(tabEcommerce, activeSubTab === 'ecommerce');
    setSubTabClass(tabCashbook, activeSubTab === 'cashbook');
    setSubTabClass(tabDebts, activeSubTab === 'debts');

    if (activeSubTab === 'invoices' || activeSubTab === 'ecommerce') {
        if (pageTitle) pageTitle.innerHTML = activeSubTab === 'ecommerce'
            ? `<i class="fa-solid fa-globe text-pink-600"></i> Hàng xuất TMĐT`
            : `<i class="fa-solid fa-receipt text-blue-600"></i> Lịch sử Hóa đơn`;
        if (cashbookHeaderActions) cashbookHeaderActions.classList.add('hidden');
        if (debtHeaderActions) debtHeaderActions.classList.add('hidden');
        if (cashbookStats) cashbookStats.classList.add('hidden');
        if (debtsStats) debtsStats.classList.add('hidden');

        invoiceFilterItems.forEach(el => el.classList.remove('hidden'));
        cashbookFilterItems.forEach(el => el.classList.add('hidden'));

        if (tableWrapper) tableWrapper.classList.remove('hidden');
        if (cashbookTableWrapper) cashbookTableWrapper.classList.add('hidden');
        if (debtsWrapper) debtsWrapper.classList.add('hidden');
        updateOrderTableLabels();

        loadOrders();
    } else if (activeSubTab === 'cashbook') {
        if (pageTitle) pageTitle.innerHTML = `<i class="fa-solid fa-wallet text-emerald-600"></i> Sổ Quỹ Thu Chi`;
        if (cashbookHeaderActions) cashbookHeaderActions.classList.remove('hidden');
        if (debtHeaderActions) debtHeaderActions.classList.add('hidden');
        if (cashbookStats) cashbookStats.classList.remove('hidden');
        if (debtsStats) debtsStats.classList.add('hidden');

        invoiceFilterItems.forEach(el => el.classList.add('hidden'));
        cashbookFilterItems.forEach(el => el.classList.remove('hidden'));

        if (tableWrapper) tableWrapper.classList.add('hidden');
        if (cashbookTableWrapper) cashbookTableWrapper.classList.remove('hidden');
        if (debtsWrapper) debtsWrapper.classList.add('hidden');

        loadCashbook();
    } else if (activeSubTab === 'debts') {
        if (pageTitle) pageTitle.innerHTML = `<i class="fa-solid fa-handshake-angle text-indigo-600"></i> Quản lý công nợ`;
        if (cashbookHeaderActions) cashbookHeaderActions.classList.add('hidden');
        if (debtHeaderActions) debtHeaderActions.classList.remove('hidden');
        if (cashbookStats) cashbookStats.classList.add('hidden');
        if (debtsStats) debtsStats.classList.remove('hidden');

        invoiceFilterItems.forEach(el => el.classList.add('hidden'));
        cashbookFilterItems.forEach(el => el.classList.add('hidden'));

        if (tableWrapper) tableWrapper.classList.add('hidden');
        if (cashbookTableWrapper) cashbookTableWrapper.classList.add('hidden');
        if (debtsWrapper) debtsWrapper.classList.remove('hidden');

        loadDebts();
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
    if (activeSubTab === 'debts') {
        loadDebts();
        return;
    }
    const search = document.getElementById('searchInput')?.value.trim() || '';
    const dateFrom = document.getElementById('dateFrom')?.value || '';
    const dateTo = document.getElementById('dateTo')?.value || '';
    const status = document.getElementById('statusFilter')?.value || '';

    setSearchLoading(true);
    showState('loading');

    try {
        const orderType = activeSubTab === 'ecommerce' ? 'ecommerce' : 'retail';
        let orders = await fetchOrders({ search, dateFrom, dateTo, limit: 200, orderType });
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

    setLabel(activeSubTab === 'ecommerce' ? `Tìm thấy ${orders.length} phiếu xuất TMĐT` : `Tìm thấy ${orders.length} hóa đơn`);
    if (!orders.length) { showState('empty'); return; }

    body.innerHTML = orders.map(order => {
        const date = new Date(order.created_at).toLocaleString('vi-VN');
        const isReturn = order.total < 0;
        const total = (isReturn ? '-' : '') + vnd(order.total);
        const customerName = escHtml(order.customer_name || 'Khách lẻ');
        const code = escHtml(order.order_code);
        const ecommerceInfo = activeSubTab === 'ecommerce'
            ? `<div class="text-[10px] text-pink-500 dark:text-pink-300 font-black uppercase mt-1">Nền tảng: ${escHtml(order.ecommerce_platform || 'TMĐT')}</div>`
            : '';

        return `
        <tr class="hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors cursor-pointer group" data-order-id="${escHtml(order.id)}">
            <td class="py-4 px-6">
                <span class="font-mono font-black ${isReturn ? 'text-emerald-600' : 'text-blue-600'} text-xs group-hover:underline">${code}</span>
            </td>
            <td class="py-4 px-6 text-xs font-medium text-slate-500 dark:text-slate-400">${date}</td>
            <td class="py-4 px-6 font-bold text-slate-800 dark:text-white text-sm">${customerName}${ecommerceInfo}</td>
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
            .select('*', { count: 'exact' })
            .order('transaction_date', { ascending: false });

        if (type) query = query.eq('type', type);
        if (source) query = query.eq('ref_type', source);
        if (method) query = query.eq('payment_method', method);
        if (status) query = query.eq('status', status);
        if (dateFrom) query = query.gte('transaction_date', `${dateFrom}T00:00:00Z`);
        if (dateTo) query = query.lte('transaction_date', `${dateTo}T23:59:59Z`);

        if (search) {
            query = query.or(`transaction_code.ilike.%${search}%,category.ilike.%${search}%,performer.ilike.%${search}%,description.ilike.%${search}%`);
        }

        const from = (cashbookCurrentPage - 1) * cashbookItemsPerPage;
        const to = from + cashbookItemsPerPage - 1;
        query = query.range(from, to);

        const { data: txs, error, count } = await query;
        if (error) throw error;

        // Fetch all matching transactions to calculate correct stats (without pagination range limit)
        let statsQuery = supabaseClient
            .from('cashbook_transactions')
            .select('type, amount, status');

        if (type) statsQuery = statsQuery.eq('type', type);
        if (source) statsQuery = statsQuery.eq('ref_type', source);
        if (method) statsQuery = statsQuery.eq('payment_method', method);
        if (status) statsQuery = statsQuery.eq('status', status);
        if (dateFrom) statsQuery = statsQuery.gte('transaction_date', `${dateFrom}T00:00:00Z`);
        if (dateTo) statsQuery = statsQuery.lte('transaction_date', `${dateTo}T23:59:59Z`);

        if (search) {
            statsQuery = statsQuery.or(`transaction_code.ilike.%${search}%,category.ilike.%${search}%,performer.ilike.%${search}%,description.ilike.%${search}%`);
        }

        const { data: allTxsForStats, error: statsError } = await statsQuery;
        if (statsError) throw statsError;

        const filteredTxs = txs || [];
        calculateStats(allTxsForStats || []);
        renderCashbookTable(filteredTxs, count || 0);
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

function renderCashbookTable(txs, totalCount = txs.length) {
    const body = document.getElementById('cashbookTableBody');
    const pagination = document.getElementById('cashbookPagination');
    if (!body) return;

    // Cache để hàm in nhãn tra cứu
    window._cashbookTxCache = txs;

    setLabel(`Tìm thấy ${totalCount} giao dịch`);
    if (!txs.length) {
        if (pagination) {
            pagination.innerHTML = '';
            pagination.classList.add('hidden');
        }
        showState('empty');
        return;
    }

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

        // Nút in nhãn cho phiếu thu hoàn thành
        const printBtnHtml = tx.status === 'completed'
            ? `<button onclick="event.stopPropagation(); window.printCashbookLabel('${escHtml(tx.id)}')"
                title="In nhãn dán cọc tiền"
                class="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all text-xs">
                <i class="fa-solid fa-print"></i>
               </button>`
            : '';

        let actionHtml;
        if (tx.ref_type === 'manual') {
            if (tx.status === 'completed') {
                actionHtml = `<div class="flex items-center justify-center gap-1.5">
                    ${printBtnHtml}
                    <button onclick="event.stopPropagation(); window.cancelCashbookTx('${escHtml(tx.id)}')" class="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all text-xs" title="Hủy phiếu"><i class="fa-solid fa-ban"></i></button>
                </div>`;
            } else {
                actionHtml = '<span class="text-slate-400 font-medium text-xs">Đã hủy</span>';
            }
        } else {
            actionHtml = `<div class="flex items-center justify-center">${printBtnHtml}</div>`;
        }

        const noteInfo = tx.description ? `<div class="text-[10px] text-slate-400 italic font-medium mt-1">Ghi chú: ${escHtml(tx.description)}</div>` : '';

        return `
        <tr class="hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors cursor-pointer" onclick="window.showCashbookDetail('${escHtml(tx.id)}')">
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

    const totalPages = Math.max(1, Math.ceil(totalCount / cashbookItemsPerPage));
    if (cashbookCurrentPage > totalPages) cashbookCurrentPage = totalPages;
    if (pagination) {
        pagination.classList.remove('hidden');
        pagination.innerHTML = `
            <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-slate-500 dark:text-slate-400">Hiển thị:</span>
                    <select onchange="window.changeCashbookItemsPerPage(this.value)" class="text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5">
                        <option value="20" ${cashbookItemsPerPage === 20 ? 'selected' : ''}>20 phiếu / trang</option>
                        <option value="50" ${cashbookItemsPerPage === 50 ? 'selected' : ''}>50 phiếu / trang</option>
                        <option value="100" ${cashbookItemsPerPage === 100 ? 'selected' : ''}>100 phiếu / trang</option>
                    </select>
                </div>
                <div class="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                    <button onclick="window.changeCashbookPage(${Math.max(1, cashbookCurrentPage - 1)})" class="px-3 py-1.5 rounded-lg text-sm font-bold ${cashbookCurrentPage === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}"><i class="fa-solid fa-chevron-left mr-1"></i>Trước</button>
                    <div class="px-4 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-black text-sm rounded-lg border border-blue-100 dark:border-blue-800/50">Trang ${cashbookCurrentPage} / ${totalPages}</div>
                    <button onclick="window.changeCashbookPage(${Math.min(totalPages, cashbookCurrentPage + 1)})" class="px-3 py-1.5 rounded-lg text-sm font-bold ${cashbookCurrentPage === totalPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}">Sau<i class="fa-solid fa-chevron-right ml-1"></i></button>
                </div>
            </div>
        `;
    }

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

    const standardFields = document.getElementById('cbStandardFields');
    const shiftCloseFields = document.getElementById('cbShiftCloseFields');
    const categorySelect = document.getElementById('cbCategory');

    if (categorySelect) {
        categorySelect.innerHTML = isShiftClose
            ? '<option value="Thu kết ca">Thu kết ca</option>'
            : '<option value="Thu khác">Thu khác</option>';
        categorySelect.disabled = isShiftClose;
    }

    if (isShiftClose) {
        standardFields?.classList.add('hidden');
        shiftCloseFields?.classList.remove('hidden');
        document.getElementById('cbAmount')?.removeAttribute('required');
        document.getElementById('cbCashAmount')?.setAttribute('required', 'true');
    } else {
        standardFields?.classList.remove('hidden');
        shiftCloseFields?.classList.add('hidden');
        document.getElementById('cbAmount')?.setAttribute('required', 'true');
        document.getElementById('cbCashAmount')?.removeAttribute('required');

        const amountInput = document.getElementById('cbAmount');
        const descriptionInput = document.getElementById('cbDescription');
        if (amountInput) amountInput.value = '';
        if (descriptionInput) descriptionInput.value = '';
        realtimePosSuggestion = null;
        renderRealtimeSuggestionPreview();
    }
    updateRealtimeDifferencePreview();
}

async function loadRealtimePosSuggestion() {
    try {
        if (!supabaseClient) throw new Error('Supabase client chưa được khởi tạo.');
        realtimePosSuggestion = null;
        renderRealtimeSuggestionPreview('Đang lấy doanh thu POS realtime...');

        const now = new Date();
        const { data: orders, error } = await supabaseClient
            .from('orders')
            .select('id, total, created_at, order_type, status')
            .gte('created_at', startOfTodayIso())
            .lte('created_at', now.toISOString())
            .eq('status', 'completed')
            .or('order_type.eq.retail,order_type.is.null')
            .order('created_at', { ascending: true });

        if (error) throw error;

        const orderList = orders || [];
        const total = orderList.reduce((sum, order) => sum + Number(order.total || 0), 0);
        const positiveOrders = orderList.filter(order => Number(order.total || 0) > 0).length;
        const returnOrders = orderList.filter(order => Number(order.total || 0) < 0).length;

        // Lấy danh sách ca làm việc của ngày hôm nay để gợi ý chi tiết tiền mặt vs chuyển khoản
        const todayLocal = new Date();
        const yyyy = todayLocal.getFullYear();
        const mm = String(todayLocal.getMonth() + 1).padStart(2, '0');
        const dd = String(todayLocal.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;

        const { data: shifts, error: shiftsError } = await supabaseClient
            .from('employee_shifts')
            .select('cash_amount, bank_amount, status')
            .eq('shift_date', todayStr);

        let cashTotal = 0;
        let bankTotal = 0;
        if (!shiftsError && shifts) {
            shifts.forEach(s => {
                if (s.status === 'worked') {
                    cashTotal += Number(s.cash_amount || 0);
                    bankTotal += Number(s.bank_amount || 0);
                }
            });
        }

        realtimePosSuggestion = {
            total,
            cashTotal,
            bankTotal,
            orderCount: orderList.length,
            positiveOrders,
            returnOrders,
            asOf: now.toISOString()
        };
        applyRealtimeSuggestion();
    } catch (err) {
        console.error('[cashbook] Lỗi tải gợi ý doanh thu POS realtime:', err);
        realtimePosSuggestion = null;
        renderRealtimeSuggestionPreview('Không tải được doanh thu POS realtime.');
    }
}

function applyRealtimeSuggestion() {
    if (modalType !== 'income' || incomeMode !== 'shift_close') return;
    const cashInput = document.getElementById('cbCashAmount');
    const bankInput = document.getElementById('cbBankAmount');
    const shiftPerformerInput = document.getElementById('cbShiftPerformer');

    if (!realtimePosSuggestion) {
        if (cashInput) cashInput.value = '';
        if (bankInput) bankInput.value = '';
        renderRealtimeSuggestionPreview('Chưa có dữ liệu POS realtime để gợi ý.');
        return;
    }

    if (cashInput) {
        cashInput.value = Number(realtimePosSuggestion.cashTotal || 0);
    }
    if (bankInput) {
        bankInput.value = Number(realtimePosSuggestion.bankTotal || 0);
    }

    if (shiftPerformerInput) {
        const userStr = localStorage.getItem('pos_user');
        if (userStr) {
            const user = JSON.parse(userStr);
            shiftPerformerInput.value = user.name || '';
        }
    }
    renderRealtimeSuggestionPreview();
}

function renderRealtimeSuggestionPreview(message = '') {
    const preview = document.getElementById('shiftIncomePreview');
    if (!preview) return;
    if (message) {
        preview.textContent = message;
        return;
    }
    if (!realtimePosSuggestion) {
        preview.textContent = 'Hệ thống sẽ lấy doanh thu POS trong ngày tới thời điểm hiện tại để gợi ý.';
        return;
    }
    const asOf = new Date(realtimePosSuggestion.asOf).toLocaleTimeString('vi-VN');
    preview.innerHTML = `
        <div class="flex flex-col gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
            <div>POS realtime tới <span class="text-emerald-700 dark:text-emerald-300 font-black">${escHtml(asOf)}</span>: <span class="text-emerald-700 dark:text-emerald-300 font-black">${vnd(realtimePosSuggestion.total)}</span></div>
            <div class="mt-1 flex flex-wrap gap-4 text-slate-500 dark:text-slate-400">
                <span>Gợi ý Tiền mặt: <span class="text-emerald-600 font-black">${vnd(realtimePosSuggestion.cashTotal)}</span> (Có thể sửa)</span>
                <span>Gợi ý Chuyển khoản: <span class="text-blue-600 font-black">${vnd(realtimePosSuggestion.bankTotal)}</span> (Khóa cứng)</span>
            </div>
            <div class="text-[10px] text-slate-500 mt-1 font-medium"><i class="fa-solid fa-circle-info mr-1"></i>Hệ thống đã tự động điền số tiền gợi ý vào ô nhập tương ứng bên dưới.</div>
        </div>
    `;
    updateRealtimeDifferencePreview();
}

function updateRealtimeDifferencePreview() {
    const diffEl = document.getElementById('cbRealtimeDifference');
    if (!diffEl) return;
    if (incomeMode !== 'shift_close' || modalType !== 'income' || !realtimePosSuggestion) {
        diffEl.classList.add('hidden');
        diffEl.innerHTML = '';
        return;
    }
    const cashVal = Number(document.getElementById('cbCashAmount')?.value || 0);
    const bankVal = Number(document.getElementById('cbBankAmount')?.value || 0);
    const totalDeclared = cashVal + bankVal;

    const diff = totalDeclared - Number(realtimePosSuggestion.total || 0);
    const absDiff = Math.abs(diff);
    const label = diff === 0 ? 'Khớp POS realtime' : diff > 0 ? 'Thu cao hơn POS' : 'Thu thấp hơn POS';
    const color = diff === 0
        ? 'text-emerald-700 dark:text-emerald-300'
        : diff > 0
            ? 'text-amber-700 dark:text-amber-300'
            : 'text-rose-700 dark:text-rose-300';
    diffEl.className = `rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-xs font-bold ${color}`;
    diffEl.innerHTML = `${label}: ${diff === 0 ? '0đ' : `${diff > 0 ? '+' : '-'}${vnd(absDiff)}`}`;
    const guidance = diff > 0
        ? '<div class="mt-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">Phần chênh lệch dương chỉ được ghi chú để đối soát; phiếu tiền mặt vẫn lưu đúng số thực nộp.</div>'
        : diff < 0
            ? '<div class="mt-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">Hệ thống sẽ giữ số thực thu hiện tại và ghi chú phần thấp hơn POS để dễ đối soát cuối ca.</div>'
            : '';
    diffEl.innerHTML = `${label}: ${diff === 0 ? '0đ' : `${diff > 0 ? '+' : '-'}${vnd(absDiff)}`}${guidance}`;
    diffEl.classList.remove('hidden');
}

function buildShiftCloseDescriptions({ baseDescription, cashAmount, bankAmount, posCashAmount, posBankAmount }) {
    const totalActual = Number(cashAmount || 0) + Number(bankAmount || 0);
    const totalPos = Number(posCashAmount || 0) + Number(posBankAmount || 0);
    const diff = totalActual - totalPos;
    const diffLabel = diff === 0
        ? 'Khớp POS realtime'
        : diff > 0
            ? `Nhiều hơn POS ${vnd(diff)}`
            : `Thấp hơn POS ${vnd(Math.abs(diff))}`;
    const prefix = baseDescription ? `${baseDescription} ` : '';

    return {
        cash: `${prefix}(Thu kết ca tiền mặt theo POS; POS tiền mặt: ${vnd(posCashAmount)}; Thực thu tiền mặt: ${vnd(cashAmount)}; ${diffLabel}).`,
        bank: `${prefix}(Thu kết ca chuyển khoản theo POS; POS chuyển khoản: ${vnd(posBankAmount)}; ${diffLabel}).`,
        diff
    };
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
    }

    if (type === 'income') {
        incomeModeGroup?.classList.remove('hidden');
        loadRealtimePosSuggestion();
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
    realtimePosSuggestion = null;
    updateRealtimeDifferencePreview();
}

async function handleCashbookSubmit(e) {
    e.preventDefault();
    const isShiftClose = modalType === 'income' && incomeMode === 'shift_close';
    const category = document.getElementById('cbCategory').value;
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');

    // Validate
    if (modalType === 'income' && incomeMode === 'shift_close' && !realtimePosSuggestion) {
        alert('Chưa tải được doanh thu POS realtime để gợi ý. Vui lòng thử lại.');
        return;
    }

    const saveBtn = document.getElementById('btnSaveCashbook');
    const originalText = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> ĐANG LƯU...';

    try {
        if (!supabaseClient) throw new Error('Supabase client chưa được khởi tạo.');

        if (isShiftClose) {
            const cashAmount = parseFloat(document.getElementById('cbCashAmount').value || 0);
            const bankAmount = parseFloat(document.getElementById('cbBankAmount').value || 0);
            const performer = document.getElementById('cbShiftPerformer').value.trim() || 'Nhân viên';
            const description = document.getElementById('cbDescription').value.trim();
            const posCashAmount = Number(realtimePosSuggestion?.cashTotal || 0);
            const posBankAmount = Number(realtimePosSuggestion?.bankTotal || 0);

            if (isNaN(cashAmount) || cashAmount < 0) {
                alert('Số tiền mặt không hợp lệ.');
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalText;
                return;
            }

            if (cashAmount === 0 && bankAmount === 0) {
                alert('Tổng số tiền thu kết ca phải lớn hơn 0.');
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalText;
                return;
            }

            const transactions = [];
            const descriptions = buildShiftCloseDescriptions({
                baseDescription: description,
                cashAmount,
                bankAmount,
                posCashAmount,
                posBankAmount
            });
            const baseCashAmount = cashAmount;

            if (baseCashAmount > 0) {
                const rand1 = Math.floor(1000 + Math.random() * 9000);
                const code1 = `PT-${yy}${mm}${dd}-${rand1}`;
                transactions.push({
                    transaction_code: code1,
                    type: 'income',
                    amount: baseCashAmount,
                    category: category,
                    ref_type: 'manual',
                    ref_id: null,
                    payment_method: 'cash',
                    performer: performer,
                    description: `${description}${description ? ' ' : ''}(Thu kết ca Tiền mặt; Gợi ý POS: ${Number(realtimePosSuggestion?.cashTotal || 0)}; Chênh lệch: ${cashAmount - Number(realtimePosSuggestion?.cashTotal || 0)}).`,
                    status: 'completed',
                    transaction_date: now.toISOString()
                });
                transactions[transactions.length - 1].description = descriptions.cash;
            }

            if (bankAmount > 0) {
                const rand2 = Math.floor(1000 + Math.random() * 9000);
                const code2 = `PT-${yy}${mm}${dd}-${rand2}`;
                transactions.push({
                    transaction_code: code2,
                    type: 'income',
                    amount: bankAmount,
                    category: category,
                    ref_type: 'manual',
                    ref_id: null,
                    payment_method: 'bank_transfer',
                    performer: performer,
                    description: `${description}${description ? ' ' : ''}(Thu kết ca Chuyển khoản cố định; POS: ${bankAmount}).`,
                    status: 'completed',
                    transaction_date: now.toISOString()
                });
                transactions[transactions.length - 1].description = descriptions.bank;
            }

            if (transactions.length > 0) {
                const { error } = await supabaseClient
                    .from('cashbook_transactions')
                    .insert(transactions);

                if (error) throw error;
            }
        } else {
            const amount = parseFloat(document.getElementById('cbAmount').value);
            const paymentMethod = document.getElementById('cbPaymentMethod').value;
            const performer = document.getElementById('cbPerformer').value.trim() || 'Nhân viên';
            const description = document.getElementById('cbDescription').value.trim();

            if (isNaN(amount) || amount <= 0) {
                alert('Số tiền nhập vào phải lớn hơn 0. Vui lòng kiểm tra lại.');
                document.getElementById('cbAmount')?.focus();
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalText;
                return;
            }

            const prefix = modalType === 'income' ? 'PT' : 'PC';
            const rand = Math.floor(1000 + Math.random() * 9000);
            const code = `${prefix}-${yy}${mm}${dd}-${rand}`;

            const newTx = {
                transaction_code: code,
                type: modalType,
                amount: amount,
                category: category,
                ref_type: 'manual',
                ref_id: null,
                payment_method: paymentMethod,
                performer: performer,
                description: description,
                status: 'completed',
                transaction_date: now.toISOString()
            };

            const { error } = await supabaseClient
                .from('cashbook_transactions')
                .insert([newTx]);

            if (error) throw error;
        }

        closeCashbookModal();
        loadCashbook();
        showToast('Lập phiếu giao dịch thành công!');
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

// ─── IN NHÃN CỌC TIỀN ────────────────────────────────────────────────
function printCashbookLabel(txId) {
    console.log('printCashbookLabel called with txId:', txId);
    // Tìm tx trong danh sách đã load
    const txs = window._cashbookTxCache || [];
    console.log('printCashbookLabel: cache size', txs.length);
    console.log('printCashbookLabel: looking for txId', txId);
    const tx = txs.find(t => t.id === txId);
    console.log('printCashbookLabel: tx found?', !!tx);

    if (!tx) {
        alert('Không tìm thấy thông tin phiếu để in.');
        return;
    }

    const dt = new Date(tx.transaction_date);
    const dateStr = dt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    const isIncome = tx.type === 'income';
    const typeLabel = isIncome ? 'PHIẾU THU' : 'PHIẾU CHI';
    const typeColor = isIncome ? '#059669' : '#dc2626';
    const methodMap = { cash: 'Tiền mặt', bank_transfer: 'Chuyển khoản' };
    const methodLabel = methodMap[tx.payment_method] || tx.payment_method || 'Khác';

    const amountFormatted = new Intl.NumberFormat('vi-VN').format(tx.amount) + 'đ';
    const performer = tx.performer || 'Nhân viên';
    const code = tx.transaction_code || '';

    // Hỏi khổ giấy
    const template = window._cashbookPrintTemplate || '50x30';
    const isSmall = template === '35x22';

    const W = isSmall ? '35mm' : '50mm';
    const H = isSmall ? '22mm' : '30mm';

    const fontSize = {
        store: isSmall ? '5pt' : '6pt',
        type: isSmall ? '8pt' : '10pt',
        amount: isSmall ? '11pt' : '14pt',
        meta: isSmall ? '5.5pt' : '6.5pt',
        code: isSmall ? '4.5pt' : '5.5pt',
    };

    const padding = isSmall ? '1mm' : '1.5mm';

    const labelHtml = `
        <div style="width:${W}; height:${H}; box-sizing:border-box; display:flex; flex-direction:column; justify-content:space-between; align-items:center; padding:${padding}; background:white; color:black; font-family:Arial,sans-serif; overflow:hidden; text-align:center;">
            <div style="font-size:${fontSize.store}; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; border-bottom:0.5px dashed #000; width:100%; padding-bottom:0.3mm; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                NHÀ THUỐC KHẢI HOÀN
            </div>
            <div style="font-size:${fontSize.type}; font-weight:900; color:${typeColor}; margin:0.2mm 0; letter-spacing:0.5px;">
                ${typeLabel}
            </div>
            <div style="font-size:${fontSize.meta}; font-weight:700; color:#475569; margin:0;">
                ${methodLabel}
            </div>
            <div style="font-size:${fontSize.amount}; font-weight:900; color:#1e3a5f; line-height:1;">
                ${amountFormatted}
            </div>
            <div style="font-size:${fontSize.meta}; font-weight:700; color:#374151; margin-top:0.2mm; display:flex; gap:1.5mm; align-items:center; justify-content:center;">
                <span>${dateStr}</span>
                <span style="color:#9ca3af;">|</span>
                <span>${timeStr}</span>
                <span style="color:#9ca3af;">|</span>
                <span>${performer}</span>
            </div>
            <div style="font-size:${fontSize.code}; font-family:monospace; color:#9ca3af; margin-top:0.2mm; letter-spacing:0.5px; border-top:0.3px dashed #e5e7eb; width:100%; padding-top:0.3mm;">
                ${code}
            </div>
        </div>
    `;

    const pageStyle = `
        @page {
            size: ${W} ${H};
            margin: 0;
        }
        body { margin: 0; padding: 0; }
        #kh-cashbook-print-wrap { display: block !important; width: ${W}; }
    `;

    const printWin = window.open('', '_blank', 'width=400,height=300');
    console.log('printCashbookLabel: opened print window?', !!printWin);
    if (!printWin) {
        alert('Trình duyệt đã chặn cửa sổ in. Vui lòng cho phép popup.');
        return;
    }
    printWin.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>In Nhãn Phiếu</title><style>${pageStyle}</style></head><body><div id="kh-cashbook-print-wrap">${labelHtml}</div></body></html>`);
    console.log('printCashbookLabel: wrote content to print window');
    printWin.document.close();
    // Đợi một chút để nội dung render
    setTimeout(() => {
        printWin.focus();
        printWin.print();
        // Đóng sau in
        printWin.onafterprint = () => printWin.close();
    }, 100);
}

window.printCashbookLabel = printCashbookLabel;
window.cancelCashbookTx = cancelCashbookTransaction;

window.showCashbookDetail = (txId) => {
    const txs = window._cashbookTxCache || [];
    const tx = txs.find(t => t.id === txId);
    if (!tx) return;

    const modal = document.getElementById('cashbookDetailModal');
    if (!modal) return;

    const isIncome = tx.type === 'income';
    const typeLabel = isIncome ? 'Phiếu Thu' : 'Phiếu Chi';
    const typeColor = isIncome ? '#059669' : '#dc2626';
    const amountFormatted = vnd(tx.amount);
    const methodMap = { cash: 'Tiền mặt', bank_transfer: 'Chuyển khoản' };
    const dt = new Date(tx.transaction_date);
    const dateStr = dt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const statusMap = { completed: 'Hoàn thành', cancelled: 'Đã hủy' };

    document.getElementById('cbDetailTitle').textContent = `Chi Tiết ${typeLabel}`;
    document.getElementById('cbDetailCode').textContent = tx.transaction_code || '---';
    document.getElementById('cbDetailIcon').className = isIncome
        ? 'w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center'
        : 'w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center';
    document.getElementById('cbDetailType').textContent = typeLabel;
    document.getElementById('cbDetailType').style.color = typeColor;
    document.getElementById('cbDetailStatus').textContent = statusMap[tx.status] || tx.status;
    document.getElementById('cbDetailAmount').textContent = amountFormatted;
    document.getElementById('cbDetailAmount').style.color = isIncome ? '#059669' : '#dc2626';
    document.getElementById('cbDetailMethod').textContent = methodMap[tx.payment_method] || tx.payment_method || '-';
    document.getElementById('cbDetailCategory').textContent = tx.category || '-';
    document.getElementById('cbDetailPerformer').textContent = tx.performer || 'Hệ thống';
    document.getElementById('cbDetailDate').textContent = `${dateStr} - ${timeStr}`;
    document.getElementById('cbDetailDesc').textContent = tx.description || 'Không có ghi chú';

    modal.classList.remove('hidden');
};

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
        const comboChildParentIds = new Set((order.items || [])
            .filter(item => item.line_type === 'combo_component' && item.parent_order_item_id)
            .map(item => item.parent_order_item_id));
        const comboProductIds = [...new Set((order.items || []).map(item => item.product_id).filter(Boolean))];
        const comboDefinitionsByProductId = new Map();
        if (comboProductIds.length > 0 && supabaseClient) {
            const { data: comboProducts } = await supabaseClient
                .from('products')
                .select('id, description')
                .in('id', comboProductIds);
            (comboProducts || []).forEach(product => {
                const comboDefinition = parseComboDescription(product.description);
                if (comboDefinition) comboDefinitionsByProductId.set(product.id, comboDefinition);
            });
        }

        document.getElementById('modalOrderCode').textContent = order.order_code;
        document.getElementById('modalCustomerName').textContent = order.customer_name || 'Khách lẻ';
        document.getElementById('modalCustomerPhone').textContent = order.customer_phone || '---';
        document.getElementById('modalCreatedAt').textContent = new Date(order.created_at).toLocaleString('vi-VN');

        const statusEl = document.getElementById('modalStatus');
        statusEl.textContent = STATUS_LABEL[order.status] || order.status;
        statusEl.className = `inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${STATUS_CLASS[order.status] || STATUS_CLASS.draft}`;

        const itemsBody = document.getElementById('modalItemsBody');
        const displayItems = [];
        const comboComponentGroups = new Map();

        (order.items || []).forEach(item => {
            if (item.line_type !== 'combo_component' || !item.parent_order_item_id) {
                displayItems.push(item);
                return;
            }

            const groupKey = [
                item.parent_order_item_id,
                item.product_id || item.product_name || '',
                item.unit_name || ''
            ].join('::');
            const existingGroup = comboComponentGroups.get(groupKey);
            if (existingGroup) {
                existingGroup.quantity = Number(existingGroup.quantity || 0) + Number(item.quantity || 0);
                existingGroup.batch_details.push({
                    batch_no: item.batch_no || item.batch_number || '---',
                    expiry_date: item.expiry_date || null,
                    quantity: Number(item.quantity || 0)
                });
                return;
            }

            const groupedItem = {
                ...item,
                batch_details: item.batch_id ? [{
                    batch_no: item.batch_no || item.batch_number || '---',
                    expiry_date: item.expiry_date || null,
                    quantity: Number(item.quantity || 0)
                }] : []
            };
            comboComponentGroups.set(groupKey, groupedItem);
            displayItems.push(groupedItem);
        });

        itemsBody.innerHTML = displayItems.map(item => {
            const isReturn = item.total_price < 0;
            const comboDefinition = comboDefinitionsByProductId.get(item.product_id);
            const batchInfo = Array.isArray(item.batch_details) && item.batch_details.length > 0
                ? `<div class="text-[10px] text-slate-400 font-medium">${item.batch_details.map(detail => `Lô: <span class="font-bold text-blue-500">${escHtml(detail.batch_no || '---')}</span> | Hạn dùng: <span class="font-bold text-orange-500">${detail.expiry_date ? new Date(detail.expiry_date).toLocaleDateString('vi-VN') : '---'}</span> | SL: <span class="font-bold text-slate-600 dark:text-slate-200">${detail.quantity}</span>`).join('<br>')}</div>`
                : (item.batch_id ? `<div class="text-[10px] text-slate-400 font-medium">Lô: <span class="font-bold text-blue-500">${item.batch_no || '---'}</span> | Hạn dùng: <span class="font-bold text-orange-500">${item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('vi-VN') : '---'}</span></div>` : '');

            const deletedNote = !item.product_id ? '<div class="text-[10px] text-amber-600 dark:text-amber-300 font-bold mt-1"><i class="fa-solid fa-circle-info mr-1"></i>Đã xóa khỏi hàng hóa</div>' : '';
            const productStatusNote = item.product_status_note ? `<div class="text-[10px] text-amber-600 dark:text-amber-300 font-bold mt-1"><i class="fa-solid fa-circle-info mr-1"></i>${escHtml(item.product_status_note)}</div>` : '';

            const comboInfo = comboDefinition && !comboChildParentIds.has(item.id)
                ? `<div class="mt-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">Thành phần: ${expandComboItems(comboDefinition, Math.abs(Number(item.quantity || 0))).map(component => `${escHtml(component.name)} x${component.quantity} ${escHtml(component.unit || '')}`.trim()).join(', ')}</div>`
                : '';
            const isComboComponent = item.line_type === 'combo_component';

            return `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td class="py-3 px-4">
                    <div class="font-bold text-slate-800 dark:text-white text-xs ${isComboComponent ? 'pl-4' : ''}">${isComboComponent ? `- ${item.product_name}` : item.product_name}</div>
                    ${batchInfo}
                    ${comboInfo}
                    ${deletedNote}
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

    const tableWrapper = document.getElementById('tableWrapper');
    const cashbookTableWrapper = document.getElementById('cashbookTableWrapper');
    const debtsWrapper = document.getElementById('debtsWrapper');

    if (activeSubTab === 'invoices' || activeSubTab === 'ecommerce') {
        tableWrapper?.classList.toggle('hidden', state !== 'table');
        cashbookTableWrapper?.classList.add('hidden');
        debtsWrapper?.classList.add('hidden');
    } else if (activeSubTab === 'cashbook') {
        cashbookTableWrapper?.classList.toggle('hidden', state !== 'table');
        tableWrapper?.classList.add('hidden');
        debtsWrapper?.classList.add('hidden');
    } else if (activeSubTab === 'debts') {
        debtsWrapper?.classList.toggle('hidden', state !== 'table');
        tableWrapper?.classList.add('hidden');
        cashbookTableWrapper?.classList.add('hidden');
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
    cashbookCurrentPage = 1;
    if (activeSubTab === 'invoices' || activeSubTab === 'ecommerce') {
        loadOrders();
    } else if (activeSubTab === 'cashbook') {
        loadCashbook();
    } else if (activeSubTab === 'debts') {
        loadDebts();
    }
}

function initDebtModeToggles() {
    const btnCustomer = document.getElementById('debtModeCustomer');
    const btnSupplier = document.getElementById('debtModeSupplier');
    const tblCustomer = document.getElementById('customerDebtTable');
    const tblSupplier = document.getElementById('supplierDebtTable');

    if (!btnCustomer || !btnSupplier || !tblCustomer || !tblSupplier) return;

    const setMode = (mode) => {
        activeDebtMode = mode;
        const isCust = mode === 'customer';

        btnCustomer.className = isCust
            ? 'px-4 py-2 rounded-xl text-xs font-black bg-blue-600 text-white shadow-md shadow-blue-500/20 transition-all'
            : 'px-4 py-2 rounded-xl text-xs font-black text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all';

        btnSupplier.className = !isCust
            ? 'px-4 py-2 rounded-xl text-xs font-black bg-blue-600 text-white shadow-md shadow-blue-500/20 transition-all'
            : 'px-4 py-2 rounded-xl text-xs font-black text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all';

        tblCustomer.classList.toggle('hidden', !isCust);
        tblSupplier.classList.toggle('hidden', isCust);

        loadDebts();
    };

    btnCustomer.addEventListener('click', () => setMode('customer'));
    btnSupplier.addEventListener('click', () => setMode('supplier'));
}

async function loadDebts() {
    const search = document.getElementById('searchInput')?.value.trim() || '';
    setSearchLoading(true);
    showState('loading');

    try {
        if (!supabaseClient) throw new Error('Supabase client chưa được khởi tạo.');

        // 1. Fetch Customer Debts
        let customerQuery = supabaseClient
            .from('view_customer_debts')
            .select('*')
            .order('created_at', { ascending: false });
        if (search) {
            customerQuery = customerQuery.or(`order_code.ilike.%${search}%,customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`);
        }
        const { data: custDebts, error: custErr } = await customerQuery;
        if (custErr) throw custErr;

        // 2. Fetch Supplier Debts
        let supplierQuery = supabaseClient
            .from('view_supplier_debts')
            .select('*')
            .order('confirmed_at', { ascending: false });
        if (search) {
            supplierQuery = supplierQuery.or(`document_code.ilike.%${search}%,supplier_name.ilike.%${search}%`);
        }
        const { data: suppDebts, error: suppErr } = await supplierQuery;
        if (suppErr) throw suppErr;

        renderDebts(custDebts || [], suppDebts || []);
    } catch (err) {
        console.error('[debts] Lỗi tải công nợ:', err);
        showState('empty');
        setLabel('Lỗi kết nối dữ liệu');
    } finally {
        setSearchLoading(false);
    }
}

function renderDebts(custDebts, suppDebts) {
    const custBody = document.getElementById('customerDebtTableBody');
    const suppBody = document.getElementById('supplierDebtTableBody');
    if (!custBody || !suppBody) return;

    // Calculate totals
    const totalCustDebt = custDebts.reduce((sum, d) => sum + Number(d.debt_amount || 0), 0);
    const totalSuppDebt = suppDebts.reduce((sum, d) => sum + Number(d.debt_amount || 0), 0);

    const debtsTotalSupplier = document.getElementById('debtsTotalSupplier');
    const debtsTotalCustomer = document.getElementById('debtsTotalCustomer');
    if (debtsTotalSupplier) debtsTotalSupplier.textContent = vnd(totalSuppDebt);
    if (debtsTotalCustomer) debtsTotalCustomer.textContent = vnd(totalCustDebt);

    // Update label
    const totalCount = activeDebtMode === 'customer' ? custDebts.length : suppDebts.length;
    setLabel(`Tìm thấy ${totalCount} khoản nợ`);

    // Render customer debt table
    if (custDebts.length === 0) {
        custBody.innerHTML = `
            <tr>
                <td colspan="7" class="py-12 text-center text-slate-400 font-semibold">
                    <i class="fa-solid fa-users-slash text-3xl mb-2 opacity-30 block"></i>
                    Không có nợ khách hàng nào cần thu.
                </td>
            </tr>
        `;
    } else {
        custBody.innerHTML = custDebts.map(d => {
            const date = new Date(d.created_at).toLocaleString('vi-VN');
            const total = vnd(d.total);
            const paid = vnd(d.amount_received);
            const debt = vnd(d.debt_amount);
            const name = escHtml(d.customer_name || 'Khách lẻ');
            const phone = d.customer_phone ? ` - ${escHtml(d.customer_phone)}` : '';
            return `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td class="py-4 px-6 font-mono font-black text-xs text-blue-600">${escHtml(d.order_code)}</td>
                    <td class="py-4 px-6 text-xs text-slate-500">${date}</td>
                    <td class="py-4 px-6 font-bold text-sm text-slate-800 dark:text-white">${name}${phone}</td>
                    <td class="py-4 px-6 text-right font-semibold text-slate-700 dark:text-slate-300">${total}</td>
                    <td class="py-4 px-6 text-right font-semibold text-emerald-600 dark:text-emerald-400">${paid}</td>
                    <td class="py-4 px-6 text-right font-black text-rose-500">${debt}</td>
                    <td class="py-4 px-6 text-center">
                        <button data-action="collect-debt" data-order-id="${escHtml(d.order_id)}" data-order-code="${escHtml(d.order_code)}" data-debt="${d.debt_amount}" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-750 text-white rounded-lg text-xs font-black shadow-md shadow-blue-500/10 hover:shadow-blue-550/20 transition-all flex items-center gap-1 mx-auto">
                            <i class="fa-solid fa-hand-holding-dollar"></i> Thu nợ
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Render supplier debt table
    if (suppDebts.length === 0) {
        suppBody.innerHTML = `
            <tr>
                <td colspan="6" class="py-12 text-center text-slate-400 font-semibold">
                    <i class="fa-solid fa-handshake-slash text-3xl mb-2 opacity-30 block"></i>
                    Không có nợ đối tác nào cần trả.
                </td>
            </tr>
        `;
    } else {
        suppBody.innerHTML = suppDebts.map(d => {
            const date = new Date(d.confirmed_at).toLocaleString('vi-VN');
            const paid = vnd(d.paid_amount);
            const debt = vnd(d.debt_amount);
            const name = escHtml(d.supplier_name || 'Nhà cung cấp');
            const code = d.supplier_code ? ` (${escHtml(d.supplier_code)})` : '';
            return `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td class="py-4 px-6 font-mono font-black text-xs text-blue-600">${escHtml(d.document_code)}</td>
                    <td class="py-4 px-6 text-xs text-slate-500">${date}</td>
                    <td class="py-4 px-6 font-bold text-sm text-slate-800 dark:text-white">${name}${code}</td>
                    <td class="py-4 px-6 text-right font-semibold text-emerald-600 dark:text-emerald-400">${paid}</td>
                    <td class="py-4 px-6 text-right font-black text-rose-500">${debt}</td>
                    <td class="py-4 px-6 text-center">
                        <button data-action="pay-supplier-debt" data-doc-id="${escHtml(d.document_id)}" data-doc-code="${escHtml(d.document_code)}" data-debt="${d.debt_amount}" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg text-xs font-black shadow-md shadow-indigo-500/10 hover:shadow-indigo-550/20 transition-all flex items-center gap-1 mx-auto">
                            <i class="fa-solid fa-money-bill-wave"></i> Trả nợ
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Determine state
    const hasData = activeDebtMode === 'customer' ? custDebts.length > 0 : suppDebts.length > 0;
    if (hasData) {
        showState('table');
    } else {
        showState('empty');
    }
}

async function handleCollectDebt(orderId, orderCode, debtAmount) {
    const payAmountStr = prompt(`Thu nợ cho hóa đơn ${orderCode}.\nSố nợ hiện tại: ${vnd(debtAmount)}\n\nNhập số tiền muốn thu (VNĐ):`, debtAmount);
    if (payAmountStr === null) return;

    const payAmount = parseFloat(payAmountStr.replace(/[^0-9]/g, ''));
    if (isNaN(payAmount) || payAmount <= 0) {
        alert('Số tiền không hợp lệ. Vui lòng nhập số lớn hơn 0.');
        return;
    }
    if (payAmount > debtAmount) {
        alert(`Số tiền thu không được lớn hơn số nợ còn lại (${vnd(debtAmount)}).`);
        return;
    }

    const methodOption = prompt(`Chọn hình thức thanh toán cho khoản thu nợ này:\n1. Tiền mặt\n2. Chuyển khoản`, "1");
    if (methodOption === null) return;
    let paymentMethod = 'cash';
    if (methodOption === '2') paymentMethod = 'bank_transfer';

    try {
        if (!supabaseClient) throw new Error('Supabase client chưa được khởi tạo.');

        // 1. Fetch current order
        const { data: orderData, error: orderErr } = await supabaseClient
            .from('orders')
            .select('amount_received, total')
            .eq('id', orderId)
            .single();

        if (orderErr) throw orderErr;

        const newAmountReceived = Number(orderData.amount_received || 0) + payAmount;
        if (newAmountReceived > Number(orderData.total || 0)) {
            alert('Tổng số tiền đã nhận không được vượt quá tổng giá trị hóa đơn.');
            return;
        }

        // 2. Update order
        const { error: updateErr } = await supabaseClient
            .from('orders')
            .update({ amount_received: newAmountReceived, updated_at: new Date().toISOString() })
            .eq('id', orderId);

        if (updateErr) throw updateErr;

        // 3. Create cashbook transaction
        const userStr = localStorage.getItem('pos_user');
        let performer = 'Hệ thống';
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                performer = user.name || 'Nhân viên';
            } catch (e) { }
        }

        const prefix = 'PT-TN';
        const rand = Math.floor(1000 + Math.random() * 9000);
        const txCode = `${prefix}-${orderCode}-${rand}`;

        const newTx = {
            transaction_code: txCode,
            type: 'income',
            amount: payAmount,
            category: 'Thu nợ khách hàng',
            ref_type: 'sales',
            ref_id: orderId,
            payment_method: paymentMethod,
            performer: performer,
            description: `Thu nợ khách hàng cho hóa đơn ${orderCode}. Số tiền thu: ${vnd(payAmount)}.`,
            status: 'completed',
            transaction_date: new Date().toISOString()
        };

        const { error: txErr } = await supabaseClient
            .from('cashbook_transactions')
            .insert([newTx]);

        if (txErr) throw txErr;

        showToast(`Thu nợ thành công số tiền ${vnd(payAmount)}!`);
        loadDebts();
    } catch (err) {
        console.error('[debts] Lỗi thu nợ:', err);
        alert('Lỗi thu nợ: ' + err.message);
    }
}

async function openDebtModal(mode) {
    debtModalMode = mode;
    const modal = document.getElementById('debtModal');
    const title = document.getElementById('debtModalTitle');
    const subtitle = document.getElementById('debtModalSubtitle');
    const icon = document.getElementById('debtModalIcon');
    const targetLabel = document.getElementById('debtTargetLabel');
    const targetSelect = document.getElementById('debtTargetSelect');
    const amountInput = document.getElementById('debtAmountInput');
    const dateInput = document.getElementById('debtDateInput');
    const descInput = document.getElementById('debtDescriptionInput');
    const btnSave = document.getElementById('btnSaveDebt');

    if (!modal || !targetSelect) return;

    const btnQuickAddCust = document.getElementById('btnQuickAddCustomer');
    if (btnQuickAddCust) {
        btnQuickAddCust.classList.toggle('hidden', mode !== 'customer');
    }

    if (amountInput) amountInput.value = '';
    if (descInput) descInput.value = '';
    if (dateInput) dateInput.value = formatDateInputValue(new Date());

    targetSelect.innerHTML = '<option value="">Đang tải...</option>';
    targetSelect.disabled = true;

    if (mode === 'customer') {
        title.textContent = 'Ghi Nợ Khách Hàng';
        subtitle.textContent = 'Ghi nhận khoản nợ thủ công cho khách hàng';
        icon.className = 'w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20';
        targetLabel.textContent = 'Khách hàng';
        btnSave.className = 'w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-black text-sm shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 mt-4';
    } else {
        title.textContent = 'Ghi Nợ Đối Tác';
        subtitle.textContent = 'Ghi nhận khoản nợ thủ công cho nhà cung cấp / đối tác';
        icon.className = 'w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20';
        targetLabel.textContent = 'Đối tác / Nhà cung cấp';
        btnSave.className = 'w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-black text-sm shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 mt-4';
    }

    modal.classList.remove('hidden');

    try {
        if (!supabaseClient) throw new Error('Supabase client chưa được khởi tạo.');

        if (mode === 'customer') {
            const { data: customers, error } = await supabaseClient
                .from('customers')
                .select('id, full_name, phone, customer_code')
                .eq('is_active', true)
                .order('full_name', { ascending: true });

            if (error) throw error;
            loadedDebtTargets = customers || [];

            if (loadedDebtTargets.length === 0) {
                targetSelect.innerHTML = '<option value="">Không có khách hàng hoạt động</option>';
            } else {
                targetSelect.innerHTML = '<option value="">-- Chọn khách hàng --</option>' + loadedDebtTargets.map(c => {
                    const phoneStr = c.phone ? ` - ${c.phone}` : '';
                    return `<option value="${c.id}">${escHtml(c.full_name)} (${escHtml(c.customer_code)}${escHtml(phoneStr)})</option>`;
                }).join('');
                targetSelect.disabled = false;
            }
        } else {
            const { data: suppliers, error } = await supabaseClient
                .from('suppliers')
                .select('id, name, supplier_code')
                .eq('is_active', true)
                .order('name', { ascending: true });

            if (error) throw error;
            loadedDebtTargets = suppliers || [];

            if (loadedDebtTargets.length === 0) {
                targetSelect.innerHTML = '<option value="">Không có đối tác hoạt động</option>';
            } else {
                targetSelect.innerHTML = '<option value="">-- Chọn đối tác / nhà cung cấp --</option>' + loadedDebtTargets.map(s => {
                    return `<option value="${s.id}">${escHtml(s.name)} (${escHtml(s.supplier_code)})</option>`;
                }).join('');
                targetSelect.disabled = false;
            }
        }
    } catch (err) {
        console.error('[debts] Lỗi nạp đối tượng ghi nợ:', err);
        targetSelect.innerHTML = '<option value="">Lỗi tải dữ liệu</option>';
        alert('Lỗi tải dữ liệu: ' + err.message);
    }
}

function closeDebtModal() {
    const modal = document.getElementById('debtModal');
    const form = document.getElementById('debtForm');
    if (modal) modal.classList.add('hidden');
    if (form) form.reset();
    loadedDebtTargets = [];
}

async function handleDebtSubmit(e) {
    e.preventDefault();
    const targetId = document.getElementById('debtTargetSelect').value;
    const amount = parseFloat(document.getElementById('debtAmountInput').value);
    const dateVal = document.getElementById('debtDateInput').value;
    const description = document.getElementById('debtDescriptionInput').value.trim();

    if (!targetId) {
        alert(debtModalMode === 'customer' ? 'Vui lòng chọn khách hàng.' : 'Vui lòng chọn đối tác.');
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        alert('Số tiền nợ phải lớn hơn 0.');
        return;
    }

    const saveBtn = document.getElementById('btnSaveDebt');
    const originalText = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> ĐANG LƯU...';

    try {
        if (!supabaseClient) throw new Error('Supabase client chưa được khởi tạo.');

        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0];
        const timestampIso = `${dateVal}T${timeStr}Z`;

        const yy = dateVal.slice(2, 4);
        const mm = dateVal.slice(5, 7);
        const dd = dateVal.slice(8, 10);
        const rand = Math.floor(1000 + Math.random() * 9000);

        if (debtModalMode === 'customer') {
            const customer = loadedDebtTargets.find(c => c.id === targetId);
            if (!customer) throw new Error('Không tìm thấy khách hàng đã chọn.');

            const code = `HDCD-${yy}${mm}${dd}-${rand}`;
            const newOrder = {
                order_code: code,
                customer_id: targetId,
                customer_name: customer.full_name,
                customer_phone: customer.phone || null,
                subtotal: amount,
                discount: 0,
                total: amount,
                amount_received: 0,
                change_amount: 0,
                note: description || 'Ghi nợ khách hàng thủ công',
                status: 'completed',
                order_type: 'retail',
                created_at: timestampIso,
                updated_at: now.toISOString()
            };

            const { error } = await supabaseClient
                .from('orders')
                .insert([newOrder]);

            if (error) throw error;
            showToast('Ghi nợ khách hàng thành công!');
        } else {
            const supplier = loadedDebtTargets.find(s => s.id === targetId);
            if (!supplier) throw new Error('Không tìm thấy đối tác đã chọn.');

            const code = `PNCD-${yy}${mm}${dd}-${rand}`;
            const newDoc = {
                document_code: code,
                document_type: 'purchase',
                status: 'confirmed',
                note: description || 'Ghi nợ đối tác thủ công',
                supplier_id: targetId,
                confirmed_at: timestampIso,
                paid_amount: 0,
                debt_amount: amount,
                created_at: timestampIso,
                updated_at: now.toISOString()
            };

            const { error } = await supabaseClient
                .from('inventory_documents')
                .insert([newDoc]);

            if (error) throw error;
            showToast('Ghi nợ đối tác thành công!');
        }

        closeDebtModal();
        loadDebts();
    } catch (err) {
        console.error('[debts] Lỗi lưu khoản nợ:', err);
        alert('Lỗi lưu khoản nợ: ' + err.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalText;
    }
}

async function handlePaySupplierDebt(docId, docCode, debtAmount) {
    const payAmountStr = prompt(`Trả nợ cho phiếu nhập ${docCode}.\nSố nợ hiện tại: ${vnd(debtAmount)}\n\nNhập số tiền muốn trả (VNĐ):`, debtAmount);
    if (payAmountStr === null) return;

    const payAmount = parseFloat(payAmountStr.replace(/[^0-9]/g, ''));
    if (isNaN(payAmount) || payAmount <= 0) {
        alert('Số tiền không hợp lệ. Vui lòng nhập số lớn hơn 0.');
        return;
    }
    if (payAmount > debtAmount) {
        alert(`Số tiền trả không được lớn hơn số nợ còn lại (${vnd(debtAmount)}).`);
        return;
    }

    try {
        if (!supabaseClient) throw new Error('Supabase client chưa được khởi tạo.');

        const { data: docData, error: fetchErr } = await supabaseClient
            .from('inventory_documents')
            .select('paid_amount, debt_amount')
            .eq('id', docId)
            .single();

        if (fetchErr) throw fetchErr;

        const currentPaid = Number(docData.paid_amount || 0);
        const currentDebt = Number(docData.debt_amount || 0);

        if (payAmount > currentDebt) {
            alert(`Nợ hiện tại đã thay đổi. Vui lòng thử lại. Nợ hiện tại: ${vnd(currentDebt)}`);
            return;
        }

        const newPaidAmount = currentPaid + payAmount;
        const newDebtAmount = currentDebt - payAmount;

        const { error: updateErr } = await supabaseClient
            .from('inventory_documents')
            .update({
                paid_amount: newPaidAmount,
                debt_amount: newDebtAmount,
                updated_at: new Date().toISOString()
            })
            .eq('id', docId);

        if (updateErr) throw updateErr;

        showToast(`Trả nợ thành công số tiền ${vnd(payAmount)}!`);
        loadDebts();
    } catch (err) {
        console.error('[debts] Lỗi trả nợ đối tác:', err);
        alert('Lỗi trả nợ đối tác: ' + err.message);
    }
}

