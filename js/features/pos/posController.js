// js/features/pos/posController.js
import { fetchProducts } from '../products/productService.js';
import { initLayout } from '../../components/layout.js';
import { renderPOSSearchResults, renderCart, updateChange, showSuccessModal, closeSuccessModal, renderBatchPicker } from './posUI.js';
import { createOrder, createReturnOrder, fetchOrderDetail, replaceOrder, getAvailableBatches } from './orderService.js';
import { getAISuggestions, renderAISuggestions } from './aiService.js';

window.closeSuccessModal = closeSuccessModal;

let allProducts = [];
let cart = [];
let searchTimeout = null;

// --- TAB STATE MANAGEMENT ---
let tabs = [];
let currentTabId = null;

function createTab(type = 'sale', params = {}) {
    return {
        id: 'tab_' + Date.now() + Math.random().toString(36).substring(7),
        type: type,
        title: type === 'edit' ? 'Sửa HĐ' : (type === 'return' ? 'Trả hàng' : 'Đơn mới'),
        cart: [],
        customerValue: '',
        discountAmount: 0,
        amountReceived: 0,
        orderNote: '',
        editingOrderId: params.editingOrderId || null,
        editingOrder: null,
        returnOrderId: params.returnOrderId || null,
        returnOrder: null,
    };
}

let editingOrder = null;
let editingOrderId = new URLSearchParams(window.location.search).get('editOrder');
let returnOrder = null;
let returnOrderId = new URLSearchParams(window.location.search).get('returnOrder');
window.POS_EDIT_MODE = Boolean(editingOrderId);
window.POS_RETURN_MODE = Boolean(returnOrderId);
const QUICK_PRODUCTS_STORAGE_KEY = 'posQuickProductCodes';
const DEFAULT_QUICK_DOSES = [10000, 12000, 15000, 20000, 25000];
let pendingQuickProductCodes = new Set();
const PINNED_PRODUCTS_KEY = 'posPinnedProductIds';
let pinnedProductIds = JSON.parse(localStorage.getItem(PINNED_PRODUCTS_KEY) || '[]');

function normalizeKey(value) { return value == null ? '' : String(value).trim().toUpperCase(); }
function createCartId(prefix = 'cart') { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function findCartItem(cartId) { return cart.find(item => item.cartId === String(cartId)); }

// --- TAB LOGIC IMPLEMENTATION ---
function saveCurrentTabState() {
    if (!currentTabId) return;
    const tab = tabs.find(t => t.id === currentTabId);
    if (!tab) return;
    
    tab.cart = [...cart];
    tab.customerValue = document.getElementById('customerInfo')?.value || '';
    tab.discountAmount = document.getElementById('discountAmount')?.value || '0';
    tab.amountReceived = document.getElementById('amountReceived')?.value || '0';
    tab.orderNote = document.getElementById('orderNote')?.value || '';
}

function loadTabState(tabId) {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;
    currentTabId = tabId;
    
    cart = [...tab.cart];
    window.POS_EDIT_MODE = tab.type === 'edit';
    window.POS_RETURN_MODE = tab.type === 'return';
    editingOrderId = tab.editingOrderId;
    returnOrderId = tab.returnOrderId;
    editingOrder = tab.editingOrder;
    returnOrder = tab.returnOrder;

    // Cập nhật giá trị vào form (Sử dụng Optional Chaining để rút gọn)
    const fields = { customerInfo: 'customerValue', discountAmount: 'discountAmount', amountReceived: 'amountReceived', orderNote: 'orderNote' };
    Object.keys(fields).forEach(key => {
        const el = document.getElementById(key);
        if (el) el.value = tab[fields[key]] || (key.includes('Amount') || key === 'amountReceived' ? '0' : '');
    });

    renderTabUI();
    renderCurrentCart();
    updateChange();
    
    // Cập nhật Banner trạng thái
    const editBanner = document.getElementById('posEditModeBanner');
    if (window.POS_EDIT_MODE || window.POS_RETURN_MODE) {
        editBanner?.classList.remove('hidden');
        const title = document.getElementById('posEditModeTitle');
        const subTitle = editBanner?.querySelector('p.text-\\[11px\\]');
        
        if (window.POS_RETURN_MODE) {
            editBanner.className = "bg-rose-600 text-white rounded-2xl shadow-lg border border-rose-500 px-5 py-4 flex items-center justify-between gap-4";
            if (subTitle) subTitle.textContent = "Chế độ trả hàng";
            if (title) title.textContent = `Đang trả hàng cho đơn #${returnOrder?.order_code || returnOrderId}`;
        } else {
            editBanner.className = "bg-amber-600 text-white rounded-2xl shadow-lg border border-amber-500 px-5 py-4 flex items-center justify-between gap-4";
            if (subTitle) subTitle.textContent = "Chế độ chỉnh sửa hóa đơn";
            if (title) title.textContent = `Đang sửa hóa đơn #${editingOrder?.order_code || editingOrderId}`;
        }
    } else {
        editBanner?.classList.add('hidden');
    }
}

function renderTabUI() {
    const container = document.getElementById('posTabsContainer');
    if (!container) return;
    
    let html = '';
    let normalCount = 0;
    tabs.forEach((tab) => {
        if(tab.type === 'sale') normalCount++;
        const isActive = tab.id === currentTabId;
        
        let bgClass = "bg-slate-100 dark:bg-slate-800 text-slate-500";
        let iconHtml = '<i class="fa-solid fa-file-invoice"></i>';
        let displayTitle = tab.title;
        
        if (tab.type === 'edit') {
            bgClass = isActive ? "bg-amber-100 text-amber-700 border-amber-500 dark:bg-amber-900/40 dark:text-amber-400" : "bg-amber-50 text-amber-600/70 border-amber-200 dark:bg-amber-900/20 dark:text-amber-500/60 dark:border-amber-800";
            iconHtml = '<i class="fa-solid fa-pen-to-square"></i>';
        } else if (tab.type === 'return') {
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

    let html = `<span class="text-xs font-bold text-slate-400 uppercase whitespace-nowrap mr-2">Chọn nhanh:</span>`;

    // 2. Render Pinned Products
    pinnedProductIds.forEach(id => {
        const product = allProducts.find(p => String(p.id) === String(id));
        if (product) {
            html += `
                <div class="flex items-center shrink-0 group">
                    <button onclick="window.selectProduct('${product.product_code}')" class="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-l-xl border border-blue-100 dark:border-blue-800/50 font-bold text-sm hover:bg-blue-100 transition-all whitespace-nowrap">
                        ${product.name}
                    </button>
                    <button onclick="window.removePinnedProduct('${id}')" class="px-2 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-400/50 hover:text-red-500 rounded-r-xl border-t border-b border-r border-blue-100 dark:border-blue-800/50 transition-all" title="Bỏ ghim">
                        <i class="fa-solid fa-xmark text-[10px]"></i>
                    </button>
                </div>
            `;
        }
    });

    // 3. Render Settings Button
    html += `
        <button onclick="window.openQuickProductModal()" class="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-sm hover:bg-slate-200 transition-all whitespace-nowrap">
            <i class="fa-solid fa-gear mr-1"></i> Tùy chọn
        </button>
    `;

    container.innerHTML = html;
}

window.switchTab = (tabId) => { saveCurrentTabState(); loadTabState(tabId); };
window.addNewTab = () => { saveCurrentTabState(); const newTab = createTab('sale'); tabs.push(newTab); loadTabState(newTab.id); };
window.closeTab = (tabId) => {
    if (tabs.length <= 1) return;
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    tabs = tabs.filter(t => t.id !== tabId);
    if (currentTabId === tabId) {
        const nextTab = tabs[Math.max(0, tabIndex - 1)];
        loadTabState(nextTab.id);
    } else { renderTabUI(); }
};

function findExistingProductIndex(productCode, productId = null, isReturnMode = false) {
    const normId = productId ? String(productId) : null;
    const normCode = normalizeKey(productCode);
    
    return cart.findIndex(item => {
        // Nếu đang ở chế độ trả hàng, không gộp vào các dòng hàng cũ (originalQuantity)
        if (isReturnMode && item.originalQuantity !== undefined) return false;
        
        const itemId = item.id || item.productId;
        const itemCode = normalizeKey(item.code);
        
        // Ưu tiên khớp theo ID nếu có
        if (normId && itemId && String(itemId) === normId) return true;
        // Nếu không có ID (như Thuốc liều tự tạo), khớp theo Code
        return normCode && itemCode === normCode;
    });
}

function renderCurrentCart() {
    renderCart(cart);
    
    // Cập nhật gợi ý AI
    const suggestions = getAISuggestions(cart, allProducts);
    renderAISuggestions(suggestions);
}

function getBaseUnit(product) { return product.product_units?.find(u => u.is_base_unit) || product.product_units?.[0] || {}; }

async function addProductToCart(product) {
    const existingIndex = findExistingProductIndex(product.product_code, product.id, window.POS_RETURN_MODE);
    
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
    let batches = [];
    try { 
        batches = await getAvailableBatches(product.id); 
    } catch (err) { 
        console.error("Lỗi lấy lô:", err); 
    }
    const oldestBatch = batches[0] || null;

    cart.push({
        cartId: createCartId('item'),
        id: product.id,
        productId: product.id,
        code: product.product_code,
        name: product.name,
        unit: baseUnit.unit_name || 'N/A',
        price: baseUnit.retail_price || 0,
        conversionRate: baseUnit.conversion_rate || 1,
        quantity: 1,
        units: product.product_units || [],
        batches: batches,
        batchId: oldestBatch?.id || null,
        batchNo: oldestBatch?.batch_number || oldestBatch?.batch_no || 'Chưa chọn lô',
        expiryDate: oldestBatch?.expiry_date || null
    });
}

window.selectProduct = async (productCode) => {
    const product = allProducts.find(p => normalizeKey(p.product_code) === normalizeKey(productCode));
    if (!product) return;
    await addProductToCart(product);
    renderCurrentCart();
    const sugg = document.getElementById('posSearchSuggestions');
    const inp = document.getElementById('posSearchInput');
    if (sugg) sugg.classList.add('hidden');
    if (inp) inp.value = '';
};

window.updateQuantity = (id, delta) => {
    const item = findCartItem(id);
    if (!item) return;
    const isReturnItem = item.originalQuantity !== undefined;
    const minQty = (window.POS_EDIT_MODE || isReturnItem) ? 0 : 1;
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
    const minQty = (window.POS_EDIT_MODE || isReturnItem) ? 0 : 1;
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
            item.price = selectedUnit.retail_price || 0;
            item.conversionRate = selectedUnit.conversion_rate || 1;
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
    orders.push({ id: 'OFF-' + Date.now(), type, orderData, cartItems, sourceId, timestamp: new Date().toISOString() });
    localStorage.setItem(OFFLINE_ORDERS_KEY, JSON.stringify(orders));
    updateOfflineUI();
}
function removeOfflineOrder(id) {
    const orders = getOfflineOrders().filter(o => o.id !== id);
    localStorage.setItem(OFFLINE_ORDERS_KEY, JSON.stringify(orders));
    updateOfflineUI();
}
window.updateOfflineUI = function() {
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
}

async function syncOfflineOrders() {
    if (!navigator.onLine) { alert("Vẫn chưa có kết nối mạng."); return; }
    const orders = getOfflineOrders();
    if (orders.length === 0) return;
    const btn = document.getElementById('offlineSyncBanner');
    if(btn) btn.innerHTML = `<div class="flex items-center gap-2"><i class="fa-solid fa-spinner fa-spin"></i> Đang đồng bộ... Vui lòng không đóng trang!</div>`;
    let success = 0; let failed = 0;
    for (const order of orders) {
        try {
            if (order.type === 'sale') await createOrder(order.orderData, order.cartItems);
            else if (order.type === 'return') await createReturnOrder({ order_code: order.sourceId }, order.orderData, order.cartItems);
            else if (order.type === 'edit') await replaceOrder(order.sourceId, order.orderData, order.cartItems);
            removeOfflineOrder(order.id); success++;
        } catch (err) { console.error("Lỗi đồng bộ", err); failed++; }
    }
    if (success > 0) alert(`Đã đồng bộ thành công ${success} đơn.`);
    if (failed > 0) alert(`Có ${failed} đơn bị lỗi khi đồng bộ.`);
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
            name: `Thuốc liều ${(price/1000).toLocaleString('vi-VN')}k`,
            unit: 'Liều', 
            price: price, 
            conversionRate: 1, 
            quantity: 1,
            units: [{ unit_name: 'Liều', retail_price: price }]
        });
    }
    renderCurrentCart();
};

window.processPayment = async () => {
    if (cart.length === 0) { alert('Giỏ hàng trống!'); return; }
    const total = parseInt(document.getElementById('totalFinalDisplay')?.textContent.replace(/[^0-9]/g, '') || '0');
    let amountReceived = parseInt(document.getElementById('amountReceived')?.value || '0');
    const discount = parseInt(document.getElementById('discountAmount')?.value || '0') || 0;
    const payableItems = cart.filter(item => Number(item.quantity || 0) > 0);

    if (amountReceived === 0 && total > 0) amountReceived = total;
    if (!window.POS_EDIT_MODE && payableItems.length === 0) { alert('Giỏ hàng trống!'); return; }
    if (!window.POS_RETURN_MODE && amountReceived < total) { alert('Tiền khách đưa chưa đủ!'); return; }

    const btn = document.querySelector('[data-action="process-payment"]');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span>Đang lưu...</span>'; }

    try {
        const customerValue = document.getElementById('customerInfo')?.value.trim() || '';
        const isPhone = /^\d+$/.test(customerValue.replace(/\s/g, '')) && customerValue.length >= 9;

        const orderPayload = {
            customerName: isPhone ? 'Khách lẻ' : (customerValue || 'Khách lẻ'),
            customerPhone: isPhone ? customerValue : null,
            subtotal: payableItems.reduce((sum, i) => sum + (i.price * i.quantity), 0),
            discount, total, amountReceived, note: document.getElementById('orderNote')?.value.trim() || null,
        };
        let orderCode = '';
        
        if (!navigator.onLine) {
            const type = window.POS_RETURN_MODE ? 'return' : (window.POS_EDIT_MODE ? 'edit' : 'sale');
            const sourceId = window.POS_RETURN_MODE ? (returnOrder?.order_code || returnOrderId) : (window.POS_EDIT_MODE ? editingOrderId : null);
            saveOrderOffline(type, orderPayload, cart, sourceId);
            orderCode = 'OFFLINE-' + Date.now().toString().slice(-4);
        } else {
            const order = window.POS_RETURN_MODE ? await createReturnOrder(returnOrder, orderPayload, cart) : (window.POS_EDIT_MODE ? await replaceOrder(editingOrderId, orderPayload, cart) : await createOrder(orderPayload, cart));
            orderCode = order.order_code;
        }
        
        showSuccessModal(orderCode); 
        if (tabs.length > 1) { closeTab(currentTabId); } else { const tab = tabs[0]; Object.assign(tab, createTab('sale', { id: tab.id })); loadTabState(tab.id); }
    } catch (err) { 
        if (err.message === 'Failed to fetch' || (err.message && err.message.toLowerCase().includes('network'))) {
            const customerValue = document.getElementById('customerInfo')?.value.trim() || '';
            const isPhone = /^\d+$/.test(customerValue.replace(/\s/g, '')) && customerValue.length >= 9;
            const orderPayload = {
                customerName: isPhone ? 'Khách lẻ' : (customerValue || 'Khách lẻ'),
                customerPhone: isPhone ? customerValue : null,
                subtotal: payableItems.reduce((sum, i) => sum + (i.price * i.quantity), 0),
                discount, total, amountReceived, note: document.getElementById('orderNote')?.value.trim() || null,
            };
            const type = window.POS_RETURN_MODE ? 'return' : (window.POS_EDIT_MODE ? 'edit' : 'sale');
            saveOrderOffline(type, orderPayload, cart, window.POS_EDIT_MODE ? editingOrderId : null);
            showSuccessModal('OFFLINE-' + Date.now().toString().slice(-4));
            if (tabs.length > 1) { closeTab(currentTabId); } else { const tab = tabs[0]; Object.assign(tab, createTab('sale', { id: tab.id })); loadTabState(tab.id); }
        } else { alert('Lỗi: ' + err.message); }
    } finally { if (btn) { btn.disabled = false; btn.innerHTML = 'THANH TOÁN'; } }
};

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
                const searchStr = `${p.product_code || ''} ${p.name || ''} ${p.active_ingredient || ''} ${p.barcode || ''}`.toUpperCase();
                return searchStr.includes(query);
            }).slice(0, 15);
            renderPOSSearchResults(results);
        }, 200);
    });
    document.addEventListener('click', (e) => { if (!searchInput.contains(e.target) && !searchSuggestions.contains(e.target)) searchSuggestions.classList.add('hidden'); });
}

function setupEventListeners() {
    // 1. Lắng nghe các nút chọn nhanh Thuốc liều
    document.querySelectorAll('[data-quick-dose]').forEach(btn => {
        btn.addEventListener('click', () => {
            const price = parseInt(btn.getAttribute('data-quick-dose'));
            if (price) window.addQuickDose(price);
        });
    });

    // 2. Lắng nghe phím tắt
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F2') {
            e.preventDefault();
            document.getElementById('posSearchInput')?.focus();
        }
        if (e.key === 'F8') {
            e.preventDefault();
            document.getElementById('amountReceived')?.focus();
        }
        if (e.key === 'F10') {
            e.preventDefault();
            window.processPayment();
        }
    });

    // 3. Lắng nghe các nút hành động khác (nếu dùng data-action)
    document.querySelectorAll('[data-action="configure-quick-products"]').forEach(btn => {
        btn.addEventListener('click', () => window.openQuickProductModal());
    });

    document.querySelectorAll('[data-action="toggle-ai"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const content = document.getElementById('aiContent');
            const icon = document.getElementById('aiToggleIcon');
            if (content && icon) {
                content.classList.toggle('hidden');
                icon.classList.toggle('rotate-180');
            }
        });
    });

    // 4. Tìm kiếm trong Modal cấu hình
    const qpSearchInput = document.getElementById('qpSearchInput');
    if (qpSearchInput) {
        qpSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.toUpperCase();
            const resultsDiv = document.getElementById('qpSearchResults');
            if (!query) { resultsDiv.classList.add('hidden'); return; }
            
            const results = allProducts.filter(p => 
                (p.name?.toUpperCase().includes(query) || p.product_code?.toUpperCase().includes(query))
            ).slice(0, 10);

            if (results.length > 0) {
                resultsDiv.innerHTML = results.map(p => {
                    const safeName = (p.name || '').replace(/'/g, "\\'");
                    return `
                    <div onclick="window.addPinnedProduct('${p.id}')" class="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0">
                        <div class="font-bold text-sm">${p.name}</div>
                        <div class="text-[10px] text-slate-500">${p.product_code || 'Không có mã'}</div>
                    </div>
                    `;
                }).join('');
                resultsDiv.classList.remove('hidden');
            } else {
                resultsDiv.innerHTML = `<div class="p-4 text-center text-slate-500 text-xs">Không tìm thấy sản phẩm</div>`;
                resultsDiv.classList.remove('hidden');
            }
        });
    }
}

window.openQuickProductModal = () => {
    document.getElementById('quickProductModal').classList.remove('hidden');
    renderPinnedProductsList();
};

window.addPinnedProduct = (id) => {
    if (!pinnedProductIds.includes(id)) {
        pinnedProductIds.push(id);
        localStorage.setItem(PINNED_PRODUCTS_KEY, JSON.stringify(pinnedProductIds));
        renderPinnedProductsList();
        renderQuickActions();
    }
    document.getElementById('qpSearchInput').value = '';
    document.getElementById('qpSearchResults').classList.add('hidden');
};

window.removePinnedProduct = (id) => {
    pinnedProductIds = pinnedProductIds.filter(i => String(i) !== String(id));
    localStorage.setItem(PINNED_PRODUCTS_KEY, JSON.stringify(pinnedProductIds));
    renderPinnedProductsList();
    renderQuickActions();
};

function renderPinnedProductsList() {
    const container = document.getElementById('pinnedProductsList');
    if (!container) return;

    if (pinnedProductIds.length === 0) {
        container.innerHTML = `<div class="col-span-2 py-8 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">Chưa có sản phẩm nào được ghim</div>`;
        return;
    }

    container.innerHTML = pinnedProductIds.map(id => {
        const product = allProducts.find(p => String(p.id) === String(id));
        return `
            <div class="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div class="min-w-0">
                    <div class="font-bold text-xs truncate">${product?.name || 'Sản phẩm không tồn tại'}</div>
                    <div class="text-[10px] text-slate-500">${product?.product_code || ''}</div>
                </div>
                <button onclick="window.removePinnedProduct('${id}')" class="text-red-500 hover:text-red-600 p-1">
                    <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
            </div>
        `;
    }).join('');
}

async function initPOSApp() {
    initLayout('pos');
    if (editingOrderId) tabs.push(createTab('edit', { editingOrderId }));
    else if (returnOrderId) tabs.push(createTab('return', { returnOrderId }));
    else tabs.push(createTab('sale'));
    currentTabId = tabs[0].id;
    renderTabUI();
    
    try { 
        allProducts = await fetchProducts(); 
        setupPOSSearch();
        renderQuickActions(); // Render các phím nhanh từ localStorage
        setupEventListeners(); // Bắt sự kiện cho các nút
    } catch (err) { 
        console.warn("Lỗi tải sản phẩm:", err); 
    }
    
    if (editingOrderId) await loadOrderForEdit(tabs[0]);
    if (returnOrderId) await loadOrderForReturn(tabs[0]);
    window.updateOfflineUI();
    setInterval(() => { const t = document.getElementById('posTime'); if (t) t.textContent = new Date().toLocaleTimeString('vi-VN'); }, 1000);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPOSApp);
else initPOSApp();

async function loadOrderForEdit(tab) { 
    try { 
        editingOrder = await fetchOrderDetail(tab.editingOrderId); 
        tab.editingOrder = editingOrder;
        tab.title = `HĐ #${editingOrder.order_code}`;
        cart = (editingOrder.items || []).map(i => ({ cartId: createCartId('item'), id: i.product_id, productId: i.product_id, code: i.product_code, name: i.product_name, unit: i.unit_name, price: i.unit_price, quantity: i.quantity, units: [{unit_name: i.unit_name, retail_price: i.unit_price}], batchId: i.batch_id, batchNo: i.batch_number || i.batch_no || '---', expiryDate: i.expiry_date })); 
        tab.cart = [...cart];
        tab.customerValue = editingOrder.customer_phone || editingOrder.customer_name || '';
        tab.discountAmount = editingOrder.discount || 0;
        tab.orderNote = editingOrder.note || '';
        loadTabState(tab.id); 
    } catch(err){ console.error(err); } 
}

async function loadOrderForReturn(tab) { 
    try { 
        returnOrder = await fetchOrderDetail(tab.returnOrderId); 
        tab.returnOrder = returnOrder;
        tab.title = `HĐ #${returnOrder.order_code}`;
        cart = (returnOrder.items || []).map(i => ({ cartId: createCartId('return'), id: i.product_id, productId: i.product_id, code: i.product_code, name: i.product_name, unit: i.unit_name, price: i.unit_price, quantity: 0, originalQuantity: i.quantity, maxReturnQuantity: i.quantity, units: [{unit_name: i.unit_name, retail_price: i.unit_price}], batchId: i.batch_id, batchNo: i.batch_number || i.batch_no || '---', expiryDate: i.expiry_date })); 
        tab.cart = [...cart];
        loadTabState(tab.id); 
    } catch(err){ console.error(err); } 
}
