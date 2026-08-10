// js/features/pos/posController.js
import { supabaseClient } from '../../core/supabase.js';
import { fetchProducts, syncProductsBackground } from '../products/productService.js';
import { initLayout } from '../../components/layout.js';
import { renderPOSSearchResults, renderCart, updateChange, showSuccessModal, closeSuccessModal, renderBatchPicker } from './posUI.js';
import { createOrder, fetchOrderDetail, getAvailableBatches } from './orderService.js?v=20260712a';
import {
    cancelOrderWithComboIntegrity,
    createReturnOrderWithComboIntegrity as createReturnOrder
} from './comboInvoiceLifecycleService.js';
import { createOrderWithAtomicFastPath } from './fastCheckoutService.js';
import { getAISuggestions, renderAISuggestions } from './aiService.js';
import { createCustomer, fetchCustomers } from '../customers/customerService.js';
import { getShifts } from '../employees/employeeService.js?v=20260712a';
import { fetchEmployeeDirectory } from '../employees/employeeDirectoryService.js';
import { pickTimeMatchedShift } from './shiftSelection.js?v=20260712a';
import { createOrderContext, getOrderRules } from './orderRules.js';
import { syncPaymentToCurrentShift, syncReturnSettlementToCurrentShift } from './shiftSyncService.js?v=20260712a';
import { reconcileShiftSalesFromOrders } from './shiftRevenueReconciliationService.js?v=20260712a';
import { getReturnSettlement } from './returnSettlementRules.js';
import { buildInternalIssueNote } from '../inventory/internalIssueMetadata.js';
import { autoCleanZeroBatches } from '../inventory/inventoryService.js?v=20260712a';
import {
    QUICK_SALE_KEYS,
    assignQuickSaleShortcut,
    findQuickSaleKey
} from './quickSaleShortcutRules.js';
import {
    createCheckoutSnapshot,
    getCheckoutStorageType
} from './posCheckoutSnapshotRules.js';
import {
    completeOfflineCheckout,
    createCartFingerprint,
    createReloadSafeDraft,
    getReusableOrderCode,
    isRecoverableNetworkError,
    parseOfflineOrders,
    restoreReloadSafeDraft,
    startPostCheckoutTasks,
    upsertOfflineOrder
} from './checkoutResilienceRules.js';
import {
    getPOSModePresentation,
    getPOSTabPresentation,
    summarizePOSDraft
} from './posModePresentationRules.js';
import { isPOSShortcutBlocked } from './posKeyboardRules.js';
import {
    calculateComboAvailability,
    getAllowedComboQuantity
} from './comboAvailabilityRules.js';
import { startProductBatchRealtimeSync } from './comboInventoryRealtimeService.js';
import {
    buildParentVariantSearchText,
    groupVariantsByClinicalIdentity
} from '../products/productVariantPackagingRules.js';
import { materializePosCustomItems } from './posCustomItemMaterializationService.js';
import {
    isCurrentSePayRequestAmount,
    isMatchingSePayPayment,
    SEPAY_REALTIME_TABLE
} from '../payments/sepayRealtimeRules.js';

function escapePosHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }[character]));
}

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
let stopProductBatchRealtime = null;
let customerSearchTimeout = null;
let paymentMethod = 'cash';

// --- TAB STATE MANAGEMENT ---
let tabs = [];
let currentTabId = null;
let pendingDraftRecoveryResolver = null;
let pendingPOSActionResolver = null;
let posModalPreviousFocus = null;

function getOrCreatePOSDeviceKey() {
    let deviceKey = localStorage.getItem('pos_device_key');
    if (!deviceKey) {
        deviceKey = `DEV-${Math.random().toString(36).slice(2, 18).toUpperCase()}-${Date.now()}`;
        localStorage.setItem('pos_device_key', deviceKey);
    }
    return deviceKey;
}

function closePOSActionModal(result = false) {
    const modal = document.getElementById('posActionModal');
    modal?.classList.add('hidden');
    const resolve = pendingPOSActionResolver;
    pendingPOSActionResolver = null;
    resolve?.(result === true);
    posModalPreviousFocus?.focus?.();
    posModalPreviousFocus = null;
}

function showPOSMessage(message, type = 'error') {
    const modal = document.getElementById('posActionModal');
    if (!modal) {
        console.warn('[pos]', message);
        return;
    }
    posModalPreviousFocus = document.activeElement;
    document.getElementById('posActionTitle').textContent = type === 'success' ? 'Thành công' : type === 'warning' ? 'Cần lưu ý' : 'Không thể thực hiện';
    document.getElementById('posActionMessage').textContent = String(message || 'Đã có lỗi xảy ra.');
    document.getElementById('posActionCancelBtn').classList.add('hidden');
    document.getElementById('posActionConfirmBtn').textContent = 'Đóng';
    modal.classList.remove('hidden');
    document.getElementById('posActionConfirmBtn')?.focus();
}

function requestPOSConfirmation(message, options = {}) {
    const modal = document.getElementById('posActionModal');
    if (!modal) return Promise.resolve(false);
    posModalPreviousFocus = document.activeElement;
    document.getElementById('posActionTitle').textContent = options.title || 'Xác nhận thao tác';
    document.getElementById('posActionMessage').textContent = String(message || 'Bạn có chắc muốn tiếp tục?');
    const cancelButton = document.getElementById('posActionCancelBtn');
    const confirmButton = document.getElementById('posActionConfirmBtn');
    cancelButton.classList.remove('hidden');
    cancelButton.textContent = options.cancelLabel || 'Hủy';
    confirmButton.textContent = options.confirmLabel || 'Xác nhận';
    modal.classList.remove('hidden');
    cancelButton.focus();
    return new Promise(resolve => { pendingPOSActionResolver = resolve; });
}

window.resolvePOSAction = closePOSActionModal;

function createTab(type = 'sale', params = {}) {
    const tabId = 'tab_' + Date.now() + Math.random().toString(36).substring(7);
    return {
        id: tabId,
        type: type,
        title: type === 'return' ? 'Đổi / Trả hàng' : 'Đơn mới',
        isDoseCut: false,
        isInternal: false,
        isEcommerce: false,
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
        paymentRef: 'TT' + Math.random().toString(36).substring(2, 8).toUpperCase() // Mã tham chiếu VD: TT1A2B3C
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
    let subtotal = 0;
    cart.forEach(item => { 
        if (window.POS_RETURN_MODE && item.originalQuantity !== undefined) {
            subtotal -= (item.price || 0) * (item.quantity || 0);
        } else {
            subtotal += (item.price || 0) * (item.quantity || 0); 
        }
    });
    const isStockExportMode = window.POS_INTERNAL_MODE === true || window.POS_ECOMMERCE_MODE === true || window.POS_DOSE_CUT_MODE === true;
    const discountEl = document.getElementById('discountAmount');
    const discount = isStockExportMode ? 0 : (parseInt(discountEl?.value || '0') || 0);
    
    if (window.POS_RETURN_MODE) {
        return subtotal - discount;
    }
    
    const total = Math.max(0, subtotal - discount);
    return window.POS_INTERNAL_MODE ? -total : total;
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
        if (window.POS_DOSE_CUT_MODE || window.POS_INTERNAL_MODE || window.POS_ECOMMERCE_MODE) {
            cashArea.classList.add('hidden');
        } else {
            cashArea.classList.remove('hidden');
        }
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
    return false;
}

function isDoseRetailProduct(item) {
    if (item.description) {
        try {
            const desc = JSON.parse(item.description);
            if (desc && desc.is_dose_retail === true) return true;
            if (desc && desc.is_dose_cut === true) return false;
            return false;
        } catch (e) { }
    }
    const code = item.code || item.product_code || '';
    return !item.id && code.startsWith('DOSE-');
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

function inlinePosJSString(value) {
    return escapePosHtml(JSON.stringify(String(value ?? '')));
}

function persistDraftState() {
    if (!currentTabId || tabs.length === 0) return;
    try {
        saveCurrentTabState();
        localStorage.setItem('POS_DRAFT_STATE', JSON.stringify(createReloadSafeDraft({
            tabs,
            currentTabId,
            ownerEmployeeId: getLoggedInEmployeeId(),
            deviceKey: getOrCreatePOSDeviceKey()
        })));
    } catch (error) {
        console.warn('[pos] Không thể lưu bản nháp hiện tại:', error);
    }
}

function showPOSDraftNotice(message, type = 'success') {
    const toast = document.getElementById('posDraftRecoveryToast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = `fixed top-5 right-5 z-[260] max-w-sm rounded-2xl px-5 py-3 text-sm font-black text-white shadow-2xl ${
        type === 'warning' ? 'bg-amber-600' : 'bg-emerald-600'
    }`;
    clearTimeout(showPOSDraftNotice.timeoutId);
    showPOSDraftNotice.timeoutId = setTimeout(() => toast.classList.add('hidden'), 4500);
}

function requestPOSDraftRecovery(draft) {
    const modal = document.getElementById('posDraftRecoveryModal');
    if (!modal) return Promise.resolve(false);

    const summary = summarizePOSDraft(draft);
    const itemCount = document.getElementById('posDraftItemCount');
    const tabCount = document.getElementById('posDraftTabCount');
    const modeLabel = document.getElementById('posDraftModeLabel');
    const savedAt = document.getElementById('posDraftSavedAt');

    if (itemCount) itemCount.textContent = String(summary.itemCount);
    if (tabCount) tabCount.textContent = String(summary.tabCount);
    if (modeLabel) modeLabel.textContent = summary.activeModeLabel;
    if (savedAt) {
        const savedDate = summary.savedAt ? new Date(summary.savedAt) : null;
        savedAt.textContent = savedDate && !Number.isNaN(savedDate.getTime())
            ? savedDate.toLocaleString('vi-VN')
            : 'Không xác định';
    }

    modal.classList.remove('hidden');
    document.getElementById('restorePOSDraftBtn')?.focus();

    return new Promise(resolve => {
        pendingDraftRecoveryResolver = resolve;
    });
}

window.resolvePOSDraftRecovery = shouldRestore => {
    const modal = document.getElementById('posDraftRecoveryModal');
    modal?.classList.add('hidden');

    const resolve = pendingDraftRecoveryResolver;
    pendingDraftRecoveryResolver = null;
    resolve?.(shouldRestore === true);
};

function loadTabState(tabId) {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;
    currentTabId = tabId;

    cart = [...tab.cart];
    window.POS_RETURN_MODE = tab.type === 'return';
    const restoredMode = getPOSModePresentation(tab).key;
    window.POS_DOSE_CUT_MODE = restoredMode === 'dose';
    window.POS_INTERNAL_MODE = restoredMode === 'internal';
    window.POS_ECOMMERCE_MODE = restoredMode === 'ecommerce';
    tab.isDoseCut = window.POS_DOSE_CUT_MODE;
    tab.isInternal = window.POS_INTERNAL_MODE;
    tab.isEcommerce = window.POS_ECOMMERCE_MODE;
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
        document.getElementById('discountInputRow')?.classList.add('hidden');
    } else {
        editBanner?.classList.add('hidden');
        document.getElementById('cashReceivedArea')?.classList.remove('hidden');
        document.getElementById('discountInputRow')?.classList.remove('hidden');
    }

    // Cập nhật giao diện thanh chuyển đổi chế độ xuất thuốc liều
    if (window.updatePOSModeUI) window.updatePOSModeUI();
    
    // Nếu tab này đã được thanh toán QR thành công từ trước (do webhook) nhưng chưa hoàn tất
    if (tab && tab.isQrPaid) {
        setTimeout(() => {
            if (currentTabId === tab.id && tab.isQrPaid && cart.length > 0) {
                window.finalizeProcessPayment();
            }
        }, 500);
    }
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
    const cashInputGroup = document.getElementById('cashInputGroup');
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
    
    // Hide fast cash and change calculations when bank transfer is selected
    if (cashInputGroup) {
        if (paymentMethod === 'bank_transfer') {
            cashInputGroup.classList.add('hidden');
        } else {
            cashInputGroup.classList.remove('hidden');
        }
    }
}

function updateCounterpartyFieldUI() {
    const label = document.getElementById('customerFieldLabel');
    const icon = document.getElementById('customerFieldIcon');
    const input = document.getElementById('customerInfo');
    const addBtn = document.getElementById('customerQuickAddBtn');
    const suggestions = document.getElementById('customerSuggestions');
    const wrapper = document.getElementById('customerInfoWrapper');

    if (label) {
        label.textContent = window.POS_INTERNAL_MODE ? 'Đối tượng xuất' : 'Khách hàng';
    }
    if (icon) {
        icon.className = window.POS_INTERNAL_MODE
            ? 'fa-solid fa-user-doctor absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors text-sm'
            : 'fa-solid fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors text-sm';
    }
    if (input) {
        input.placeholder = window.POS_INTERNAL_MODE ? 'Chọn người nhận...' : 'SĐT hoặc tên khách...';
    }
    if (window.POS_INTERNAL_MODE) {
        const reason = document.getElementById('posInternalReasonSelect')?.value;
        if (reason === 'sample') {
            wrapper?.classList.remove('hidden');
        } else {
            wrapper?.classList.add('hidden');
            if (input) input.value = '';
            suggestions?.classList.add('hidden');
        }
    } else if (window.POS_DOSE_CUT_MODE) {
        wrapper?.classList.add('hidden');
        if (input) input.value = '';
    } else {
        wrapper?.classList.remove('hidden');
    }
    
}

// --- SHIFT TRACKING STATE ---
let allEmployees = [];
let currentActiveShift = null;

function getLoggedInEmployeeId() {
    try {
        const user = JSON.parse(localStorage.getItem('pos_user') || 'null');
        return user?.id || null;
    } catch {
        return null;
    }
}

async function reconcileTodayShiftSales(options = {}) {
    try {
        const result = await reconcileShiftSalesFromOrders({
            referenceDate: options.referenceDate || new Date(),
            employeeId: options.employeeId || getLoggedInEmployeeId()
        });
        if (result?.updated?.length) {
            console.log('[pos] Da doi soat lai doanh thu ca tu hoa don:', result);
            await updateActiveShiftUI();
        }
        return result;
    } catch (error) {
        console.error('[pos] Loi doi soat doanh thu ca tu hoa don:', error);
        if (window.showToast) {
            window.showToast('Hoa don da luu, nhung doi soat doanh thu ca bi loi: ' + (error.message || error), 'error');
        }
        return null;
    }
}

function startCheckoutPostProcessing({
    createdOrder = null,
    orderCode,
    total,
    paymentMethod: checkoutPaymentMethod,
    orderContext,
    isReturn = false,
    shouldCleanBatches = false,
    employeeId = null,
    referenceDate = null,
    remindPendingItems = false
}) {
    const tasks = [];

    if (shouldCleanBatches) {
        tasks.push({
            name: 'clean-zero-batches',
            run: () => autoCleanZeroBatches()
        });
    }

    if (isReturn) {
        tasks.push({
            name: 'sync-return-shift',
            run: () => syncReturnSettlementToCurrentShift(
                total,
                createdOrder?.order_code || orderCode,
                checkoutPaymentMethod,
                { employeeId, referenceDate }
            )
        });
    } else if (getOrderRules(orderContext).shouldSyncShift) {
        tasks.push({
            name: 'sync-sale-shift',
            run: () => syncPaymentToCurrentShift(
                total,
                orderCode,
                checkoutPaymentMethod,
                orderContext,
                { employeeId, referenceDate }
            )
        });
    }

    tasks.push({
        name: 'reconcile-shift-sales',
        run: () => reconcileTodayShiftSales({
            referenceDate: referenceDate || createdOrder?.created_at || new Date(),
            employeeId
        })
    });
    tasks.push({
        name: 'refresh-active-shift',
        run: () => updateActiveShiftUI()
    });

    if (remindPendingItems && window.fetchPendingCustomItems) {
        tasks.push({
            name: 'refresh-pending-custom-items',
            run: () => window.fetchPendingCustomItems(true)
        });
    }

    const job = startPostCheckoutTasks(tasks, {
        onTaskError: ({ name, error }) => {
            console.warn(`[pos] Hóa đơn đã lưu; hậu xử lý "${name}" sẽ được đối soát lại.`, error);
        }
    });
    job.completion.then(report => {
        if (!report.ok && window.showToast) {
            window.showToast('Hóa đơn đã lưu. Một số dữ liệu phụ sẽ được đối soát lại tự động.', 'warning');
        }
    });
    return job;
}

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

    currentActiveShift = timeMatchedShifts.length > 0
        ? pickTimeMatchedShift(activeTodayShifts, currentSec, employeeId)
        : null;

    const container = document.getElementById('posActiveShiftContainer');
    const nameEl = document.getElementById('posActiveShiftName');

    if (container && nameEl) {
        container.classList.remove('hidden');
        container.classList.add('flex');
        if (currentActiveShift) {
            const empName = getEmployeeName(currentActiveShift.employee_id);
            nameEl.textContent = `${currentActiveShift.shift_name} (${empName})`;
        } else {
            nameEl.textContent = 'Chưa có ca phù hợp';
        }
    }
}

function renderTabUI() {
    const container = document.getElementById('posTabsContainer');
    if (!container) return;

    let html = '';
    let saleCount = 0;
    tabs.forEach((tab) => {
        if (tab.type === 'sale') saleCount++;
        const isActive = tab.id === currentTabId;

        let bgClass = "bg-slate-100 dark:bg-slate-800 text-slate-500";
        let iconHtml = '<i class="fa-solid fa-file-invoice"></i>';
        let displayTitle = tab.title;

        if (tab.type === 'return') {
            bgClass = isActive ? "bg-rose-100 text-rose-700 border-rose-500 dark:bg-rose-900/40 dark:text-rose-400" : "bg-rose-50 text-rose-600/70 border-rose-200 dark:bg-rose-900/20 dark:text-rose-500/60 dark:border-rose-800";
            iconHtml = '<i class="fa-solid fa-arrow-rotate-left"></i>';
        } else {
            const presentation = getPOSTabPresentation(tab, saleCount);
            const toneClasses = {
                blue: isActive ? 'bg-blue-100 text-blue-700 border-blue-600 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
                violet: isActive ? 'bg-violet-100 text-violet-700 border-violet-600 dark:bg-violet-900/40 dark:text-violet-300' : 'bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-900',
                amber: isActive ? 'bg-amber-100 text-amber-800 border-amber-600 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900',
                pink: isActive ? 'bg-pink-100 text-pink-700 border-pink-600 dark:bg-pink-900/40 dark:text-pink-300' : 'bg-pink-50 text-pink-600 border-pink-200 dark:bg-pink-950/30 dark:text-pink-400 dark:border-pink-900'
            };
            bgClass = toneClasses[presentation.tone];
            displayTitle = presentation.label;
            iconHtml = `<i class="fa-solid ${presentation.icon}"></i>`;
        }

        const borderClass = isActive ? "border-b-2" : "border-b border-t border-l border-r";
        const fontClass = isActive ? "font-black shadow-sm" : "font-bold";
        const tabActive = isActive ? "rounded-t-xl mt-1" : "rounded-xl my-1 text-sm opacity-80 hover:opacity-100";

        html += `
            <div class="flex items-stretch shrink-0">
                <button type="button" onclick="switchTab(${inlinePosJSString(tab.id)})" aria-label="Mở ${escapePosHtml(displayTitle)}" class="min-h-11 px-3 py-2 ${bgClass} ${borderClass} ${fontClass} ${tabActive} transition-all flex items-center gap-2">
                    ${iconHtml}
                    ${escapePosHtml(displayTitle)}
                </button>
                ${tabs.length > 1 ? `<button type="button" onclick="closeTab(${inlinePosJSString(tab.id)})" aria-label="Đóng ${escapePosHtml(displayTitle)}" class="min-w-11 min-h-11 px-2 py-2 ${bgClass} ${borderClass} ${tabActive} !rounded-l-none !border-l-0 transition-all hover:text-red-500 flex items-center justify-center"><i class="fa-solid fa-xmark text-xs"></i></button>` : ''}
            </div>
        `;
    });

    html += `
        <button type="button" onclick="addNewTab()" aria-label="Thêm đơn bán mới" class="min-h-11 px-3 py-2 my-1 bg-white dark:bg-slate-800 text-slate-500 hover:text-blue-600 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-all ml-1 shrink-0 font-bold text-xs">
            <i class="fa-solid fa-plus"></i> Thêm HĐ
        </button>
    `;

    container.innerHTML = html;
    persistDraftState();
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
            if (window.POS_ECOMMERCE_MODE && (!product.is_ecommerce || isDoseCutMaterial(product))) return;
            if (!window.POS_ECOMMERCE_MODE && !window.POS_DOSE_CUT_MODE && isDoseCutMaterial(product)) return;
            const shortcut = findQuickSaleKey(quickSaleShortcuts, `product:${id}`);
            html += `
                <div class="flex items-center shrink-0 group">
                    <button onclick="window.selectProduct(${inlinePosJSString(product.product_code)})" class="px-5 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-l-2xl border border-blue-100 dark:border-blue-800/50 font-black text-base hover:bg-blue-100 transition-all whitespace-nowrap active:scale-95 shadow-sm">
                        ${shortcut ? `<span class="mr-1 rounded-md bg-blue-600 px-1.5 py-0.5 text-[10px] text-white">${escapePosHtml(shortcut)}</span>` : ''}
                        ${escapePosHtml(product.name)}
                    </button>
                    <button onclick="window.removePinnedProduct(${inlinePosJSString(id)})" class="px-3 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-400/50 hover:text-red-500 rounded-r-2xl border-t border-b border-r border-blue-100 dark:border-blue-800/50 transition-all" title="Bỏ ghim">
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
                <span class="mr-1 rounded-md bg-violet-600 px-1.5 py-0.5 text-[10px] text-white">${escapePosHtml(shortcut)}</span>
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

window.focusBarcodeScanner = () => {
    const input = document.getElementById('posSearchInput');
    if (!input) return;
    input.focus();
    input.select();
    showPOSDraftNotice('Sẵn sàng quét mã vạch. Hãy quét mã sản phẩm.');
};

window.setPOSMode = (mode) => {
    // Nếu giỏ hàng có sản phẩm, KHÔNG CHO PHÉP đổi chế độ
    const currentTab = tabs.find(t => t.id === currentTabId);
    if (currentTab && currentTab.cart && currentTab.cart.length > 0) {
        const currentModeName = getPOSModePresentation({
            isDoseCut: window.POS_DOSE_CUT_MODE,
            isInternal: window.POS_INTERNAL_MODE,
            isEcommerce: window.POS_ECOMMERCE_MODE
        }).modeLabel;
        const requestedModeName = getPOSModePresentation({
            isDoseCut: mode === 'dose',
            isInternal: mode === 'internal',
            isEcommerce: mode === 'ecommerce'
        }).modeLabel;

        showPOSMessage(`Giỏ hiện tại thuộc nghiệp vụ "${currentModeName}" nên chưa thể chuyển sang "${requestedModeName}".\n\nHãy hoàn tất hoặc xóa giỏ hiện tại; nếu cần bán song song, hãy mở một tab đơn mới.`, 'warning');
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
    const presentation = getPOSModePresentation({
        isDoseCut: window.POS_DOSE_CUT_MODE,
        isInternal: window.POS_INTERNAL_MODE,
        isEcommerce: window.POS_ECOMMERCE_MODE
    });

    // Reset all buttons to default classes first
    const buttons = [normalBtn, doseBtn, internalBtn, ecommerceBtn];
    buttons.forEach(btn => {
        if (btn) {
            btn.className = 'px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-200';
            btn.setAttribute('aria-pressed', 'false');
        }
    });

    if (presentation.key === 'dose') {
        if (doseBtn) {
            doseBtn.className = 'px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all flex items-center gap-1.5 bg-violet-600 text-white shadow-md shadow-violet-500/20';
            doseBtn.setAttribute('aria-pressed', 'true');
        }
        doseActionsArea?.classList.remove('hidden');
        internalActionsArea?.classList.add('hidden');
        document.getElementById('ecommerceActionsArea')?.classList.add('hidden');
        document.getElementById('posInternalReasonRow')?.classList.add('hidden');
        document.getElementById('posInternalTargetTypeRow')?.classList.add('hidden');

        cashReceivedArea?.classList.add('hidden');
        discountInputRow?.classList.add('hidden');
    } else if (presentation.key === 'internal') {
        if (internalBtn) {
            internalBtn.className = 'px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all flex items-center gap-1.5 bg-amber-600 text-white shadow-md shadow-amber-500/20';
            internalBtn.setAttribute('aria-pressed', 'true');
        }
        doseActionsArea?.classList.add('hidden');
        internalActionsArea?.classList.remove('hidden');
        document.getElementById('ecommerceActionsArea')?.classList.add('hidden');
        document.getElementById('posInternalReasonRow')?.classList.remove('hidden');
        document.getElementById('posInternalTargetTypeRow')?.classList.remove('hidden');

        // Hide cash received and discount in internal use mode
        cashReceivedArea?.classList.add('hidden');
        discountInputRow?.classList.add('hidden');
    } else if (presentation.key === 'ecommerce') {
        if (ecommerceBtn) {
            ecommerceBtn.className = 'px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all flex items-center gap-1.5 bg-pink-600 text-white shadow-md shadow-pink-500/20';
            ecommerceBtn.setAttribute('aria-pressed', 'true');
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
    } else {
        if (normalBtn) {
            normalBtn.className = 'px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all flex items-center gap-1.5 bg-blue-600 text-white shadow-md shadow-blue-500/20';
            normalBtn.setAttribute('aria-pressed', 'true');
        }
        doseActionsArea?.classList.add('hidden');
        internalActionsArea?.classList.add('hidden');
        document.getElementById('ecommerceActionsArea')?.classList.add('hidden');
        document.getElementById('posInternalReasonRow')?.classList.add('hidden');
        document.getElementById('posInternalTargetTypeRow')?.classList.add('hidden');

        cashReceivedArea?.classList.remove('hidden');
        discountInputRow?.classList.remove('hidden');
    }

    if (paymentButton) {
        const btnText = paymentButton.querySelector('.uppercase');
        const btnLabel = paymentButton.querySelector('.flex');
        if (btnText) btnText.textContent = presentation.checkoutHint;
        if (btnLabel) {
            btnLabel.innerHTML = `<i class="fa-solid ${presentation.checkoutIcon} text-white/80"></i> ${presentation.checkoutLabel}`;
        }
        paymentButton.setAttribute('aria-label', presentation.checkoutHint);

        const themeClasses = {
            normal: ['bg-blue-600', 'hover:bg-blue-700', 'shadow-blue-500/30'],
            dose: ['bg-violet-600', 'hover:bg-violet-700', 'shadow-violet-500/30'],
            internal: ['bg-amber-600', 'hover:bg-amber-700', 'shadow-amber-500/30'],
            ecommerce: ['bg-pink-600', 'hover:bg-pink-700', 'shadow-pink-500/30']
        };
        Object.values(themeClasses).flat().forEach(className => paymentButton.classList.remove(className));
        paymentButton.classList.add(...themeClasses[presentation.key]);
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
    
    const currentTab = tabs.find(t => t.id === currentTabId);
    if (currentTab) {
        // Keep the tab model authoritative and in sync with the cart currently
        // shown on screen. Checkout and draft restore both read this model.
        currentTab.cart = [...cart];
        currentTab.isDoseCut = window.POS_DOSE_CUT_MODE === true;
        currentTab.isInternal = window.POS_INTERNAL_MODE === true;
        currentTab.isEcommerce = window.POS_ECOMMERCE_MODE === true;

        if (currentTab.qrRealtimeSubscription
            && !isCurrentSePayRequestAmount(
                currentTab.qrExpectedAmount,
                getDisplayedTotal()
            )) {
            currentTab.qrRealtimeSubscription.unsubscribe();
            currentTab.qrRealtimeSubscription = null;
            currentTab.qrExpectedAmount = null;
            currentTab.isQrPaid = false;

            const qrModalOrderCode = document.getElementById('qrModalOrderCode')?.textContent;
            const floatingOrderCode = document.getElementById('qrFloatingOrderCode')?.textContent;
            const refText = `#${currentTab.paymentRef}`;
            if (qrModalOrderCode === refText || floatingOrderCode === refText) {
                if (window.closeQrModalCompletely) window.closeQrModalCompletely();
                if (window.showToast) {
                    window.showToast(
                        'Tổng tiền đã thay đổi. Mã QR cũ đã được hủy, vui lòng tạo lại.',
                        'warning'
                    );
                }
            }
        }

        // Nếu giỏ hàng rỗng, tự động tắt QR Modal / Floating button của tab đó
        if (cart.length === 0) {
            if (currentTab.qrRealtimeSubscription) {
                currentTab.qrRealtimeSubscription.unsubscribe();
                currentTab.qrRealtimeSubscription = null;
            }
            
            const qrModalOrderCode = document.getElementById('qrModalOrderCode')?.textContent;
            const floatingOrderCode = document.getElementById('qrFloatingOrderCode')?.textContent;
            const refText = `#${currentTab.paymentRef}`;
            
            if (qrModalOrderCode === refText || floatingOrderCode === refText) {
                if (window.closeQrModalCompletely) window.closeQrModalCompletely();
            }
        }
    }

    // Cập nhật gợi ý AI
    const suggestions = getAISuggestions(cart, allProducts);
    renderAISuggestions(suggestions);
    
    persistDraftState();
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
    const comboAvailability = calculateComboAvailability(product, allProducts);
    if (comboAvailability.isCombo && comboAvailability.availableQuantity <= 0) {
        const limitingName = comboAvailability.bottleneck?.name || 'thành phần combo';
        const message = `Không thể bán ${product.name}: ${limitingName} không đủ tồn kho.`;
        if (window.showToast) window.showToast(message, 'warning');
        else showPOSMessage(message);
        return;
    }

    let existingIndex = findExistingProductIndex(product.product_code, product.id, window.POS_RETURN_MODE, variantNote);

    if (existingIndex > -1) {
        const item = cart[existingIndex];
        if (item.originalQuantity !== undefined) {
            const maxQuantity = Number(item.maxReturnQuantity || item.originalQuantity || 0);
            item.quantity = Math.min(maxQuantity, Number(item.quantity || 0) + 1);
        } else {
            item.quantity = getAllowedComboQuantity(
                Number(item.quantity || 0) + 1,
                item.comboAvailability
            );
        }
        return;
    }

    const baseUnit = getBaseUnit(product);
    const isDoseProduct = isDoseCutMaterial(product) || isDoseRetailProduct(product);

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
            item.quantity = getAllowedComboQuantity(
                Number(item.quantity || 0) + 1,
                item.comboAvailability
            );
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
        description: product.description,
        comboAvailability
    });
    
    const currentTab = tabs.find(t => t.id === currentTabId);
    if (currentTab) currentTab.isQrPaid = false;
}

window.selectProduct = async (productCode) => {
    const product = allProducts.find(p => normalizeKey(p.product_code) === normalizeKey(productCode));
    if (!product) return;

    if (window.POS_ECOMMERCE_MODE && (!product.is_ecommerce || isDoseCutMaterial(product))) {
        if (window.showToast) window.showToast('Sản phẩm này không thuộc kho Thương Mại Điện Tử!', 'warning');
        return;
    }
    if (!window.POS_ECOMMERCE_MODE && !window.POS_DOSE_CUT_MODE && !(window.POS_INTERNAL_MODE && document.getElementById('posInternalReasonSelect')?.value === 'dose_cutting') && isDoseCutMaterial(product)) {
        if (window.showToast) window.showToast('Sản phẩm này thuộc Nguyên Liệu Cắt Liều (không bán lẻ ở đây)!', 'warning');
        return;
    }

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

    const groupsHtml = groupVariantsByClinicalIdentity(
        variants,
        parentProduct.variant_definitions
    ).map(group => `
        <section class="rounded-2xl border border-slate-200 dark:border-slate-700 p-3">
            <h4 class="mb-2 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">${escapePosHtml(group.label)}</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                ${group.variants.map(variant => {
                    const baseUnit = getBaseUnit(variant);
                    const priceStr = new Intl.NumberFormat('vi-VN').format(baseUnit.retail_price || 0) + 'đ';
                    const stock = (variant.product_batches || []).reduce((sum, batch) => sum + Number(batch.stock_quantity || 0), 0);
                    return `
                        <button type="button" data-variant-code="${escapePosHtml(variant.product_code)}"
                                class="min-h-24 flex flex-col items-start justify-between p-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all text-left">
                            <span class="font-black text-sm text-slate-800 dark:text-white">${escapePosHtml(variant.packaging_spec || variant.variant_label || variant.name)}</span>
                            <span class="mt-1 text-[11px] font-bold text-slate-500">${escapePosHtml(variant.product_code)} • Tồn ${stock.toLocaleString('vi-VN')} ${escapePosHtml(baseUnit.unit_name || '')}</span>
                            <span class="mt-2 text-xs font-black text-blue-600 dark:text-blue-400">${priceStr}/${escapePosHtml(baseUnit.unit_name || 'đơn vị')}</span>
                        </button>
                    `;
                }).join('')}
            </div>
        </section>
    `).join('');

    const modalHtml = `
        <div id="variantSelectionModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <div>
                        <h3 class="font-black text-slate-800 dark:text-white text-lg">Chọn Biến Thể</h3>
                        <p class="text-xs font-bold text-slate-500">${escapePosHtml(parentProduct.name)}</p>
                    </div>
                    <button type="button" onclick="document.getElementById('variantSelectionModal').remove()" class="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-white rounded-full transition-colors">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="p-4">
                    <div class="space-y-3 max-h-[65vh] overflow-y-auto">
                        ${groupsHtml}
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('variantSelectionModal')?.querySelectorAll('[data-variant-code]').forEach(button => {
        button.addEventListener('click', () => window.confirmDatabaseVariant(button.dataset.variantCode));
    });
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
                <input type="radio" name="variant_${index}" value="${escapePosHtml(v)}" class="peer hidden" ${valArr.indexOf(v) === 0 ? 'checked' : ''}>
                <div class="px-4 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 peer-checked:border-purple-500 peer-checked:bg-purple-50 dark:peer-checked:bg-purple-900/30 peer-checked:text-purple-700 dark:peer-checked:text-purple-400 transition-all shadow-sm hover:border-purple-300">
                    ${escapePosHtml(v)}
                </div>
            </label>
        `).join('');

        groupsHtml += `
            <div class="mb-4 variant-group" data-attr="${escapePosHtml(attr)}">
                <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">${escapePosHtml(attr)}</label>
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
                        <p class="text-xs font-bold text-slate-500">${escapePosHtml(product.name)}</p>
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
    const maxQty = isReturnItem
        ? Number(item.maxReturnQuantity || item.originalQuantity || 0)
        : (item.comboAvailability?.isCombo
            ? Number(item.comboAvailability.availableQuantity || 0)
            : Infinity);
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
    const maxQty = isReturnItem
        ? Number(item.maxReturnQuantity || item.originalQuantity || 0)
        : (item.comboAvailability?.isCombo
            ? Number(item.comboAvailability.availableQuantity || 0)
            : Infinity);
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

window.removeFromCart = (id) => { 
    cart = cart.filter(i => i.cartId !== String(id)); 
    const currentTab = tabs.find(t => t.id === currentTabId);
    if (currentTab) currentTab.isQrPaid = false;
    renderCurrentCart(); 
};
window.clearCart = async () => {
    if (cart.length === 0) return;
    if (await requestPOSConfirmation('Xóa tất cả mặt hàng trong giỏ hiện tại?', {
        title: 'Xóa giỏ hàng',
        confirmLabel: 'Xóa tất cả'
    })) {
        cart = []; 
        const currentTab = tabs.find(t => t.id === currentTabId);
        if (currentTab) currentTab.isQrPaid = false;
        renderCurrentCart(); 
    }
};

// --- OFFLINE LOGIC ---
const OFFLINE_ORDERS_KEY = 'pos_offline_orders';
function getOfflineOrders() {
    return parseOfflineOrders(localStorage.getItem(OFFLINE_ORDERS_KEY));
}
function saveOrderOffline(type, orderData, cartItems, sourceId) {
    const orders = getOfflineOrders();
    let employeeId = null;
    try {
        const user = JSON.parse(localStorage.getItem('pos_user') || 'null');
        employeeId = user?.id || null;
    } catch(e) {}
    const persistedOrderData = { ...orderData, sellerEmployeeId: orderData?.sellerEmployeeId || employeeId };
    const candidate = {
        id: 'OFF-' + Date.now(),
        type,
        orderData: persistedOrderData,
        cartItems,
        sourceId,
        employeeId,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem(OFFLINE_ORDERS_KEY, JSON.stringify(upsertOfflineOrder(orders, candidate)));
    window.updateOfflineUI();
}
function saveMaterializedOfflineCart(orderId, cartItems) {
    const orders = getOfflineOrders();
    const orderIndex = orders.findIndex(order => order?.id === orderId);
    if (orderIndex < 0) {
        throw new Error('Không tìm thấy đơn offline cần cập nhật.');
    }
    orders[orderIndex] = {
        ...orders[orderIndex],
        cartItems
    };
    localStorage.setItem(OFFLINE_ORDERS_KEY, JSON.stringify(orders));
}
function removeOfflineOrder(id) {
    const orders = getOfflineOrders().filter(o => o.id !== id);
    localStorage.setItem(OFFLINE_ORDERS_KEY, JSON.stringify(orders));
    window.updateOfflineUI();
}

window.cancelOfflineOrder = async function cancelOfflineOrder(id) {
    const pendingOrder = getOfflineOrders().find(order => String(order?.id) === String(id));
    if (!pendingOrder) return;

    const orderCode = pendingOrder.orderData?.orderCode || pendingOrder.orderData?.order_code || pendingOrder.id;
    if (!confirm(`Hủy đơn chờ đồng bộ ${orderCode}?\n\nThao tác này sẽ bỏ đơn khỏi máy này. Nếu máy chủ đã có bản nháp cùng mã, bản nháp đó cũng sẽ được hủy.`)) return;

    try {
        if (supabaseClient && navigator.onLine && orderCode) {
            const { data: serverOrder, error: lookupError } = await supabaseClient
                .from('orders')
                .select('id, status')
                .eq('order_code', orderCode)
                .maybeSingle();
            if (lookupError) throw lookupError;
            if (serverOrder?.status === 'draft') {
                await cancelOrderWithComboIntegrity(serverOrder.id, 'Hủy đơn chờ đồng bộ trên POS');
            }
        }
        removeOfflineOrder(id);
        window.showToast?.(`Đã hủy đơn chờ đồng bộ ${orderCode}.`, 'warning');
    } catch (error) {
        console.error('[pos] Không thể hủy đơn offline:', error);
        showPOSMessage(`Không thể hủy đơn ${orderCode}. Vui lòng thử lại khi có mạng.`, 'warning');
    }
};

window.updateOfflineUI = function () {
    const orders = getOfflineOrders();
    let banner = document.getElementById('offlineSyncBanner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'offlineSyncBanner';
        banner.className = 'bg-orange-600 text-white px-4 py-3 text-sm font-bold flex justify-between items-center z-50 fixed bottom-0 left-0 right-0 shadow-[0_-5px_15px_rgba(0,0,0,0.2)] cursor-pointer hover:bg-orange-700 transition-colors';
        banner.onclick = event => {
            const cancelButton = event.target.closest('[data-action="cancel-offline-order"]');
            if (cancelButton) {
                event.stopPropagation();
                window.cancelOfflineOrder(cancelButton.dataset.offlineId);
                return;
            }
            window.syncOfflineOrders();
        };
        document.body.appendChild(banner);
    }
    if (orders.length > 0) {
        const firstOrderCode = orders[0]?.orderData?.orderCode || orders[0]?.orderData?.order_code || orders[0]?.id || '';
        banner.innerHTML = `<div class="flex items-center gap-3 min-w-0"><i class="fa-solid fa-wifi text-xl shrink-0"></i> <span class="truncate">Mất mạng hoặc có lỗi kết nối: đang có <span class="bg-white text-orange-600 px-2 py-0.5 rounded-md">${orders.length}</span> đơn chờ đồng bộ (${escapePosHtml(firstOrderCode)}).</span></div><div class="flex items-center gap-2 shrink-0"><button type="button" data-action="cancel-offline-order" data-offline-id="${escapePosHtml(orders[0]?.id || '')}" class="min-h-9 px-3 rounded-lg bg-white/15 hover:bg-white/25 text-[11px] font-black">Hủy đơn</button><i class="fa-solid fa-rotate"></i></div>`;
        banner.style.display = 'flex';
    } else {
        banner.style.display = 'none';
    }
    // Gửi báo cáo số đơn hàng chưa đồng bộ lên database để các máy khác biết
    reportDeviceSyncStatus();
}

async function reportDeviceSyncStatus() {
    if (!supabaseClient || !navigator.onLine) return;

    const deviceKey = getOrCreatePOSDeviceKey();

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
                const safeDeviceName = String(dev.device_name || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
                const safeUserName = String(dev.last_user_name || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
                html += `
                    <div class="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/80 rounded-2xl p-4 text-red-750 dark:text-red-400 text-sm font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-pulse">
                        <div class="flex items-start gap-3 min-w-0">
                            <div class="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                                <i class="fa-solid fa-triangle-exclamation text-lg"></i>
                            </div>
                            <div class="min-w-0">
                                <p class="font-black">Cảnh báo: Thiết bị khác có đơn hàng chưa đồng bộ!</p>
                                <p class="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                    Thiết bị <strong class="text-slate-700 dark:text-slate-200 font-bold">"${safeDeviceName}"</strong> (Tài khoản: ${safeUserName}) đang bị kẹt <span class="bg-red-500 text-white px-2 py-0.5 rounded-md font-black">${escapePosHtml(dev.unsynced_count)}</span> đơn chưa gửi lên server.
                                </p>
                            </div>
                        </div>
                        <div class="text-right shrink-0 flex flex-col items-end">
                            <span class="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Hoạt động lần cuối: ${escapePosHtml(timeStr)}</span>
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

let isSyncingOfflineOrders = false;
window.syncOfflineOrders = async function syncOfflineOrders() {
    if (!navigator.onLine) { showPOSMessage('Vẫn chưa có kết nối mạng.', 'warning'); return; }
    if (isSyncingOfflineOrders) {
        if (window.showToast) window.showToast('Đơn offline đang được đồng bộ. Vui lòng chờ.', 'warning');
        return;
    }
    const orders = getOfflineOrders();
    if (orders.length === 0) return;
    isSyncingOfflineOrders = true;
    try {
    const btn = document.getElementById('offlineSyncBanner');
    if (btn) btn.innerHTML = `<div class="flex items-center gap-2"><i class="fa-solid fa-spinner fa-spin"></i> Đang đồng bộ... Vui lòng không đóng trang!</div>`;
    let success = 0; let failed = 0;
    
    for (const order of orders) {
        // Đưa các biến ngữ cảnh ra ngoài khối try-catch để có thể tái sử dụng lúc khôi phục dòng tiền (Fix ReferenceError)
        let orderContext = null;
        let paymentMethod = order.orderData?.paymentMethod || order.orderData?.payment_method || 'cash';
        let total = Math.abs(order.orderData?.total || 0);
        let syncCartItems = Array.isArray(order.cartItems) ? order.cartItems : [];
        
        try {
            const hasPendingCustomItems = syncCartItems.some(item => item?.isCustom === true);
            syncCartItems = await materializePosCustomItems(supabaseClient, {
                orderCode: order.orderData?.orderCode || order.orderData?.order_code,
                cartItems: syncCartItems,
                context: {
                    isDoseCut: order.type === 'dose_cut',
                    isInternal: order.type === 'internal',
                    isEcommerce: order.type === 'ecommerce'
                }
            });
            if (hasPendingCustomItems) {
                saveMaterializedOfflineCart(order.id, syncCartItems);
            }

            if (order.type !== 'return') {
                orderContext = createOrderContext({
                    isDoseCut: order.type === 'dose_cut',
                    isInternal: order.type === 'internal',
                    isEcommerce: order.type === 'ecommerce',
                    paymentMethod: paymentMethod,
                    orderPayload: order.orderData || {},
                    cartItems: syncCartItems
                });
            }

            const persistedOrderData = {
                ...(order.orderData || {}),
                sellerEmployeeId: order.orderData?.sellerEmployeeId || order.employeeId || null
            };
            let createdOrder = null;
            if (['sale', 'dose_cut', 'internal', 'ecommerce'].includes(order.type)) {
                createdOrder = await createOrderWithAtomicFastPath(persistedOrderData, syncCartItems, {
                    client: supabaseClient,
                    fallback: (data, items) => createOrder(data, items, { isOfflineSync: true })
                });
            } else if (order.type === 'return') {
                createdOrder = await createReturnOrder({ order_code: order.sourceId }, persistedOrderData, syncCartItems, { isOfflineSync: true });
            } else {
                createdOrder = await createOrder(persistedOrderData, syncCartItems, { isOfflineSync: true });
            }
            
            // Xử lý dọn kho lô rỗng trong khối try-catch riêng để không chặn quy trình đồng bộ ca làm việc (Fix Crash)
            try {
                if (order.type !== 'return') {
                    await autoCleanZeroBatches();
                }
            } catch(cleanErr) {
                console.warn('Lỗi khi auto clean batch trong offline sync (bỏ qua):', cleanErr);
            }

            if (createdOrder) {
                const orderCode = createdOrder.order_code || order.orderData?.orderCode || order.orderData?.order_code;
                
                if (order.type === 'return') {
                    if (total > 0) {
                        await syncReturnSettlementToCurrentShift(
                            total, orderCode, paymentMethod, {
                                employeeId: order.employeeId || null,
                                referenceDate: order.timestamp || null
                            }
                        );
                    }
                } else {
                    const rules = getOrderRules(orderContext);
                    if (rules.shouldSyncShift && total > 0) {
                        await syncPaymentToCurrentShift(
                            total, orderCode, paymentMethod, orderContext, {
                                employeeId: order.employeeId || null,
                                referenceDate: order.timestamp || null
                            }
                        );
                    }
                }
                if (typeof createdOrder.finalizeOrder === 'function') {
                    await createdOrder.finalizeOrder();
                }
                await reconcileTodayShiftSales({
                    referenceDate: order.timestamp || createdOrder.created_at || new Date(),
                    employeeId: order.employeeId || null
                });
            }

            removeOfflineOrder(order.id); success++;
        } catch (err) {
            console.error("Lỗi đồng bộ đơn hàng:", err);
            // Xử lý thông minh lỗi trùng khóa (23505): Nếu đơn đã tồn tại trên máy chủ, dọn dẹp khỏi offline cache để tránh tắc nghẽn
            if (err.code === '23505' || (err.message && err.message.includes('23505')) || (err.message && err.message.toLowerCase().includes('duplicate key'))) {
                console.warn(`Đơn hàng ${order.orderData?.orderCode || order.id} đã tồn tại trên máy chủ. Tự động dọn dẹp offline.`);
                try {
                    if (order.type !== 'return' && orderContext) {
                        const rules = getOrderRules(orderContext);
                        if (rules.shouldSyncShift && total > 0) {
                            console.log('Khôi phục ghi nhận dòng tiền cho đơn trùng lặp:', order.orderData?.orderCode || order.id);
                            await syncPaymentToCurrentShift(
                                total, order.orderData?.orderCode || order.id, paymentMethod, orderContext, {
                                    employeeId: order.employeeId || null,
                                    referenceDate: order.timestamp || null
                                }
                            );
                        }
                    } else if (order.type === 'return' && total > 0) {
                        await syncReturnSettlementToCurrentShift(
                            total, order.orderData?.orderCode || order.id, paymentMethod, {
                                employeeId: order.employeeId || null,
                                referenceDate: order.timestamp || null
                            }
                        );
                    }
                    await reconcileTodayShiftSales({
                        referenceDate: order.timestamp || new Date(),
                        employeeId: order.employeeId || null
                    });
                } catch(e) {
                    console.error('Lỗi khi khôi phục payment cho đơn trùng lặp:', e);
                }
                removeOfflineOrder(order.id);
                success++;
            } else {
                if (err.message === 'Failed to fetch' || (err.message && err.message.toLowerCase().includes('network'))) {
                    failed++;
                } else {
                    showPOSMessage(`Không thể đồng bộ đơn ${order.orderData?.orderCode || order.id}. Vui lòng thử lại hoặc báo quản trị viên.`);
                    failed++;
                }
            }
        }
    }
    if (success > 0) {
        if (window.showToast) window.showToast(`✅ Đã đồng bộ thành công ${success} đơn hàng lên máy chủ.`, 'success');
        else showPOSMessage(`Đã đồng bộ thành công ${success} đơn hàng.`, 'success');
    }
    if (failed > 0) {
        if (window.showToast) window.showToast(`⚠️ Có ${failed} đơn bị lỗi khi đồng bộ. Kiểm tra kết nối mạng.`, 'error');
        else showPOSMessage(`Có ${failed} đơn chưa đồng bộ được. Vui lòng kiểm tra mạng và thử lại.`, 'warning');
    }
    } finally {
        isSyncingOfflineOrders = false;
        window.updateOfflineUI();
    }
}

window.addEventListener('online', () => {
    window.updateOfflineUI();
    if (getOfflineOrders().length > 0) {
        console.log("Mạng đã khôi phục. Tự động đồng bộ...");
        setTimeout(window.syncOfflineOrders, 3000);
    }
});
window.addEventListener('offline', window.updateOfflineUI);
window.addEventListener('pagehide', persistDraftState);
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') persistDraftState();
});

// --- BATCH PICKER LOGIC ---
window.openBatchPicker = (cartId) => {
    const item = findCartItem(cartId);
    if (!item || !item.batches || item.batches.length === 0) { showPOSMessage('Không có thông tin lô hàng.', 'warning'); return; }
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
        const currentTab = tabs.find(t => t.id === currentTabId);
        if (currentTab) currentTab.isQrPaid = false;
    } else {
        // Thêm mới liều ảo
        const currentTab = tabs.find(t => t.id === currentTabId);
        if (currentTab) currentTab.isQrPaid = false;
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
                <div class="font-black text-sm text-slate-800 dark:text-white truncate">${escapePosHtml(product.name)}</div>
                <div class="mt-2 flex items-center gap-2">
                    <select onchange="window.assignQuickSaleKey(${inlinePosJSString(targetId)}, this.value)"
                        class="min-w-0 flex-1 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800 px-2 py-2 text-xs font-black">
                        ${shortcutOptions(selectedKey)}
                    </select>
                    <button onclick="window.removePinnedProduct(${inlinePosJSString(id)})" class="h-9 w-9 rounded-xl text-red-500 hover:bg-red-100 dark:hover:bg-red-950/30">
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
                <select onchange="window.assignQuickSaleKey(${inlinePosJSString(targetId)}, this.value)"
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

window.openCustomItemModal = (suggestedName = '') => {
    const modal = document.getElementById('customItemModal');
    if (!modal) return;
    const nameInput = document.getElementById('customItemName');
    if (nameInput) {
        nameInput.value = typeof suggestedName === 'string'
            ? suggestedName.trim().slice(0, 255)
            : '';
    }
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.querySelector('div').classList.remove('scale-95');
        nameInput?.focus();
    }, 10);
};

window.closeCustomItemModal = () => {
    const modal = document.getElementById('customItemModal');
    if (!modal) return;
    modal.classList.add('opacity-0');
    modal.querySelector('div').classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
        // Reset fields
        const nameInput = document.getElementById('customItemName');
        const priceInput = document.getElementById('customItemPrice');
        const qtyInput = document.getElementById('customItemQuantity');
        if (nameInput) nameInput.value = '';
        if (priceInput) priceInput.value = '';
        if (qtyInput) qtyInput.value = '1';
    }, 300);
};

window.submitCustomItem = () => {
    const nameInput = document.getElementById('customItemName');
    const priceInput = document.getElementById('customItemPrice');
    const qtyInput = document.getElementById('customItemQuantity');
    const unitInput = document.getElementById('customItemUnit');
    const costInput = document.getElementById('customItemCost');

    const name = nameInput ? nameInput.value.trim() : '';
    const price = priceInput ? Number(priceInput.value) : 0;
    const quantity = qtyInput ? Number(qtyInput.value) : 1;
    const unit = unitInput ? unitInput.value.trim() : 'Lần';
    const cost = costInput ? Number(costInput.value) : 0;

    if (!name) {
        showPOSMessage('Vui lòng nhập tên mặt hàng.', 'warning');
        if (nameInput) nameInput.focus();
        return;
    }
    if (price < 0) {
        showPOSMessage('Đơn giá không hợp lệ.', 'warning');
        if (priceInput) priceInput.focus();
        return;
    }
    if (quantity <= 0) {
        showPOSMessage('Số lượng phải lớn hơn 0.', 'warning');
        if (qtyInput) qtyInput.focus();
        return;
    }

    // Fake item to bypass stock checks but still work smoothly in POS
    const customItem = {
        cartId: 'custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        id: null, 
        product_code: 'CUSTOM',
        name: name,
        unit: unit || 'Lần',
        price: price,
        cost_price: cost,
        quantity: quantity,
        batches: [],
        units: [{ unit_name: unit || 'Lần', is_base_unit: true, conversion_rate: 1 }],
        isCustom: true
    };

    cart.push(customItem);
    
    // Switch back to normal mode if it's return mode so we can add it
    if (window.POS_RETURN_MODE) {
        window.POS_RETURN_MODE = false;
        document.getElementById('returnModeBanner')?.classList.add('hidden');
    }

    renderCurrentCart();
    
    // Play sound if exists
    const blipSound = document.getElementById('blipSound');
    if (blipSound) {
        blipSound.currentTime = 0;
        blipSound.play().catch(() => {});
    }

    window.closeCustomItemModal();
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
            showPOSMessage('Mặt hàng bán nhanh không còn tồn tại trong danh mục.', 'warning');
            return false;
        }
        await window.selectProduct(product.product_code);
        return true;
    }

    return false;
}



window.processPayment = () => {
    if (cart.length === 0) { showPOSMessage('Giỏ hàng trống!', 'warning'); return; }
    
    const selectedPaymentMethod = getSelectedPaymentMethod();
    const qrPaymentType = window.BRANCH_SETTINGS?.qr_payment_type || 'none';
    const currentTab = tabs.find(t => t.id === currentTabId);
    const total = getDisplayedTotal();
    
    // Nếu chọn chuyển khoản, không phải khách trả hàng, và có bật tính năng QR
    if (selectedPaymentMethod === 'bank_transfer' && !window.POS_RETURN_MODE && qrPaymentType !== 'none' && total > 0) {
        if (!currentTab.isQrPaid) {
            // Mở modal quét mã thay vì hoàn tất đơn ngay
            window.openQrModal();
            return;
        }
    }
    
    // Nếu thanh toán bằng tiền mặt, hoặc đã quét mã xong, thì tiếp tục quy trình chuẩn
    window.finalizeProcessPayment();
};

let isProcessingPayment = false;
window.finalizeProcessPayment = async () => {
    if (isProcessingPayment) return;
    if (cart.length === 0) { showPOSMessage('Giỏ hàng trống!', 'warning'); return; }
    const total = getDisplayedTotal();
    let amountReceived = parseInt(document.getElementById('amountReceived')?.value || '0');
    const discount = parseInt(document.getElementById('discountAmount')?.value || '0') || 0;
    const selectedPaymentMethod = getSelectedPaymentMethod();
    const checkoutTab = tabs.find(tab => tab.id === currentTabId) || null;
    const checkoutSnapshot = createCheckoutSnapshot({
        tab: checkoutTab,
        cartItems: cart,
        fallbackModes: {
            isReturn: window.POS_RETURN_MODE,
            isDoseCut: window.POS_DOSE_CUT_MODE,
            isInternal: window.POS_INTERNAL_MODE,
            isEcommerce: window.POS_ECOMMERCE_MODE
        },
        paymentMethod: selectedPaymentMethod,
        ecommercePlatform: document.getElementById('posEcommercePlatform')?.value || null
    });
    let checkoutCart = checkoutSnapshot.cartItems;
    const payableItems = checkoutCart.filter(item => Number(item.quantity || 0) > 0);
    const modeContext = createOrderContext({
        isReturn: checkoutSnapshot.isReturn,
        isDoseCut: checkoutSnapshot.isDoseCut,
        isInternal: checkoutSnapshot.isInternal,
        isEcommerce: checkoutSnapshot.isEcommerce,
        paymentMethod: selectedPaymentMethod,
        cartItems: payableItems
    });
    const modeRules = getOrderRules(modeContext);
    const isStockExportMode = modeRules.isStockExport;
    if (!isStockExportMode && !checkoutSnapshot.isReturn && amountReceived === 0 && total > 0) amountReceived = total;
    if (payableItems.length === 0) {
        showPOSMessage(checkoutSnapshot.isReturn ? 'Chưa chọn mặt hàng đổi hoặc trả!' : 'Giỏ hàng trống!', 'warning');
        return;
    }
    if (checkoutSnapshot.isReturn) {
        if (!navigator.onLine) {
            showPOSMessage('Không thể đổi / trả hàng khi đang offline. Vui lòng kết nối mạng rồi thử lại.', 'warning');
            return;
        }
        const settlement = getReturnSettlement(total);
        const amountText = new Intl.NumberFormat('vi-VN').format(settlement.amount) + 'đ';
        const confirmationText = settlement.type === 'collect'
            ? `Xác nhận đã thu thêm ${amountText} từ khách?`
            : settlement.type === 'refund'
                ? `Xác nhận sẽ hoàn lại ${amountText} cho khách?`
                : 'Xác nhận đổi hàng ngang giá, không thu thêm và không hoàn tiền?';
        if (!await requestPOSConfirmation(confirmationText, {
            title: 'Xác nhận đổi / trả hàng',
            confirmLabel: 'Xác nhận'
        })) return;
        if (settlement.type !== 'collect') amountReceived = 0;
    }
    isProcessingPayment = true;

    const btn = document.querySelector('[onclick="window.processPayment()"]');
    const originalBtnHTML = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = checkoutSnapshot.isInternal ?
            '<span><i class="fa-solid fa-spinner animate-spin mr-2"></i> Đang xuất kho...</span>' :
            '<span><i class="fa-solid fa-spinner animate-spin mr-2"></i> Đang xử lý thanh toán...</span>';
    }

    let orderPayload = {};
    let orderCode = null;

    try {
        const customerValue = document.getElementById('customerInfo')?.value.trim() || '';
        const internalTargetType = document.getElementById('posInternalTargetType')?.value || 'staff';
        let customerId = null;
        let customerName = 'Khách lẻ';
        let customerPhone = null;

        if (customerValue) {
            const exactMatch = allCustomers.find(c => {
                const phoneDisplay = c.phone ? ` - ${c.phone}` : '';
                const selectValue = `${c.full_name}${phoneDisplay}`;
                return selectValue === customerValue || c.full_name === customerValue || c.phone === customerValue;
            });

            if (exactMatch) {
                customerId = exactMatch.id || null;
                customerName = exactMatch.full_name;
                customerPhone = exactMatch.phone;
            } else {
                const phoneMatch = customerValue.match(/\b\d{9,11}\b/);
                if (phoneMatch) {
                    customerPhone = phoneMatch[0];
                    const namePart = customerValue.replace(phoneMatch[0], '').replace(/[-()]/g, '').trim();
                    customerName = namePart || 'Khách lẻ';
                } else {
                    customerName = customerValue;
                }
            }
        }

        if (!isStockExportMode && total > 0 && amountReceived < total) {
            showPOSMessage(`Cần thu thêm ${new Intl.NumberFormat('vi-VN').format(total)}đ. Số tiền khách đưa chưa đủ!`, 'warning');
            if (btn) { btn.disabled = false; btn.innerHTML = originalBtnHTML; }
            return;
        }

        if (checkoutSnapshot.isInternal) {
            const internalReason = document.getElementById('posInternalReasonSelect')?.value || 'sample';
            if (internalReason !== 'sample') {
                customerId = null;
                customerName = 'Nội bộ';
                customerPhone = null;
            } else {
                if (!customerValue) {
                    showPOSMessage('Vui lòng chọn nhân viên / đối tượng xuất.', 'warning');
                    document.getElementById('customerInfo')?.focus();
                    return;
                }
                
                const matchedInternal = allCustomers.find(c => {
                    const phoneDisplay = c.phone ? ` - ${c.phone}` : '';
                    const selectValue = `${c.full_name}${phoneDisplay}`;
                    return selectValue === customerValue || c.full_name === customerValue || c.phone === customerValue || c.full_name === customerName;
                });
                
                if (!matchedInternal) {
                    showPOSMessage('Đối tượng xuất nội bộ phải được chọn từ danh sách đã lưu hệ thống. Vui lòng chọn từ gợi ý!', 'warning');
                    document.getElementById('customerInfo')?.focus();
                    return;
                } else {
                    customerId = matchedInternal.id || null;
                    customerName = matchedInternal.full_name;
                    customerPhone = matchedInternal.phone;
                }
            }
        }

        const isInternalDoseCut = checkoutSnapshot.isInternal && document.getElementById('posInternalReasonSelect')?.value === 'dose_cutting';
        orderPayload = {
            customerId,
            customerName,
            customerPhone,
            subtotal: payableItems.reduce((sum, i) => sum + (i.price * i.quantity), 0),
            discount: isStockExportMode ? 0 : discount,
            total,
            amountReceived: isStockExportMode ? 0 : amountReceived,
            paymentMethod: selectedPaymentMethod,
            note: checkoutSnapshot.isInternal
                ? buildInternalIssueNote({
                    note: `[XUẤT NỘI BỘ] ${document.getElementById('orderNote')?.value.trim() || 'Dùng nội bộ'}`,
                    targetType: internalTargetType,
                    targetName: customerName
                })
                : (checkoutSnapshot.isEcommerce ? `[TMĐT] ${document.getElementById('orderNote')?.value.trim() || 'Đơn Thương Mại Điện Tử'}` : (document.getElementById('orderNote')?.value.trim() || null)),
            isDoseCut: checkoutSnapshot.isDoseCut || isInternalDoseCut,
            isInternal: checkoutSnapshot.isInternal,
            isEcommerce: checkoutSnapshot.isEcommerce,
            ecommercePlatform: checkoutSnapshot.ecommercePlatform,
            internalReason: checkoutSnapshot.isInternal ? (document.getElementById('posInternalReasonSelect')?.value || 'sample') : null,
            internalTargetType: checkoutSnapshot.isInternal ? internalTargetType : null,
            sellerEmployeeId: getLoggedInEmployeeId()
        };
        let orderCode = null;
        if (checkoutSnapshot.isReturn && returnOrder && returnOrder.order_code) {
            try {
                const { data, error } = await supabaseClient
                    .from('orders')
                    .select('order_code')
                    .like('order_code', `${returnOrder.order_code}-%`);
                let maxSuffix = 0;
                if (data && data.length > 0) {
                    data.forEach(o => {
                        const parts = o.order_code.split('-');
                        if (parts.length > 1) {
                            const num = parseInt(parts[parts.length - 1]);
                            if (!isNaN(num) && num > maxSuffix) maxSuffix = num;
                        }
                    });
                }
                orderCode = `${returnOrder.order_code}-${maxSuffix + 1}`;
                orderPayload.note = (orderPayload.note ? orderPayload.note + ' | ' : '') + `Phiếu chỉnh sửa/đổi trả từ đơn gốc: ${returnOrder.order_code}`;
            } catch (err) {
                console.error("Lỗi tạo hậu tố cho đơn trả hàng:", err);
                orderCode = `${returnOrder.order_code}-${Math.floor(100 + Math.random() * 900)}`;
            }
        } else {
            const reusableOrderCode = getReusableOrderCode(checkoutTab?.pendingCheckout, checkoutCart);
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const timeStr = now.getTime().toString().slice(-4) + Math.floor(10 + Math.random() * 90);
            const prefix = checkoutSnapshot.isInternal ? 'PX' : (checkoutSnapshot.isEcommerce ? 'XTMDT' : 'HD');
            orderCode = reusableOrderCode || `${prefix}${year}${month}${day}${timeStr}`;
        }

        orderPayload.orderCode = orderCode;
        if (checkoutTab) {
            checkoutTab.pendingCheckout = {
                orderCode,
                cartFingerprint: createCartFingerprint(checkoutCart),
                startedAt: new Date().toISOString()
            };
            persistDraftState();
        }
        
        // Nếu tab đã nhận tiền qua QR nội tuyến thì ghi nhận vào lịch sử đơn hàng (tùy chọn)
        const currentTab = tabs.find(t => t.id === currentTabId);
        if (currentTab && currentTab.isQrPaid) {
            orderPayload.note = (orderPayload.note ? orderPayload.note + ' - ' : '') + `Đã xác nhận tự động qua SePay (Ref: ${currentTab.paymentRef})`;
        }

        if (navigator.onLine) {
            checkoutCart = await materializePosCustomItems(supabaseClient, {
                orderCode,
                cartItems: checkoutCart,
                context: {
                    isEcommerce: checkoutSnapshot.isEcommerce,
                    isInternal: checkoutSnapshot.isInternal,
                    isDoseCut: checkoutSnapshot.isDoseCut
                }
            });
        }

        const currentSourceId = checkoutSnapshot.isReturn ? (returnOrder?.order_code || returnOrderId) : null;
        const currentOrderContext = createOrderContext({
            isReturn: checkoutSnapshot.isReturn,
            isDoseCut: checkoutSnapshot.isDoseCut,
            isInternal: checkoutSnapshot.isInternal,
            isEcommerce: checkoutSnapshot.isEcommerce,
            paymentMethod: selectedPaymentMethod,
            orderPayload,
            cartItems: checkoutCart,
            sourceId: currentSourceId,
            returnOrder
        });
        if (!navigator.onLine) {
            try {
                await completeOfflineCheckout({
                    save: () => saveOrderOffline(currentOrderContext.type, orderPayload, checkoutCart, currentSourceId)
                });
            } catch (quotaErr) {
                if (window.showToast) window.showToast('Khong the luu don offline: Bo nho may day! Vui long chup anh don hang ngay.', 'error');
                else showPOSMessage('Không thể lưu đơn offline vì bộ nhớ máy đã đầy. Vui lòng chụp lại thông tin đơn và báo quản trị viên.');
                return;
            }
            if (checkoutSnapshot.isInternal) {
                if (window.showToast) window.showToast('Đã tạo phiếu xuất nội bộ ' + orderCode + ' thành công!', 'success');
                else showPOSMessage('Đã tạo phiếu xuất nội bộ ' + orderCode + ' thành công!', 'success');
            } else {
                showSuccessModal(orderCode);
            }
            if (checkoutSnapshot.isReturn) {
                window.POS_COMPLETED_EDIT_OR_RETURN = true;
            }
            window.POS_CURRENT_ORDER_CODE = null; window.POS_CURRENT_CART_STRING = null;
            if (tabs.length > 1) { window.closeTab(currentTabId); } else { const tab = tabs[0]; Object.assign(tab, createTab('sale', { id: tab.id })); loadTabState(tab.id); }
        } else if (checkoutSnapshot.isReturn) {
            const returnResult = await createReturnOrder(returnOrder, orderPayload, checkoutCart);
            // Cập nhật tồn kho giao diện (UI) - Cộng lại tồn kho khi trả hàng
            checkoutCart.forEach(item => {
                if (item.id) {
                    const p = allProducts.find(p => String(p.id) === String(item.id));
                    if (p) p.stock_quantity = (p.stock_quantity || 0) + item.quantity;
                }
            });

            window.POS_COMPLETED_EDIT_OR_RETURN = true;
            showSuccessModal(returnResult?.order_code || orderCode);
            startCheckoutPostProcessing({
                createdOrder: returnResult,
                orderCode,
                total,
                paymentMethod: selectedPaymentMethod,
                orderContext: currentOrderContext,
                isReturn: true,
                employeeId: getLoggedInEmployeeId(),
                referenceDate: returnResult?.created_at || new Date()
            });

            if (tabs.length > 1) {
                window.closeTab(currentTabId);
            } else {
                const tab = tabs[0];
                Object.assign(tab, createTab('sale', { id: tab.id }));
                loadTabState(tab.id);
            }
        } else if (checkoutSnapshot.isDoseCut || checkoutSnapshot.isInternal) {
            const createdOrder = await createOrderWithAtomicFastPath(orderPayload, checkoutCart, {
                client: supabaseClient,
                fallback: createOrder
            });

            // Cập nhật tồn kho giao diện (UI)
            checkoutCart.forEach(item => {
                if (item.id) {
                    const p = allProducts.find(p => String(p.id) === String(item.id));
                    if (p) p.stock_quantity = Math.max(0, (p.stock_quantity || 0) - item.quantity);
                }
            });

            if (checkoutSnapshot.isInternal) {
                if (window.showToast) window.showToast('Đã tạo phiếu xuất nội bộ ' + orderCode + ' thành công!', 'success');
                else showPOSMessage('Đã tạo phiếu xuất nội bộ ' + orderCode + ' thành công!', 'success');
            } else {
                showSuccessModal(orderCode);
            }
            startCheckoutPostProcessing({
                createdOrder,
                orderCode,
                total,
                paymentMethod: selectedPaymentMethod,
                orderContext: currentOrderContext,
                shouldCleanBatches: true,
                employeeId: getLoggedInEmployeeId(),
                referenceDate: createdOrder?.created_at || new Date()
            });

            if (tabs.length > 1) {
                window.closeTab(currentTabId);
            } else {
                const tab = tabs[0];
                Object.assign(tab, createTab('sale', { id: tab.id }));
                loadTabState(tab.id);
            }
        } else {
            try {
                // ĐỒNG BỘ: Chờ lưu đơn hàng xong mới clear giỏ hàng (Để bắt lỗi không đủ tồn kho)
                const createdOrder = await createOrderWithAtomicFastPath(orderPayload, checkoutCart, {
                    client: supabaseClient,
                    fallback: createOrder
                });
                
                const isDose = checkoutSnapshot.isDoseCut;
                const isInternal = checkoutSnapshot.isInternal;
                const isEcommerce = checkoutSnapshot.isEcommerce;
                const capturedOrderContext = createOrderContext({
                    isDoseCut: isDose,
                    isInternal,
                    isEcommerce,
                    paymentMethod: selectedPaymentMethod,
                    orderPayload,
                    cartItems: checkoutCart
                });
                // Cập nhật tồn kho giao diện (UI)
                checkoutCart.forEach(item => {
                    if (item.id) {
                        const p = allProducts.find(prod => String(prod.id) === String(item.id));
                        if (p) p.stock_quantity = Math.max(0, (p.stock_quantity || 0) - item.quantity);
                    }
                });

                // Hiển thị thông báo thành công cho khách hàng
                if (checkoutSnapshot.isInternal) {
                    if (window.showToast) window.showToast('Đã tạo phiếu xuất nội bộ ' + orderCode + ' thành công!', 'success');
                    else showPOSMessage('Đã tạo phiếu xuất nội bộ ' + orderCode + ' thành công!', 'success');
                } else {
                    showSuccessModal(orderCode);
                }
                startCheckoutPostProcessing({
                    createdOrder,
                    orderCode,
                    total,
                    paymentMethod: selectedPaymentMethod,
                    orderContext: capturedOrderContext,
                    shouldCleanBatches: true,
                    employeeId: getLoggedInEmployeeId(),
                    referenceDate: createdOrder?.created_at || new Date(),
                    remindPendingItems: true
                });

                // Làm sạch giỏ hàng & reset tab thanh toán
                if (tabs.length > 1) {
                    window.closeTab(currentTabId);
                } else {
                    const tab = tabs[0];
                    Object.assign(tab, createTab('sale', { id: tab.id }));
                    loadTabState(tab.id);
                }
            } catch (err) {
                console.error('Lỗi khi lưu đơn hàng:', err);
                if (isRecoverableNetworkError(err) || navigator.onLine === false) {
                    // Tự động sao lưu vào bộ nhớ cache offline nếu bị rớt mạng đột ngột
                    try {
                        const type = getCheckoutStorageType(checkoutSnapshot);
                        saveOrderOffline(type, orderPayload, checkoutCart, null);
                        console.log('Đã tự động sao lưu dữ liệu hóa đơn offline thành công.');
                        if (window.showToast) {
                            window.showToast('⚠️ Mất kết nối! Đơn hàng ' + (orderPayload.orderCode || '') + ' đã lưu tạm. Sẽ tự đồng bộ khi có mạng.', 'error');
                        }
                        
                        // Sau khi lưu offline thành công, tiến hành clear giỏ hàng
                        if (checkoutSnapshot.isInternal) {
                            if (window.showToast) window.showToast('Đã tạo phiếu xuất nội bộ (OFFLINE) ' + orderCode + ' thành công!', 'success');
                        } else {
                            showSuccessModal(orderCode);
                        }
                        if (tabs.length > 1) {
                            window.closeTab(currentTabId);
                        } else {
                            const tab = tabs[0];
                            Object.assign(tab, createTab('sale', { id: tab.id }));
                            loadTabState(tab.id);
                        }
                    } catch (cacheErr) {
                        console.error('Lỗi lưu đơn hàng vào offline cache:', cacheErr);
                        showPOSMessage('Không thể lưu đơn offline. Vui lòng chụp lại thông tin đơn và báo quản trị viên.');
                    }
                } else {
                    showPOSMessage('Thanh toán chưa hoàn tất. Vui lòng kiểm tra kết nối và thử lại.');
                }
                
                if (btn) { btn.disabled = false; btn.innerHTML = originalBtnHTML; }
                isProcessingPayment = false;
                return;
            }
        }
    } catch (err) {
        if (isRecoverableNetworkError(err) || navigator.onLine === false) {
            const type = getCheckoutStorageType(checkoutSnapshot);
            const sourceId = checkoutSnapshot.isReturn ? (returnOrder?.order_code || returnOrderId) : null;
            try {
                await completeOfflineCheckout({
                    save: () => saveOrderOffline(type, orderPayload, checkoutCart, sourceId)
                });
            } catch (quotaErr) {
                if (window.showToast) window.showToast('Khong the luu don offline: Bo nho may day! Vui long chup anh don hang ngay.', 'error');
                else showPOSMessage('Không thể lưu đơn offline vì bộ nhớ máy đã đầy. Vui lòng chụp lại thông tin đơn và báo quản trị viên.');
                return;
            }
            if (checkoutSnapshot.isInternal) {
                showPOSMessage('Đã lưu offline phiếu xuất nội bộ!', 'success');
            } else {
                showSuccessModal(orderPayload.orderCode || orderCode);
            }
            if (checkoutSnapshot.isReturn) {
                window.POS_COMPLETED_EDIT_OR_RETURN = true;
            }
            window.POS_CURRENT_ORDER_CODE = null; window.POS_CURRENT_CART_STRING = null;
            if (tabs.length > 1) { window.closeTab(currentTabId); } else { const tab = tabs[0]; Object.assign(tab, createTab('sale', { id: tab.id })); loadTabState(tab.id); }
        } else { showPOSMessage('Không thể hoàn tất thao tác. Vui lòng thử lại hoặc báo quản trị viên.'); }
    } finally {
        isProcessingPayment = false;
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalBtnHTML;
        }
    }
};

window.openQuickCustomerModal = () => {
    const modal = document.getElementById('quickCustomerModal');
    const form = document.getElementById('quickCustomerForm');
    const customerInput = document.getElementById('customerInfo');
    const title = modal?.querySelector('h3');

    if (modal && form) {
        form.reset();
        
        if (title) {
            title.textContent = window.POS_INTERNAL_MODE ? 'Thêm Đối Tượng Xuất (Nội bộ)' : 'Thêm Khách Hàng Nhanh';
        }

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
            
            if (window.POS_INTERNAL_MODE) {
                payload.customer_group = 'internal';
            }

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
            else showPOSMessage('Đã thêm khách hàng thành công!', 'success');

        } catch (err) {
            showPOSMessage('Không thể thêm khách hàng. Vui lòng kiểm tra dữ liệu và thử lại.');
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
            const variantsByParent = new Map();
            allProducts.forEach(product => {
                if (!product.parent_id) return;
                if (!variantsByParent.has(product.parent_id)) variantsByParent.set(product.parent_id, []);
                variantsByParent.get(product.parent_id).push(product);
            });
            const results = allProducts.filter(p => {
                // Ẩn các sản phẩm con (biến thể) khỏi kết quả tìm kiếm gốc
                if (p.parent_id) return false;
                if (p.is_active === false) return false;

                if (window.POS_DOSE_CUT_MODE) {
                    // Dose mode allows any active product as ingredient, plus tagged dose retail packages.
                } else if (window.POS_ECOMMERCE_MODE) {
                    // Chế độ Bán TMĐT: CHỈ sản phẩm is_ecommerce = true, ẩn thuốc liều
                    if (!p.is_ecommerce) return false;
                    if (isDoseCutMaterial(p)) return false;
                } else {
                    // Chế độ bán thường: Ẩn nguyên liệu thuốc liều, NHƯNG CHO PHÉP bán hàng TMĐT ở chế độ thường
                    if (isDoseCutMaterial(p)) return false;
                }

                const childVariants = variantsByParent.get(p.id) || [];
                const searchSource = childVariants.length > 0
                    ? buildParentVariantSearchText(p, childVariants)
                    : `${p.product_code || ''} ${p.name || ''} ${p.active_ingredient || ''} ${p.barcode || ''} ${p.concentration || ''} ${p.dosage_form || ''} ${p.packaging_spec || ''}`;
                const searchStr = removeVietnameseTones(searchSource).toUpperCase();
                return searchStr.includes(query);
            }).map(p => {
                // Nếu là sản phẩm cha, tính tổng tồn kho từ các biến thể con để hiển thị
                const childVariants = variantsByParent.get(p.id) || [];
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
            }).slice(0, 15).map(product => ({
                ...product,
                comboAvailability: calculateComboAvailability(product, allProducts)
            }));

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
                if (exactMatch.is_active === false) {
                    if (window.showToast) window.showToast('San pham nay dang ngung kinh doanh.', 'warning');
                    return;
                } else if (window.POS_ECOMMERCE_MODE && (!exactMatch.is_ecommerce || isDoseCutMaterial(exactMatch))) {
                    if (window.showToast) window.showToast('Sản phẩm này không thuộc kho Thương Mại Điện Tử!', 'warning');
                    return;
                } else if (!window.POS_ECOMMERCE_MODE && !window.POS_DOSE_CUT_MODE && !(window.POS_INTERNAL_MODE && document.getElementById('posInternalReasonSelect')?.value === 'dose_cutting') && isDoseCutMaterial(exactMatch)) {
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
                    else showPOSMessage('Không tìm thấy mặt hàng với mã này!', 'warning');
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
            const internalReason = document.getElementById('posInternalReasonSelect')?.value;
            if (internalReason !== 'sample') {
                customerSuggestions.classList.add('hidden');
                saveCurrentTabState();
                return;
            }
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
                    <button type="button" onclick="window.selectCustomerSuggestion(${inlinePosJSString(selectValue)})"
                         class="w-full text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0 font-bold text-sm text-slate-800 dark:text-white transition-all">
                        <div class="font-black text-slate-700 dark:text-slate-200">${escapePosHtml(c.full_name)}</div>
                        <div class="text-xs text-slate-500 font-medium">${escapePosHtml(c.phone || 'Không có số điện thoại')}</div>
                    </button>
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
        document.getElementById(id)?.addEventListener('change', (e) => {
            saveCurrentTabState();
            if (id === 'posInternalReasonSelect') {
                updateCounterpartyFieldUI();
            }
        });
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
            if (product.parent_id) return false;
            if (window.POS_ECOMMERCE_MODE && (!product.is_ecommerce || isDoseCutMaterial(product))) return false;
            if (!window.POS_ECOMMERCE_MODE && !window.POS_DOSE_CUT_MODE && !(window.POS_INTERNAL_MODE && document.getElementById('posInternalReasonSelect')?.value === 'dose_cutting') && isDoseCutMaterial(product)) return false;

            const haystack = normalizeKey(`${product.name || ''} ${product.product_code || ''} ${product.active_ingredient || ''}`);
            return haystack.includes(query)
                && !pinnedProductIds.some(id => String(id) === String(product.id));
        }).slice(0, 12);

        if (quickProductResults) {
            quickProductResults.innerHTML = matches.length
                ? matches.map(product => `
                    <button type="button" onclick="window.pinQuickProduct(${inlinePosJSString(product.id)})"
                        class="flex w-full items-center justify-between border-b border-slate-100 dark:border-slate-700 px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-950/20">
                        <span>
                            <span class="block text-sm font-black text-slate-800 dark:text-white">${escapePosHtml(product.name)}</span>
                            <span class="text-[10px] font-bold text-slate-400">${escapePosHtml(product.product_code || '')}</span>
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

        const successModal = document.getElementById('paymentSuccessModal');
        const isSuccessModalOpen = successModal && !successModal.classList.contains('hidden');
        if (isSuccessModalOpen && event.key === 'F10') {
            event.preventDefault();
            window.closeSuccessModal();
            return;
        }
        if (isPOSShortcutBlocked(document)) {
            if (event.key === 'Escape' && pendingPOSActionResolver) {
                event.preventDefault();
                closePOSActionModal(false);
            } else if (event.key === 'F10' || event.key === 'F8' || /^F[1-9][0-2]?$/.test(event.key || '')) {
                event.preventDefault();
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
            window.processPayment();
            return;
        }
        if (event.key === 'Escape' || event.key === 'Esc') {
            if (successModal && !successModal.classList.contains('hidden')) {
                event.preventDefault();
                window.closeSuccessModal();
                return;
            }
        }

        const isFunctionKey = event.key && /^F[1-9][0-2]?$/.test(event.key);
        const shortcutTarget = (!isTyping || isFunctionKey) ? quickSaleShortcuts[String(event.key || '').toUpperCase()] : null;
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

// --- QR PAYMENT MODAL LOGIC ---
window.openQrModal = () => {
    const modal = document.getElementById('qrPaymentModal');
    const floatingBtn = document.getElementById('qrFloatingBtn');
    if (!modal) return;
    
    const qrPaymentType = window.BRANCH_SETTINGS?.qr_payment_type || 'none';
    const total = getDisplayedTotal();
    const currentTab = tabs.find(t => t.id === currentTabId);
    
    if (qrPaymentType === 'none' || total <= 0) {
        // Fallback to immediate checkout
        window.finalizeProcessPayment();
        return;
    }
    
    // Hiển thị Modal, ẩn floating button
    modal.classList.remove('hidden');
    if (floatingBtn) floatingBtn.classList.add('hidden');
    
    // Đặt lại vị trí modal ra giữa nếu chưa có
    const modalWindow = document.getElementById('qrModalWindow');
    if (modalWindow && !modalWindow.dataset.dragged) {
        modalWindow.style.transform = 'translate(0px, 0px)';
    }
    
    const orderCode = currentTab.paymentRef;
    const amount = total;
    
    document.getElementById('qrModalOrderCode').textContent = `#${orderCode}`;
    document.getElementById('qrModalAmount').textContent = new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
    
    const img = document.getElementById('qrModalImage');
    const loading = document.getElementById('qrModalLoading');
    const statusElement = document.getElementById('qrModalStatus');
    const successOverlay = document.getElementById('qrModalSuccessOverlay');
    const manualBtn = document.getElementById('qrModalManualBtn');
    
    successOverlay.classList.add('hidden');
    manualBtn.classList.remove('hidden');
    
    const BANK_BIN = window.BRANCH_SETTINGS?.bank_bin || '970415'; 
    const BANK_ACCOUNT = window.BRANCH_SETTINGS?.bank_account || ''; 
    const BANK_NAME = window.BRANCH_SETTINGS?.bank_account_name || ''; 
    let QR_TEMPLATE = window.BRANCH_SETTINGS?.qr_template || 'compact2.png';
    
    if (!QR_TEMPLATE.includes('.')) {
        QR_TEMPLATE += '.png';
    }
    
    if (!BANK_ACCOUNT) {
        img.classList.add('hidden');
        loading.classList.remove('hidden');
        loading.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-rose-500 text-3xl mb-3"></i><span class="text-xs font-bold text-rose-500 uppercase text-center">Chưa cài đặt STK</span>';
        statusElement.innerHTML = 'Vào Cài đặt hệ thống để thêm STK';
        return;
    }
    
    // Sử dụng API POST của VietQR
    const payload = {
        accountNo: BANK_ACCOUNT,
        accountName: BANK_NAME,
        acqId: BANK_BIN,
        amount: amount,
        addInfo: orderCode,
        format: 'text',
        template: QR_TEMPLATE.replace(/\.(png|jpg|jpeg)$/i, '')
    };
    
    const payloadStr = JSON.stringify(payload);
    
    if (img.dataset.qrPayload !== payloadStr) {
        img.dataset.qrPayload = payloadStr;
        img.classList.add('hidden');
        loading.classList.remove('hidden');
        loading.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-3xl text-blue-500 mb-3"></i><span class="text-xs font-bold text-slate-500 uppercase">Đang tạo mã...</span>';
        
        fetch('https://api.vietqr.io/v2/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payloadStr
        })
        .then(response => response.json())
        .then(data => {
            if (data && data.code === '00' && data.data && data.data.qrDataURL) {
                img.onload = () => {
                    loading.classList.add('hidden');
                    img.classList.remove('hidden');
                };
                img.onerror = () => {
                    loading.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-rose-500 text-3xl mb-3"></i><span class="text-xs font-bold text-rose-500 uppercase">Lỗi hiển thị</span>';
                    img.dataset.qrPayload = '';
                };
                img.src = data.data.qrDataURL;
            } else {
                console.error("VietQR API Error:", data);
                loading.innerHTML = `
                    <i class="fa-solid fa-triangle-exclamation text-rose-500 text-3xl mb-3"></i>
                    <span class="text-xs font-bold text-rose-500 uppercase text-center">${escapePosHtml(data.desc || 'Lỗi tạo mã')}</span>
                    <button onclick="window.refreshQrCode()" class="mt-3 px-4 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg text-xs font-bold transition-colors shadow-sm">
                        <i class="fa-solid fa-rotate-right mr-1"></i> Thử lại
                    </button>
                `;
                img.dataset.qrPayload = '';
            }
        })
        .catch(error => {
            console.error("Fetch Error:", error);
            loading.innerHTML = `
                <i class="fa-solid fa-wifi text-rose-500 text-3xl mb-3"></i>
                <span class="text-xs font-bold text-rose-500 uppercase">Lỗi kết nối mạng</span>
                <button onclick="window.refreshQrCode()" class="mt-3 px-4 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg text-xs font-bold transition-colors shadow-sm">
                    <i class="fa-solid fa-rotate-right mr-1"></i> Thử lại
                </button>
            `;
            img.dataset.qrPayload = '';
        });
    }
    
    if (qrPaymentType === 'sepay') {
        statusElement.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-1"></i> Đang chờ khách chuyển khoản...';
        statusElement.className = 'mt-2 text-xs font-bold text-amber-600 dark:text-amber-400 px-3 py-1 bg-amber-50 dark:bg-amber-900/30 rounded-full border border-amber-200/50';
        manualBtn.classList.add('hidden'); // Ẩn nút nhận thủ công nếu dùng sepay
        
        // Bắt đầu lắng nghe realtime nếu chưa có
        if (!currentTab.qrRealtimeSubscription) {
            currentTab.qrExpectedAmount = amount;
            currentTab.qrRealtimeSubscription = supabaseClient
                .channel(`sepay_payments_${currentTab.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: SEPAY_REALTIME_TABLE,
                        filter: `order_code=eq.${orderCode}`
                    },
                    (payload) => {
                        const currentAmount = currentTabId === currentTab.id
                            ? getDisplayedTotal()
                            : currentTab.qrExpectedAmount;
                        if (isCurrentSePayRequestAmount(amount, currentAmount)
                            && isMatchingSePayPayment({
                            expectedOrderCode: orderCode,
                            expectedAmount: amount,
                            transaction: payload.new
                        })) {
                            // Thành công
                            if (currentTab.qrRealtimeSubscription) {
                                currentTab.qrRealtimeSubscription.unsubscribe();
                                currentTab.qrRealtimeSubscription = null;
                            }
                            currentTab.qrExpectedAmount = null;
                            
                            // Đánh dấu tab đã thanh toán xong
                            currentTab.isQrPaid = true;
                            
                            // Ẩn floating button nếu có
                            const floatingBtn = document.getElementById('qrFloatingBtn');
                            if (floatingBtn) floatingBtn.classList.add('hidden');
                            
                            // Bật modal lên nếu đang bị thu nhỏ để user thấy success
                            const modal = document.getElementById('qrPaymentModal');
                            if (modal && modal.classList.contains('hidden') && currentTabId === currentTab.id) {
                                modal.classList.remove('hidden');
                            }
                            
                            // Cập nhật UI modal
                            statusElement.innerHTML = '<i class="fa-solid fa-check mr-1"></i> Đã nhận tiền tự động!';
                            statusElement.className = 'mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-full border border-emerald-200/50';
                            successOverlay.classList.remove('hidden');
                            
                            // Đợi 1.5s để xem hiệu ứng rồi chốt đơn
                            setTimeout(async () => {
                                window.closeQrModalCompletely();
                                // Chỉ gọi finalize nếu đang ở đúng tab, hoặc lưu lại để gọi sau
                                if (currentTabId !== currentTab.id) {
                                    const originalTabId = currentTabId;
                                    window.switchTab(currentTab.id);
                                    await window.finalizeProcessPayment();
                                    window.switchTab(originalTabId);
                                } else {
                                    await window.finalizeProcessPayment();
                                }
                            }, 1500);
                        }
                    }
                )
                .subscribe();
        }
    } else {
        statusElement.innerHTML = '<i class="fa-solid fa-hand-holding-dollar mr-1"></i> Nhận tiền thủ công';
        statusElement.className = 'mt-2 text-xs font-bold text-blue-600 dark:text-blue-400 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full border border-blue-200/50';
        manualBtn.classList.remove('hidden');
    }
    
    // Nếu tab đã được đánh dấu là paid do webhook đến lúc đang mở tab khác
    if (currentTab.isQrPaid) {
        statusElement.innerHTML = '<i class="fa-solid fa-check mr-1"></i> Đã nhận tiền tự động!';
        statusElement.className = 'mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-full border border-emerald-200/50';
        successOverlay.classList.remove('hidden');
        
        setTimeout(() => {
            window.closeQrModalCompletely();
            window.finalizeProcessPayment();
        }, 1500);
    }
};

window.minimizeQrModal = () => {
    const modal = document.getElementById('qrPaymentModal');
    const floatingBtn = document.getElementById('qrFloatingBtn');
    const currentTab = tabs.find(t => t.id === currentTabId);
    
    if (modal) modal.classList.add('hidden');
    
    if (floatingBtn && currentTab) {
        document.getElementById('qrFloatingOrderCode').textContent = `#${currentTab.paymentRef}`;
        floatingBtn.classList.remove('hidden');
    }
};

window.restoreQrModal = () => {
    const modal = document.getElementById('qrPaymentModal');
    const floatingBtn = document.getElementById('qrFloatingBtn');
    if (modal) modal.classList.remove('hidden');
    if (floatingBtn) floatingBtn.classList.add('hidden');
};

window.closeQrModalCompletely = () => {
    const modal = document.getElementById('qrPaymentModal');
    const floatingBtn = document.getElementById('qrFloatingBtn');
    if (modal) modal.classList.add('hidden');
    if (floatingBtn) floatingBtn.classList.add('hidden');
};

window.manualConfirmQrPayment = async () => {
    const orderCodeStr = document.getElementById('qrModalOrderCode')?.textContent;
    const orderCode = orderCodeStr ? orderCodeStr.replace('#', '') : null;
    
    let targetTab = tabs.find(t => t.paymentRef === orderCode);
    if (!targetTab) targetTab = tabs.find(t => t.id === currentTabId);
    if (!targetTab) return;
    
    targetTab.isQrPaid = true;
    if (targetTab.qrRealtimeSubscription) {
        targetTab.qrRealtimeSubscription.unsubscribe();
        targetTab.qrRealtimeSubscription = null;
    }
    targetTab.qrExpectedAmount = null;
    
    window.closeQrModalCompletely();

    if (targetTab.id !== currentTabId) {
        const originalTabId = currentTabId;
        window.switchTab(targetTab.id);
        await window.finalizeProcessPayment();
        window.switchTab(originalTabId);
    } else {
        await window.finalizeProcessPayment();
    }
};

window.refreshQrCode = () => {
    const img = document.getElementById('qrModalImage');
    if (img) img.dataset.qrPayload = ''; // Xóa cache để buộc fetch lại
    window.openQrModal();
};

// --- DRAG AND DROP CHO QR MODAL ---
function setupQrModalDrag() {
    const header = document.getElementById('qrModalHeader');
    const windowEl = document.getElementById('qrModalWindow');
    if (!header || !windowEl) return;
    
    let isDragging = false;
    let startX, startY, initialX, initialY;
    
    header.addEventListener('mousedown', (e) => {
        isDragging = true;
        
        // Bắt đầu kéo, đánh dấu đã từng kéo
        windowEl.dataset.dragged = "true";
        
        // Parse transform hiện tại
        const transform = window.getComputedStyle(windowEl).getPropertyValue('transform');
        let currentX = 0, currentY = 0;
        
        if (transform && transform !== 'none') {
            const matrix = new DOMMatrix(transform);
            currentX = matrix.m41;
            currentY = matrix.m42;
        }
        
        startX = e.clientX;
        startY = e.clientY;
        initialX = currentX;
        initialY = currentY;
        
        header.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        const newX = initialX + dx;
        const newY = initialY + dy;
        
        windowEl.style.transform = `translate(${newX}px, ${newY}px)`;
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            header.style.cursor = 'move';
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    document.body.setAttribute('aria-busy', 'true');
    window.addEventListener('productsUpdated', (e) => {
        if (e.detail) {
            allProducts = e.detail.filter(product => product.is_active !== false);
            console.log("POS: Đã cập nhật danh mục sản phẩm từ Background Sync.");
        }
    });
    try {
        if (!await initLayout('pos', 'pos')) return;
    } catch (err) {
        console.error('[pos] Lỗi khởi tạo layout:', err);
        return;
    }

    try {
        allProducts = (await fetchProducts()).filter(product => product.is_active !== false);
        stopProductBatchRealtime = startProductBatchRealtimeSync({
            client: supabaseClient,
            onInventoryChange: () => syncProductsBackground()
        });
    } catch (err) {
        console.error('[pos] Lỗi tải hàng hóa:', err);
        allProducts = [];
    }

    window.addEventListener('beforeunload', () => {
        stopProductBatchRealtime?.();
        stopProductBatchRealtime = null;
    }, { once: true });

    try {
        allCustomers = await fetchCustomers();
    } catch (err) {
        console.warn('[pos] Không tải được khách hàng:', err);
        allCustomers = [];
    }

    try {
        allEmployees = await fetchEmployeeDirectory(supabaseClient);
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
    setupQrModalDrag();
    window.updateOfflineUI?.();

    if (returnOrderId) {
        const tab = createTab('return', { returnOrderId });
        tabs = [tab];
        await loadOrderForReturn(tab);
    } else {
        let restored = false;
        try {
            const draftStr = localStorage.getItem('POS_DRAFT_STATE');
            if (draftStr) {
                const draft = restoreReloadSafeDraft(draftStr, {
                    employeeId: getLoggedInEmployeeId(),
                    deviceKey: getOrCreatePOSDeviceKey()
                });
                if (!draft) {
                    localStorage.removeItem('POS_DRAFT_STATE');
                    showPOSDraftNotice('Bản nháp đã hết hạn hoặc thuộc nhân viên/máy khác nên đã được hủy an toàn.', 'warning');
                }
                const hasData = draft?.tabs?.some(tab => tab.cart && tab.cart.length > 0);
                if (hasData) {
                    const shouldRestore = await requestPOSDraftRecovery(draft);
                    if (shouldRestore) {
                        tabs = draft.tabs;
                        currentTabId = draft.currentTabId;
                        restored = true;
                        loadTabState(currentTabId);
                        const summary = summarizePOSDraft(draft);
                        showPOSDraftNotice(`Đã khôi phục bản nháp: ${summary.activeModeLabel}, ${summary.itemCount} mặt hàng.`);
                    } else {
                        localStorage.removeItem('POS_DRAFT_STATE');
                        showPOSDraftNotice('Đã hủy bản nháp. POS đã mở đơn Bán thông thường mới.', 'warning');
                    }
                }
            }
        } catch(e) {
            localStorage.removeItem('POS_DRAFT_STATE');
        }

        if (!restored) {
            const tab = createTab('sale');
            tabs = [tab];
            loadTabState(tab.id);
        }
    }

    window.POS_READY = true;
    document.body.dataset.posReady = 'true';
    document.body.removeAttribute('aria-busy');

    if (navigator.onLine) {
        startPostCheckoutTasks([{
            name: 'startup-shift-reconciliation',
            run: () => reconcileTodayShiftSales({
                referenceDate: new Date(),
                employeeId: getLoggedInEmployeeId()
            })
        }], {
            onTaskError: ({ error }) => console.warn('[pos] Đối soát ca nền khi mở POS chưa hoàn tất:', error)
        });
    }
});



// --- Custom Unit Selection ---
window.setCustomUnit = (unit, btn) => {
    const unitInput = document.getElementById('customItemUnit');
    if (unitInput) unitInput.value = unit;
    document.querySelectorAll('.custom-unit-btn').forEach(b => {
        b.classList.remove('border-emerald-500', 'bg-emerald-50', 'dark:bg-emerald-900/20', 'text-emerald-700', 'dark:text-emerald-400');
        b.classList.add('border-slate-200', 'dark:border-slate-700', 'text-slate-600', 'dark:text-slate-400', 'bg-white', 'dark:bg-slate-800');
    });
    if (btn) {
        btn.classList.remove('border-slate-200', 'dark:border-slate-700', 'text-slate-600', 'dark:text-slate-400', 'bg-white', 'dark:bg-slate-800');
        btn.classList.add('border-emerald-500', 'bg-emerald-50', 'dark:bg-emerald-900/20', 'text-emerald-700', 'dark:text-emerald-400');
    }
};

window.clearCustomUnitSelection = () => {
    document.querySelectorAll('.custom-unit-btn').forEach(b => {
        b.classList.remove('border-emerald-500', 'bg-emerald-50', 'dark:bg-emerald-900/20', 'text-emerald-700', 'dark:text-emerald-400');
        b.classList.add('border-slate-200', 'dark:border-slate-700', 'text-slate-600', 'dark:text-slate-400', 'bg-white', 'dark:bg-slate-800');
    });
    const unitInput = document.getElementById('customItemUnit');
    if (unitInput) unitInput.value = '';
};

// --- Pending Custom Items Logic ---
window.fetchPendingCustomItems = async (showReminder = false) => {
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        const { data, error } = await import('../../core/supabase.js').then(m => m.supabaseClient)
            .from('order_items')
            .select('id')
            .like('product_name', '[CẦN CẬP NHẬT]%');
        if (error) throw error;
        const btn = document.getElementById('pendingCustomItemsBtn');
        const countEl = document.getElementById('pendingCustomItemsCount');
        if (btn && countEl) {
            const urgentBanner = document.getElementById('urgentCustomItemWarningArea');
            const urgentCount = document.getElementById('urgentCustomItemCount');

            if (data && data.length > 0) {
                countEl.textContent = data.length;
                btn.classList.remove('hidden');
                
                if (urgentBanner && urgentCount) {
                    urgentCount.textContent = data.length;
                    urgentBanner.classList.remove('hidden');
                }
                
                if (showReminder && window.showToast) {
                    window.showToast(`CẢNH BÁO: Có ${data.length} mặt hàng ngoài danh mục chưa cập nhật thông tin. Vui lòng vào Danh Sách Hàng Hóa để cập nhật!`, 'error');
                }
                
                // AI Corner Flashing Highlight
                const aiText = document.getElementById('aiFloatingText');
                const aiTooltip = document.getElementById('aiFloatingTooltip');
                if (aiTooltip) {
                    aiTooltip.classList.remove('hidden');
                    aiTooltip.classList.remove('border-blue-300', 'dark:border-blue-800', 'from-blue-50', 'to-emerald-50');
                    aiTooltip.classList.add('border-rose-500', 'dark:border-rose-500', 'from-rose-50', 'to-red-50', 'animate-pulse');
                    const aiIcon = aiTooltip.querySelector('.fa-lightbulb, .fa-triangle-exclamation');
                    if (aiIcon) aiIcon.className = 'fa-solid fa-triangle-exclamation text-rose-600 text-lg animate-bounce';
                }
                if (aiText) aiText.innerHTML = `<span class="text-rose-600 dark:text-rose-400">CẢNH BÁO: Còn ${data.length} hàng chờ cập nhật!</span>`;
                
            } else {
                btn.classList.add('hidden');
                if (urgentBanner) urgentBanner.classList.add('hidden');
                
                // Restore AI Corner
                const aiText = document.getElementById('aiFloatingText');
                const aiTooltip = document.getElementById('aiFloatingTooltip');
                if (aiTooltip && aiTooltip.classList.contains('border-rose-500')) {
                    aiTooltip.classList.remove('border-rose-500', 'dark:border-rose-500', 'from-rose-50', 'to-red-50', 'animate-pulse');
                    aiTooltip.classList.add('border-blue-300', 'dark:border-blue-800', 'from-blue-50', 'to-emerald-50');
                    const aiIcon = aiTooltip.querySelector('.fa-triangle-exclamation');
                    if (aiIcon) aiIcon.className = 'fa-solid fa-lightbulb text-yellow-500 text-base animate-duration-1000';
                    if (aiText) aiText.innerHTML = `Mọi thứ đang hoạt động ổn định!`;
                }
            }
        }
    } catch (err) {
        console.error('Lỗi đếm số lượng hàng ngoài DM:', err);
    }
};

// Start periodic reminder
setInterval(() => {
    if (window.fetchPendingCustomItems) {
        window.fetchPendingCustomItems(true);
    }
}, 5 * 60 * 1000);




// --- Logic UI Khôi phục đơn nháp lỗi ---
window.failedDraftOrders = window.failedDraftOrders || [];
window.updateFailedOrdersUI = function() {
    const btn = document.getElementById('failedOrdersBtn');
    const countSpan = document.getElementById('failedOrdersCount');
    if (!btn || !countSpan) return;
    
    if (window.failedDraftOrders && window.failedDraftOrders.length > 0) {
        countSpan.textContent = window.failedDraftOrders.length;
        btn.classList.remove('hidden');
    } else {
        btn.classList.add('hidden');
    }
};

window.restoreFailedOrder = function() {
    if (!window.failedDraftOrders || window.failedDraftOrders.length === 0) return;
    const failedOrder = window.failedDraftOrders.shift();
    window.updateFailedOrdersUI();
    
    try {
        if (typeof saveCurrentTabState === 'function') saveCurrentTabState();
        const fallbackTab = typeof createTab === 'function' ? createTab(failedOrder.modeStr || 'sale') : null;
        if (fallbackTab) {
            fallbackTab.title = '⚠️ Lỗi: ' + failedOrder.orderCode;
            fallbackTab.cart = failedOrder.cart || [];
            fallbackTab.customerValue = failedOrder.customerValue || '';
            fallbackTab.discountAmount = failedOrder.discountAmount || 0;
            fallbackTab.amountReceived = failedOrder.amountReceived || 0;
            fallbackTab.orderNote = failedOrder.orderNote || '';
            
            if (typeof tabs !== 'undefined') tabs.push(fallbackTab);
            if (typeof loadTabState === 'function') loadTabState(fallbackTab.id);
            renderTabUI();
        }
        if (window.showToast) window.showToast('Đã khôi phục giỏ hàng lỗi ra Tab mới để chỉnh sửa!', 'success');
    } catch (restoreErr) {
        console.error('Không thể khôi phục tab:', restoreErr);
    }
};
