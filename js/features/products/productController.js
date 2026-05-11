// js/features/products/productController.js
import { supabaseClient } from '../../core/supabase.js';
import { fetchProducts, updateProduct, updateProductFull, syncCategories, syncProducts, syncProductUnits, syncProductBatches, createProduct, fetchCategories } from './productService.js';
import { 
    toggleFilter, showLoading, hideLoading, showError, 
    showSupabaseError, renderProducts, toggleAllCheckboxes, updateBulkEditButton, 
    setupSearch, showToast,
    openExportModal, closeExportModal, showImportErrorsModal, closeImportErrorModal,
    openAddProductModal, closeAddProductModal
} from './productUI.js';
import { initLayout } from '../../components/layout.js';

let currentProductsList = [];

document.addEventListener('DOMContentLoaded', () => {
    console.log("Ứng dụng đang khởi tạo...");
    
    // Kiểm tra nếu chạy trực tiếp từ file (CORS sẽ chặn Module)
    if (window.location.protocol === 'file:') {
        console.error("Lỗi: Bạn đang mở file HTML trực tiếp. Vui lòng sử dụng một web server (như Live Server trong VS Code) để chạy ứng dụng module.");
        showError("Ứng dụng không thể chạy trực tiếp từ file (protocol file://). Vui lòng sử dụng Web Server (như Live Server) để các tính năng Supabase hoạt động.");
        return;
    }

    initLayout('admin', 'products'); 
    setupProductEventListeners();
    
    if (!supabaseClient) {
        console.error("Supabase Client chưa được khởi tạo!");
        showSupabaseError();
    } else {
        console.log("Supabase Client OK, bắt đầu tải dữ liệu...");
        loadProductsData();
        populateCategoriesForAdd();
    }
});

async function populateCategoriesForAdd() {
    try {
        const categories = await fetchCategories();
        const select = document.getElementById('add_category');
        if (!select) return;
        
        select.innerHTML = '<option value="">-- Chọn nhóm hàng --</option>';
        categories.forEach(cat => {
            select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
        });
    } catch (error) {
        console.error('Lỗi khi tải danh mục:', error);
    }
}

window.quickAddCategory = async () => {
    const name = prompt('Nhap ten nhom hang moi:');
    if (name === null) return;

    const categoryName = name.trim();
    if (!categoryName) {
        alert('Vui long nhap ten nhom hang.');
        return;
    }

    try {
        const categoryMap = await syncCategories([categoryName]);
        await populateCategoriesForAdd();
        const select = document.getElementById('add_category');
        if (select && categoryMap[categoryName]) {
            select.value = categoryMap[categoryName];
        }
    } catch (error) {
        console.error('Loi them nhom hang nhanh:', error);
        alert('Khong the them nhom hang: ' + error.message);
    }
};

async function loadProductsData() {
    console.log("Bắt đầu tải dữ liệu sản phẩm...");
    showLoading("Đang tải dữ liệu từ Supabase...");
    try {
        console.log("Đang gọi fetchProducts()...");
        currentProductsList = await fetchProducts();
        console.log("Tải thành công:", currentProductsList.length, "sản phẩm.");
        
        console.log("Đang render dữ liệu...");
        renderProducts(currentProductsList);
        setupSearch(currentProductsList);
        console.log("Hoàn tất render.");
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu sản phẩm:', error);
        showError(error.message || "Đã xảy ra lỗi không xác định khi tải dữ liệu.");
    } finally {
        console.log("Kết thúc loadProductsData, đang ẩn loading...");
        hideLoading();
    }
}

// ================= GẮN HÀM RA WINDOW ĐỂ HTML GỌI =================

function setupProductEventListeners() {
    document.addEventListener('click', (event) => {
        const editButton = event.target.closest('[data-edit-product-code]');
        if (editButton) {
            window.openEditModalByCode(editButton.dataset.editProductCode);
            return;
        }

        const suggestion = event.target.closest('[data-suggestion-code]');
        if (suggestion) {
            window.selectSuggestion(suggestion.dataset.suggestionCode);
            return;
        }

        const removeUnitButton = event.target.closest('[data-remove-unit]');
        if (removeUnitButton) {
            window.removeConversionUnit(removeUnitButton.dataset.removeUnit);
            return;
        }

        const removeBatchButton = event.target.closest('[data-remove-batch-row]');
        if (removeBatchButton) {
            window.removeBatchRow(removeBatchButton.dataset.removeBatchRow);
            return;
        }

        const actionButton = event.target.closest('[data-action]');
        if (!actionButton) return;

        const actionMap = {
            'bulk-edit': () => window.bulkEdit(),
            'import-excel': () => window.importExcel(),
            'open-export-modal': openExportModal,
            'close-export-modal': closeExportModal,
            'open-add-product-modal': () => window.openAddProductModal(),
            'close-add-product-modal': closeAddProductModal,
            'toggle-filter': toggleFilter,
            'toggle-all-export-cols': toggleAllExportCols,
            'confirm-export': () => window.confirmExport(),
            'close-import-error-modal': closeImportErrorModal,
            'generate-product-code': () => window.generateProductCode(),
            'add-conversion-unit': () => window.addConversionUnit(),
            'add-batch-row': () => window.addBatchRow(),
            'quick-add-category': () => window.quickAddCategory(),
            'toggle-advanced-fields': () => window.toggleAdvancedFields(),
            'submit-add-product': () => window.submitAddProduct()
        };

        const handler = actionMap[actionButton.dataset.action];
        if (handler) handler();
    });

    document.addEventListener('change', (event) => {
        const target = event.target;
        if (target.id === 'selectAllCheckbox') {
            toggleAllCheckboxes(target);
            return;
        }
        if (target.classList.contains('row-checkbox')) {
            updateBulkEditButton();
            return;
        }
        if (target.name === 'exportCols') {
            updateExportCounters();
            return;
        }
        if (target.id === 'importFileInput') {
            window.handleFileImport(event);
            return;
        }
        if (target.id === 'add_has_batch') {
            window.toggleBatchFields();
        }
    });

    const addNameInput = document.getElementById('add_name');
    if (addNameInput) {
        addNameInput.addEventListener('blur', () => window.autoGenerateProductCode());
    }
}

function updateExportCounters() {
    document.querySelectorAll('.export-group').forEach(group => {
        const checkboxes = group.querySelectorAll('input[name="exportCols"]');
        const checked = group.querySelectorAll('input[name="exportCols"]:checked');
        const counter = group.querySelector('.group-counter');
        if (counter) counter.textContent = `${checked.length}/${checkboxes.length}`;
    });

    const totalCount = document.getElementById('totalColsCount');
    if (totalCount) {
        totalCount.textContent = document.querySelectorAll('input[name="exportCols"]:checked').length;
    }
}

function toggleAllExportCols() {
    const checkboxes = document.querySelectorAll('input[name="exportCols"]');
    const shouldCheck = Array.from(checkboxes).some(checkbox => !checkbox.checked);
    checkboxes.forEach(checkbox => {
        checkbox.checked = shouldCheck;
    });
    updateExportCounters();
}
window.toggleDarkMode = window.toggleDarkMode || (() => {}); // handled by layout.js
window.toggleFilter = toggleFilter;
window.toggleAllCheckboxes = toggleAllCheckboxes;
window.updateBulkEditButton = updateBulkEditButton;
// closeEditModal is handled via openAddProductModal
window.openExportModal = openExportModal;
window.closeExportModal = closeExportModal;
window.closeImportErrorModal = closeImportErrorModal;
window.updateExportCounters = updateExportCounters;
window.toggleAllExportCols = toggleAllExportCols;

window.bulkEdit = () => {
    const checkedCheckboxes = Array.from(document.querySelectorAll('.row-checkbox:checked'));
    const selectedProductIds = checkedCheckboxes.map(checkbox => checkbox.value);
    alert(`Bạn đang mở chức năng Chỉnh sửa hàng loạt cho ${selectedProductIds.length} sản phẩm:\n[${selectedProductIds.join(', ')}]\n\nChức năng Cập nhật nhiều sản phẩm cùng lúc sẽ sớm ra mắt!`);
};

window.openEditModalByCode = (productCode) => {
    const selectedProduct = currentProductsList.find(product => product.product_code === productCode);
    if(selectedProduct) {
        openAddProductModal(selectedProduct);
    }
};

window.saveEditProduct = async () => {
    // Đã gộp logic vào submitAddProduct
};

window.submitAddProduct = async () => {
    const form = document.getElementById('addProductForm');
    if (!form.reportValidity()) return;

    const productId    = document.getElementById('add_product_id').value;
    const isEditMode   = Boolean(productId);
    const submitBtn    = document.querySelector('[data-action="submit-add-product"]');

    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Đang lưu...'; }
    showLoading(isEditMode ? 'Đang cập nhật sản phẩm...' : 'Đang lưu hàng hóa mới...');

    try {
        // Collect Data
        const productData = {
            name:             document.getElementById('add_name').value.trim(),
            product_code:     document.getElementById('add_code').value.trim(),
            category_id:      document.getElementById('add_category').value || null,
            is_active:        document.getElementById('add_is_active').checked,

            // Advanced Info — field names match Supabase columns
            barcode:           document.getElementById('add_barcode').value.trim()           || null,
            registration_no:   document.getElementById('add_reg_no').value.trim()            || null,
            active_ingredient: document.getElementById('add_active_ingredient').value.trim() || null,
            concentration:     document.getElementById('add_concentration').value.trim()     || null,
            route_of_admin:    document.getElementById('add_route').value.trim()             || null,
            packaging_spec:    document.getElementById('add_packaging').value.trim()         || null,
            manufacturer:      document.getElementById('add_manufacturer').value.trim()      || null,
            is_direct_sale:    true,
            is_component_item: false
        };

        const unitsData = [];
        document.querySelectorAll('#unitsContainer .unit-row').forEach((row, index) => {
            const unitName = row.querySelector('.unit-name').value.trim();
            if (unitName) {
                unitsData.push({
                    unit_name:       unitName,
                    retail_price:    parseFloat(row.querySelector('.unit-retail').value)    || 0,
                    cost_price:      parseFloat(row.querySelector('.unit-cost').value)      || 0,
                    conversion_rate: parseFloat(row.querySelector('.unit-conversion').value) || 1,
                    is_base_unit:    index === 0
                });
            }
        });

        if (unitsData.length === 0) throw new Error('Vui lòng nhập ít nhất 1 đơn vị tính.');

        let batchData = [];
        const hasBatch = document.getElementById('add_has_batch').checked;
        const initialStock = parseFloat(document.getElementById('add_stock').value) || 0;

        if (hasBatch || initialStock > 0) {
            batchData = [{
                batch_number: document.getElementById('add_batch_no').value.trim() || 'Lô mặc định',
                expiry_date: document.getElementById('add_expiry').value || null,
                stock_quantity: initialStock,
                is_tracked: hasBatch
            }];
        }

        document.querySelectorAll('#batchRowsContainer .batch-extra-row').forEach((row, index) => {
            const stock = parseFloat(row.querySelector('.batch-stock')?.value) || 0;
            const batchNumber = row.querySelector('.batch-number')?.value.trim() || `Lo ${index + 2}`;
            const expiryDate = row.querySelector('.batch-expiry')?.value || null;

            if (hasBatch || stock > 0 || expiryDate || batchNumber) {
                batchData.push({
                    batch_number: batchNumber,
                    expiry_date: expiryDate,
                    stock_quantity: stock,
                    is_tracked: hasBatch
                });
            }
        });

        if (batchData.length === 0) batchData = null;

        // Send to API
        if (productId) {
            showLoading("Đang cập nhật sản phẩm...");
            await updateProductFull(productId, productData, unitsData, batchData);
            closeAddProductModal();
            showToast('Cập nhật sản phẩm thành công!', 'success');
        } else {
            await createProduct(productData, unitsData, batchData);
            closeAddProductModal();
            showToast('Thêm hàng hóa thành công!', 'success');
        }

        loadProductsData(); // Reload list

    } catch (error) {
        console.error('Lỗi khi lưu sản phẩm:', error);
        showToast('Lỗi: ' + error.message, 'error', 5000);
    } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Lưu hàng hóa'; }
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
                    const rowNum = i + index + 2; 
                    // Xác định cột "Mã Hàng" theo chuẩn KiotViet
                    const code = row['Mã hàng'];
                    if (!code || String(code).trim() === '') {
                        errorLogs.push({ row: i + 1, message: 'Thiếu Mã Hàng (Bắt buộc)', productCode: '', status: 'error' });
                        return;
                    }        
                    validBatch.push({ ...row, _excelRow: rowNum });
                });

                if (validBatch.length === 0) continue;

                try {
                    // 1. Đồng bộ Categories
                    const categoryNames = validBatch.map(r => r['Nhóm hàng']).filter(name => name);
                    const categoryMap = await syncCategories(categoryNames);

                    // 2. Map dữ liệu Products
                    const productsData = validBatch.map(row => ({
                        product_code: String(row['Mã hàng']).trim(),
                        barcode: row['Mã vạch'] || null,
                        name: row['Tên hàng'] || 'Chưa có tên',
                        category_id: row['Nhóm hàng'] ? categoryMap[row['Nhóm hàng']] : null,
                        is_active: row['Trạng thái KD'] ? row['Trạng thái KD'] === 'Có' : true,
                        registration_no: row['Số đăng ký'] || null,
                        national_med_code: row['Mã thuốc'] || null,
                        active_ingredient: row['Hoạt chất'] || null,
                        concentration: row['Hàm lượng'] || null,
                        packaging_spec: row['Quy cách đóng gói'] || null,
                        manufacturer: row['Hãng sản xuất'] || null,
                        route_of_admin: row['Đường dùng'] || null,
                        
                        // Default values for omitted fields
                        is_direct_sale: true,
                        images: null,
                        country_of_origin: null,
                        weight: null,
                        description: null,
                        note_template: null,
                        is_component_item: false
                    }));

                    const uniqueProductsMap = new Map();
                    productsData.forEach(p => uniqueProductsMap.set(p.product_code, p));
                    const uniqueProductsData = Array.from(uniqueProductsMap.values());

                    const productMap = await syncProducts(uniqueProductsData);

                    // 3. Map dữ liệu Units (Nhận diện động)
                    if (validBatch[0]['ĐVT'] !== undefined) {
                        const unitsData = validBatch.filter(row => row['ĐVT']).map(row => ({
                            product_id: productMap[String(row['Mã hàng']).trim()],
                            unit_name: row['ĐVT'],
                            conversion_rate: 1, // Mặc định 1 cho API gọn nhẹ
                            is_base_unit: true, // Mặc định đơn vị đầu tiên là cơ bản
                            cost_price: Number(row['Giá vốn']) || 0,
                            retail_price: Number(row['Giá bán']) || 0
                        })).filter(u => u.product_id);
                        
                        await syncProductUnits(unitsData);
                    }

                    // 4. Map dữ liệu Batches (Tồn kho - Nhận diện động)
                    if (validBatch[0]['Lô'] !== undefined || validBatch[0]['Tồn kho'] !== undefined) {
                        const batchesData = validBatch.filter(row => row['Lô'] || row['Tồn kho']).map(row => {
                            let expDate = row['Hạn sử dụng'];
                            if (typeof expDate === 'number') {
                                expDate = new Date(Math.round((expDate - 25569) * 86400 * 1000)).toISOString().split('T')[0];
                            }
                            return {
                                product_id: productMap[String(row['Mã hàng']).trim()],
                                batch_number: String(row['Lô'] || 'Lô mặc định'),
                                expiry_date: expDate || null,
                                stock_quantity: Number(row['Tồn kho']) || 0,
                                is_tracked: true
                            };
                        }).filter(b => b.product_id);
                        
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
                // Ánh xạ 18 trường tinh gọn
                const fullRow = {
                    "Mã hàng": product.product_code || '',
                    "Mã vạch": product.barcode || '',
                    "Tên hàng": product.name || '',
                    "Nhóm hàng": product.categories?.name || '',
                    "Trạng thái KD": product.is_active === false ? 'Không' : 'Có',
                    "ĐVT": unit.unit_name || '',
                    
                    "Giá vốn": unit.cost_price || 0,
                    "Giá bán": unit.retail_price || 0,
                    "Lô": batch.batch_number || '',
                    "Hạn sử dụng": batch.expiry_date || '',
                    "Tồn kho": batch.stock_quantity || 0,
                    
                    "Số đăng ký": product.registration_no || '',
                    "Mã thuốc": product.national_med_code || '',
                    "Hoạt chất": product.active_ingredient || '',
                    "Hàm lượng": product.concentration || '',
                    "Quy cách đóng gói": product.packaging_spec || '',
                    "Hãng sản xuất": product.manufacturer || '',
                    "Đường dùng": product.route_of_admin || ''
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


