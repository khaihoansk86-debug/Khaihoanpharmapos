// js/app.js
import { supabaseClient } from './config/supabase.js';
import { fetchProducts, updateProduct, syncCategories, syncProducts, syncProductUnits, syncProductBatches } from './api/productService.js';
import { 
    initDarkMode, toggleDarkMode, toggleFilter, showLoading, hideLoading, showError, 
    showSupabaseError, renderProducts, toggleAllCheckboxes, updateBulkEditButton, 
    openEditModal, closeEditModal, setupSearch,
    openExportModal, closeExportModal, showImportErrorsModal, closeImportErrorModal
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
window.openExportModal = openExportModal;
window.closeExportModal = closeExportModal;
window.closeImportErrorModal = closeImportErrorModal;

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

    showLoading("Đang đọc file Excel...");

    const fileReader = new FileReader();
    fileReader.onload = async function(e) {
        try {
            const fileData = new Uint8Array(e.target.result);
            if (!window.XLSX) throw new Error("Thư viện Excel (SheetJS) chưa được tải.");
            
            const workbook = window.XLSX.read(fileData, {type: 'array'});
            const firstSheetName = workbook.SheetNames[0];
            const jsonData = window.XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName]);
            
            const BATCH_SIZE = 500;
            const totalItems = jsonData.length;
            let successCount = 0;
            const errorLogs = [];

            showLoading(`Chuẩn bị xử lý ${totalItems} dòng dữ liệu...`);

            for (let i = 0; i < totalItems; i += BATCH_SIZE) {
                const rawBatch = jsonData.slice(i, i + BATCH_SIZE);
                showLoading(`Đang xử lý Lô ${Math.ceil((i+1)/BATCH_SIZE)}... (${Math.min(i + BATCH_SIZE, totalItems)}/${totalItems})`);

                const validBatch = [];
                
                // Validate từng dòng
                rawBatch.forEach((row, index) => {
                    const rowNum = i + index + 2; // +2 vì index bắt đầu từ 0 và dòng 1 là header
                    if (!row['Mã Hàng'] || String(row['Mã Hàng']).trim() === '') {
                        errorLogs.push({ row: rowNum, reason: "Thiếu Mã Hàng (Bắt buộc)" });
                    } else {
                        validBatch.push({ ...row, _excelRow: rowNum });
                    }
                });

                if (validBatch.length === 0) continue;

                try {
                    // 1. Lọc và Sync Categories (Nhận diện động)
                    let categoryMap = {};
                    if (validBatch[0]['Tên Danh Mục'] !== undefined) {
                        const categoryNames = validBatch.map(row => row['Tên Danh Mục']).filter(Boolean);
                        categoryMap = await syncCategories(categoryNames);
                    }

                    // 2. Map dữ liệu Products
                    const productsData = validBatch.map(row => ({
                        product_code: String(row['Mã Hàng']).trim(),
                        name: row['Tên Thuốc'] || 'Chưa có tên',
                        active_ingredient: row['Hoạt Chất'] || null,
                        packaging_spec: row['Quy Cách'] || null,
                        manufacturer: row['Hãng Sản Xuất'] || null,
                        category_id: row['Tên Danh Mục'] ? categoryMap[row['Tên Danh Mục']] : null
                    }));

                    const uniqueProductsMap = new Map();
                    productsData.forEach(p => uniqueProductsMap.set(p.product_code, p));
                    const uniqueProductsData = Array.from(uniqueProductsMap.values());

                    const productMap = await syncProducts(uniqueProductsData);

                    // 3. Map dữ liệu Units (Nhận diện động)
                    if (validBatch[0]['Tên ĐVT'] !== undefined) {
                        const unitsData = validBatch.filter(row => row['Tên ĐVT']).map(row => ({
                            product_id: productMap[String(row['Mã Hàng']).trim()],
                            unit_name: row['Tên ĐVT'],
                            conversion_rate: Number(row['Tỷ Lệ Quy Đổi']) || 1,
                            cost_price: Number(row['Giá Nhập']) || 0,
                            retail_price: Number(row['Giá Bán Lẻ']) || 0
                        })).filter(u => u.product_id);
                        
                        await syncProductUnits(unitsData);
                    }

                    // 4. Map dữ liệu Batches (Tồn kho - Nhận diện động)
                    if (validBatch[0]['Mã Lô'] !== undefined) {
                        const batchesData = validBatch.filter(row => row['Mã Lô']).map(row => {
                            let expDate = row['Hạn Sử Dụng'];
                            if (typeof expDate === 'number') {
                                expDate = new Date(Math.round((expDate - 25569) * 86400 * 1000)).toISOString().split('T')[0];
                            }
                            return {
                                product_id: productMap[String(row['Mã Hàng']).trim()],
                                batch_number: String(row['Mã Lô']),
                                expiry_date: expDate || null,
                                stock_quantity: Number(row['Tồn Kho']) || 0
                            };
                        }).filter(b => b.product_id && b.expiry_date);
                        
                        await syncProductBatches(batchesData);
                    }

                    successCount += validBatch.length;
                } catch (batchErr) {
                    // Lỗi cả lô -> ghi nhận lỗi cho mọi dòng trong lô
                    validBatch.forEach(row => {
                        errorLogs.push({ row: row._excelRow, reason: "Lỗi hệ thống khi đồng bộ dữ liệu lô: " + batchErr.message });
                    });
                }
            }
            
            if (errorLogs.length > 0) {
                showImportErrorsModal(successCount, errorLogs);
            } else {
                alert(`Đã Import thành công ${successCount} dòng dữ liệu liên kết 5 bảng!`);
            }
            await loadProductsData(); // Tải lại toàn bộ dữ liệu
        } catch (error) {
            console.error("Lỗi Import Excel:", error);
            alert(`Đã xảy ra lỗi trong quá trình đọc file: ${error.message}`);
        } finally {
            event.target.value = ''; 
            hideLoading();
        }
    };
    fileReader.readAsArrayBuffer(uploadedFile);
};

window.confirmExport = () => {
    const checkboxes = document.querySelectorAll('input[name="exportCols"]:checked');
    const selectedCols = Array.from(checkboxes).map(cb => cb.value);

    if(!currentProductsList || currentProductsList.length === 0) {
        alert("Không có dữ liệu để xuất!");
        return;
    }
    if (!window.XLSX) {
        alert("Lỗi: Thư viện xuất Excel chưa được tải.");
        return;
    }
    
    const exportDataArray = [];

    currentProductsList.forEach(product => {
        const units = product.product_units && product.product_units.length > 0 
            ? product.product_units 
            : [{}];
            
        units.forEach(unit => {
            const batches = product.product_batches && product.product_batches.length > 0
                ? product.product_batches
                : [{}];
                
            batches.forEach(batch => {
                const fullRow = {
                    "Mã Danh Mục": product.categories?.id || '',
                    "Tên Danh Mục": product.categories?.name || '',
                    "Mã Hàng": product.product_code,
                    "Tên Thuốc": product.name,
                    "Hoạt Chất": product.active_ingredient || '',
                    "Quy Cách": product.packaging_spec || product.packaging || '',
                    "Hãng Sản Xuất": product.manufacturer || '',
                    "Tên ĐVT": unit.unit_name || '',
                    "Tỷ Lệ Quy Đổi": unit.conversion_rate || 1,
                    "Giá Nhập": unit.cost_price || 0,
                    "Giá Bán Lẻ": unit.retail_price || 0,
                    "Mã Lô": batch.batch_number || '',
                    "Hạn Sử Dụng": batch.expiry_date || product.expiration_date || '',
                    "Tồn Kho": batch.stock_quantity || 0
                };
                
                // Chỉ lấy các cột người dùng đã chọn
                const filteredRow = {};
                selectedCols.forEach(col => {
                    if (fullRow[col] !== undefined) {
                        filteredRow[col] = fullRow[col];
                    }
                });
                
                exportDataArray.push(filteredRow);
            });
        });
    });

    const worksheet = window.XLSX.utils.json_to_sheet(exportDataArray);
    
    // Auto fit width cho các cột
    const columnWidths = selectedCols.map(() => ({wch: 20}));
    worksheet['!cols'] = columnWidths;

    const workbook = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(workbook, worksheet, "DuLieuHangHoa");

    window.XLSX.writeFile(workbook, "KhaiHoanPOS_Data_Custom.xlsx");
    
    closeExportModal();
};
