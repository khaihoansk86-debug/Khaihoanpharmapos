// js/features/pos/posController.js
import { fetchProducts } from '../products/productService.js';
import { initLayout } from '../../components/layout.js';
import { renderPOSSearchResults, renderCart, updateChange, showSuccessModal, closeSuccessModal, renderBatchPicker } from './posUI.js';
import { createOrder, createReturnOrder, fetchOrderDetail, replaceOrder, getAvailableBatches } from './orderService.js';

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

function normalizeKey(value) { return value == null ? '' : String(value).trim().toUpperCase(); }
function createCartId(prefix = 'cart') { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function findCartItem(cartId) { return cart.find(item => item.cartId === String(cartId)); }

function findExistingProductIndex(product) {
    const productId = normalizeKey(product.id);
    const productCode = normalizeKey(product.product_code);
    return cart.findIndex(item => {
        const itemId = normalizeKey(item.id);
        const itemCode = normalizeKey(item.code);
        return (productId && itemId === productId) || (productCode && itemCode === productCode);
    });
}

function renderCurrentCart() {
    // Không gộp dòng tự động nữa để nhân viên có thể chọn các lô khác nhau cho cùng 1 sản phẩm nếu cần
    renderCart(cart);
}

function getBaseUnit(product) { return product.product_units?.find(u => u.is_base_unit) || product.product_units?.[0] || {}; }

async function addProductToCart(product) {
    if (window.POS_RETURN_MODE) {
        const existingIndex = findExistingProductIndex(product);
        if (existingIndex > -1) {
            const item = cart[existingIndex];
            const maxQuantity = Number(item.maxReturnQuantity || item.originalQuantity || 0);
            item.quantity = Math.min(maxQuantity, Number(item.quantity || 0) + 1);
            return;
        }
        alert('Chỉ có thể trả hàng nằm trong hóa đơn gốc.'); return;
    }

    const baseUnit = getBaseUnit(product);
    
    // Tìm các lô khả dụng
    let batches = [];
    try { batches = await getAvailableBatches(product.id); } catch (err) { console.error("Lỗi lấy lô:", err); }
    
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
        batchNo: oldestBatch?.batch_no || 'Chưa chọn lô',
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
    const minimumQuantity = (window.POS_EDIT_MODE || window.POS_RETURN_MODE) ? 0 : 1;
    const maximumQuantity = window.POS_RETURN_MODE ? Number(item.maxReturnQuantity || item.originalQuantity || 0) : Infinity;
    item.quantity = Math.min(maximumQuantity, Math.max(minimumQuantity, Number(item.quantity || 0) + delta));
    renderCurrentCart();
};

window.setItemQuantity = (id, value) => {
    const item = findCartItem(id);
    const qty = parseInt(value);
    const min = (window.POS_EDIT_MODE || window.POS_RETURN_MODE) ? 0 : 1;
    const max = window.POS_RETURN_MODE ? Number(item?.maxReturnQuantity || item?.originalQuantity || 0) : Infinity;
    if (item && qty >= min) { item.quantity = Math.min(max, qty); renderCurrentCart(); }
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

// --- BATCH PICKER LOGIC ---
window.openBatchPicker = (cartId) => {
    const item = findCartItem(cartId);
    if (!item || !item.batches || item.batches.length === 0) {
        alert("Sản phẩm này không có thông tin lô hàng khả dụng.");
        return;
    }
    renderBatchPicker(item);
};

window.selectBatchForItem = (cartId, batchId) => {
    const item = findCartItem(cartId);
    if (!item) return;
    const batch = item.batches.find(b => String(b.id) === String(batchId));
    if (batch) {
        item.batchId = batch.id;
        item.batchNo = batch.batch_no || '---';
        item.expiryDate = batch.expiry_date || null;
        renderCurrentCart();
        // Close modal
        document.getElementById('batchPickerModal')?.classList.add('hidden');
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
    const amountReceived = parseInt(document.getElementById('amountReceived')?.value || '0');
    const discount = parseInt(document.getElementById('discountAmount')?.value || '0') || 0;
    const payableItems = cart.filter(item => Number(item.quantity || 0) > 0);

    if (!window.POS_EDIT_MODE && payableItems.length === 0) { alert('Giỏ hàng trống!'); return; }
    if (!window.POS_RETURN_MODE && amountReceived < total) { alert('Tiền khách đưa chưa đủ!'); return; }

    const btn = document.querySelector('[data-action="process-payment"]');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span>Đang lưu...</span>'; }

    try {
        const orderPayload = {
            customerName: document.getElementById('customerName')?.value.trim() || 'Khách lẻ',
            customerPhone: document.getElementById('customerPhone')?.value.trim() || null,
            subtotal: payableItems.reduce((sum, i) => sum + (i.price * i.quantity), 0),
            discount, total, amountReceived, note: document.getElementById('orderNote')?.value.trim() || null,
        };

        const order = window.POS_RETURN_MODE ? await createReturnOrder(returnOrder, orderPayload, cart) : (window.POS_EDIT_MODE ? await replaceOrder(editingOrderId, orderPayload, cart) : await createOrder(orderPayload, cart));
        showSuccessModal(order.order_code); cart = []; renderCurrentCart();
    } catch (err) { alert('Lỗi: ' + err.message); } finally { if (btn) { btn.disabled = false; btn.innerHTML = 'THANH TOÁN'; } }
};

document.addEventListener('DOMContentLoaded', async () => {
    initLayout('pos');
    try { allProducts = await fetchProducts(); console.log(`POS ready: ${allProducts.length} items`); } catch (err) { console.warn(err); }
    if (editingOrderId) await loadOrderForEdit();
    if (returnOrderId) await loadOrderForReturn();
    setInterval(() => { const t = document.getElementById('posTime'); if (t) t.textContent = new Date().toLocaleTimeString('vi-VN'); }, 1000);
});
async function loadOrderForEdit() { try { editingOrder = await fetchOrderDetail(editingOrderId); cart = (editingOrder.items || []).map(i => ({ cartId: createCartId('item'), id: i.product_id, productId: i.product_id, code: i.product_code, name: i.product_name, unit: i.unit_name, price: i.unit_price, quantity: i.quantity, units: [{unit_name: i.unit_name, retail_price: i.unit_price}], batchId: i.batch_id, batchNo: i.batch_no || '---', expiryDate: i.expiry_date })); renderCurrentCart(); } catch(err){ console.error(err); } }
async function loadOrderForReturn() { try { returnOrder = await fetchOrderDetail(returnOrderId); cart = (returnOrder.items || []).map(i => ({ cartId: createCartId('return'), id: i.product_id, productId: i.product_id, code: i.product_code, name: i.product_name, unit: i.unit_name, price: i.unit_price, quantity: 0, originalQuantity: i.quantity, maxReturnQuantity: i.quantity, units: [{unit_name: i.unit_name, retail_price: i.unit_price}], batchId: i.batch_id, batchNo: i.batch_no || '---', expiryDate: i.expiry_date })); renderCurrentCart(); } catch(err){ console.error(err); } }
