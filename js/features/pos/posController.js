// js/features/pos/posController.js
import { fetchProducts } from '../products/productService.js';
import { initLayout } from '../../components/layout.js';
import { renderPOSSearchResults, renderCart, updateChange, showSuccessModal, closeSuccessModal } from './posUI.js';
import { createOrder, createReturnOrder, fetchOrderDetail, replaceOrder } from './orderService.js';

let allProducts = [];
let cart = [];
let searchTimeout = null;
let editingOrder = null;
let editingOrderId = new URLSearchParams(window.location.search).get('editOrder');
let returnOrder = null;
let returnOrderId = new URLSearchParams(window.location.search).get('returnOrder');
window.POS_EDIT_MODE = Boolean(editingOrderId);
window.POS_RETURN_MODE = Boolean(returnOrderId);
const QUICK_PRODUCTS_STORAGE_KEY = 'posQuickProductCodes';
const DEFAULT_QUICK_DOSES = [10000, 12000, 15000, 20000, 25000];
let pendingQuickProductCodes = new Set();

function normalizeKey(value) {
    return value == null ? '' : String(value).trim().toUpperCase();
}

function createCartId(prefix = 'cart') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function findCartItem(cartId) {
    return cart.find(item => item.cartId === String(cartId));
}

function getProductCartKey(item) {
    if (item.quickDosePrice != null) return `quick-dose:${normalizeKey(item.quickDosePrice)}`;
    const idKey = normalizeKey(item.id);
    const codeKey = normalizeKey(item.code);
    if (idKey) return `id:${idKey}`;
    if (codeKey && !['DOSE', 'MANUAL'].includes(codeKey)) return `code:${codeKey}`;
    return '';
}

function findExistingProductIndex(product) {
    const productId = normalizeKey(product.id);
    const productCode = normalizeKey(product.product_code);
    return cart.findIndex(item => {
        const itemId = normalizeKey(item.id);
        const itemCode = normalizeKey(item.code);
        return (productId && itemId === productId) || (productCode && itemCode === productCode);
    });
}

function mergeDuplicateProductRows(items) {
    const mergedItems = [];
    const productIndexByKey = new Map();
    items.forEach(item => {
        const key = getProductCartKey(item);
        if (!key) { mergedItems.push(item); return; }
        const existingIndex = productIndexByKey.get(key);
        if (existingIndex == null) {
            productIndexByKey.set(key, mergedItems.length);
            mergedItems.push(item);
        } else {
            mergedItems[existingIndex].quantity = Number(mergedItems[existingIndex].quantity || 0) + Number(item.quantity || 0);
        }
    });
    return mergedItems;
}

function renderCurrentCart() {
    cart = mergeDuplicateProductRows(cart);
    renderCart(cart);
}

function getBaseUnit(product) {
    return product.product_units?.find(u => u.is_base_unit) || product.product_units?.[0] || {};
}

function addProductToCart(product) {
    if (window.POS_RETURN_MODE) {
        const existingIndex = findExistingProductIndex(product);
        if (existingIndex > -1) {
            const item = cart[existingIndex];
            const maxQuantity = Number(item.maxReturnQuantity || item.originalQuantity || 0);
            item.quantity = Math.min(maxQuantity, Number(item.quantity || 0) + 1);
            return;
        }
        alert('Chỉ có thể trả hàng nằm trong hóa đơn gốc.');
        return;
    }
    const baseUnit = getBaseUnit(product);
    const existingIndex = findExistingProductIndex(product);
    if (existingIndex > -1) {
        cart[existingIndex].quantity = Number(cart[existingIndex].quantity || 0) + 1;
        return;
    }
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
        units: product.product_units || []
    });
}

// ... (Các hàm Quick Actions giữ nguyên)
function getQuickProductCodes() { try { return JSON.parse(localStorage.getItem(QUICK_PRODUCTS_STORAGE_KEY) || '[]'); } catch { return []; } }
function setQuickProductCodes(productCodes) { const uniqueCodes = [...new Set(productCodes.map(code => String(code || '').trim()).filter(Boolean))]; localStorage.setItem(QUICK_PRODUCTS_STORAGE_KEY, JSON.stringify(uniqueCodes)); }
function getQuickProducts() { const quickCodes = getQuickProductCodes().map(normalizeKey); return quickCodes.map(code => allProducts.find(product => normalizeKey(product.product_code) === code)).filter(Boolean); }
function quickButtonClass(color = 'emerald') { if (color === 'blue') return 'px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-800/50 font-bold text-sm hover:bg-blue-100 transition-all whitespace-nowrap'; if (color === 'slate') return 'px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-sm hover:bg-slate-200 transition-all whitespace-nowrap'; return 'px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-800/50 font-bold text-sm hover:bg-emerald-100 transition-all whitespace-nowrap'; }

function renderQuickActions() {
    const container = document.getElementById('quickActions');
    if (!container) return;
    const quickProducts = getQuickProducts();
    const productButtons = quickProducts.map(product => {
        const baseUnit = getBaseUnit(product);
        const price = Number(baseUnit.retail_price || 0);
        const label = price > 0 ? `${product.name} ${new Intl.NumberFormat('vi-VN').format(price)}` : product.name;
        return `<button data-quick-product-code="${product.product_code}" class="${quickButtonClass()}">${label}</button>`;
    }).join('');
    const doseButtons = quickProducts.length > 0 ? '' : DEFAULT_QUICK_DOSES.map(price => `<button data-quick-dose="${price}" class="${quickButtonClass()}">Liều ${(price / 1000).toLocaleString('vi-VN')}k</button>`).join('');
    container.innerHTML = `<span class="text-xs font-bold text-slate-400 uppercase whitespace-nowrap mr-2">Chọn nhanh:</span>${productButtons || doseButtons}<button data-action="configure-quick-products" class="${quickButtonClass('blue')}"><i class="fa-solid fa-gear mr-1"></i> Tùy chọn</button><button data-action="add-custom-dose" class="${quickButtonClass('slate')}"><i class="fa-solid fa-plus mr-1"></i> Liều khác</button>`;
}

function findQuickDoseProduct(price) { return allProducts.find(product => { const baseUnit = getBaseUnit(product); const productText = normalizeKey(`${product.name || ''} ${product.product_code || ''}`); const isDoseProduct = productText.includes('LIEU') || productText.includes('LIỀU') || productText.includes('DOSE'); return isDoseProduct && Number(baseUnit.retail_price || 0) === Number(price || 0); }); }

// Global handlers
window.selectProduct = (productCode) => {
    const product = allProducts.find(p => normalizeKey(p.product_code) === normalizeKey(productCode));
    if (!product) return;
    addProductToCart(product);
    renderCurrentCart();
    const sugg = document.getElementById('posSearchSuggestions');
    const inp = document.getElementById('posSearchInput');
    if (sugg) sugg.classList.add('hidden');
    if (inp) inp.value = '';
};

window.updateQuantity = (id, delta) => {
    const item = findCartItem(id);
    if (!item) return;
    const minimumQuantity = (window.POS_EDIT_MODE || window.POS_RETURN_MODE) ? 0 : 1;
    const maximumQuantity = window.POS_RETURN_MODE ? Number(item.maxReturnQuantity || item.originalQuantity || 0) : Infinity;
    item.quantity = Math.min(maximumQuantity, Math.max(minimumQuantity, Number(item.quantity || 0) + delta));
    renderCurrentCart();
};

window.setItemQuantity = (id, value) => {
    const item = findCartItem(id);
    const qty = parseInt(value);
    const minimumQuantity = (window.POS_EDIT_MODE || window.POS_RETURN_MODE) ? 0 : 1;
    const maximumQuantity = window.POS_RETURN_MODE ? Number(item?.maxReturnQuantity || item?.originalQuantity || 0) : Infinity;
    if (item && qty >= minimumQuantity) { item.quantity = Math.min(maximumQuantity, qty); renderCurrentCart(); }
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
window.clearCart = () => { if (cart.length === 0) return; if (confirm("Xóa toàn bộ giỏ hàng?")) { cart = []; renderCurrentCart(); } };

window.addQuickDose = (price) => {
    const quickDoseProduct = findQuickDoseProduct(price);
    if (quickDoseProduct) { addProductToCart(quickDoseProduct); renderCurrentCart(); return; }
    cart.push({
        cartId: createCartId('dose'),
        id: null,
        productId: null,
        batchId: null,
        code: `DOSE-${price}`,
        name: `Thuốc liều ${(price/1000).toLocaleString('vi-VN')}k`,
        unit: 'Liều',
        price: price,
        conversionRate: 1,
        quantity: 1,
        quickDosePrice: price,
        units: [{ unit_name: 'Liều', retail_price: price }]
    });
    renderCurrentCart();
};

window.addCustomDose = () => { const price = parseInt(prompt("Nhập giá liều (VD: 30000):") || '0'); if (price > 0) window.addQuickDose(price); };
window.quickCash = (amount) => { const input = document.getElementById('amountReceived'); if (input) { input.value = amount; updateChange(); } };

window.processPayment = async () => {
    cart = mergeDuplicateProductRows(cart);
    if (cart.length === 0) { alert('Giỏ hàng trống!'); return; }
    const totalFinalEl = document.getElementById('totalFinalDisplay');
    const total = parseInt(totalFinalEl?.textContent.replace(/[^0-9]/g, '') || '0');
    const amountReceived = parseInt(document.getElementById('amountReceived')?.value || '0');
    const discount = parseInt(document.getElementById('discountAmount')?.value || '0') || 0;
    const payableItems = cart.filter(item => Number(item.quantity || 0) > 0);

    if (!window.POS_EDIT_MODE && payableItems.length === 0) { alert(window.POS_RETURN_MODE ? 'Chưa chọn sản phẩm cần trả!' : 'Giỏ hàng không có sản phẩm cần thanh toán!'); return; }
    if (!window.POS_RETURN_MODE && amountReceived < total) { alert('Tiền khách đưa chưa đủ!'); return; }

    const btn = document.querySelector('[data-action="process-payment"]');
    const originalButtonHtml = btn?.innerHTML;
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="text-sm font-bold">Đang lưu hóa đơn...</span>'; }

    try {
        const subtotal = payableItems.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)), 0);
        const orderPayload = {
            customerName: document.getElementById('customerName')?.value.trim() || 'Khách lẻ',
            customerPhone: document.getElementById('customerPhone')?.value.trim() || null,
            subtotal, discount, total, amountReceived,
            changeAmount: Math.max(0, amountReceived - total),
            note: document.getElementById('orderNote')?.value.trim() || null,
        };

        const order = window.POS_RETURN_MODE ? await createReturnOrder(returnOrder, orderPayload, cart) : (window.POS_EDIT_MODE ? await replaceOrder(editingOrderId, orderPayload, cart) : await createOrder(orderPayload, cart));
        showSuccessModal(order.order_code);
        cart = [];
        renderCurrentCart();
    } catch (err) {
        console.error('Lỗi lưu hóa đơn:', err);
        alert('Không thể lưu hóa đơn: ' + err.message);
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = originalButtonHtml; }
    }
};

// ... (Các hàm còn lại giữ nguyên)
window.saveDraft = () => { alert("Tính năng lưu đơn nháp sẽ ra mắt sớm!"); };
window.printBill = () => { window.print(); };
window.closeSuccessModal = closeSuccessModal;
window.toggleAI = () => { const panel = document.getElementById('aiAssistant'); const icon = document.getElementById('aiToggleIcon'); if (panel) { const isCollapsed = panel.classList.toggle('collapsed'); if (icon) icon.className = `fa-solid ${isCollapsed ? 'fa-chevron-up' : 'fa-chevron-down'} transition-transform duration-300`; } };

function setupPOSEventListeners() {
    document.addEventListener('click', (event) => {
        const productButton = event.target.closest('[data-product-code]');
        if (productButton) { window.selectProduct(productButton.dataset.productCode); return; }
        const quantityButton = event.target.closest('[data-quantity-delta]');
        if (quantityButton) { window.updateQuantity(quantityButton.dataset.itemId, parseInt(quantityButton.dataset.quantityDelta, 10)); return; }
        const removeButton = event.target.closest('[data-remove-item-id]');
        if (removeButton) { window.removeFromCart(removeButton.dataset.removeItemId); return; }
        const quickDoseButton = event.target.closest('[data-quick-dose]');
        if (quickDoseButton) { window.addQuickDose(parseInt(quickDoseButton.dataset.quickDose, 10)); return; }
        const quickProductButton = event.target.closest('[data-quick-product-code]');
        if (quickProductButton) { window.selectProduct(quickProductButton.dataset.quickProductCode); return; }
        const quickCashButton = event.target.closest('[data-quick-cash]');
        if (quickCashButton) { window.quickCash(parseInt(quickCashButton.dataset.quickCash, 10)); return; }
        const actionButton = event.target.closest('[data-action]');
        if (!actionButton) return;
        const actionMap = {
            'add-custom-dose': () => window.addCustomDose(),
            'clear-cart': () => window.clearCart(),
            'toggle-ai': () => window.toggleAI(),
            'save-draft': () => window.saveDraft(),
            'process-payment': () => window.processPayment(),
            'close-success-modal': () => window.closeSuccessModal(),
            'configure-quick-products': () => openQuickProductModal(),
            'close-quick-products': () => closeQuickProductModal(),
            'save-quick-products': () => saveQuickProductConfig(),
            'reset-quick-products': () => resetQuickProductConfig(),
            'print-bill': () => window.printBill()
        };
        const handler = actionMap[actionButton.dataset.action];
        if (handler) handler();
    });
    document.addEventListener('change', (event) => {
        const target = event.target;
        if (target.classList.contains('cart-unit-select')) { window.updateItemUnit(target.dataset.itemId, target.value); return; }
        if (target.classList.contains('cart-quantity-input')) { window.setItemQuantity(target.dataset.itemId, target.value); }
    });
    document.getElementById('discountAmount')?.addEventListener('input', () => renderCurrentCart());
}

function buildCartFromOrder(order) {
    const orderCart = (order.items || []).map((item) => {
        const product = allProducts.find(p => normalizeKey(p.id) === normalizeKey(item.product_id) || normalizeKey(p.product_code) === normalizeKey(item.product_code));
        const units = product?.product_units?.length ? product.product_units : [{ unit_name: item.unit_name, retail_price: item.unit_price }];
        return {
            cartId: createCartId('item'),
            id: item.product_id || null,
            productId: item.product_id || null,
            batchId: item.batch_id || null,
            code: item.product_code || 'MANUAL',
            name: item.product_name,
            unit: item.unit_name,
            price: item.unit_price,
            conversionRate: units.find(u => u.unit_name === item.unit_name)?.conversion_rate || 1,
            quantity: item.quantity,
            units
        };
    });
    return mergeDuplicateProductRows(orderCart);
}

function buildReturnCartFromOrder(order) {
    return (order.items || []).filter(item => Number(item.quantity || 0) > 0).map((item) => {
        const product = allProducts.find(p => normalizeKey(p.id) === normalizeKey(item.product_id) || normalizeKey(p.product_code) === normalizeKey(item.product_code));
        const units = product?.product_units?.length ? product.product_units : [{ unit_name: item.unit_name, retail_price: item.unit_price }];
        return {
            cartId: createCartId('return'),
            id: item.product_id || null,
            productId: item.product_id || null,
            batchId: item.batch_id || null,
            code: item.product_code || 'MANUAL',
            name: item.product_name,
            unit: item.unit_name,
            price: item.unit_price,
            conversionRate: units.find(u => u.unit_name === item.unit_name)?.conversion_rate || 1,
            quantity: 0,
            originalQuantity: item.quantity,
            maxReturnQuantity: item.quantity,
            units
        };
    });
}

async function loadOrderForEdit() { if (!editingOrderId) return; try { editingOrder = await fetchOrderDetail(editingOrderId); if (editingOrder.status === 'cancelled') { alert('Không thể chỉnh sửa hóa đơn đã hủy.'); window.location.href = 'invoices.html'; return; } cart = buildCartFromOrder(editingOrder); document.getElementById('customerName').value = editingOrder.customer_name || ''; document.getElementById('customerPhone').value = editingOrder.customer_phone || ''; document.getElementById('discountAmount').value = editingOrder.discount || 0; document.getElementById('amountReceived').value = editingOrder.amount_received || 0; document.getElementById('orderNote').value = editingOrder.note || ''; applyEditModeUI(editingOrder); renderCurrentCart(); } catch (err) { console.error('Lỗi tải hóa đơn để chỉnh sửa:', err); alert('Không thể tải hóa đơn để chỉnh sửa: ' + err.message); window.location.href = 'invoices.html'; } }
async function loadOrderForReturn() { if (!returnOrderId) return; try { returnOrder = await fetchOrderDetail(returnOrderId); if (returnOrder.status === 'cancelled') { alert('Không thể trả hàng từ hóa đơn đã hủy.'); window.location.href = 'invoices.html'; return; } cart = buildReturnCartFromOrder(returnOrder); document.getElementById('customerName').value = returnOrder.customer_name || ''; document.getElementById('customerPhone').value = returnOrder.customer_phone || ''; document.getElementById('discountAmount').value = 0; document.getElementById('orderNote').value = `Tra hang tu hoa don ${returnOrder.order_code}`; applyReturnModeUI(returnOrder); renderCurrentCart(); } catch (err) { console.error('Lỗi tải hóa đơn để trả hàng:', err); alert('Không thể tải hóa đơn để trả hàng: ' + err.message); window.location.href = 'invoices.html'; } }

document.addEventListener('DOMContentLoaded', async () => {
    initLayout('pos');
    setupPOSEventListeners();
    renderQuickActions();
    const searchInput = document.getElementById('posSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            const suggestionsEl = document.getElementById('posSearchSuggestions');
            if (!query) { if (suggestionsEl) suggestionsEl.classList.add('hidden'); return; }
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const results = allProducts.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || (p.product_code || '').toLowerCase().includes(query.toLowerCase())).slice(0, 20);
                renderPOSSearchResults(results);
            }, 250);
        });
        document.addEventListener('click', (e) => { if (!searchInput.contains(e.target)) { const s = document.getElementById('posSearchSuggestions'); if (s) s.classList.add('hidden'); } });
    }
    const amountInput = document.getElementById('amountReceived');
    if (amountInput) amountInput.addEventListener('input', () => updateChange());
    setInterval(() => { const timeEl = document.getElementById('posTime'); if (timeEl) timeEl.textContent = new Date().toLocaleTimeString('vi-VN'); }, 1000);
    try { allProducts = await fetchProducts(); renderQuickActions(); console.log(`✅ POS sẵn sàng, đã tải ${allProducts.length} sản phẩm.`); } catch (err) { console.warn("⚠️ Không thể tải dữ liệu sản phẩm:", err.message); }
    await loadOrderForEdit();
    await loadOrderForReturn();
});
function ensureQuickProductModal() { if (document.getElementById('quickProductModal')) return; const modal = document.createElement('div'); modal.id = 'quickProductModal'; modal.className = 'fixed inset-0 z-[100] hidden items-center justify-center bg-slate-900/60 p-4'; modal.innerHTML = `<div class="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"><div class="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between"><h3 class="font-black text-slate-800 dark:text-white">Tùy chọn sản phẩm chọn nhanh</h3><button data-action="close-quick-products" class="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500"><i class="fa-solid fa-xmark"></i></button></div><div class="p-4"><input id="quickProductSearch" type="text" placeholder="Tìm tên hàng hoặc mã hàng..." class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"><div id="quickProductList" class="mt-4 max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800"></div></div><div class="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3"><button data-action="reset-quick-products" class="${quickButtonClass('slate')}">Dùng liều mặc định</button><button data-action="save-quick-products" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors">Lưu chọn nhanh</button></div></div>`; document.body.appendChild(modal); document.getElementById('quickProductSearch')?.addEventListener('input', renderQuickProductPicker); document.getElementById('quickProductList')?.addEventListener('change', (event) => { if (!event.target.classList.contains('quick-product-checkbox')) return; const code = normalizeKey(event.target.value); if (!code) return; if (event.target.checked) { pendingQuickProductCodes.add(code); } else { pendingQuickProductCodes.delete(code); } }); }
function renderQuickProductPicker() { const list = document.getElementById('quickProductList'); const search = normalizeKey(document.getElementById('quickProductSearch')?.value || ''); if (!list) return; const matchedProducts = allProducts.filter(product => { const haystack = normalizeKey(`${product.name || ''} ${product.product_code || ''}`); return !search || haystack.includes(search); }).slice(0, 80); list.innerHTML = matchedProducts.map(product => { const baseUnit = getBaseUnit(product); const checked = pendingQuickProductCodes.has(normalizeKey(product.product_code)) ? 'checked' : ''; return `<label class="flex items-center justify-between gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"><div class="min-w-0"><div class="font-bold text-slate-800 dark:text-slate-100 truncate">${product.name || ''}</div><div class="text-xs text-slate-500">${product.product_code || ''} - ${baseUnit.unit_name || 'N/A'} - ${new Intl.NumberFormat('vi-VN').format(baseUnit.retail_price || 0)}đ</div></div><input type="checkbox" class="quick-product-checkbox w-5 h-5 accent-blue-600" value="${product.product_code || ''}" ${checked}></label>`; }).join(''); }
function openQuickProductModal() { ensureQuickProductModal(); pendingQuickProductCodes = new Set(getQuickProductCodes().map(normalizeKey)); renderQuickProductPicker(); document.getElementById('quickProductModal')?.classList.remove('hidden'); document.getElementById('quickProductModal')?.classList.add('flex'); }
function closeQuickProductModal() { document.getElementById('quickProductModal')?.classList.add('hidden'); document.getElementById('quickProductModal')?.classList.remove('flex'); }
function saveQuickProductConfig() { setQuickProductCodes([...pendingQuickProductCodes]); renderQuickActions(); closeQuickProductModal(); }
function resetQuickProductConfig() { localStorage.removeItem(QUICK_PRODUCTS_STORAGE_KEY); renderQuickActions(); closeQuickProductModal(); }
function applyEditModeUI(order) { const banner = document.getElementById('posEditModeBanner'); const title = document.getElementById('posEditModeTitle'); if (banner) { if (title) title.textContent = `Đang chỉnh sửa hóa đơn ${order.order_code}`; banner.classList.remove('hidden'); } const paymentButton = document.querySelector('[data-action="process-payment"]'); if (paymentButton) { paymentButton.classList.remove('bg-blue-600', 'hover:bg-blue-700', 'shadow-blue-500/30'); paymentButton.classList.add('bg-amber-600', 'hover:bg-amber-700', 'shadow-amber-500/30'); paymentButton.innerHTML = `<div class="absolute inset-0 bg-gradient-to-r from-amber-300/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div><span class="text-[10px] uppercase font-bold opacity-70 mb-0.5">Chỉnh sửa hóa đơn</span><div class="flex items-center gap-2"><i class="fa-solid fa-floppy-disk"></i> CẬP NHẬT</div>`; } }
function applyReturnModeUI(order) { const banner = document.getElementById('posEditModeBanner'); const title = document.getElementById('posEditModeTitle'); if (banner) { if (title) title.textContent = `Đang trả hàng hóa đơn ${order.order_code}`; banner.classList.remove('hidden', 'bg-amber-600', 'border-amber-500', 'shadow-amber-500/20'); banner.classList.add('bg-emerald-600', 'border-emerald-500', 'shadow-emerald-500/20'); } const paymentButton = document.querySelector('[data-action="process-payment"]'); if (paymentButton) { paymentButton.classList.remove('bg-blue-600', 'hover:bg-blue-700', 'shadow-blue-500/30'); paymentButton.classList.add('bg-emerald-600', 'hover:bg-emerald-700', 'shadow-emerald-500/30'); paymentButton.innerHTML = `<div class="absolute inset-0 bg-gradient-to-r from-emerald-300/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div><span class="text-[10px] uppercase font-bold opacity-70 mb-0.5">Trả hàng</span><div class="flex items-center gap-2"><i class="fa-solid fa-rotate-left"></i> HOÀN TẤT TRẢ</div>`; } const amountInput = document.getElementById('amountReceived'); if (amountInput) { amountInput.value = 0; amountInput.disabled = true; } document.getElementById('quickActions')?.classList.add('hidden'); }
