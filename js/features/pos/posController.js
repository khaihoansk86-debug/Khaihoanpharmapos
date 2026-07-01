// js/features/pos/posController.js
import { supabaseClient } from '../../core/supabase.js';
import { fetchProducts } from '../products/productService.js';
import { initLayout } from '../../components/layout.js';
import { renderPOSSearchResults, renderCart, updateChange, showSuccessModal, closeSuccessModal, renderBatchPicker } from './posUI.js';
import { createOrder, createReturnOrder, fetchOrderDetail, getAvailableBatches } from './orderService.js';
import { getAISuggestions, renderAISuggestions } from './aiService.js';
import { createCustomer, fetchCustomers } from '../customers/customerService.js';
import { getShifts, saveShift, getEmployees } from '../employees/employeeService.js';
import { pickTimeMatchedShift } from './shiftSelection.js';
import { createOrderContext, getOrderRules } from './orderRules.js';
import { syncPaymentToCurrentShift, syncReturnSettlementToCurrentShift } from './shiftSyncService.js';
import { getReturnSettlement } from './returnSettlementRules.js';
import { buildInternalIssueNote } from '../inventory/internalIssueMetadata.js';
import {
    QUICK_SALE_KEYS,
    assignQuickSaleShortcut,
    findQuickSaleKey
} from './quickSaleShortcutRules.js';

window.closeSuccessModal = () => {
    closeSuccessModal();
    if (window.POS_COMPLETED_EDIT_OR_RETURN) {
        window.location.href = 'invoices.html';
    }
};

let allProducts = [];
let allCustomers = [];
let cart = [];
let searchTimeout = null;
let customerSearchTimeout = null;
let paymentMethod = 'cash';

// --- TAB STATE MANAGEMENT ---
let tabs = [];
let currentTabId = null;

function createTab(type = 'sale', params = {}) {
    return {
        id: 'tab_' + Date.now() + Math.random().toString(36).substring(7),
        type: type,
        title: type === 'return' ? 'Đổi / Trả hàng' : 'Đơn mới',
        isDoseCut: false,
        isInternal: false,
        cart: [],
        customerValue: '',
        discountAmount: 0,
        amountReceived: 0,
        paymentMethod: 'cash',
        orderNote: '',
        internalReason: 'sample',
        internalTargetType: 'staff',
        returnOrderId: params.returnOrderId || null,
        returnOrder: null,
    };
}

let returnOrder = null;
let returnOrderId = new URLSearchParams(window.location.search).get('returnOrder');
window.POS_RETURN_MODE = Boolean(returnOrderId);
const DEFAULT_QUICK_DOSES = [10000, 12000, 15000, 20000, 25000];
const PINNED_PRODUCTS_KEY = 'posPinnedProductIds';
const QUICK_SHORTCUTS_STORAGE_KEY = 'posQuickSaleShortcuts';
let pinnedProductIds = JSON.parse(localStorage.getItem(PINNED_PRODUCTS_KEY) || '[]');
let quickSaleShortcuts = JSON.parse(localStorage.getItem(QUICK_SHORTCUTS_STORAGE_KEY) || '{}');

function removeVietnameseTones(str) {
    if (!str) return '';
    return String(str).normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

function normalizeKey(value) {
    return value == null ? '' : removeVietnameseTones(String(value)).trim().toUpperCase();
}
function createCartId(prefix = 'cart') { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function findCartItem(cartId) { return cart.find(item => item.cartId === String(cartId)); }
function getDisplayedTotal() {
    const text = document.getElementById('totalFinalDisplay')?.textContent || '0';
    const value = parseInt(text.replace(/[^0-9]/g, ''), 10) || 0;
    return text.includes('-') ? -value : value;
}

function updateReturnSettlementUI() {
    const notice = document.getElementById('returnSettlementNotice');
    const title = document.getElementById('returnSettlementTitle');
    const message = document.getElementById('returnSettlementMessage');
    const icon = document.getElementById('returnSettlementIcon');
    const cashArea = document.getElementById('cashReceivedArea');
    if (!notice || !title || !message || !icon || !cashArea) return;

    if (!window.POS_RETURN_MODE) {
        notice.classList.add('hidden');
        cashArea.classList.remove('hidden');
        return;
    }

    if (!cart.some(item => Number(item.quantity || 0) > 0)) {
        notice.className = 'rounded-2xl border-2 border-slate-200 bg-slate-50 dark:bg-slate-900/40 dark:border-slate-700 p-4 text-sm font-bold text-slate-600 dark:text-slate-300';
        notice.classList.remove('hidden');
        title.textContent = 'Chọn hàng cần đổi hoặc trả';
        message.textContent = 'Chọn số lượng hàng khách trả, sau đó thêm hàng đổi mới nếu có.';
        icon.className = 'fa-solid fa-circle-info mt-0.5 text-lg';
        cashArea.classList.add('hidden');
        return;
    }

    const settlement = getReturnSettlement(getDisplayedTotal());
    const amountText = new Intl.NumberFormat('vi-VN').format(settlement.amount) + 'đ';
    notice.classList.remove('hidden');

    if (settlement.type === 'collect') {
        notice.className = 'rounded-2xl border-2 border-rose-300 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-800 p-4 text-sm font-bold text-rose-700 dark:text-rose-300';
        title.textContent = 'Cần thu thêm từ khách';
        message.textContent = `Khách đổi sang hàng có giá cao hơn. Phải thu thêm ${amountText} trước khi xác nhận.`;
        icon.className = 'fa-solid fa-triangle-exclamation mt-0.5 text-lg';
        cashArea.classList.remove('hidden');
    } else if (settlement.type === 'refund') {
        notice.className = 'rounded-2xl border-2 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 p-4 text-sm font-bold text-emerald-700 dark:text-emerald-300';
        title.textContent = 'Cần hoàn tiền cho khách';
        message.textContent = `Giá trị hàng trả lớn hơn hàng đổi. Cần hoàn lại ${amountText}.`;
        icon.className = 'fa-solid fa-money-bill-transfer mt-0.5 text-lg';
        cashArea.classList.add('hidden');
    } else {
        notice.className = 'rounded-2xl border-2 border-blue-300 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 p-4 text-sm font-bold text-blue-700 dark:text-blue-300';
        title.textContent = 'Đổi hàng ngang giá';
        message.textContent = 'Không thu thêm và không hoàn tiền.';
        icon.className = 'fa-solid fa-scale-balanced mt-0.5 text-lg';
        cashArea.classList.add('hidden');
    }
}

function isDoseCatalogItem(item) {
    const categoryName = item.categoryName || item.product_categories?.name || item.categories?.name || '';
    return categoryName.toLowerCase().includes('cắt liều')
        || categoryName.toLowerCase().includes('thuốc liều')
        || categoryName.toLowerCase().includes('cat lieu')
        || categoryName.toLowerCase().includes('thuoc lieu')
        || item.code?.startsWith('DOSE-')
        || item.product_code?.startsWith('DOSE-');
}

// Phân biệt 2 loại sản phẩm thuốc liều từ description JSON
function isDoseCutMaterial(item) {
    if (isDoseRetailProduct(item)) return false;
    if (item.description) {
        try {
            const desc = JSON.parse(item.description);
            if (desc && desc.is_dose_retail === true) return false;
            return desc && desc.is_dose_cut === true;
        } catch (e) { }
    }
    if (isDoseCatalogItem(item)) return true; // Nằm trong category cắt liều → nguyên liệu
    return false;
}

function isDoseRetailProduct(item) {
    if (item.description) {
        try {
            const desc = JSON.parse(item.description);
            return desc && desc.is_dose_retail === true;
        } catch (e) { }
    }
    const code = item.code || item.product_code || '';
    if (code.startsWith('DOSE-')) return true;
    const name = normalizeKey(item.name || '');
    const baseUnit = item.product_units?.find(u => u.is_base_unit) || item.product_units?.[0] || {};
    return name.includes('THUOC LIEU') && Number(baseUnit.retail_price || item.originalPrice || item.price || 0) > 0;
}

function isDosePackageItem(item) {
    return isDoseRetailProduct(item);
}

function isEcommerceCatalogItem(item) {
    return item?.is_ecommerce === true;
}

function applyChannelPricing(item) {
    const isDoseProduct = isDosePackageItem(item);
    const retailPrice = Number(item.originalPrice || item.retailPrice || item.price || 0);
    const costPrice = Number(item.costPrice || 0);

    if (window.POS_INTERNAL_MODE || window.POS_ECOMMERCE_MODE) {
        item.isIngredient = false;
        item.price = costPrice;
        item.channelPriceType = 'cost';
        return item;
    }

    if (window.POS_DOSE_CUT_MODE && !isDoseProduct) {
        item.isIngredient = true;
        item.price = 0;
        item.channelPriceType = 'dose_ingredient';
        return item;
    }

    item.isIngredient = false;
    item.price = retailPrice;
    item.channelPriceType = 'retail';
    return item;
}

// --- TAB LOGIC IMPLEMENTATION ---
function saveCurrentTabState() {
    if (!currentTabId) return;
    const tab = tabs.find(t => t.id === currentTabId);
    if (!tab) return;

    tab.cart = [...cart];
    tab.isDoseCut = window.POS_DOSE_CUT_MODE || false;
    tab.isInternal = window.POS_INTERNAL_MODE || false;
    tab.isEcommerce = window.POS_ECOMMERCE_MODE || false;
    tab.customerValue = document.getElementById('customerInfo')?.value || '';
    tab.discountAmount = document.getElementById('discountAmount')?.value || '0';
    tab.amountReceived = document.getElementById('amountReceived')?.value || '0';
    tab.paymentMethod = paymentMethod || 'cash';
    tab.orderNote = document.getElementById('orderNote')?.value || '';
    tab.internalReason = document.getElementById('posInternalReasonSelect')?.value || 'sample';
    tab.internalTargetType = document.getElementById('posInternalTargetType')?.value || 'staff';
}

function loadTabState(tabId) {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;
    currentTabId = tabId;

    cart = [...tab.cart];
    window.POS_RETURN_MODE = tab.type === 'return';
    window.POS_DOSE_CUT_MODE = tab.isDoseCut || false;
    window.POS_INTERNAL_MODE = tab.isInternal || false;
    window.POS_ECOMMERCE_MODE = tab.isEcommerce || false;
    paymentMethod = tab.paymentMethod || 'cash';
    returnOrderId = tab.returnOrderId;
    returnOrder = tab.returnOrder;

    // Tự động đồng bộ trạng thái thành phần/giá tiền của các món hàng trong giỏ tùy chế độ tab
    cart.forEach(item => {
        const isDosePackage = isDosePackageItem(item);

        if (window.POS_INTERNAL_MODE) {
            item.isIngredient = false;
            item.price = item.costPrice || 0;
        } else if (window.POS_DOSE_CUT_MODE && !isDosePackage) {
            if (!item.isIngredient) {
                item.isIngredient = true;
                item.originalPrice = item.originalPrice || item.price;
                item.price = 0;
            }
        } else {
            if (item.isIngredient || item.price === item.costPrice) {
                item.isIngredient = false;
                item.price = item.originalPrice || item.price;
            }
        }
    });

    // Cập nhật giá trị vào form (Sử dụng Optional Chaining để rút gọn)
    cart.forEach(item => applyChannelPricing(item));

    const fields = { customerInfo: 'customerValue', discountAmount: 'discountAmount', amountReceived: 'amountReceived', orderNote: 'orderNote' };
    Object.keys(fields).forEach(key => {
        const el = document.getElementById(key);
        if (el) el.value = tab[fields[key]] || (key.includes('Amount') || key === 'amountReceived' ? '0' : '');
    });
    const internalReasonSelect = document.getElementById('posInternalReasonSelect');
    if (internalReasonSelect) internalReasonSelect.value = tab.internalReason || 'sample';
    const internalTargetTypeSelect = document.getElementById('posInternalTargetType');
    if (internalTargetTypeSelect) internalTargetTypeSelect.value = tab.internalTargetType || 'staff';
    updatePaymentMethodUI();

    renderTabUI();
    renderCurrentCart();
    updateChange();

    // Cập nhật Banner trạng thái
    const editBanner = document.getElementById('posEditModeBanner');
    if (window.POS_RETURN_MODE) {
        editBanner?.classList.remove('hidden');
        const title = document.getElementById('posEditModeTitle');
        const subTitle = editBanner?.querySelector('p.text-\\[11px\\]');

        editBanner.className = "bg-rose-600 text-white rounded-2xl shadow-lg border border-rose-500 px-5 py-4 flex items-center justify-between gap-4";
        if (subTitle) subTitle.textContent = "Chế độ đổi / trả hàng";
        if (title) title.textContent = `Đang đổi / trả hàng cho đơn #${returnOrder?.order_code || returnOrderId}`;
        discountInputRow?.classList.add('hidden');
    } else {
        editBanner?.classList.add('hidden');
        cashReceivedArea?.classList.remove('hidden');
        discountInputRow?.classList.remove('hidden');
    }

    // Cập nhật giao diện thanh chuyển đổi chế độ xuất thuốc liều
    if (window.updatePOSModeUI) window.updatePOSModeUI();
}

function setPaymentMethod(method) {
    paymentMethod = method === 'bank_transfer' ? 'bank_transfer' : 'cash';
    updatePaymentMethodUI();
    if (paymentMethod === 'bank_transfer') {
        const total = getDisplayedTotal();
        const amountReceivedInput = document.getElementById('amountReceived');
        if (amountReceivedInput && total > 0) amountReceivedInput.value = String(total);
    }
    updateChange();
    saveCurrentTabState();
}

function getSelectedPaymentMethod() {
    const cashArea = document.getElementById('cashReceivedArea');
    const bankBtn = document.getElementById('posPaymentBankBtn');
    if (cashArea?.dataset.paymentMethod === 'bank_transfer') return 'bank_transfer';
    if (bankBtn?.dataset.selected === 'true') return 'bank_transfer';
    return paymentMethod === 'bank_transfer' ? 'bank_transfer' : 'cash';
}

function updatePaymentMethodUI() {
    const cashBtn = document.getElementById('posPaymentCashBtn');
    const bankBtn = document.getElementById('posPaymentBankBtn');
    const amountLabel = document.getElementById('amountReceivedLabel');
    const amountInput = document.getElementById('amountReceived');
    const cashArea = document.getElementById('cashReceivedArea');
    if (cashArea) cashArea.dataset.paymentMethod = paymentMethod;
    if (cashBtn) {
        cashBtn.dataset.selected = paymentMethod === 'cash' ? 'true' : 'false';
        cashBtn.className = paymentMethod === 'cash'
            ? 'payment-method-btn px-3 py-2 rounded-xl text-xs font-black bg-blue-600 text-white shadow-sm'
            : 'payment-method-btn px-3 py-2 rounded-xl text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700';
    }
    if (bankBtn) {
        bankBtn.dataset.selected = paymentMethod === 'bank_transfer' ? 'true' : 'false';
        bankBtn.className = paymentMethod === 'bank_transfer'
            ? 'payment-method-btn px-3 py-2 rounded-xl text-xs font-black bg-emerald-600 text-white shadow-sm'
            : 'payment-method-btn px-3 py-2 rounded-xl text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700';
    }
    if (amountLabel) amountLabel.textContent = paymentMethod === 'bank_transfer' ? 'Chuyển khoản' : 'Tiền mặt';
    if (amountInput) amountInput.placeholder = paymentMethod === 'bank_transfer' ? 'Số tiền chuyển khoản' : 'Số tiền khách đưa';
}

function updateCounterpartyFieldUI() {
    const label = document.getElementById('customerFieldLabel');
    const icon = document.getElementById('customerFieldIcon');
    const input = document.getElementById('customerInfo');
    const addBtn = document.getElementById('customerQuickAddBtn');
    const suggestions = document.getElementById('customerSuggestions');

    const wrapper = document.getElementById('customerInfoWrapper');

    if (label) {
        label.textContent = window.POS_INTERNAL_MODE ? 'Người / đối tượng tiêu hao' : 'Khách hàng';
    }
    if (icon) {
        icon.className = window.POS_INTERNAL_MODE
            ? 'fa-solid fa-user-doctor absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors text-sm'
            : 'fa-solid fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors text-sm';
    }
    if (input) {
        input.placeholder = window.POS_INTERNAL_MODE ? 'Ghi người nhận / đối tượng tiêu hao...' : 'SĐT hoặc tên khách...';
    }
    if (addBtn) {
        addBtn.classList.toggle('hidden', window.POS_INTERNAL_MODE);
    }
    if (window.POS_INTERNAL_MODE) {
        suggestions?.classList.add('hidden');
    }
    
    if (wrapper) {
        if (window.POS_INTERNAL_MODE) {
            const reason = document.getElementById('posInternalReasonSelect')?.value || 'sample';
            if (reason === 'sample') {
                wrapper.classList.remove('hidden');
            } else {
                wrapper.classList.add('hidden');
                if (input) input.value = '';
            }
        } else {
            wrapper.classList.remove('hidden');
        }
    }
}

// --- SHIFT TRACKING STATE ---
let allEmployees = [];
let currentActiveShift = null;

function getEmployeeName(id) {
    return allEmployees.find(e => e.id === id)?.name || 'Không rõ';
}

const normalizeTimeToSeconds = (timeStr) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map(Number);
    return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
};

const isTimeInInterval = (timeSec, startSec, endSec) => {
    if (endSec >= startSec) {
        return timeSec >= startSec && timeSec < endSec;
    } else {
        // Ca qua đêm (Ví dụ từ 22:00 hôm trước đến 06:00 sáng hôm sau)
        return timeSec >= startSec || timeSec < endSec;
    }
};

async function updateActiveShiftUI() {
    const userStr = localStorage.getItem('pos_user');
    const user = userStr ? JSON.parse(userStr) : null;
    const employeeId = user?.id;
    if (!employeeId) return;

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    let shifts = [];
    try {
        shifts = await getShifts({ from: todayStr, to: todayStr });
    } catch (err) {
        console.error('[pos] Lỗi tải ca làm việc hôm nay:', err);
    }

    const activeTodayShifts = (shifts || []).filter(s => s.status === 'worked' && !s.is_closed);
    const currentSec = today.getHours() * 3600 + today.getMinutes() * 60 + today.getSeconds();

    const timeMatchedShifts = activeTodayShifts.filter(s => {
        if (!s.start_time || !s.end_time) return false;
        const startSec = normalizeTimeToSeconds(s.start_time);
        const endSec = normalizeTimeToSeconds(s.end_time);
        return isTimeInInterval(currentSec, startSec, endSec);
    });

    if (timeMatchedShifts.length > 0) {
        // Ưu tiên theo độ ưu tiên:
        // 1. Ca bắt đầu sớm nhất (start_time tăng dần)
        // 2. Ca của chính nhân viên đang đăng nhập
        timeMatchedShifts.sort((a, b) => {
            const startA = a.start_time || '00:00:00';
            const startB = b.start_time || '00:00:00';
            const timeDiff = startA.localeCompare(startB);
            if (timeDiff !== 0) return timeDiff;

            if (a.employee_id === employeeId && b.employee_id !== employeeId) return -1;
            if (b.employee_id === employeeId && a.employee_id !== employeeId) return 1;
            return 0;
        });
        currentActiveShift = timeMatchedShifts[0];
    } else {
        currentActiveShift = null;
    }

    currentActiveShift = pickTimeMatchedShift(activeTodayShifts.filter(s => s.employee_id === employeeId), currentSec, employeeId);

    const container = document.getElementById('posActiveShiftContainer');
    const nameEl = document.getElementById('posActiveShiftName');

    if (container && nameEl) {
        if (currentActiveShift) {
            container.classList.remove('hidden');
            const empName = getEmployeeName(currentActiveShift.employee_id);
            nameEl.textContent = `${currentActiveShift.shift_name} (${empName})`;
        } else {
            container.classList.add('hidden');
        }
    }
}

window.endCurrentShift = async () => {
    if (!currentActiveShift) {
        alert('Không tìm thấy ca làm việc đang hoạt động.');
        return;
    }
    if (!confirm(`Bạn có chắc chắn muốn kết thúc ca "${currentActiveShift.shift_name}" không? Sau khi kết ca, doanh thu phát sinh tiếp theo sẽ được tính vào ca sau.`)) {
        return;
    }
    try {
        const savedShift = await saveShift({
            ...currentActiveShift,
            is_closed: true,
            closed_at: new Date().toISOString()
        });
        if (!Object.prototype.hasOwnProperty.call(savedShift || {}, 'is_closed')) {
            throw new Error('CSDL chưa có cột is_closed/closed_at. Hãy chạy migration 026_add_is_closed_to_employee_shifts.sql rồi thử lại.');
        }
        alert('Đã kết thúc ca làm việc thành công!');
        await updateActiveShiftUI();
    } catch (err) {
        console.error('[pos] Lỗi khi kết thúc ca:', err);
        alert('Có lỗi xảy ra: ' + err.message);
    }
};

function renderTabUI() {
    const container = document.getElementById('posTabsContainer');
    if (!container) return;

    let html = '';
    let normalCount = 0;
    tabs.forEach((tab) => {
        if (tab.type === 'sale') normalCount++;
        const isActive = tab.id === currentTabId;

        let bgClass = "bg-slate-100 dark:bg-slate-800 text-slate-500";
        let iconHtml = '<i class="fa-solid fa-file-invoice"></i>';
        let displayTitle = tab.title;

        if (tab.type === 'return') {
            bgClass = isActive ? "bg-rose-100 text-rose-700 border-rose-500 dark:bg-rose-900/40 dark:text-rose-400" : "bg-rose-50 text-rose-600/70 border-rose-200 dark:bg-rose-900/20 dark:text-rose-500/60 dark:border-rose-800";
            iconHtml = '<i class="fa-solid fa-arrow-rotate-left"></i>';
        } else {
            bgClass = isActive ? "bg-blue-100 text-blue-700 border-blue-600 dark:bg-blue-900/40 dark:text-blue-400" : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700";
            displayTitle = `Đơn mới ${normalCount}`;
        }

        const borderClass = isActive ? "border-b-2" : "border-b border-t border-l border-r";
        const fontClass = isActive ? "font-black shadow-sm" : "font-bold";
        const tabActive = isActive ? "rounded-t-xl mt-1" : "rounded-xl my-1 text-sm opacity-80 hover:opacity-100";

        html += `
            <div class="flex items-stretch shrink-0">
                <button onclick="switchTab('${tab.id}')" class="px-3 py-1.5 ${bgClass} ${borderClass} ${fontClass} ${tabActive} transition-all flex items-center gap-2">
                    ${iconHtml}
                    ${displayTitle}
                </button>
                ${tabs.length > 1 ? `<button onclick="closeTab('${tab.id}')" class="px-2 py-1.5 ${bgClass} ${borderClass} ${tabActive} !rounded-l-none !border-l-0 transition-all hover:text-red-500 flex items-center"><i class="fa-solid fa-xmark text-xs"></i></button>` : ''}
            </div>
        `;
    });

    html += `
        <button onclick="addNewTab()" class="px-3 py-1.5 my-1 bg-white dark:bg-slate-800 text-slate-500 hover:text-blue-600 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-all ml-1 shrink-0 font-bold text-xs">
            <i class="fa-solid fa-plus"></i> Thêm HĐ
        </button>
    `;

    container.innerHTML = html;
}

function renderQuickActions() {
    const container = document.getElementById('quickActions');
    if (!container) return;
    const searchInput = document.getElementById('posSearchInput');
    if (searchInput) {
        searchInput.placeholder = quickSaleShortcuts.F2
            ? 'Tìm hàng hóa...'
            : 'Tìm hàng hóa (F2)...';
    }

    let html = `<span class="text-sm font-black text-slate-400 uppercase whitespace-nowrap mr-2">Chọn nhanh:</span>`;

    pinnedProductIds.forEach(id => {
        const product = allProducts.find(p => String(p.id) === String(id));
        if (product) {
            const shortcut = findQuickSaleKey(quickSaleShortcuts, `product:${id}`);
            html += `
                <div class="flex items-center shrink-0 group">
                    <button onclick="window.selectProduct('${product.product_code}')" class="px-5 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-l-2xl border border-blue-100 dark:border-blue-800/50 font-black text-base hover:bg-blue-100 transition-all whitespace-nowrap active:scale-95 shadow-sm">
                        ${shortcut ? `<span class="mr-1 rounded-md bg-blue-600 px-1.5 py-0.5 text-[10px] text-white">${shortcut}</span>` : ''}
                        ${product.name}
                    </button>
                    <button onclick="window.removePinnedProduct('${id}')" class="px-3 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-400/50 hover:text-red-500 rounded-r-2xl border-t border-b border-r border-blue-100 dark:border-blue-800/50 transition-all" title="Bỏ ghim">
                        <i class="fa-solid fa-xmark text-xs"></i>
                    </button>
                </div>
            `;
        }
    });

    DEFAULT_QUICK_DOSES.forEach(price => {
        const targetId = `dose:${price}`;
        const shortcut = findQuickSaleKey(quickSaleShortcuts, targetId);
        if (!shortcut) return;
        html += `
            <button onclick="window.addQuickDose(${price})"
                class="shrink-0 px-5 py-2.5 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 rounded-2xl border border-violet-200 dark:border-violet-800/50 font-black text-base hover:bg-violet-100 transition-all whitespace-nowrap active:scale-95 shadow-sm">
                <span class="mr-1 rounded-md bg-violet-600 px-1.5 py-0.5 text-[10px] text-white">${shortcut}</span>
                Thuốc liều ${price / 1000}k
            </button>
        `;
    });

    html += `
        <button onclick="window.openQuickProductModal()" class="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-base hover:bg-slate-200 transition-all whitespace-nowrap active:scale-95 shadow-sm">
            <i class="fa-solid fa-gear mr-1"></i> Tùy chọn
        </button>
    `;

    container.innerHTML = html;
}

window.setPOSMode = (mode) => {
    // Nếu giỏ hàng có sản phẩm, KHÔNG CHO PHÉP đổi chế độ
    const currentTab = tabs.find(t => t.id === currentTabId);
    if (currentTab && currentTab.cart && currentTab.cart.length > 0) {
        let currentModeName = 'Bán thông thường';
        if (window.POS_DOSE_CUT_MODE) currentModeName = 'Xuất thuốc liều';
        if (window.POS_INTERNAL_MODE) currentModeName = 'Xuất nội bộ';
        if (window.POS_ECOMMERCE_MODE) currentModeName = 'Bán TMĐT';

        alert(`Không thể đổi chế độ! Giỏ hàng đang có sản phẩm thuộc chế độ "${currentModeName}". Vui lòng thanh toán hoặc xóa giỏ hàng trước khi chuyển đổi chế độ.`);
        return;
    }

    window.POS_DOSE_CUT_MODE = (mode === 'dose');
    window.POS_INTERNAL_MODE = (mode === 'internal');
    window.POS_ECOMMERCE_MODE = (mode === 'ecommerce');

    if (currentTabId) {
        const tab = tabs.find(t => t.id === currentTabId);
        if (tab) {
            tab.isDoseCut = window.POS_DOSE_CUT_MODE;
            tab.isInternal = window.POS_INTERNAL_MODE;
            tab.isEcommerce = window.POS_ECOMMERCE_MODE;

            // Tự động đồng bộ lại giỏ hàng của tab khi đổi chế độ
            tab.cart.forEach(item => {
                const isDosePackage = isDosePackageItem(item);

                if (window.POS_INTERNAL_MODE) {
                    item.isIngredient = false;
                    item.originalPrice = item.originalPrice || item.price;
                    item.price = item.costPrice || 0;
                } else if (window.POS_DOSE_CUT_MODE && !isDosePackage) {
                    item.isIngredient = true;
                    item.originalPrice = item.originalPrice || item.price;
                    item.price = 0;
                } else if (window.POS_ECOMMERCE_MODE) {
                    item.isIngredient = false;
                    item.originalPrice = item.originalPrice || item.price;
                    item.price = item.costPrice || 0;
                } else {
                    item.isIngredient = false;
                    item.price = item.originalPrice || item.price;
                }
            });
            tab.cart.forEach(item => applyChannelPricing(item));
            cart = [...tab.cart];
        }
    }

    window.updatePOSModeUI();
    renderCurrentCart();
};

window.updatePOSModeUI = () => {
    const normalBtn = document.getElementById('posModeNormalBtn');
    const doseBtn = document.getElementById('posModeDoseBtn');
    const internalBtn = document.getElementById('posModeInternalBtn');
    const doseActionsArea = document.getElementById('doseActionsArea');
    const internalActionsArea = document.getElementById('internalActionsArea');
    const cashReceivedArea = document.getElementById('cashReceivedArea');
    const discountInputRow = document.getElementById('discountInputRow');
    const paymentButton = document.querySelector('[onclick="window.processPayment()"]');
    const ecommerceBtn = document.getElementById('posModeEcommerceBtn');

    // Reset all buttons to default classes first
    const buttons = [normalBtn, doseBtn, internalBtn, ecommerceBtn];
    buttons.forEach(btn => {
        if (btn) {
            btn.className = 'px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-200';
        }
    });

    if (window.POS_DOSE_CUT_MODE) {
        if (doseBtn) {
            doseBtn.className = 'px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all flex items-center gap-1.5 bg-violet-600 text-white shadow-md shadow-violet-500/20';
        }
        doseActionsArea?.classList.remove('hidden');
        internalActionsArea?.classList.add('hidden');
        document.getElementById('ecommerceActionsArea')?.classList.add('hidden');
        document.getElementById('posInternalReasonRow')?.classList.add('hidden');
        document.getElementById('posInternalTargetTypeRow')?.classList.add('hidden');

        cashReceivedArea?.classList.remove('hidden');
        discountInputRow?.classList.remove('hidden');
        if (paymentButton) {
            const btnText = paymentButton.querySelector('.uppercase');
            const btnLabel = paymentButton.querySelector('.flex');
            if (btnText) btnText.textContent = 'Thanh toán (F10)';
            if (btnLabel) btnLabel.innerHTML = '<i class="fa-solid fa-bolt text-yellow-300"></i> HOÀN TẤT';
        }
    } else if (window.POS_INTERNAL_MODE) {
        if (internalBtn) {
            internalBtn.className = 'px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all flex items-center gap-1.5 bg-amber-600 text-white shadow-md shadow-amber-500/20';
        }
        doseActionsArea?.classList.add('hidden');
        internalActionsArea?.classList.remove('hidden');
        document.getElementById('ecommerceActionsArea')?.classList.add('hidden');
        document.getElementById('posInternalReasonRow')?.classList.remove('hidden');
        document.getElementById('posInternalTargetTypeRow')?.classList.remove('hidden');

        // Hide cash received and discount in internal use mode
        cashReceivedArea?.classList.add('hidden');
        discountInputRow?.classList.add('hidden');
        if (paymentButton) {
            const btnText = paymentButton.querySelector('.uppercase');
            const btnLabel = paymentButton.querySelector('.flex');
            if (btnText) btnText.textContent = 'Xuất nội bộ (F10)';
            if (btnLabel) btnLabel.innerHTML = '<i class="fa-solid fa-people-carry-box text-amber-300"></i> XUẤT NGAY';
        }
    } else if (window.POS_ECOMMERCE_MODE) {
        if (ecommerceBtn) {
            ecommerceBtn.className = 'px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all flex items-center gap-1.5 bg-pink-600 text-white shadow-md shadow-pink-500/20';
        }
        doseActionsArea?.classList.add('hidden');
        internalActionsArea?.classList.add('hidden');
        document.getElementById('ecommerceActionsArea')?.classList.remove('hidden');
        cashReceivedArea?.classList.add('hidden');
        discountInputRow?.classList.add('hidden');
        document.getElementById('posInternalReasonRow')?.classList.add('hidden');
        document.getElementById('posInternalTargetTypeRow')?.classList.add('hidden');

        cashReceivedArea?.classList.add('hidden');
        discountInputRow?.classList.add('hidden');
        if (paymentButton) {
            const btnText = paymentButton.querySelector('.uppercase');
            const btnLabel = paymentButton.querySelector('.flex');
            if (btnText) btnText.textContent = 'Xuất TMĐT (F10)';
            if (btnLabel) btnLabel.innerHTML = '<i class="fa-solid fa-globe text-yellow-300"></i> XUẤT HÀNG';
        }
    } else {
        if (normalBtn) {
            normalBtn.className = 'px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all flex items-center gap-1.5 bg-blue-600 text-white shadow-md shadow-blue-500/20';
        }
        doseActionsArea?.classList.add('hidden');
        internalActionsArea?.classList.add('hidden');
        document.getElementById('ecommerceActionsArea')?.classList.add('hidden');
        document.getElementById('posInternalReasonRow')?.classList.add('hidden');
        document.getElementById('posInternalTargetTypeRow')?.classList.add('hidden');

        cashReceivedArea?.classList.remove('hidden');
        discountInputRow?.classList.remove('hidden');
        if (paymentButton) {
            const btnText = paymentButton.querySelector('.uppercase');
            const btnLabel = paymentButton.querySelector('.flex');
            if (btnText) btnText.textContent = 'Thanh toán (F10)';
            if (btnLabel) btnLabel.innerHTML = '<i class="fa-solid fa-bolt text-yellow-300"></i> HOÀN TẤT';
        }
    }

    renderQuickActions();
    updateCounterpartyFieldUI();
};

window.switchTab = (tabId) => { saveCurrentTabState(); loadTabState(tabId); };
window.addNewTab = () => { saveCurrentTabState(); const newTab = createTab('sale'); tabs.push(newTab); loadTabState(newTab.id); };
window.addNewDoseCutTab = () => { saveCurrentTabState(); const newTab = createTab('dose_cut'); tabs.push(newTab); loadTabState(newTab.id); };
window.closeTab = (tabId) => {
    if (tabs.length <= 1) return;
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    tabs = tabs.filter(t => t.id !== tabId);
    if (currentTabId === tabId) {
        const nextTab = tabs[Math.max(0, tabIndex - 1)];
        loadTabState(nextTab.id);
    } else { renderTabUI(); }
};

function findExistingProductIndex(productCode, productId = null, isReturnMode = false, variantNote = '') {
    const normId = productId ? String(productId) : null;
    const normCode = normalizeKey(productCode);
    const normVariant = (variantNote || '').trim().toLowerCase();

    return cart.findIndex(item => {
        // Nếu đang ở chế độ trả hàng, không gộp vào các dòng hàng cũ (originalQuantity)
        if (isReturnMode && item.originalQuantity !== undefined) return false;

        const itemId = item.id || item.productId;
        const itemCode = normalizeKey(item.code);
        const itemVariant = (item.variantNote || '').trim().toLowerCase();

        if (itemVariant !== normVariant) return false;

        // Ưu tiên khớp theo ID nếu có
        if (normId && itemId && String(itemId) === normId) return true;
        // Nếu không có ID (như Thuốc liều tự tạo), khớp theo Code
        return normCode && itemCode === normCode;
    });
}

function renderCurrentCart() {
    renderCart(cart);
    updateReturnSettlementUI();

    // Cập nhật gợi ý AI
    const suggestions = getAISuggestions(cart, allProducts);
    renderAISuggestions(suggestions);
}

function getBaseUnit(product) { return product.product_units?.find(u => u.is_base_unit) || product.product_units?.[0] || {}; }

function parsePriceFromVariant(variantNote) {
    if (!variantNote) return null;
    const cleanStr = variantNote.trim().toLowerCase();

    // 1. Tìm số đi sau bởi chữ 'k' (ví dụ: 11k, 12.5k, 12k, liều 11k, phân loại 11k)
    const kMatch = cleanStr.match(/(\d+(?:\.\d+)?)\s*k\b/);
    if (kMatch) {
        return parseFloat(kMatch[1]) * 1000;
    }

    // 2. Tìm số lớn >= 500 (ví dụ: 11.000, 11000, 11.000đ)
    const normalizedStr = cleanStr.replace(/(\d+)[.,](\d{3})/g, '$1$2'); // "11.000" -> "11000", "11,000" -> "11000"
    const numberMatch = normalizedStr.match(/\b\d+\b/);
    if (numberMatch) {
        const parsed = parseInt(numberMatch[0], 10);
        if (parsed >= 500) {
            return parsed;
        }
    }

    // 3. Fallback tìm bất kỳ chuỗi số nào trong chuỗi và ghép lại
    const digitsOnly = cleanStr.replace(/[^0-9]/g, '');
    if (digitsOnly) {
        const parsed = parseInt(digitsOnly, 10);
        if (parsed >= 500) {
            return parsed;
        }
    }

    return null;
}

async function addProductToCart(product, variantNote = '') {
    let existingIndex = findExistingProductIndex(product.product_code, product.id, window.POS_RETURN_MODE, variantNote);

    if (existingIndex > -1) {
        const item = cart[existingIndex];
        if (item.originalQuantity !== undefined) {
            const maxQuantity = Number(item.maxReturnQuantity || item.originalQuantity || 0);
            item.quantity = Math.min(maxQuantity, Number(item.quantity || 0) + 1);
        } else {
            item.quantity = Number(item.quantity || 0) + 1;
        }
        return;
    }

    const baseUnit = getBaseUnit(product);
    const isDoseProduct = isDoseCutMaterial(product) || product.product_code?.startsWith('DOSE-') || isDoseRetailProduct(product);

    let originalPrice = baseUnit.retail_price || 0;

    // Nếu là thuốc liều và có phân loại/biến thể chứa thông tin giá (VD: 11k, 12k), tự động cập nhật giá theo phân loại
    const isLikelyDose = isDoseProduct || product.name?.toLowerCase().includes('liều') || product.name?.toLowerCase().includes('lieu');
    if (isLikelyDose && variantNote) {
        const parsedPrice = parsePriceFromVariant(variantNote);
        if (parsedPrice !== null) {
            originalPrice = parsedPrice;
        }
    }

    let costPrice = baseUnit.cost_price || 0;

    let ecommercePrice = originalPrice;
    if (product.ecommerce_platforms && Array.isArray(product.ecommerce_platforms)) {
        const platform = document.getElementById('posEcommercePlatform')?.value;
        const pMatch = product.ecommerce_platforms.find(p => p.platform === platform);
        if (pMatch) {
            ecommercePrice = Number(pMatch.price) || originalPrice;
        } else if (product.ecommerce_platforms.length > 0) {
            ecommercePrice = Number(product.ecommerce_platforms[0].price) || originalPrice;
        }
    }
    const isDosePackage = isDosePackageItem(product);
    let itemPrice = (window.POS_INTERNAL_MODE || window.POS_ECOMMERCE_MODE) ? costPrice : originalPrice;
    let isIngredient = false;

    if (window.POS_DOSE_CUT_MODE && !isDosePackage) {
        isIngredient = true;
        itemPrice = 0;
    }

    let batches = [];
    if (product.product_batches && product.product_batches.length > 0) {
        // Tối ưu hóa tốc độ trên Vercel: Dùng ngay các lô hàng đã được tải sẵn trong bộ nhớ (phản hồi tức thì < 1ms!)
        batches = product.product_batches
            .filter(b => Number(b.stock_quantity || 0) > 0)
            .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
    } else {
        // Dự phòng nếu chưa được tải sẵn
        try {
            batches = await getAvailableBatches(product.id);
        } catch (err) {
            console.error("Lỗi lấy lô:", err);
        }
    }

    // Re-check để tránh lỗi Race Condition khi người dùng click 2 lần liên tục thật nhanh
    existingIndex = findExistingProductIndex(product.product_code, product.id, window.POS_RETURN_MODE, variantNote);
    if (existingIndex > -1) {
        const item = cart[existingIndex];
        if (item.originalQuantity !== undefined) {
            const maxQuantity = Number(item.maxReturnQuantity || item.originalQuantity || 0);
            item.quantity = Math.min(maxQuantity, Number(item.quantity || 0) + 1);
        } else {
            item.quantity = Number(item.quantity || 0) + 1;
        }
        return;
    }

    const oldestBatch = batches[0] || null;

    cart.push({
        cartId: createCartId('item'),
        id: product.id,
        productId: product.id,
        code: product.product_code,
        name: product.name + (variantNote ? ` (${variantNote})` : ''),
        variantNote: variantNote,
        unit: baseUnit.unit_name || 'N/A',
        price: itemPrice,
        originalPrice: originalPrice,
        costPrice: costPrice,
        ecommercePrice: ecommercePrice,
        ecommercePlatforms: product.ecommerce_platforms || [],
        isIngredient: isIngredient,
        channelPriceType: (window.POS_INTERNAL_MODE || window.POS_ECOMMERCE_MODE) ? 'cost' : (isIngredient ? 'dose_ingredient' : 'retail'),
        conversionRate: baseUnit.conversion_rate || 1,
        quantity: 1,
        units: product.product_units || [],
        batches: batches,
        batchId: oldestBatch?.id || null,
        batchNo: oldestBatch?.batch_number || oldestBatch?.batch_no || 'Chưa chọn lô',
        expiryDate: oldestBatch?.expiry_date || null,
        categoryId: product.category_id,
        categoryName: product.product_categories?.name || product.categories?.name || '',
        description: product.description
    });
}

window.selectProduct = async (productCode) => {
    const product = allProducts.find(p => normalizeKey(p.product_code) === normalizeKey(productCode));
    if (!product) return;

    // 1. Kiểm tra xem sản phẩm này có biến thể con (child products) không
    const childVariants = allProducts.filter(p => p.parent_id === product.id);

    if (childVariants.length > 0) {
        window.openDatabaseVariantModal(product, childVariants);
        return;
    }

    // 2. Logic cũ: Kiểm tra phân loại từ JSON (nếu có)
    let hasVariants = false;
    let variantsData = null;
    if (product.description) {
        try {
            const desc = JSON.parse(product.description);
            if (desc && desc.variants && Object.keys(desc.variants).length > 0) {
                hasVariants = true;
                variantsData = desc.variants;
            }
        } catch (e) { }
    }

    if (hasVariants) {
        window.openVariantSelectionModal(product, variantsData);
        return;
    }

    await window.confirmProductSelection(product, '');
};

window.confirmProductSelection = async (product, variantNote) => {
    await addProductToCart(product, variantNote);
    renderCurrentCart();
    const sugg = document.getElementById('posSearchSuggestions');
    const inp = document.getElementById('posSearchInput');
    if (sugg) sugg.classList.add('hidden');
    if (inp) inp.value = '';
    inp?.focus();
};

window.openDatabaseVariantModal = (parentProduct, variants) => {
    const oldModal = document.getElementById('variantSelectionModal');
    if (oldModal) oldModal.remove();

    const buttonsHtml = variants.map(v => {
        const baseUnit = getBaseUnit(v);
        const priceStr = new Intl.NumberFormat('vi-VN').format(baseUnit.retail_price || 0) + 'đ';
        const label = v.variant_label || v.name;

        return `
            <button type="button" onclick="window.confirmDatabaseVariant('${v.product_code}')"
                    class="flex flex-col items-center justify-center p-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all text-center">
                <span class="font-bold text-sm text-slate-800 dark:text-white mb-1">${label}</span>
                <span class="text-xs font-black text-blue-600 dark:text-blue-400">${priceStr}</span>
            </button>
        `;
    }).join('');

    const modalHtml = `
        <div id="variantSelectionModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <div>
                        <h3 class="font-black text-slate-800 dark:text-white text-lg">Chọn Biến Thể</h3>
                        <p class="text-xs font-bold text-slate-500">${parentProduct.name}</p>
                    </div>
                    <button type="button" onclick="document.getElementById('variantSelectionModal').remove()" class="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-white rounded-full transition-colors">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="p-6">
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto">
                        ${buttonsHtml}
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
};

window.confirmDatabaseVariant = (variantProductCode) => {
    const modal = document.getElementById('variantSelectionModal');
    if (modal) modal.remove();
    const variantProduct = allProducts.find(p => p.product_code === variantProductCode);
    if (variantProduct) {
        window.confirmProductSelection(variantProduct, '');
    }
};

window.openVariantSelectionModal = (product, variantsData) => {
    // Xóa modal cũ nếu có
    const oldModal = document.getElementById('variantSelectionModal');
    if (oldModal) oldModal.remove();

    let groupsHtml = '';
    Object.entries(variantsData).forEach(([attr, values], index) => {
        const valArr = Array.isArray(values) ? values : [values];
        const buttonsHtml = valArr.map(v => `
            <label class="cursor-pointer">
                <input type="radio" name="variant_${index}" value="${v}" class="peer hidden" ${valArr.indexOf(v) === 0 ? 'checked' : ''}>
                <div class="px-4 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 peer-checked:border-purple-500 peer-checked:bg-purple-50 dark:peer-checked:bg-purple-900/30 peer-checked:text-purple-700 dark:peer-checked:text-purple-400 transition-all shadow-sm hover:border-purple-300">
                    ${v}
                </div>
            </label>
        `).join('');

        groupsHtml += `
            <div class="mb-4 variant-group" data-attr="${attr}">
                <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">${attr}</label>
                <div class="flex flex-wrap gap-2">
                    ${buttonsHtml}
                </div>
            </div>
        `;
    });

    const modalHtml = `
        <div id="variantSelectionModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <div>
                        <h3 class="font-black text-slate-800 dark:text-white text-lg">Chọn Phân Loại</h3>
                        <p class="text-xs font-bold text-slate-500">${product.name}</p>
                    </div>
                    <button type="button" onclick="document.getElementById('variantSelectionModal').remove()" class="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-white rounded-full transition-colors">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="p-6 max-h-[60vh] overflow-y-auto">
                    ${groupsHtml}
                </div>
                <div class="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                    <button type="button" onclick="document.getElementById('variantSelectionModal').remove()" class="px-5 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">Hủy</button>
                    <button type="button" id="confirmVariantBtn" class="px-6 py-2.5 rounded-xl font-black text-white bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/30 transition-all">Chọn & Thêm</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('confirmVariantBtn').onclick = () => {
        const modal = document.getElementById('variantSelectionModal');
        const groups = modal.querySelectorAll('.variant-group');
        let selections = [];

        groups.forEach((group, index) => {
            const attr = group.getAttribute('data-attr');
            const checkedInput = group.querySelector(`input[name="variant_${index}"]:checked`);
            if (checkedInput) {
                selections.push(`${attr}: ${checkedInput.value}`);
            }
        });

        const variantNote = selections.join(', ');
        modal.remove();
        window.confirmProductSelection(product, variantNote);
    };
};

window.updateQuantity = (id, delta) => {
    const item = findCartItem(id);
    if (!item) return;
    const isReturnItem = item.originalQuantity !== undefined;
    const minQty = isReturnItem ? 0 : 1;
    const maxQty = isReturnItem ? Number(item.maxReturnQuantity || item.originalQuantity || 0) : Infinity;
    const newQty = Number(item.quantity || 0) + delta;
    if (!isReturnItem && newQty <= 0) { window.removeFromCart(id); return; }
    item.quantity = Math.min(maxQty, Math.max(minQty, newQty));
    renderCurrentCart();
};

window.setItemQuantity = (id, value) => {
    const item = findCartItem(id);
    if (!item) return;
    const qty = parseInt(value) || 0;
    const isReturnItem = item.originalQuantity !== undefined;
    const minQty = isReturnItem ? 0 : 1;
    const maxQty = isReturnItem ? Number(item.maxReturnQuantity || item.originalQuantity || 0) : Infinity;
    if (!isReturnItem && qty <= 0) { window.removeFromCart(id); return; }
    item.quantity = Math.min(maxQty, Math.max(minQty, qty));
    renderCurrentCart();
};

window.updateItemUnit = (id, unitName) => {
    const item = findCartItem(id);
    if (item) {
        const selectedUnit = item.units.find(u => u.unit_name === unitName);
        if (selectedUnit) {
            item.unit = unitName;
            item.originalPrice = selectedUnit.retail_price || 0;
            item.costPrice = selectedUnit.cost_price || 0;
            item.conversionRate = selectedUnit.conversion_rate || 1;
            applyChannelPricing(item);
            renderCurrentCart();
        }
    }
};

window.removeFromCart = (id) => { cart = cart.filter(i => i.cartId !== String(id)); renderCurrentCart(); };
window.clearCart = () => {
    if (cart.length === 0) return;
    if (confirm("Xóa tất cả mặt hàng?")) { cart = []; renderCurrentCart(); }
};

// --- OFFLINE LOGIC ---
const OFFLINE_ORDERS_KEY = 'pos_offline_orders';
function getOfflineOrders() { return JSON.parse(localStorage.getItem(OFFLINE_ORDERS_KEY) || '[]'); }
function saveOrderOffline(type, orderData, cartItems, sourceId) {
    const orders = getOfflineOrders();
    let employeeId = null;
    try {
        const user = JSON.parse(localStorage.getItem('pos_user') || 'null');
        employeeId = user?.id || null;
    } catch(e) {}
    orders.push({ id: 'OFF-' + Date.now(), type, orderData, cartItems, sourceId, employeeId, timestamp: new Date().toISOString() });
    localStorage.setItem(OFFLINE_ORDERS_KEY, JSON.stringify(orders));
    updateOfflineUI();
}
function removeOfflineOrder(id) {
    const orders = getOfflineOrders().filter(o => o.id !== id);
    localStorage.setItem(OFFLINE_ORDERS_KEY, JSON.stringify(orders));
    updateOfflineUI();
}
window.updateOfflineUI = function () {
    const orders = getOfflineOrders();
    let banner = document.getElementById('offlineSyncBanner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'offlineSyncBanner';
        banner.className = 'bg-orange-600 text-white px-4 py-3 text-sm font-bold flex justify-between items-center z-50 fixed bottom-0 left-0 right-0 shadow-[0_-5px_15px_rgba(0,0,0,0.2)] cursor-pointer hover:bg-orange-700 transition-colors';
        banner.onclick = syncOfflineOrders;
        document.body.appendChild(banner);
    }
    if (orders.length > 0) {
        banner.innerHTML = `<div class="flex items-center gap-3"><i class="fa-solid fa-wifi text-xl"></i> <span>Mất mạng hoặc có lỗi kết nối: Đang có <span class="bg-white text-orange-600 px-2 py-0.5 rounded-md">${orders.length}</span> đơn hàng lưu tạm ở máy này. Bấm vào đây để đồng bộ lên máy chủ.</span></div> <i class="fa-solid fa-rotate"></i>`;
        banner.style.display = 'flex';
    } else {
        banner.style.display = 'none';
    }
    // Gửi báo cáo số đơn hàng chưa đồng bộ lên database để các máy khác biết
    reportDeviceSyncStatus();
}

async function reportDeviceSyncStatus() {
    if (!supabaseClient || !navigator.onLine) return;

    let deviceKey = localStorage.getItem('pos_device_key');
    if (!deviceKey) {
        deviceKey = 'DEV-' + Math.random().toString(36).slice(2, 18).toUpperCase() + '-' + Date.now();
        localStorage.setItem('pos_device_key', deviceKey);
    }

    const userStr = localStorage.getItem('pos_user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userName = user ? user.name : 'Chưa đăng nhập';

    const userAgent = navigator.userAgent;
    let deviceName = 'Thiết bị POS';
    if (userAgent.includes('Windows')) deviceName = 'Máy tính Windows';
    else if (userAgent.includes('Macintosh')) deviceName = 'Máy tính Mac';
    else if (userAgent.includes('Android')) deviceName = 'Thiết bị Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) deviceName = 'Thiết bị iOS';

    if (user) {
        deviceName += ` của ${user.name}`;
    }

    const unsyncedCount = getOfflineOrders().length;

    try {
        const payload = {
            device_key: deviceKey,
            device_name: deviceName,
            unsynced_count: unsyncedCount,
            last_user_name: userName,
            last_active_at: new Date().toISOString()
        };

        await supabaseClient
            .from('device_sync_status')
            .upsert(payload, { onConflict: 'device_key' });
    } catch (e) {
        console.warn('Lỗi gửi sync status của thiết bị:', e);
    }
}

async function checkOtherDevicesSyncStatus() {
    if (!supabaseClient || !navigator.onLine) return;

    const ourDeviceKey = localStorage.getItem('pos_device_key');
    if (!ourDeviceKey) return;

    try {
        // Lấy danh sách các thiết bị khác hoạt động trong vòng 48 giờ qua và có đơn hàng chưa đồng bộ
        const cutoffTime = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
        const { data: otherDevices, error } = await supabaseClient
            .from('device_sync_status')
            .select('*')
            .neq('device_key', ourDeviceKey)
            .gt('unsynced_count', 0)
            .gt('last_active_at', cutoffTime);

        if (error) throw error;

        const container = document.getElementById('otherDevicesWarningArea');
        if (!container) return;

        if (otherDevices && otherDevices.length > 0) {
            let html = '';
            otherDevices.forEach(dev => {
                const timeStr = new Date(dev.last_active_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date(dev.last_active_at).toLocaleDateString('vi-VN');
                html += `
                    <div class="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/80 rounded-2xl p-4 text-red-750 dark:text-red-400 text-sm font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-pulse">
                        <div class="flex items-start gap-3 min-w-0">
                            <div class="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                                <i class="fa-solid fa-triangle-exclamation text-lg"></i>
                            </div>
                            <div class="min-w-0">
                                <p class="font-black">Cảnh báo: Thiết bị khác có đơn hàng chưa đồng bộ!</p>
                                <p class="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                    Thiết bị <strong class="text-slate-700 dark:text-slate-200 font-bold">"${dev.device_name}"</strong> (Tài khoản: ${dev.last_user_name}) đang bị kẹt <span class="bg-red-500 text-white px-2 py-0.5 rounded-md font-black">${dev.unsynced_count}</span> đơn chưa gửi lên server.
                                </p>
                            </div>
                        </div>
                        <div class="text-right shrink-0 flex flex-col items-end">
                            <span class="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Hoạt động lần cuối: ${timeStr}</span>
                            <span class="text-[10px] bg-red-100 dark:bg-red-900/20 text-red-600 px-2 py-0.5 rounded-full mt-1">Cần đồng bộ gấp!</span>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
            container.classList.remove('hidden');
        } else {
            container.innerHTML = '';
            container.classList.add('hidden');
        }
    } catch (e) {
        console.warn('Lỗi kiểm tra trạng thái sync các thiết bị khác:', e);
    }
}

async function syncOfflineOrders() {
    if (!navigator.onLine) { alert("Vẫn chưa có kết nối mạng."); return; }
    const orders = getOfflineOrders();
    if (orders.length === 0) return;
    const btn = document.getElementById('offlineSyncBanner');
    if (btn) btn.innerHTML = `<div class="flex items-center gap-2"><i class="fa-solid fa-spinner fa-spin"></i> Đang đồng bộ... Vui lòng không đóng trang!</div>`;
    let success = 0; let failed = 0;
    for (const order of orders) {
        try {
            let createdOrder = null;
            if (['sale', 'dose_cut', 'internal', 'ecommerce'].includes(order.type)) {
                createdOrder = await createOrder(order.orderData, order.cartItems, { isOfflineSync: true });
            } else if (order.type === 'return') {
                createdOrder = await createReturnOrder({ order_code: order.sourceId }, order.orderData, order.cartItems, { isOfflineSync: true });
            } else {
                createdOrder = await createOrder(order.orderData, order.cartItems, { isOfflineSync: true });
            }

            if (createdOrder) {
                const orderCode = createdOrder.order_code || order.orderData?.orderCode || order.orderData?.order_code;
                const total = Math.abs(order.orderData?.total || 0);
                const paymentMethod = order.orderData?.paymentMethod || order.orderData?.payment_method || 'cash';
                
                if (order.type === 'return') {
                    if (total > 0) {
                        await syncReturnSettlementToCurrentShift(
                            total, 
                            orderCode, 
                            paymentMethod,
                            { employeeId: order.employeeId || null }
                        );
                    }
                } else {
                    const isDose = order.type === 'dose_cut';
                    const isInternal = order.type === 'internal';
                    const isEcommerce = order.type === 'ecommerce';
                    
                    const orderContext = createOrderContext({
                        isDoseCut: isDose,
                        isInternal,
                        isEcommerce,
                        paymentMethod: paymentMethod,
                        orderPayload: order.orderData || {},
                        cartItems: order.cartItems || []
                    });
                    
                    const rules = getOrderRules(orderContext);
                    if (rules.shouldSyncShift && total > 0) {
                        await syncPaymentToCurrentShift(
                            total, 
                            orderCode, 
                            paymentMethod, 
                            orderContext, 
                            { employeeId: order.employeeId || null }
                        );
                    }
                }
            }

            removeOfflineOrder(order.id); success++;
        } catch (err) {
            console.error("Lỗi đồng bộ đơn hàng:", err);
            // Xử lý thông minh lỗi trùng khóa (23505): Nếu đơn đã tồn tại trên máy chủ, dọn dẹp khỏi offline cache để tránh tắc nghẽn
            if (err.code === '23505' || (err.message && err.message.includes('23505')) || (err.message && err.message.toLowerCase().includes('duplicate key'))) {
                console.warn(`Đơn hàng ${order.orderData?.orderCode || order.id} đã tồn tại trên máy chủ. Tự động dọn dẹp offline.`);
                removeOfflineOrder(order.id);
                success++;
            } else {
                failed++;
            }
        }
    }
    if (success > 0) alert(`Đã đồng bộ thành công ${success} đơn hàng.`);
    if (failed > 0) alert(`Có ${failed} đơn bị lỗi khi đồng bộ (ví dụ: mất mạng giữa chừng).`);
    window.updateOfflineUI();
}

window.addEventListener('online', () => {
    updateOfflineUI();
    if (getOfflineOrders().length > 0) {
        console.log("Mạng đã khôi phục. Tự động đồng bộ...");
        setTimeout(syncOfflineOrders, 3000);
    }
});
window.addEventListener('offline', updateOfflineUI);

// --- BATCH PICKER LOGIC ---
window.openBatchPicker = (cartId) => {
    const item = findCartItem(cartId);
    if (!item || !item.batches || item.batches.length === 0) { alert("Không có thông tin lô hàng."); return; }
    renderBatchPicker(item);
};

window.selectBatchForItem = (cartId, batchId) => {
    const item = findCartItem(cartId);
    if (!item) return;
    const batch = item.batches.find(b => String(b.id) === String(batchId));
    if (batch) {
        item.batchId = batch.id;
        item.batchNo = batch.batch_number || batch.batch_no || '---';
        item.expiryDate = batch.expiry_date || null;
        renderCurrentCart();
        document.getElementById('batchPickerModal')?.classList.add('hidden');
    }
};
window.addQuickDose = async (price) => {
    // 1. Thử tìm sản phẩm thực trong database có tên chứa "Liều" và khớp giá
    const doseProduct = allProducts.find(p => {
        const u = getBaseUnit(p);
        const name = p.name ? p.name.toUpperCase() : '';
        // Khớp nếu tên có chữ "LIỀU" hoặc "LIEU" và giá bán lẻ khớp
        return (name.includes('LIỀU') || name.includes('LIEU')) && Number(u.retail_price) === Number(price);
    });

    if (doseProduct) {
        await addProductToCart(doseProduct);
        renderCurrentCart();
        return;
    }

    // 2. Nếu không thấy, kiểm tra xem trong giỏ đã có "liều ảo" này chưa để gộp
    const virtualCode = `DOSE-${price}`;
    const existingIndex = findExistingProductIndex(virtualCode, null, window.POS_RETURN_MODE);

    if (existingIndex > -1) {
        cart[existingIndex].quantity += 1;
    } else {
        // Thêm mới liều ảo
        cart.push({
            cartId: createCartId('dose'),
            id: null,
            productId: null,
            batchId: null,
            code: virtualCode,
            name: `Thuốc liều ${(price / 1000).toLocaleString('vi-VN')}k`,
            unit: 'Liều',
            price: price,
            conversionRate: 1,
            quantity: 1,
            units: [{ unit_name: 'Liều', retail_price: price }]
        });
    }
    renderCurrentCart();
};

window.toggleAI = () => {
    const aiPanel = document.getElementById('aiAssistant');
    const icon = document.getElementById('aiToggleIcon');
    if (aiPanel) {
        aiPanel.classList.toggle('collapsed');
        if (icon) icon.style.transform = aiPanel.classList.contains('collapsed') ? 'rotate(0deg)' : 'rotate(180deg)';
    }
};

window.removePinnedProduct = (id) => {
    pinnedProductIds = pinnedProductIds.filter(pid => pid !== id);
    const targetId = `product:${id}`;
    quickSaleShortcuts = Object.fromEntries(
        Object.entries(quickSaleShortcuts).filter(([, value]) => value !== targetId)
    );
    localStorage.setItem(PINNED_PRODUCTS_KEY, JSON.stringify(pinnedProductIds));
    localStorage.setItem(QUICK_SHORTCUTS_STORAGE_KEY, JSON.stringify(quickSaleShortcuts));
    renderQuickActions();
    renderQuickProductSettings();
};

function shortcutOptions(selectedKey = '') {
    return [
        '<option value="">Không gán phím</option>',
        ...QUICK_SALE_KEYS.map(key => `<option value="${key}" ${key === selectedKey ? 'selected' : ''}>${key}</option>`)
    ].join('');
}

function renderQuickProductSettings() {
    const list = document.getElementById('pinnedProductsList');
    if (!list) return;

    const productRows = pinnedProductIds.map(id => {
        const product = allProducts.find(item => String(item.id) === String(id));
        if (!product) return '';
        const targetId = `product:${id}`;
        const selectedKey = findQuickSaleKey(quickSaleShortcuts, targetId);
        return `
            <div class="rounded-2xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 p-3">
                <div class="font-black text-sm text-slate-800 dark:text-white truncate">${product.name}</div>
                <div class="mt-2 flex items-center gap-2">
                    <select onchange="window.assignQuickSaleKey('${targetId}', this.value)"
                        class="min-w-0 flex-1 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800 px-2 py-2 text-xs font-black">
                        ${shortcutOptions(selectedKey)}
                    </select>
                    <button onclick="window.removePinnedProduct('${id}')" class="h-9 w-9 rounded-xl text-red-500 hover:bg-red-100 dark:hover:bg-red-950/30">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    const doseRows = DEFAULT_QUICK_DOSES.map(price => {
        const targetId = `dose:${price}`;
        const selectedKey = findQuickSaleKey(quickSaleShortcuts, targetId);
        return `
            <div class="rounded-2xl border border-violet-100 dark:border-violet-900/50 bg-violet-50/50 dark:bg-violet-950/20 p-3">
                <div class="font-black text-sm text-violet-700 dark:text-violet-300">Thuốc liều ${price / 1000}k</div>
                <select onchange="window.assignQuickSaleKey('${targetId}', this.value)"
                    class="mt-2 w-full rounded-xl border border-violet-200 dark:border-violet-800 bg-white dark:bg-slate-800 px-2 py-2 text-xs font-black">
                    ${shortcutOptions(selectedKey)}
                </select>
            </div>
        `;
    }).join('');

    list.innerHTML = `
        <div class="col-span-2 text-[10px] font-black uppercase tracking-widest text-violet-500">Thuốc liều bán nhanh</div>
        ${doseRows}
        <div class="col-span-2 mt-2 text-[10px] font-black uppercase tracking-widest text-blue-500">Mặt hàng đã ghim</div>
        ${productRows || '<div class="col-span-2 rounded-xl bg-slate-50 dark:bg-slate-800 p-4 text-center text-xs font-bold text-slate-400">Chưa ghim mặt hàng nào.</div>'}
    `;
}

window.assignQuickSaleKey = (targetId, key) => {
    quickSaleShortcuts = assignQuickSaleShortcut(quickSaleShortcuts, targetId, key);
    localStorage.setItem(QUICK_SHORTCUTS_STORAGE_KEY, JSON.stringify(quickSaleShortcuts));
    renderQuickProductSettings();
    renderQuickActions();
};

window.pinQuickProduct = (productId) => {
    if (!pinnedProductIds.some(id => String(id) === String(productId))) {
        pinnedProductIds.push(productId);
        localStorage.setItem(PINNED_PRODUCTS_KEY, JSON.stringify(pinnedProductIds));
    }
    document.getElementById('qpSearchInput').value = '';
    document.getElementById('qpSearchResults')?.classList.add('hidden');
    renderQuickProductSettings();
    renderQuickActions();
};

window.openQuickProductModal = () => {
    const modal = document.getElementById('quickProductModal');
    if (!modal) return;
    renderQuickProductSettings();
    modal.classList.remove('hidden');
    document.getElementById('qpSearchInput')?.focus();
};

async function triggerQuickSaleTarget(targetId) {
    if (String(targetId).startsWith('dose:')) {
        await window.addQuickDose(Number(String(targetId).split(':')[1] || 0));
        return true;
    }

    if (String(targetId).startsWith('product:')) {
        const productId = String(targetId).slice('product:'.length);
        const product = allProducts.find(item => String(item.id) === productId);
        if (!product) {
            alert('Mặt hàng bán nhanh không còn tồn tại trong danh mục.');
            return false;
        }
        await window.selectProduct(product.product_code);
        return true;
    }

    return false;
}



window.processPayment = async () => {
    if (cart.length === 0) { alert('Giỏ hàng trống!'); return; }
    const total = getDisplayedTotal();
    let amountReceived = parseInt(document.getElementById('amountReceived')?.value || '0');
    const discount = parseInt(document.getElementById('discountAmount')?.value || '0') || 0;
    const payableItems = cart.filter(item => Number(item.quantity || 0) > 0);
    const selectedPaymentMethod = getSelectedPaymentMethod();
    const modeContext = createOrderContext({
        isReturn: window.POS_RETURN_MODE,
        isDoseCut: window.POS_DOSE_CUT_MODE,
        isInternal: window.POS_INTERNAL_MODE,
        isEcommerce: window.POS_ECOMMERCE_MODE,
        paymentMethod: selectedPaymentMethod,
        cartItems: payableItems
    });
    const modeRules = getOrderRules(modeContext);
    const isStockExportMode = modeRules.isStockExport;
    if (!isStockExportMode && !window.POS_RETURN_MODE && amountReceived === 0 && total > 0) amountReceived = total;
    if (payableItems.length === 0) {
        alert(window.POS_RETURN_MODE ? 'Chưa chọn mặt hàng đổi hoặc trả!' : 'Giỏ hàng trống!');
        return;
    }
    if (!isStockExportMode && total > 0 && amountReceived < total) {
        alert(`Cần thu thêm ${new Intl.NumberFormat('vi-VN').format(total)}đ. Số tiền khách đưa chưa đủ!`);
        return;
    }
    if (window.POS_RETURN_MODE) {
        if (!navigator.onLine) {
            alert('Không thể đổi / trả hàng khi đang offline. Vui lòng kết nối mạng rồi thử lại.');
            return;
        }
        const settlement = getReturnSettlement(total);
        const amountText = new Intl.NumberFormat('vi-VN').format(settlement.amount) + 'đ';
        const confirmationText = settlement.type === 'collect'
            ? `Xác nhận đã thu thêm ${amountText} từ khách?`
            : settlement.type === 'refund'
                ? `Xác nhận sẽ hoàn lại ${amountText} cho khách?`
                : 'Xác nhận đổi hàng ngang giá, không thu thêm và không hoàn tiền?';
        if (!confirm(confirmationText)) return;
        if (settlement.type !== 'collect') amountReceived = 0;
    }

    const btn = document.querySelector('[onclick="window.processPayment()"]');
    const originalBtnHTML = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = window.POS_INTERNAL_MODE ?
            '<span><i class="fa-solid fa-spinner animate-spin mr-2"></i> Đang xuất kho...</span>' :
            '<span><i class="fa-solid fa-spinner animate-spin mr-2"></i> Đang xử lý thanh toán...</span>';
    }

    try {
        const customerValue = document.getElementById('customerInfo')?.value.trim() || '';
        const internalTargetType = document.getElementById('posInternalTargetType')?.value || 'staff';
        let customerName = 'Khách lẻ';
        let customerPhone = null;

        if (window.POS_INTERNAL_MODE) {
            const internalReason = document.getElementById('posInternalReasonSelect')?.value || 'sample';
            if (internalReason !== 'sample') {
                customerName = 'Nội bộ';
            } else {
                if (!customerValue) {
                    alert('Vui lòng nhập người / đối tượng tiêu hao.');
                    document.getElementById('customerInfo')?.focus();
                    return;
                }
                customerName = customerValue;
            }
        } else if (customerValue) {
            const phoneMatch = customerValue.match(/\b\d{9,11}\b/);
            if (phoneMatch) {
                customerPhone = phoneMatch[0];
                const namePart = customerValue.replace(phoneMatch[0], '').replace(/[-()]/g, '').trim();
                customerName = namePart || 'Khách lẻ';
            } else {
                customerName = customerValue;
            }
        }

        const orderPayload = {
            customerName,
            customerPhone: window.POS_INTERNAL_MODE ? null : customerPhone,
            subtotal: payableItems.reduce((sum, i) => sum + (i.price * i.quantity), 0),
            discount: isStockExportMode ? 0 : discount,
            total,
            amountReceived: isStockExportMode ? 0 : amountReceived,
            paymentMethod: selectedPaymentMethod,
            note: window.POS_INTERNAL_MODE
                ? buildInternalIssueNote({
                    note: `[XUẤT NỘI BỘ] ${document.getElementById('orderNote')?.value.trim() || 'Dùng nội bộ'}`,
                    targetType: internalTargetType,
                    targetName: customerName
                })
                : (window.POS_ECOMMERCE_MODE ? `[TMĐT] ${document.getElementById('orderNote')?.value.trim() || 'Đơn Thương Mại Điện Tử'}` : (document.getElementById('orderNote')?.value.trim() || null)),
            isDoseCut: window.POS_DOSE_CUT_MODE,
            isInternal: window.POS_INTERNAL_MODE,
            isEcommerce: window.POS_ECOMMERCE_MODE,
            ecommercePlatform: window.POS_ECOMMERCE_MODE ? document.getElementById('posEcommercePlatform')?.value : null,
            internalReason: window.POS_INTERNAL_MODE ? (document.getElementById('posInternalReasonSelect')?.value || 'sample') : null,
            internalTargetType: window.POS_INTERNAL_MODE ? internalTargetType : null
        };
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const timeStr = now.getTime().toString().slice(-4) + Math.floor(10 + Math.random() * 90);
        const prefix = window.POS_RETURN_MODE ? 'TH' : (window.POS_INTERNAL_MODE ? 'PX' : (window.POS_ECOMMERCE_MODE ? 'XTMDT' : 'HD'));
        const orderCode = `${prefix}${year}${month}${day}${timeStr}`;

        orderPayload.orderCode = orderCode;
        
        // Bắt sự kiện thanh toán chuyển khoản
        const qrPaymentType = window.BRANCH_SETTINGS?.qr_payment_type || 'none';
        if (selectedPaymentMethod === 'transfer' && total > 0 && !window.POS_INTERNAL_MODE && !window.POS_RETURN_MODE && navigator.onLine && qrPaymentType !== 'none') {
            const paymentConfirmed = await window.showQrPaymentModalAndWait(orderCode, total, qrPaymentType);
            if (!paymentConfirmed) {
                if (btn) { btn.disabled = false; btn.innerHTML = originalBtnHTML; }
                return; // Hủy thanh toán
            }
        }

        const currentSourceId = window.POS_RETURN_MODE ? (returnOrder?.order_code || returnOrderId) : null;
        const currentOrderContext = createOrderContext({
            isReturn: window.POS_RETURN_MODE,
            isDoseCut: window.POS_DOSE_CUT_MODE,
            isInternal: window.POS_INTERNAL_MODE,
            isEcommerce: window.POS_ECOMMERCE_MODE,
            paymentMethod: selectedPaymentMethod,
            orderPayload,
            cartItems: cart,
            sourceId: currentSourceId,
            returnOrder
        });
        const currentOrderRules = getOrderRules(currentOrderContext);

        if (!navigator.onLine) {
            saveOrderOffline(currentOrderContext.type, orderPayload, cart, currentSourceId);
            if (currentOrderRules.shouldSyncShift) {
                await syncPaymentToCurrentShift(total, orderCode, selectedPaymentMethod, currentOrderContext, {
                    onSynced: updateActiveShiftUI
                });
            }

            if (window.POS_INTERNAL_MODE) {
                if (window.showToast) window.showToast('Đã tạo phiếu xuất nội bộ ' + orderCode + ' thành công!', 'success');
                else alert('Đã tạo phiếu xuất nội bộ ' + orderCode + ' thành công!');
            } else {
                showSuccessModal(orderCode);
            }
            if (window.POS_RETURN_MODE) {
                window.POS_COMPLETED_EDIT_OR_RETURN = true;
            }
            if (tabs.length > 1) { closeTab(currentTabId); } else { const tab = tabs[0]; Object.assign(tab, createTab('sale', { id: tab.id })); loadTabState(tab.id); }
        } else if (window.POS_RETURN_MODE) {
            const returnResult = await createReturnOrder(returnOrder, orderPayload, cart);
            await syncReturnSettlementToCurrentShift(total, returnResult?.order_code || orderCode, selectedPaymentMethod, {
                onSynced: updateActiveShiftUI
            });
            window.POS_COMPLETED_EDIT_OR_RETURN = true;
            showSuccessModal(returnResult?.order_code || orderCode);

            if (tabs.length > 1) {
                closeTab(currentTabId);
            } else {
                const tab = tabs[0];
                Object.assign(tab, createTab('sale', { id: tab.id }));
                loadTabState(tab.id);
            }
        } else if (window.POS_DOSE_CUT_MODE || window.POS_INTERNAL_MODE) {
            await createOrder(orderPayload, cart);
            if (currentOrderRules.shouldSyncShift) {
                await syncPaymentToCurrentShift(total, orderCode, selectedPaymentMethod, currentOrderContext, {
                    onSynced: updateActiveShiftUI
                });
            }

            if (window.POS_INTERNAL_MODE) {
                if (window.showToast) window.showToast('Đã tạo phiếu xuất nội bộ ' + orderCode + ' thành công!', 'success');
                else alert('Đã tạo phiếu xuất nội bộ ' + orderCode + ' thành công!');
            } else {
                showSuccessModal(orderCode);
            }

            if (tabs.length > 1) {
                closeTab(currentTabId);
            } else {
                const tab = tabs[0];
                Object.assign(tab, createTab('sale', { id: tab.id }));
                loadTabState(tab.id);
            }
        } else {
            // 1. Hiển thị thông báo thành công cho khách hàng ngay lập tức
            if (window.POS_INTERNAL_MODE) {
                if (window.showToast) window.showToast('Đã tạo phiếu xuất nội bộ ' + orderCode + ' thành công!', 'success');
                else alert('Đã tạo phiếu xuất nội bộ ' + orderCode + ' thành công!');
            } else {
                showSuccessModal(orderCode);
            }

            // 2. Chụp trạng thái giỏ hàng & các chế độ trước khi làm sạch màn hình
            const capturedCart = [...cart];
            const capturedPaymentMethod = selectedPaymentMethod;
            const isDose = window.POS_DOSE_CUT_MODE;
            const isInternal = window.POS_INTERNAL_MODE;
            const isEcommerce = window.POS_ECOMMERCE_MODE;
            const capturedOrderContext = createOrderContext({
                isDoseCut: isDose,
                isInternal,
                isEcommerce,
                paymentMethod: capturedPaymentMethod,
                orderPayload,
                cartItems: capturedCart
            });
            const capturedOrderRules = getOrderRules(capturedOrderContext);

            // 3. Làm sạch giỏ hàng & reset tab thanh toán tức thì để thu ngân bán đơn tiếp theo
            if (tabs.length > 1) {
                closeTab(currentTabId);
            } else {
                const tab = tabs[0];
                Object.assign(tab, createTab('sale', { id: tab.id }));
                loadTabState(tab.id);
            }

            // 4. Đẩy lệnh ghi vào Database xuống chạy ngầm (Asynchronous Background)
            (async () => {
                try {
                    await createOrder(orderPayload, capturedCart);
                    if (capturedOrderRules.shouldSyncShift) {
                        await syncPaymentToCurrentShift(total, orderCode, capturedPaymentMethod, capturedOrderContext, {
                            onSynced: updateActiveShiftUI
                        });
                    }
                    console.log('Lưu cơ sở dữ liệu ngầm thành công đơn:', orderCode);
                } catch (backgroundError) {
                    console.error('Lỗi khi lưu đơn hàng ngầm:', backgroundError);
                    // Tự động sao lưu vào bộ nhớ cache offline nếu bị rớt mạng đột ngột để bảo toàn dữ liệu
                    try {
                        const type = isDose ? 'dose_cut' : (isInternal ? 'internal' : (isEcommerce ? 'ecommerce' : 'sale'));
                        saveOrderOffline(type, orderPayload, capturedCart, null);
                        console.log('Đã tự động sao lưu dữ liệu hóa đơn offline thành công.');
                    } catch (offlineErr) {
                        console.error('Không thể sao lưu offline:', offlineErr);
                    }
                }
            })();
        }
    } catch (err) {
        if (err.message === 'Failed to fetch' || (err.message && err.message.toLowerCase().includes('network'))) {
            const type = window.POS_RETURN_MODE ? 'return' : (window.POS_DOSE_CUT_MODE ? 'dose_cut' : (window.POS_INTERNAL_MODE ? 'internal' : (window.POS_ECOMMERCE_MODE ? 'ecommerce' : 'sale')));
            const sourceId = window.POS_RETURN_MODE ? (returnOrder?.order_code || returnOrderId) : null;
            saveOrderOffline(type, orderPayload, cart, sourceId);
            if (window.POS_INTERNAL_MODE) {
                alert('Đã lưu offline phiếu xuất nội bộ!');
            } else {
                showSuccessModal(orderPayload.orderCode || orderCode);
            }
            if (window.POS_RETURN_MODE) {
                window.POS_COMPLETED_EDIT_OR_RETURN = true;
            }
            if (tabs.length > 1) { closeTab(currentTabId); } else { const tab = tabs[0]; Object.assign(tab, createTab('sale', { id: tab.id })); loadTabState(tab.id); }
        } else { alert('Lỗi: ' + err.message); }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalBtnHTML;
        }
    }
};

window.openQuickCustomerModal = () => {
    if (window.POS_INTERNAL_MODE) return;
    const modal = document.getElementById('quickCustomerModal');
    const form = document.getElementById('quickCustomerForm');
    const customerInput = document.getElementById('customerInfo');

    if (modal && form) {
        form.reset();

        // Auto-fill phone if input looks like a phone number
        if (customerInput && /^\d+$/.test(customerInput.value.trim())) {
            document.getElementById('qc_phone').value = customerInput.value.trim();
        }

        modal.classList.remove('hidden');
        document.getElementById('qc_phone')?.focus();
    }
};

async function setupQuickCustomerForm() {
    const form = document.getElementById('quickCustomerForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Đang lưu...';

            const payload = {
                phone: document.getElementById('qc_phone').value.trim(),
                full_name: document.getElementById('qc_name').value.trim(),
                note: document.getElementById('qc_note').value.trim()
            };

            const newCustomer = await createCustomer(payload);
            allCustomers.push(newCustomer);

            // Auto-fill into POS
            const customerInput = document.getElementById('customerInfo');
            if (customerInput) {
                customerInput.value = newCustomer.phone || newCustomer.full_name;
                saveCurrentTabState();
            }

            document.getElementById('quickCustomerModal').classList.add('hidden');
            if (window.showToast) window.showToast('Đã thêm khách hàng thành công!', 'success');
            else alert('Đã thêm khách hàng thành công!');

        } catch (err) {
            alert('Lỗi: ' + err.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
}

function setupPOSSearch() {
    const searchInput = document.getElementById('posSearchInput');
    const searchSuggestions = document.getElementById('posSearchSuggestions');
    if (!searchInput || !searchSuggestions) return;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = normalizeKey(e.target.value);
        if (query.length === 0) { searchSuggestions.classList.add('hidden'); return; }

        searchTimeout = setTimeout(() => {
            const results = allProducts.filter(p => {
                // Ẩn các sản phẩm con (biến thể) khỏi kết quả tìm kiếm gốc
                if (p.parent_id) return false;

                if (window.POS_DOSE_CUT_MODE) {
                    // Chế độ Xuất thuốc liều: hiển thị nguyên liệu + bán lẻ thuốc liều
                    if (!isDoseCutMaterial(p) && !isDoseRetailProduct(p)) return false;
                } else if (window.POS_ECOMMERCE_MODE) {
                    // Chế độ Bán TMĐT: CHỈ sản phẩm is_ecommerce = true, ẩn thuốc liều
                    if (!p.is_ecommerce) return false;
                    if (isDoseCutMaterial(p)) return false;
                } else {
                    // Chế độ bán thường: Ẩn nguyên liệu thuốc liều, NHƯNG CHO PHÉP bán hàng TMĐT ở chế độ thường
                    if (isDoseCutMaterial(p)) return false;
                }

                const searchStr = p._searchKey || removeVietnameseTones(`${p.product_code || ''} ${p.name || ''} ${p.active_ingredient || ''} ${p.barcode || ''}`).toUpperCase();
                return searchStr.includes(query);
            }).map(p => {
                // Nếu là sản phẩm cha, tính tổng tồn kho từ các biến thể con để hiển thị
                const childVariants = allProducts.filter(c => c.parent_id === p.id);
                if (childVariants.length > 0) {
                    let aggregatedBatches = [];
                    childVariants.forEach(c => {
                        if (c.product_batches && Array.isArray(c.product_batches)) {
                            aggregatedBatches = aggregatedBatches.concat(c.product_batches);
                        }
                    });
                    return { ...p, product_batches: aggregatedBatches };
                }
                return p;
            }).slice(0, 15);

            renderPOSSearchResults(results);
        }, 200);
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = normalizeKey(e.target.value);
            if (query.length === 0) return;

            // Tìm khớp tuyệt đối mã (product_code hoặc barcode) để ưu tiên quét mã vạch
            // Lưu ý: barcode scanner thường quét mã vạch, nhưng đôi khi người dùng gõ mã sản phẩm và enter
            const exactMatch = allProducts.find(p => 
                (p.product_code || '').toUpperCase() === query || 
                (p.barcode || '').toUpperCase() === query
            );

            if (exactMatch) {
                // Kiểm tra xem sản phẩm có bị ẩn trong chế độ hiện tại không
                if (window.POS_DOSE_CUT_MODE && !isDoseCutMaterial(exactMatch) && !isDoseRetailProduct(exactMatch)) {
                    if (window.showToast) window.showToast('Sản phẩm này không phải là thuốc cắt liều!', 'warning');
                    return;
                } else if (window.POS_ECOMMERCE_MODE && (!exactMatch.is_ecommerce || isDoseCutMaterial(exactMatch))) {
                    if (window.showToast) window.showToast('Sản phẩm này không thuộc kho Thương Mại Điện Tử!', 'warning');
                    return;
                } else if (!window.POS_ECOMMERCE_MODE && !window.POS_DOSE_CUT_MODE && isDoseCutMaterial(exactMatch)) {
                    if (window.showToast) window.showToast('Sản phẩm này thuộc Nguyên Liệu Cắt Liều (không bán lẻ ở đây)!', 'warning');
                    return;
                }

                // Nếu khớp tuyệt đối mã, thêm ngay vào giỏ hàng
                window.selectPOSProduct(exactMatch.id);
                searchInput.value = '';
                searchSuggestions.classList.add('hidden');
                searchInput.focus();
            } else {
                // Nếu không có mã chính xác, tự động chọn kết quả đầu tiên của dropdown (nếu có)
                const firstBtn = searchSuggestions.querySelector('button, div[onclick]');
                if (firstBtn) {
                    firstBtn.click();
                    searchInput.value = '';
                    searchSuggestions.classList.add('hidden');
                } else {
                    if (window.showToast) window.showToast('Không tìm thấy mặt hàng với mã này!', 'error');
                    else alert('Không tìm thấy mặt hàng với mã này!');
                    searchInput.select();
                }
            }
        }
    });

    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchSuggestions.contains(e.target)) {
            searchSuggestions.classList.add('hidden');
        }
    });
}

function setupCustomerSearch() {
    const customerInput = document.getElementById('customerInfo');
    const customerSuggestions = document.getElementById('customerSuggestions');
    if (!customerInput || !customerSuggestions) return;

    customerInput.addEventListener('input', (e) => {
        if (window.POS_INTERNAL_MODE) {
            customerSuggestions.classList.add('hidden');
            saveCurrentTabState();
            return;
        }
        clearTimeout(customerSearchTimeout);
        const rawQuery = e.target.value;
        const query = removeVietnameseTones(rawQuery).trim().toUpperCase();
        if (query.length === 0) {
            customerSuggestions.classList.add('hidden');
            return;
        }

        customerSearchTimeout = setTimeout(() => {
            const results = allCustomers.filter(c => {
                const nameStr = removeVietnameseTones(c.full_name || '').toUpperCase();
                const phoneStr = (c.phone || '').trim();
                return nameStr.includes(query) || phoneStr.includes(query);
            }).slice(0, 10);

            if (results.length > 0) {
                customerSuggestions.innerHTML = results.map(c => {
                    const phoneDisplay = c.phone ? ` - ${c.phone}` : '';
                    const selectValue = `${c.full_name}${phoneDisplay}`;
                    return `
                    <div onclick="window.selectCustomerSuggestion('${selectValue.replace(/'/g, "\\'")}')" 
                         class="px-4 py-2.5 hover:bg-slate-105 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0 font-bold text-sm text-slate-800 dark:text-white transition-all">
                        <div class="font-black text-slate-700 dark:text-slate-200">${c.full_name}</div>
                        <div class="text-xs text-slate-500 font-medium">${c.phone || 'Không có số điện thoại'}</div>
                    </div>
                    `;
                }).join('');
                customerSuggestions.classList.remove('hidden');
            } else {
                customerSuggestions.innerHTML = `<div class="p-3 text-center text-slate-500 text-xs font-bold">Không tìm thấy khách hàng nào</div>`;
                customerSuggestions.classList.remove('hidden');
            }
        }, 150);
    });

    document.addEventListener('click', (e) => {
        if (!customerInput.contains(e.target) && !customerSuggestions.contains(e.target)) {
            customerSuggestions.classList.add('hidden');
        }
    });
}

window.selectCustomerSuggestion = (value) => {
    const customerInput = document.getElementById('customerInfo');
    if (customerInput) {
        customerInput.value = value;
        saveCurrentTabState();
        const customerSuggestions = document.getElementById('customerSuggestions');
        if (customerSuggestions) customerSuggestions.classList.add('hidden');
    }
};

function setupEventListeners() {
    // 1b. Lắng nghe thay đổi tiền khách đưa và giảm giá để tính lại tiền thừa tức thời
    const amountReceivedInput = document.getElementById('amountReceived');
    if (amountReceivedInput) {
        let amountTimeout;
        amountReceivedInput.addEventListener('input', () => {
            clearTimeout(amountTimeout);
            amountTimeout = setTimeout(() => {
                updateChange();
                saveCurrentTabState();
            }, 300);
        });
        amountReceivedInput.addEventListener('focus', () => {
            amountReceivedInput.select();
        });
    }

    const discountInput = document.getElementById('discountAmount');
    if (discountInput) {
        let discountTimeout;
        discountInput.addEventListener('input', () => {
            clearTimeout(discountTimeout);
            discountTimeout = setTimeout(() => {
                renderCurrentCart();
                saveCurrentTabState();
            }, 300);
        });
        discountInput.addEventListener('focus', () => {
            discountInput.select();
        });
    }

    const platformSelect = document.getElementById('posEcommercePlatform');
    if (platformSelect) {
        platformSelect.addEventListener('change', () => {
            if (window.POS_ECOMMERCE_MODE) {
                cart.forEach(item => applyChannelPricing(item));
                renderCurrentCart();
                saveCurrentTabState();
            }
        });
    }

    ['posInternalReasonSelect', 'posInternalTargetType', 'customerInfo', 'orderNote'].forEach((id) => {
        document.getElementById(id)?.addEventListener('change', saveCurrentTabState);
    });

    const quickProductSearch = document.getElementById('qpSearchInput');
    const quickProductResults = document.getElementById('qpSearchResults');
    quickProductSearch?.addEventListener('input', () => {
        const query = normalizeKey(quickProductSearch.value);
        if (!query) {
            quickProductResults?.classList.add('hidden');
            return;
        }

        const matches = allProducts.filter(product => {
            const haystack = normalizeKey(`${product.name || ''} ${product.product_code || ''} ${product.active_ingredient || ''}`);
            return haystack.includes(query)
                && !pinnedProductIds.some(id => String(id) === String(product.id));
        }).slice(0, 12);

        if (quickProductResults) {
            quickProductResults.innerHTML = matches.length
                ? matches.map(product => `
                    <button type="button" onclick="window.pinQuickProduct('${product.id}')"
                        class="flex w-full items-center justify-between border-b border-slate-100 dark:border-slate-700 px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-950/20">
                        <span>
                            <span class="block text-sm font-black text-slate-800 dark:text-white">${product.name}</span>
                            <span class="text-[10px] font-bold text-slate-400">${product.product_code || ''}</span>
                        </span>
                        <i class="fa-solid fa-plus text-blue-600"></i>
                    </button>
                `).join('')
                : '<div class="p-4 text-center text-xs font-bold text-slate-400">Không tìm thấy mặt hàng chưa ghim.</div>';
            quickProductResults.classList.remove('hidden');
        }
    });

    document.querySelectorAll('[data-quick-cash]').forEach(btn => {
        btn.addEventListener('click', () => {
            const amountReceivedInput = document.getElementById('amountReceived');
            if (!amountReceivedInput) return;
            const total = getDisplayedTotal();
            const quickValue = btn.dataset.quickCash;
            if (quickValue === 'exact') {
                amountReceivedInput.value = String(total);
            } else {
                amountReceivedInput.value = String(parseInt(quickValue || '0', 10) || 0);
            }
            updateChange();
            saveCurrentTabState();
        });
    });

    document.getElementById('posPaymentCashBtn')?.addEventListener('click', () => setPaymentMethod('cash'));
    document.getElementById('posPaymentBankBtn')?.addEventListener('click', () => setPaymentMethod('bank_transfer'));

    document.addEventListener('keydown', async (event) => {
        const tag = event.target?.tagName;
        const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || event.target?.isContentEditable;
        const quickModal = document.getElementById('quickProductModal');
        const isQuickModalOpen = quickModal && !quickModal.classList.contains('hidden');
        if (isQuickModalOpen) {
            if (event.key === 'Escape' || event.key === 'Esc') {
                event.preventDefault();
                quickModal.classList.add('hidden');
            }
            return;
        }

        if (event.key === 'F8') {
            event.preventDefault();
            document.getElementById('amountReceived')?.focus();
            return;
        }
        if (event.key === 'F10') {
            event.preventDefault();
            const successModal = document.getElementById('paymentSuccessModal');
            if (successModal && !successModal.classList.contains('hidden')) {
                window.closeSuccessModal();
            } else {
                window.processPayment();
            }
            return;
        }
        if (event.key === 'Escape' || event.key === 'Esc') {
            const successModal = document.getElementById('paymentSuccessModal');
            if (successModal && !successModal.classList.contains('hidden')) {
                event.preventDefault();
                window.closeSuccessModal();
                return;
            }
        }

        const shortcutTarget = !isTyping ? quickSaleShortcuts[String(event.key || '').toUpperCase()] : null;
        if (shortcutTarget && !event.repeat) {
            event.preventDefault();
            await triggerQuickSaleTarget(shortcutTarget);
            return;
        }

        if (event.key === 'F2' && !isTyping) {
            event.preventDefault();
            document.getElementById('posSearchInput')?.focus();
        }
    });
}

async function loadOrderForReturn(tab) {
    try {
        returnOrder = await fetchOrderDetail(tab.returnOrderId);
        tab.returnOrder = returnOrder;
        tab.title = `HĐ #${returnOrder.order_code}`;
        cart = (returnOrder.items || [])
            .filter(i => i.line_type !== 'combo_component')
            .map(i => ({ cartId: createCartId('return'), sourceOrderItemId: i.id, lineType: i.line_type, id: i.product_id, productId: i.product_id, code: i.product_code, name: i.product_name, unit: i.unit_name, price: i.unit_price, quantity: 0, originalQuantity: i.quantity, maxReturnQuantity: i.quantity, units: [{ unit_name: i.unit_name, retail_price: i.unit_price }], batchId: i.batch_id, batchNo: i.batch_number || i.batch_no || '---', expiryDate: i.expiry_date }));
        tab.cart = [...cart];
        tab.customerValue = [
            returnOrder.customer_name && returnOrder.customer_name !== 'Khách lẻ' ? returnOrder.customer_name : '',
            returnOrder.customer_phone || ''
        ].filter(Boolean).join(' - ');
        tab.paymentMethod = returnOrder.payment_method || 'cash';
        tab.amountReceived = 0;
        loadTabState(tab.id);
    } catch (err) { console.error(err); }
}

// --- QR PAYMENT LOGIC ---
let qrPaymentResolve = null;

window.showQrPaymentModalAndWait = (orderCode, amount, qrType = 'sepay') => {
    return new Promise((resolve) => {
        qrPaymentResolve = resolve;
        const modal = document.getElementById('qrPaymentModal');
        const img = document.getElementById('qrPaymentImage');
        const loading = document.getElementById('qrPaymentLoading');
        const statusElement = document.getElementById('qrPaymentStatus');
        
        document.getElementById('qrOrderCode').textContent = orderCode;
        document.getElementById('qrPaymentAmount').textContent = new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
        
        // Lấy từ cấu hình SePay
        const BANK_BIN = window.BRANCH_SETTINGS?.bank_bin || '970415'; 
        const BANK_ACCOUNT = window.BRANCH_SETTINGS?.bank_account || ''; 
        const BANK_NAME = window.BRANCH_SETTINGS?.bank_account_name || ''; 
        
        // URL tạo QR chuẩn VietQR (miễn phí qua vietqr.io)
        const qrUrl = `https://img.vietqr.io/image/${BANK_BIN}-${BANK_ACCOUNT}-compact2.png?amount=${amount}&addInfo=${orderCode}&accountName=${encodeURIComponent(BANK_NAME)}`;
        
        img.src = '';
        img.classList.add('hidden');
        loading.classList.remove('hidden');
        
        img.onload = () => {
            loading.classList.add('hidden');
            img.classList.remove('hidden');
        };
        img.src = qrUrl;
        
        // Update UI based on type
        if (qrType === 'sepay') {
            statusElement.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Đang chờ tiền về tài khoản...';
            statusElement.className = 'flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/30 text-amber-600 rounded-full text-xs font-bold mb-6 border border-amber-200/50';
        } else {
            statusElement.innerHTML = '<i class="fa-solid fa-hand-holding-dollar"></i> Vui lòng quét mã và bấm xác nhận';
            statusElement.className = 'flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/30 text-blue-600 rounded-full text-xs font-bold mb-6 border border-blue-200/50';
        }

        modal.classList.remove('hidden');
        
        // Bắt đầu lắng nghe Supabase Realtime cho bảng sepay_webhooks (Chỉ khi qrType là sepay)
        if (window.qrRealtimeSubscription) {
            window.qrRealtimeSubscription.unsubscribe();
            window.qrRealtimeSubscription = null;
        }
        
        if (qrType === 'sepay') {
            window.qrRealtimeSubscription = supabaseClient
                .channel('sepay_qr_waiter')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'sepay_webhooks',
                        filter: `order_code=eq.${orderCode}`
                    },
                    (payload) => {
                        console.log('Phát hiện thanh toán tự động qua Webhook!', payload);
                        if (Number(payload.new.amount) >= Number(amount)) {
                            window.qrRealtimeSubscription.unsubscribe();
                            window.qrRealtimeSubscription = null;
                            statusElement.innerHTML = '<i class="fa-solid fa-check"></i> Đã nhận tiền tự động!';
                            statusElement.className = 'flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold mb-6';
                            
                            setTimeout(() => {
                                modal.classList.add('hidden');
                                if (qrPaymentResolve) qrPaymentResolve(true);
                                qrPaymentResolve = null;
                            }, 1000);
                        }
                    }
                )
                .subscribe();
        }
    });
};

window.cancelQrPayment = () => {
    document.getElementById('qrPaymentModal').classList.add('hidden');
    if (window.qrRealtimeSubscription) {
        window.qrRealtimeSubscription.unsubscribe();
        window.qrRealtimeSubscription = null;
    }
    if (qrPaymentResolve) {
        qrPaymentResolve(false);
        qrPaymentResolve = null;
    }
};

window.manualConfirmQrPayment = () => {
    document.getElementById('qrPaymentModal').classList.add('hidden');
    if (window.qrRealtimeSubscription) {
        window.qrRealtimeSubscription.unsubscribe();
        window.qrRealtimeSubscription = null;
    }
    if (qrPaymentResolve) {
        qrPaymentResolve(true);
        qrPaymentResolve = null;
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        initLayout('staff', 'pos');
    } catch (err) {
        console.error('[pos] Lỗi khởi tạo layout:', err);
    }

    try {
        allProducts = (await fetchProducts()).filter(product => product.is_active !== false);
    } catch (err) {
        console.error('[pos] Lỗi tải hàng hóa:', err);
        allProducts = [];
    }

    try {
        allCustomers = await fetchCustomers();
    } catch (err) {
        console.warn('[pos] Không tải được khách hàng:', err);
        allCustomers = [];
    }

    try {
        allEmployees = await getEmployees();
        await updateActiveShiftUI();
    } catch (err) {
        console.error('[pos] Lỗi khởi tạo nhân viên/ca làm:', err);
    }

    try {
        const { data, error } = await supabaseClient.from('branch_settings').select('*').limit(1).single();
        if (!error && data) {
            window.BRANCH_SETTINGS = data;
        }
    } catch (err) {
        console.warn('[pos] Không tải được cấu hình chi nhánh:', err);
    }

    setupQuickCustomerForm();
    setupPOSSearch();
    setupCustomerSearch();
    setupEventListeners();
    window.updateOfflineUI?.();

    if (returnOrderId) {
        const tab = createTab('return', { returnOrderId });
        tabs = [tab];
        await loadOrderForReturn(tab);
    } else {
        const tab = createTab('sale');
        tabs = [tab];
        loadTabState(tab.id);
    }
});
