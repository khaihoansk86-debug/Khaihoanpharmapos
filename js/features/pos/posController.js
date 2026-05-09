// js/features/pos/posController.js
import { fetchProducts } from '../products/productService.js';
import { initLayout } from '../../components/layout.js';
import { renderPOSSearchResults, renderCart, updateChange, showSuccessModal, closeSuccessModal } from './posUI.js';
import { createOrder, fetchOrderDetail, replaceOrder } from './orderService.js';

let allProducts = [];
let cart = [];
let searchTimeout = null;
let editingOrder = null;
let editingOrderId = new URLSearchParams(window.location.search).get('editOrder');
window.POS_EDIT_MODE = Boolean(editingOrderId);

function makeLineId(prefix = 'line') {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function findCartItem(lineId) {
    return cart.find(item => String(item.lineId ?? item.id) === String(lineId));
}

// =============================================
// 1. ĐĂNG KÝ CÁC HÀM TOÀN CỤC (GLOBAL)
//    Phải đăng ký TRƯỚC khi DOM load xong
//    để onclick= trong HTML có thể gọi được
// =============================================
window.selectProduct = (productCode) => {
    const product = allProducts.find(p => p.product_code === productCode);
    if (!product) return;

    const baseUnit = product.product_units?.find(u => u.is_base_unit) || product.product_units?.[0] || {};
    const existingIndex = cart.findIndex(item => item.id === product.id);
    if (existingIndex > -1) {
        cart[existingIndex].quantity += 1;
    } else {
        cart.push({
            lineId: product.id,
            id: product.id,
            code: product.product_code,
            name: product.name,
            unit: baseUnit.unit_name || 'N/A',
            price: baseUnit.retail_price || 0,
            quantity: 1,
            units: product.product_units || []
        });
    }
    renderCart(cart);
    const sugg = document.getElementById('posSearchSuggestions');
    const inp = document.getElementById('posSearchInput');
    if (sugg) sugg.classList.add('hidden');
    if (inp) inp.value = '';
};

window.updateQuantity = (id, delta) => {
    const item = findCartItem(id);
    const minimumQuantity = window.POS_EDIT_MODE ? 0 : 1;
    if (item) { item.quantity = Math.max(minimumQuantity, item.quantity + delta); renderCart(cart); }
};

window.setItemQuantity = (id, value) => {
    const item = findCartItem(id);
    const qty = parseInt(value);
    const minimumQuantity = window.POS_EDIT_MODE ? 0 : 1;
    if (item && qty >= minimumQuantity) { item.quantity = qty; renderCart(cart); }
};

window.updateItemUnit = (id, unitName) => {
    const item = findCartItem(id);
    if (item) {
        const selectedUnit = item.units.find(u => u.unit_name === unitName);
        if (selectedUnit) { item.unit = unitName; item.price = selectedUnit.retail_price || 0; renderCart(cart); }
    }
};

window.removeFromCart = (id) => {
    cart = cart.filter(i => String(i.lineId ?? i.id) !== String(id));
    renderCart(cart);
};

window.clearCart = () => {
    if (cart.length === 0) return;
    if (confirm("Xóa toàn bộ giỏ hàng?")) { cart = []; renderCart(cart); }
};

window.addQuickDose = (price) => {
    cart.push({
        lineId: makeLineId('dose'),
        id: null,           // null = không có trong DB, orderService sẽ bỏ qua khi trừ tồn kho
        batchId: null,
        code: 'DOSE',
        name: `Thuốc liều ${(price/1000).toLocaleString('vi-VN')}k`,
        unit: 'Liều',
        price: price,
        quantity: 1,
        units: [{ unit_name: 'Liều', retail_price: price }]
    });
    renderCart(cart);
};

window.addCustomDose = () => {
    const price = parseInt(prompt("Nhập giá liều (VD: 30000):") || '0');
    if (price > 0) window.addQuickDose(price);
};

window.quickCash = (amount) => {
    const input = document.getElementById('amountReceived');
    if (input) { input.value = amount; updateChange(); }
};

window.processPayment = async () => {
    if (cart.length === 0) { alert('Giỏ hàng trống!'); return; }

    const totalFinalEl = document.getElementById('totalFinalDisplay');
    const total        = parseInt(totalFinalEl?.textContent.replace(/[^0-9]/g, '') || '0');
    const amountReceived = parseInt(document.getElementById('amountReceived')?.value || '0');
    const discount = parseInt(document.getElementById('discountAmount')?.value || '0') || 0;
    const payableItems = cart.filter(item => Number(item.quantity || 0) > 0);

    if (!window.POS_EDIT_MODE && payableItems.length === 0) {
        alert('Giỏ hàng không có sản phẩm cần thanh toán!');
        return;
    }

    if (amountReceived < total) {
        alert('Tiền khách đưa chưa đủ!');
        return;
    }

    const btn = document.querySelector('[data-action="process-payment"]');
    if (btn) { btn.disabled = true; btn.textContent = window.POS_EDIT_MODE ? 'Đang cập nhật...' : 'Đang lưu...'; }

    try {
        const subtotal = payableItems.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)), 0);
        const orderPayload = {
            customerName:     document.getElementById('customerName')?.value.trim() || 'Khách lẻ',
            customerPhone:    document.getElementById('customerPhone')?.value.trim() || null,
            subtotal,
            discount,
            total,
            amountReceived,
            changeAmount:     Math.max(0, amountReceived - total),
            note:             document.getElementById('orderNote')?.value.trim() || null,
        };

        const order = window.POS_EDIT_MODE
            ? await replaceOrder(editingOrderId, orderPayload, cart)
            : await createOrder(orderPayload, cart);

        showSuccessModal(order.order_code);
        cart = [];
        renderCart(cart);
    } catch (err) {
        console.error('Lỗi lưu hóa đơn:', err);
        alert('Không thể lưu hóa đơn: ' + err.message);
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = window.POS_EDIT_MODE ? 'Cập nhật hóa đơn' : 'Thanh toán'; }
    }
};

window.saveDraft = () => { alert("Tính năng lưu đơn nháp sẽ ra mắt sớm!"); };
window.printBill = () => { window.print(); };
window.closeSuccessModal = closeSuccessModal;

window.toggleAI = () => {
    const panel = document.getElementById('aiAssistant');
    const icon = document.getElementById('aiToggleIcon');
    if (panel) {
        const isCollapsed = panel.classList.toggle('collapsed');
        if (icon) icon.className = `fa-solid ${isCollapsed ? 'fa-chevron-up' : 'fa-chevron-down'} transition-transform duration-300`;
    }
};

// =============================================
// 2. KHỞI TẠO KHI DOM SẴN SÀNG
// =============================================
function setupPOSEventListeners() {
    document.addEventListener('click', (event) => {
        const productButton = event.target.closest('[data-product-code]');
        if (productButton) {
            window.selectProduct(productButton.dataset.productCode);
            return;
        }

        const quantityButton = event.target.closest('[data-quantity-delta]');
        if (quantityButton) {
            window.updateQuantity(quantityButton.dataset.itemId, parseInt(quantityButton.dataset.quantityDelta, 10));
            return;
        }

        const removeButton = event.target.closest('[data-remove-item-id]');
        if (removeButton) {
            window.removeFromCart(removeButton.dataset.removeItemId);
            return;
        }

        const quickDoseButton = event.target.closest('[data-quick-dose]');
        if (quickDoseButton) {
            window.addQuickDose(parseInt(quickDoseButton.dataset.quickDose, 10));
            return;
        }

        const quickCashButton = event.target.closest('[data-quick-cash]');
        if (quickCashButton) {
            window.quickCash(parseInt(quickCashButton.dataset.quickCash, 10));
            return;
        }

        const actionButton = event.target.closest('[data-action]');
        if (!actionButton) return;

        const actionMap = {
            'add-custom-dose': () => window.addCustomDose(),
            'clear-cart': () => window.clearCart(),
            'toggle-ai': () => window.toggleAI(),
            'save-draft': () => window.saveDraft(),
            'process-payment': () => window.processPayment(),
            'close-success-modal': () => window.closeSuccessModal(),
            'print-bill': () => window.printBill()
        };

        const handler = actionMap[actionButton.dataset.action];
        if (handler) handler();
    });

    document.addEventListener('change', (event) => {
        const target = event.target;
        if (target.classList.contains('cart-unit-select')) {
            window.updateItemUnit(target.dataset.itemId, target.value);
            return;
        }
        if (target.classList.contains('cart-quantity-input')) {
            window.setItemQuantity(target.dataset.itemId, target.value);
        }
    });

    document.getElementById('discountAmount')?.addEventListener('input', () => renderCart(cart));
}

function applyEditModeUI(order) {
    const banner = document.getElementById('posEditModeBanner');
    const title = document.getElementById('posEditModeTitle');
    if (banner) {
        if (title) title.textContent = `Dang chinh sua hoa don ${order.order_code}`;
        banner.classList.remove('hidden');
    }

    const paymentButton = document.querySelector('[data-action="process-payment"]');
    if (paymentButton) {
        paymentButton.classList.remove('bg-blue-600', 'hover:bg-blue-700', 'shadow-blue-500/30');
        paymentButton.classList.add('bg-amber-600', 'hover:bg-amber-700', 'shadow-amber-500/30');
        paymentButton.innerHTML = `
            <div class="absolute inset-0 bg-gradient-to-r from-amber-300/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <span class="text-[10px] uppercase font-bold opacity-70 mb-0.5">Chỉnh sửa hóa đơn</span>
            <div class="flex items-center gap-2">
                <i class="fa-solid fa-floppy-disk"></i> CẬP NHẬT
            </div>
        `;
    }
}

function buildCartFromOrder(order) {
    return (order.items || []).map((item) => {
        const product = allProducts.find(p => p.id === item.product_id || p.product_code === item.product_code);
        const units = product?.product_units?.length
            ? product.product_units
            : [{ unit_name: item.unit_name, retail_price: item.unit_price }];

        return {
            lineId: item.product_id || `order-item-${item.id}`,
            id: item.product_id || null,
            batchId: item.batch_id || null,
            code: item.product_code || 'MANUAL',
            name: item.product_name,
            unit: item.unit_name,
            price: item.unit_price,
            quantity: item.quantity,
            units
        };
    });
}

async function loadOrderForEdit() {
    if (!editingOrderId) return;

    try {
        editingOrder = await fetchOrderDetail(editingOrderId);
        if (editingOrder.status === 'cancelled') {
            alert('Không thể chỉnh sửa hóa đơn đã hủy.');
            window.location.href = 'invoices.html';
            return;
        }

        cart = buildCartFromOrder(editingOrder);
        document.getElementById('customerName').value = editingOrder.customer_name || '';
        document.getElementById('customerPhone').value = editingOrder.customer_phone || '';
        document.getElementById('discountAmount').value = editingOrder.discount || 0;
        document.getElementById('amountReceived').value = editingOrder.amount_received || 0;
        document.getElementById('orderNote').value = editingOrder.note || '';

        applyEditModeUI(editingOrder);
        renderCart(cart);
    } catch (err) {
        console.error('Lỗi tải hóa đơn để chỉnh sửa:', err);
        alert('Không thể tải hóa đơn để chỉnh sửa: ' + err.message);
        window.location.href = 'invoices.html';
    }
}
document.addEventListener('DOMContentLoaded', async () => {
    // Render Header POS tối giản
    initLayout('pos');
    setupPOSEventListeners();

    // Thiết lập ô tìm kiếm
    const searchInput = document.getElementById('posSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            const suggestionsEl = document.getElementById('posSearchSuggestions');
            if (!query) { if (suggestionsEl) suggestionsEl.classList.add('hidden'); return; }
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const results = allProducts.filter(p =>
                    p.name.toLowerCase().includes(query.toLowerCase()) ||
                    (p.product_code || '').toLowerCase().includes(query.toLowerCase())
                ).slice(0, 20);
                renderPOSSearchResults(results);
            }, 250);
        });
        // Bấm ngoài thì đóng dropdown
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target)) {
                const s = document.getElementById('posSearchSuggestions');
                if (s) s.classList.add('hidden');
            }
        });
    }

    // Thiết lập tiền khách đưa
    const amountInput = document.getElementById('amountReceived');
    if (amountInput) amountInput.addEventListener('input', () => updateChange());

    // Đồng hồ thời gian thực
    setInterval(() => {
        const timeEl = document.getElementById('posTime');
        if (timeEl) timeEl.textContent = new Date().toLocaleTimeString('vi-VN');
    }, 1000);

    // Tải dữ liệu sản phẩm (async, không block UI)
    try {
        allProducts = await fetchProducts();
        console.log(`✅ POS sẵn sàng, đã tải ${allProducts.length} sản phẩm.`);
    } catch (err) {
        console.warn("⚠️ Không thể tải dữ liệu sản phẩm:", err.message);
    }

    await loadOrderForEdit();
});

