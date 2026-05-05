// js/app.js
import { supabaseClient } from './config/supabase.js';
import { fetchProducts, updateProduct, upsertProducts } from './api/productService.js';
import { 
    initDarkMode, toggleDarkMode, toggleFilter, showLoading, hideLoading, showError, 
    showSupabaseError, renderProducts, toggleAllCheckboxes, updateBulkEditButton, 
    openEditModal, closeEditModal, setupSearch
} from './ui/dashboardUI.js';

let currentProductsList = [];

document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    
    if (!supabaseClient) {
        showSupabaseError();
    } else {
        loadProductsData();
    }
});

async function loadProductsData() {
    showLoading("Đang tải dữ liệu từ Supabase...");
    try {
        currentProductsList = await fetchProducts();
        renderProducts(currentProductsList);
        setupSearch(currentProductsList);
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
        showError(error.message);
    } finally {
        hideLoading();
    }
}

// ================= GẮN HÀM RA WINDOW ĐỂ HTML GỌI =================

window.toggleDarkMode = toggleDarkMode;
window.toggleFilter = toggleFilter;
window.toggleAllCheckboxes = toggleAllCheckboxes;
window.updateBulkEditButton = updateBulkEditButton;
window.closeEditModal = closeEditModal;

window.bulkEdit = () => {
    const checkedCheckboxes = Array.from(document.querySelectorAll('.row-checkbox:checked'));
    const selectedProductIds = checkedCheckboxes.map(checkbox => checkbox.value);
    alert(`Bạn đang mở chức năng Chỉnh sửa hàng loạt cho ${selectedProductIds.length} sản phẩm:\n[${selectedProductIds.join(', ')}]\n\nChức năng Cập nhật nhiều sản phẩm cùng lúc sẽ sớm ra mắt!`);
};

window.openEditModalByCode = (productCode) => {
    const selectedProduct = currentProductsList.find(product => product.product_code === productCode);
    if(selectedProduct) {
        openEditModal(selectedProduct);
    }
};

window.saveEditProduct = async () => {
    const codeElement = document.getElementById('editProductCode');
    const nameElement = document.getElementById('editName');
    const ingredientElement = document.getElementById('editIngredient');
    
    if (!codeElement || !nameElement || !ingredientElement) {
        alert("Lỗi giao diện: Không tìm thấy trường nhập liệu.");
        return;
    }
    
    const productCodeToUpdate = codeElement.value;
    const newProductName = nameElement.value;
    const newActiveIngredient = ingredientElement.value;
    
    try {
        showLoading("Đang lưu thay đổi...");
        await updateProduct(productCodeToUpdate, { 
            name: newProductName, 
            active_ingredient: newActiveIngredient
        });
        
        closeEditModal();
        alert(`Đã cập nhật thành công hàng hóa: ${productCodeToUpdate}`);
        
        await loadProductsData(); // Reload data
    } catch (error) {
        console.error("Lỗi cập nhật:", error);
        alert(`Lỗi cập nhật sản phẩm: ${error.message}`);
    } finally {
        hideLoading();
    }
};

window.selectSuggestion = (productCode) => {
    const searchInputElement = document.getElementById('searchInput');
    const searchTypeElement = document.getElementById('searchType');
    const searchSuggestionsElement = document.getElementById('searchSuggestions');
    
    if (searchTypeElement) searchTypeElement.value = 'code';
    if (searchInputElement) {
        searchInputElement.value = productCode;
        searchInputElement.dispatchEvent(new Event('input'));
    }
    if (searchSuggestionsElement) searchSuggestionsElement.classList.add('hidden');
};

window.importExcel = () => {
    const fileInputElement = document.getElementById('importFileInput');
    if (fileInputElement) fileInputElement.click();
};

window.handleFileImport = (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;

    showLoading("Đang xử lý dữ liệu từ file Excel...");

    const fileReader = new FileReader();
    fileReader.onload = async function(e) {
        try {
            const fileData = new Uint8Array(e.target.result);
            if (!window.XLSX) {
                throw new Error("Thư viện Excel (SheetJS) chưa được tải.");
            }
            const workbook = window.XLSX.read(fileData, {type: 'array'});
            
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = window.XLSX.utils.sheet_to_json(worksheet);
            
            const formattedProductsData = jsonData.map(row => {
                return {
                    product_code: row['Mã Hàng'] || null,
                    name: row['Tên Thuốc'] || null,
                    active_ingredient: row['Hoạt chất'] || null
                };
            }).filter(item => item.product_code);
            
            if(formattedProductsData.length === 0) {
                alert('Lỗi: File Excel không có dữ liệu hợp lệ.\nVui lòng đảm bảo cấu trúc có cột "Mã Hàng" và "Tên Thuốc".');
                loadProductsData();
                return;
            }

            const BATCH_SIZE = 500;
            const totalItems = formattedProductsData.length;
            let successCount = 0;

            showLoading(`Đang chuẩn bị đồng bộ ${totalItems} sản phẩm...`);

            for (let i = 0; i < totalItems; i += BATCH_SIZE) {
                const batch = formattedProductsData.slice(i, i + BATCH_SIZE);
                showLoading(`Đang đồng bộ ${Math.min(i + BATCH_SIZE, totalItems)}/${totalItems} sản phẩm lên Database...`);
                await upsertProducts(batch);
                successCount += batch.length;
            }
            
            alert(`Đã Import thành công ${successCount} sản phẩm vào Cơ sở dữ liệu gốc!`);
            await loadProductsData(); // Reload list after import
        } catch (error) {
            console.error("Lỗi Import Excel:", error);
            alert(`Đã xảy ra lỗi trong quá trình Import: ${error.message}`);
        } finally {
            event.target.value = ''; 
            hideLoading();
        }
    };
    fileReader.readAsArrayBuffer(uploadedFile);
};

window.exportExcel = () => {
    if(!currentProductsList || currentProductsList.length === 0) {
        alert("Không có dữ liệu để xuất!");
        return;
    }
    if (!window.XLSX) {
        alert("Lỗi: Thư viện xuất Excel chưa được tải.");
        return;
    }
    
    const exportDataArray = currentProductsList.map(product => ({
        "Mã Hàng": product.product_code,
        "Tên Thuốc": product.name,
        "Hoạt chất": product.active_ingredient || '',
        "Quy cách": product.packaging || '',
        "Giá Bán Nhỏ Nhất": product.product_units?.[0]?.retail_price || 0,
        "Hạn sử dụng": product.expiration_date || ''
    }));

    const worksheet = window.XLSX.utils.json_to_sheet(exportDataArray);
    
    const columnWidths = [
        {wch: 15}, {wch: 35}, {wch: 40}, {wch: 25}, {wch: 20}, {wch: 15}
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSachHangHoa");

    window.XLSX.writeFile(workbook, "KhaiHoanPOS_HangHoa.xlsx");
};
