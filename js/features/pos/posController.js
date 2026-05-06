// js/features/pos/posController.js
import { fetchProducts } from '../products/productService.js';
import { renderHeader } from '../../components/layout.js';
import { renderPOSSearchResults, renderCart, updateChange, showSuccessModal, closeSuccessModal } from './posUI.js';

let allProducts = [];
let cart = [];
let searchTimeout = null;

/**
 * Khởi tạo POS
 */
async function initPOS() {
    // Render Header
    const headerContainer = document.getElementById('app-header');
    if (headerContainer) {
        headerContainer.innerHTML = renderHeader('pos');
    }

    try {
        // Tải danh sách sản phẩm để tìm kiếm nhanh
        allProducts = await fetchProducts();
        console.log("POS loaded products:", allProducts.length);
    } catch (error) {
        console.error("Lỗi tải dữ liệu POS:", error);
    }

    setupEventListeners();
}

/**
 * Thiết lập các sự kiện
 */
function setupEventListeners() {
    const searchInput = document.getElementById('posSearchInput');
    const amountReceived = document.getElementById('amountReceived');

    // Tìm kiếm khi gõ
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        
        clearTimeout(searchTimeout);
        if (query.length < 1) {
            document.getElementById('posSearchSuggestions').classList.add('hidden');
            return;
        }

        searchTimeout = setTimeout(() => {
            const filtered = allProducts.filter(p => {
                const nameMatch = p.name && p.name.toLowerCase().includes(query);
                const codeMatch = p.product_code && p.product_code.toLowerCase().includes(query);
                const barcodeMatch = p.barcode && p.barcode.toLowerCase().includes(query);
                const ingredientMatch = p.active_ingredient && p.active_ingredient.toLowerCase().includes(query);
                
                return nameMatch || codeMatch || barcodeMatch || ingredientMatch;
            }).slice(0, 10);
            
            renderPOSSearchResults(filtered);
        }, 200);
    });

    // Tính tiền thừa khi nhập tiền khách đưa
    amountReceived.addEventListener('input', updateChange);

    // Phím tắt
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F2') {
            e.preventDefault();
            searchInput.focus();
        }
        if (e.key === 'F10') {
            e.preventDefault();
            window.processPayment();
        }
    });

    // Click ra ngoài đóng suggestions
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !document.getElementById('posSearchSuggestions').contains(e.target)) {
            document.getElementById('posSearchSuggestions').classList.add('hidden');
        }
    });
}

/**
 * Chọn sản phẩm từ danh sách gợi ý
 */
window.selectProduct = (productCode) => {
    const product = allProducts.find(p => p.product_code === productCode);
    if (!product) return;

    const existing = cart.find(item => item.code === productCode);
    if (existing) {
        existing.quantity += 1;
    } else {
        const baseUnit = product.product_units?.find(u => u.is_base_unit) || product.product_units?.[0] || {};
        cart.push({
            id: product.id,
            code: product.product_code,
            name: product.name,
            unit: baseUnit.unit_name || 'Đơn vị',
            price: baseUnit.retail_price || 0,
            quantity: 1,
            units: product.product_units || [] // Lưu danh sách đơn vị để chuyển đổi
        });
    }

    renderCart(cart);
    document.getElementById('posSearchSuggestions').classList.add('hidden');
    document.getElementById('posSearchInput').value = '';
    document.getElementById('posSearchInput').focus();
};

/**
 * Thêm nhanh thuốc liều với giá cố định
 */
window.addQuickDose = (price) => {
    const doseName = `Thuốc liều ${new Intl.NumberFormat('vi-VN').format(price)}đ`;
    const doseCode = `LIEU-${price}`;
    
    // Tìm xem trong giỏ đã có liều cùng giá này chưa
    const existing = cart.find(item => item.code === doseCode);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            id: 'dose-' + Date.now() + Math.floor(Math.random() * 1000),
            code: doseCode,
            name: doseName,
            unit: 'Liều',
            price: price,
            quantity: 1,
            units: [{ unit_name: 'Liều', retail_price: price, is_base_unit: true }]
        });
    }
    renderCart(cart);
};

/**
 * Nhập liều với giá tùy chỉnh
 */
window.addCustomDose = () => {
    const priceStr = prompt("Nhập giá tiền cho liều thuốc này (VNĐ):", "10000");
    const price = parseInt(priceStr);
    if (isNaN(price) || price <= 0) {
        if (priceStr !== null) alert("Giá tiền không hợp lệ!");
        return;
    }
    window.addQuickDose(price);
};

/**
 * Cập nhật số lượng
 */
window.updateQuantity = (productId, delta) => {
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            window.removeFromCart(productId);
        } else {
            renderCart(cart);
        }
    }
};

/**
 * Đặt số lượng cụ thể (dùng cho ô input)
 */
window.setItemQuantity = (productId, value) => {
    const item = cart.find(i => i.id === productId);
    if (item) {
        const qty = parseFloat(value);
        if (isNaN(qty) || qty <= 0) {
            window.removeFromCart(productId);
        } else {
            item.quantity = qty;
            renderCart(cart);
        }
    }
};

/**
 * Thay đổi đơn vị tính cho dòng hàng
 */
window.updateItemUnit = (productId, unitName) => {
    const item = cart.find(i => i.id === productId);
    if (item) {
        const unit = item.units.find(u => u.unit_name === unitName);
        if (unit) {
            item.unit = unit.unit_name;
            item.price = unit.retail_price;
            renderCart(cart);
        }
    }
};

/**
 * Chọn nhanh mệnh giá tiền khách đưa
 */
window.quickCash = (amount) => {
    const amountReceivedInput = document.getElementById('amountReceived');
    if (amountReceivedInput) {
        amountReceivedInput.value = amount;
        updateChange();
    }
};

/**
 * Xóa khỏi giỏ hàng
 */
window.removeFromCart = (productId) => {
    cart = cart.filter(i => i.id !== productId);
    renderCart(cart);
};

/**
 * Xóa sạch giỏ hàng
 */
window.clearCart = () => {
    if (confirm("Bạn có chắc chắn muốn hủy toàn bộ đơn hàng này?")) {
        cart = [];
        renderCart(cart);
    }
};

/**
 * Xử lý thanh toán
 */
window.processPayment = async () => {
    if (cart.length === 0) {
        alert("Chưa có sản phẩm nào để thanh toán!");
        return;
    }

    const totalFinalText = document.getElementById('totalFinalDisplay').textContent;
    const totalFinal = parseInt(totalFinalText.replace(/[^0-9]/g, '')) || 0;
    const amountReceived = parseInt(document.getElementById('amountReceived').value) || 0;

    if (amountReceived < totalFinal) {
        if (!confirm("Tiền khách đưa chưa đủ. Bạn vẫn muốn tiếp tục thanh toán?")) {
            return;
        }
    }

    // Ở đây sẽ là logic lưu vào Database (Orders, OrderItems, Update Stock)
    // Hiện tại làm giả lập thành công
    console.log("Processing order...", { cart, totalFinal });
    
    const randomOrderCode = 'DH' + Math.floor(100000 + Math.random() * 900000);
    showSuccessModal(randomOrderCode);
};

window.closeSuccessModal = closeSuccessModal;

// Chạy khởi tạo
initPOS();
