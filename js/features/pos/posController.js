// js/features/pos/posController.js
import { fetchProducts } from '../products/productService.js';
import { initLayout } from '../../components/layout.js';
import { renderPOSSearchResults, renderCart, updateChange, showSuccessModal, closeSuccessModal } from './posUI.js';

let allProducts = [];
let cart = [];
let searchTimeout = null;

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
    const item = cart.find(i => i.id === id);
    if (item) { item.quantity = Math.max(1, item.quantity + delta); renderCart(cart); }
};

window.setItemQuantity = (id, value) => {
    const item = cart.find(i => i.id === id);
    const qty = parseInt(value);
    if (item && qty > 0) { item.quantity = qty; renderCart(cart); }
};

window.updateItemUnit = (id, unitName) => {
    const item = cart.find(i => i.id === id);
    if (item) {
        const selectedUnit = item.units.find(u => u.unit_name === unitName);
        if (selectedUnit) { item.unit = unitName; item.price = selectedUnit.retail_price || 0; renderCart(cart); }
    }
};

window.removeFromCart = (id) => {
    cart = cart.filter(i => i.id !== id);
    renderCart(cart);
};

window.clearCart = () => {
    if (cart.length === 0) return;
    if (confirm("Xóa toàn bộ giỏ hàng?")) { cart = []; renderCart(cart); }
};

window.addQuickDose = (price) => {
    cart.push({
        id: 'dose-' + Date.now(),
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

window.processPayment = () => {
    if (cart.length === 0) { alert("Giỏ hàng trống!"); return; }
    const orderCode = 'DH' + Date.now().toString().slice(-6);
    showSuccessModal(orderCode);
    cart = [];
    renderCart(cart);
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
});

