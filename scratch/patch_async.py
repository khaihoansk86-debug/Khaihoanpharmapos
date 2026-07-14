import re

file_path = r'd:\Khaihoanpharmapos\js\features\pos\posController.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target1 = '''window.confirmProductSelection = async (product, variantNote) => {
    await addProductToCart(product, variantNote);
    renderCurrentCart();
    const sugg = document.getElementById('posSearchSuggestions');
    const inp = document.getElementById('posSearchInput');
    if (sugg) sugg.classList.add('hidden');
    if (inp) inp.value = '';
    // close modal if any
    const modal = document.getElementById('productVariantModal');
    if (modal) modal.classList.add('hidden');
};'''

replace1 = '''window.confirmProductSelection = async (product, variantNote) => {
    try {
        await addProductToCart(product, variantNote);
        renderCurrentCart();
        const sugg = document.getElementById('posSearchSuggestions');
        const inp = document.getElementById('posSearchInput');
        if (sugg) sugg.classList.add('hidden');
        if (inp) inp.value = '';
        // close modal if any
        const modal = document.getElementById('productVariantModal');
        if (modal) modal.classList.add('hidden');
    } catch (err) {
        console.error('Error confirming product selection:', err);
        if (window.showToast) window.showToast('Lỗi chọn sản phẩm: ' + err.message, 'error');
    }
};'''

if target1 in content:
    content = content.replace(target1, replace1)
    print("Patched target1")

target2 = '''window.manualConfirmQrPayment = async () => {
    if (window.confirm("Bạn xác nhận khách hàng đã chuyển khoản thành công?")) {
        hideQrPaymentModal();
        await finalizeProcessPayment();
    }
};'''

replace2 = '''window.manualConfirmQrPayment = async () => {
    try {
        if (window.confirm("Bạn xác nhận khách hàng đã chuyển khoản thành công?")) {
            hideQrPaymentModal();
            await finalizeProcessPayment();
        }
    } catch (err) {
        console.error('Lỗi xác nhận chuyển khoản:', err);
        if (window.showToast) window.showToast('Lỗi xác nhận: ' + err.message, 'error');
    }
};'''

if target2 in content:
    content = content.replace(target2, replace2)
    print("Patched target2")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
