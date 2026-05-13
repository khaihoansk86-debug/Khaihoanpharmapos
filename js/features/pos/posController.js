// js/features/pos/posController.js
import { fetchProducts } from '../products/productService.js';
import { initLayout } from '../../components/layout.js';
import { renderPOSSearchResults, renderCart, updateChange, showSuccessModal, closeSuccessModal, renderBatchPicker } from './posUI.js';
import { createOrder, createReturnOrder, fetchOrderDetail, replaceOrder, getAvailableBatches } from './orderService.js';

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
        customerName: '',
        customerPhone: '',
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

    const elCustInfo = document.getElementById('customerInfo');
    const elDisc = document.getElementById('discountAmount');
    const elAmt = document.getElementById('amountReceived');
    const elNote = document.getElementById('orderNote');
    
    if(elCustInfo) elCustInfo.value = tab.customerValue || '';
    if(elDisc) elDisc.value = tab.discountAmount;
    if(elAmt) elAmt.value = tab.amountReceived;
    if(elNote) elNote.value = tab.orderNote;

    renderTabUI();
    renderCurrentCart();
    updateChange();
    
    const editBanner = document.getElementById('posEditModeBanner');
    if (window.POS_EDIT_MODE || window.POS_RETURN_MODE) {
        if(editBanner) {
            editBanner.classList.remove('hidden');
            const title = document.getElementById('posEditModeTitle');
            const subTitle = editBanner.querySelector('p.text-\\[11px\\]') || editBanner.querySelector('p:first-of-type');
            const icon = editBanner.querySelector('i.fa-solid');
            
            if (window.POS_RETURN_MODE) {
                editBanner.className = "bg-rose-600 text-white rounded-2xl shadow-lg shadow-rose-500/20 border border-rose-500 px-5 py-4 flex items-center justify-between gap-4";
                if(subTitle) subTitle.textContent = "Chế độ trả hàng";
                if(title) title.textContent = `Đang trả hàng cho đơn #${returnOrder?.order_code || returnOrderId}`;
                if(icon) icon.className = "fa-solid fa-arrow-rotate-left text-lg";
            } else {
                editBanner.className = "bg-amber-600 text-white rounded-2xl shadow-lg shadow-amber-500/20 border border-amber-500 px-5 py-4 flex items-center justify-between gap-4";
                if(subTitle) subTitle.textContent = "Chế độ chỉnh sửa hóa đơn";
                if(title) title.textContent = `Đang sửa hóa đơn #${editingOrder?.order_code || editingOrderId}`;
                if(icon) icon.className = "fa-solid fa-pen-to-square text-lg";
            }
        }
    } else {
        if(editBanner) editBanner.classList.add('hidden');
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
                <button onclick="switchTab('${tab.id}')" class="px-4 py-2 ${bgClass} ${borderClass} ${fontClass} ${tabActive} transition-all flex items-center gap-2">
                    ${iconHtml}
                    ${displayTitle}
                </button>
                ${tabs.length > 1 ? `<button onclick="closeTab('${tab.id}')" class="px-3 py-2 ${bgClass} ${borderClass} ${tabActive} !rounded-l-none !border-l-0 transition-all hover:text-red-500 flex items-center"><i class="fa-solid fa-xmark"></i></button>` : ''}
            </div>
        `;
    });
    
    // Add Tab Button (+) right after the last tab
    html += `
        <button onclick="addNewTab()" class="ml-1 w-9 h-9 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl border border-slate-200 dark:border-slate-700 transition-all shrink-0" title="Tạo hóa đơn mới">
            <i class="fa-solid fa-plus text-xs"></i>
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


function renderCurrentCart() {
    // Không gộp dòng tự động nữa để nhân viên có thể chọn các lô khác nhau cho cùng 1 sản phẩm nếu cần
    renderCart(cart);
}

function getBaseUnit(product) { return product.product_units?.find(u => u.is_base_unit) || product.product_units?.[0] || {}; }

async function addProductToCart(product) {
    // Tìm sản phẩm đã có trong giỏ hàng (chỉ gộp nếu cùng loại: cùng là hàng bán mới hoặc cùng là hàng trả)
    const existingIndex = cart.findIndex(item => {
        if (window.POS_RETURN_MODE && item.originalQuantity !== undefined) return false;
        
        const isSameProduct = normalizeKey(item.productId) === normalizeKey(product.id) || 
                             normalizeKey(item.code) === normalizeKey(product.product_code);
        
        // Chỉ gộp nếu cùng đơn vị tính hiện tại (để tránh gộp nhầm Hộp vào Viên)
        const baseUnit = getBaseUnit(product);
        const isSameUnit = normalizeKey(item.unit) === normalizeKey(baseUnit.unit_name);
        
        return isSameProduct && isSameUnit;
    });

    if (existingIndex > -1) {
        cart[existingIndex].quantity = Number(cart[existingIndex].quantity || 0) + 1;
        return;
    }

    const baseUnit = getBaseUnit(product);
    
    // Tìm các lô khả dụng
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
        batches: batches, // Lưu danh sách lô để đổi
        batchId: oldestBatch?.id || null,
        batchNo: oldestBatch?.batch_number || 'Chưa chọn lô',
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

// ... (Các hàm updateQuantity, setItemQuantity giữ nguyên)
window.updateQuantity = (id, delta) => {
    const item = findCartItem(id);
    if (!item) return;
    const isReturnItem = item.originalQuantity !== undefined;
    const minQty = (window.POS_EDIT_MODE || isReturnItem) ? 0 : 1;
    const maxQty = isReturnItem ? Number(item.maxReturnQuantity || item.originalQuantity || 0) : Infinity;
    
    const newQty = Number(item.quantity || 0) + delta;
    if (!isReturnItem && newQty <= 0) {
        window.removeFromCart(id);
        return;
    }
    
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
    
    if (!isReturnItem && qty <= 0) {
        window.removeFromCart(id);
        return;
    }
    
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
    const newItems = cart.filter(item => item.originalQuantity === undefined);
    if (newItems.length === 0) return; 
    if (confirm("Xóa tất cả các hàng hóa mua mới?")) { 
        cart = cart.filter(item => item.originalQuantity !== undefined); 
        renderCurrentCart(); 
    } 
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
    if (!navigator.onLine) {
        alert("Vẫn chưa có kết nối mạng. Vui lòng kiểm tra lại Wifi/3G.");
        return;
    }
    const orders = getOfflineOrders();
    if (orders.length === 0) return;
    
    const btn = document.getElementById('offlineSyncBanner');
    if(btn) btn.innerHTML = `<div class="flex items-center gap-2"><i class="fa-solid fa-spinner fa-spin"></i> Đang đồng bộ... Vui lòng không đóng trang!</div>`;
    
    let success = 0;
    let failed = 0;
    
    for (const order of orders) {
        try {
            if (order.type === 'sale') await createOrder(order.orderData, order.cartItems);
            else if (order.type === 'return') await createReturnOrder({ order_code: order.sourceId }, order.orderData, order.cartItems);
            else if (order.type === 'edit') await replaceOrder(order.sourceId, order.orderData, order.cartItems);
            
            removeOfflineOrder(order.id);
            success++;
        } catch (err) {
            console.error("Lỗi đồng bộ đơn offline " + order.id, err);
            failed++;
        }
    }
    
    if (success > 0) alert(`Đã đồng bộ thành công ${success} đơn lên máy chủ.`);
    if (failed > 0) alert(`Có ${failed} đơn bị lỗi khi đồng bộ (có thể do hết tồn kho hoặc lỗi dữ liệu).\nVui lòng kiểm tra lại kho hoặc chụp màn hình lỗi.`);
    window.updateOfflineUI();
}

window.addEventListener('online', () => {
    if (getOfflineOrders().length > 0) {
        setTimeout(syncOfflineOrders, 2000); // Tự động đồng bộ sau 2s khi có mạng
    }
});

// --- BATCH SELECTION LOGIC ---

window.selectBatchForItem = (cartId, batchId) => {
    const item = findCartItem(cartId);
    if (!item) return;
    const batch = item.batches.find(b => String(b.id) === String(batchId));
    if (batch) {
        item.batchId = batch.id;
        item.batchNo = batch.batch_number || '---';
        item.expiryDate = batch.expiry_date || null;
        renderCurrentCart();
    }
};

window.addQuickDose = async (price) => {
    const doseProduct = allProducts.find(p => { 
        const u = getBaseUnit(p);
        const name = normalizeKey(p.name);
        return (name.includes('LIEU') || name.includes('LIỀU')) && Number(u.retail_price) === Number(price);
    });
    if (doseProduct) { await addProductToCart(doseProduct); renderCurrentCart(); return; }
    cart.push({
        cartId: createCartId('dose'),
        id: null, productId: null, batchId: null,
        code: `DOSE-${price}`, name: `Thuốc liều ${(price/1000).toLocaleString('vi-VN')}k`,
        unit: 'Liều', price: price, conversionRate: 1, quantity: 1,
        units: [{ unit_name: 'Liều', retail_price: price }]
    });
    renderCurrentCart();
};

window.processPayment = async () => {
    if (cart.length === 0) { alert('Giỏ hàng trống!'); return; }
    const total = parseInt(document.getElementById('totalFinalDisplay')?.textContent.replace(/[^0-9]/g, '') || '0');
    let amountReceived = parseInt(document.getElementById('amountReceived')?.value || '0');
    const discount = parseInt(document.getElementById('discountAmount')?.value || '0') || 0;
    const payableItems = cart.filter(item => Number(item.quantity || 0) > 0);

    // Nếu tiền khách đưa để trống hoặc bằng 0, mặc định là khách đưa đủ
    if (amountReceived === 0 && total > 0) {
        amountReceived = total;
    }

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
        
        // Kiểm tra mất mạng hoặc giả lập lưu offline nếu fetch thất bại
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
        
        if (tabs.length > 1) {
            closeTab(currentTabId);
        } else {
            const tab = tabs[0];
            Object.assign(tab, createTab('sale', { id: tab.id }));
            loadTabState(tab.id);
        }
    } catch (err) { 
        // Bắt lỗi mất kết nối từ Supabase/Fetch
        if (err.message === 'Failed to fetch' || (err.message && err.message.toLowerCase().includes('network'))) {
            const type = window.POS_RETURN_MODE ? 'return' : (window.POS_EDIT_MODE ? 'edit' : 'sale');
            const sourceId = window.POS_RETURN_MODE ? (returnOrder?.order_code || returnOrderId) : (window.POS_EDIT_MODE ? editingOrderId : null);
            saveOrderOffline(type, orderPayload, cart, sourceId);
            const orderCode = 'OFFLINE-' + Date.now().toString().slice(-4);
            showSuccessModal(orderCode);
            
            if (tabs.length > 1) {
                closeTab(currentTabId);
            } else {
                const tab = tabs[0];
                Object.assign(tab, createTab('sale', { id: tab.id }));
                loadTabState(tab.id);
            }
        } else {
            alert('Lỗi: ' + err.message); 
        }
    } finally { 
        if (btn) { btn.disabled = false; btn.innerHTML = 'THANH TOÁN'; } 
    }
};

function setupPOSSearch() {
    const searchInput = document.getElementById('posSearchInput');
    const searchSuggestions = document.getElementById('posSearchSuggestions');

    if (!searchInput || !searchSuggestions) return;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = normalizeKey(e.target.value);
        
        if (query.length === 0) {
            searchSuggestions.classList.add('hidden');
            return;
        }

        searchTimeout = setTimeout(() => {
            const results = allProducts.filter(p => {
                const searchStr = `${p.product_code || ''} ${p.name || ''} ${p.active_ingredient || ''} ${p.barcode || ''}`.toUpperCase();
                return searchStr.includes(query);
            }).slice(0, 15);
            
            renderPOSSearchResults(results);
        }, 200);
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchSuggestions.contains(e.target)) {
            searchSuggestions.classList.add('hidden');
        }
    });
}

async function initPOSApp() {
    console.log("POS: Khởi tạo ứng dụng...");
    initLayout('pos');
    
    // Khởi tạo tab đầu tiên
    if (editingOrderId) {
        tabs.push(createTab('edit', { editingOrderId }));
    } else if (returnOrderId) {
        tabs.push(createTab('return', { returnOrderId }));
    } else {
        tabs.push(createTab('sale'));
    }
    currentTabId = tabs[0].id;
    window.POS_EDIT_MODE = tabs[0].type === 'edit';
    window.POS_RETURN_MODE = tabs[0].type === 'return';
    renderTabUI();

    try { 
        allProducts = await fetchProducts(); 
        console.log(`POS ready: ${allProducts.length} items`); 
        setupPOSSearch();
    } catch (err) { 
        console.warn("Lỗi tải sản phẩm (có thể do mất mạng):", err); 
    }
    
    if (editingOrderId) await loadOrderForEdit(tabs[0]);
    if (returnOrderId) await loadOrderForReturn(tabs[0]);
    
    window.updateOfflineUI();
    
    setInterval(() => { 
        const t = document.getElementById('posTime'); 
        if (t) t.textContent = new Date().toLocaleTimeString('vi-VN'); 
    }, 1000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPOSApp);
} else {
    initPOSApp();
}
async function loadOrderForEdit(tab) { 
    try { 
        editingOrder = await fetchOrderDetail(tab.editingOrderId); 
        tab.editingOrder = editingOrder;
        tab.title = `HĐ #${editingOrder.order_code}`;
        cart = (editingOrder.items || []).map(i => ({ cartId: createCartId('item'), id: i.product_id, productId: i.product_id, code: i.product_code, name: i.product_name, unit: i.unit_name, price: i.unit_price, quantity: i.quantity, units: [{unit_name: i.unit_name, retail_price: i.unit_price}], batchId: i.batch_id, batchNo: i.batch_no || '---', expiryDate: i.expiry_date })); 
        tab.cart = [...cart];
        
        tab.customerName = editingOrder.customer_name || '';
        tab.customerPhone = editingOrder.customer_phone || '';
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
        cart = (returnOrder.items || []).map(i => ({ cartId: createCartId('return'), id: i.product_id, productId: i.product_id, code: i.product_code, name: i.product_name, unit: i.unit_name, price: i.unit_price, quantity: 0, originalQuantity: i.quantity, maxReturnQuantity: i.quantity, units: [{unit_name: i.unit_name, retail_price: i.unit_price}], batchId: i.batch_id, batchNo: i.batch_no || '---', expiryDate: i.expiry_date })); 
        tab.cart = [...cart];
        loadTabState(tab.id); 
    } catch(err){ console.error(err); } 
}
