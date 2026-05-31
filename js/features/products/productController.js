// js/features/products/productController.js
import { supabaseClient } from '../../core/supabase.js';
import { fetchProducts, updateProduct, updateProductFull, syncCategories, syncProducts, syncProductUnits, syncProductBatches, createProduct, fetchCategories, createCategory } from './productService.js';
import { 
    toggleFilter, showLoading, hideLoading, showError, 
    showSupabaseError, renderProducts, toggleAllCheckboxes, updateBulkEditButton, 
    setupSearch, showToast,
    openExportModal, closeExportModal, showImportErrorsModal, closeImportErrorModal,
    openAddProductModal, closeAddProductModal
} from './productUI.js';
import { initLayout } from '../../components/layout.js';

let currentProductsList = [];
window.currentCategoryId = '';

async function initApp() {
    // Kiểm tra nếu chạy trực tiếp từ file (CORS sẽ chặn Module)
    if (window.location.protocol === 'file:') {
        console.error("Lỗi: Bạn đang mở file HTML trực tiếp.");
        showError("Ứng dụng không thể chạy trực tiếp từ file (protocol file://). Vui lòng sử dụng Web Server.");
        return;
    }

    initLayout('admin', 'products'); 
    setupProductEventListeners();
    
    if (!supabaseClient) {
        console.error("Supabase Client chưa được khởi tạo!");
        showSupabaseError();
    } else {
        
        // Đọc URL hash để nhảy thẳng tab tương ứng
        const hash = window.location.hash || '#products-list';
        const targetTab = hash.substring(1);
        const tabBtn = document.querySelector(`.main-tab-btn[data-tab="${targetTab}"]`);
        if (tabBtn) {
            tabBtn.click();
        } else {
            loadProductsData();
        }
        
        // Lắng nghe thay đổi hash từ Dropdown menu đầu trang
        window.addEventListener('hashchange', () => {
            const currentHash = window.location.hash || '#products-list';
            const curTab = currentHash.substring(1);
            const targetBtn = document.querySelector(`.main-tab-btn[data-tab="${curTab}"]`);
            if (targetBtn) targetBtn.click();
        });
        
        populateCategoriesForAdd();
    }
}

async function populateCategoriesForAdd() {
    try {
        const categories = await fetchCategories();
        
        // 1. Nhóm hàng hóa thường (Loại trừ Combo và Cắt Liều)
        const select = document.getElementById('add_category');
        if (select) {
            select.innerHTML = '<option value="">-- Chọn nhóm hàng --</option>';
            categories
                .filter(cat => !cat.name.toLowerCase().includes('combo') && !cat.name.toLowerCase().includes('cắt liều'))
                .forEach(cat => {
                    select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
                });
        }
        
        // 2. Nhóm Combo (Chỉ lấy các nhóm chứa từ "combo")
        const comboSelect = document.getElementById('add_combo_category');
        if (comboSelect) {
            comboSelect.innerHTML = '<option value="">-- Chọn nhóm Combo --</option>';
            categories
                .filter(cat => cat.name.toLowerCase().includes('combo'))
                .forEach(cat => {
                    comboSelect.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
                });
        }
        
        // Render danh sách nhóm hàng (Tab Quản lý)
        renderCategoriesGrid(categories);
    } catch (error) {
        console.error('Lỗi khi tải danh mục:', error);
    }
}

function renderCategoriesGrid(categories) {
    const container = document.getElementById('categories-grid-container');
    if (!container) return;

    let html = `
        <div onclick="window.viewProductsByCategory('')" class="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-200 dark:border-blue-800 flex items-center justify-between group hover:border-blue-500 transition-all shadow-sm cursor-pointer">
            <div>
                <h4 class="font-black text-blue-800 dark:text-blue-300">Tất cả nhóm hàng</h4>
                <p class="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-1">Xem toàn bộ hàng hóa</p>
            </div>
            <div class="flex items-center gap-2 text-blue-500">
                <i class="fa-solid fa-arrow-right"></i>
            </div>
        </div>
        <div onclick="window.viewProductsByCategory('ecommerce')" class="bg-pink-50 dark:bg-pink-900/20 p-5 rounded-2xl border border-pink-200 dark:border-pink-800 flex items-center justify-between group hover:border-pink-500 transition-all shadow-sm cursor-pointer">
            <div>
                <h4 class="font-black text-pink-800 dark:text-pink-300">Nhóm TMĐT</h4>
                <p class="text-[10px] font-bold text-pink-400 uppercase tracking-widest mt-1">Hàng bán đa nền tảng</p>
            </div>
            <div class="flex items-center gap-2 text-pink-500">
                <i class="fa-solid fa-cart-shopping"></i>
            </div>
        </div>
    `;

    if (categories.length > 0) {
        html += categories.map(cat => {
            const isCombo = cat.name.toLowerCase().includes('combo');
            const isDose = cat.name.toLowerCase().includes('cắt liều') || cat.name.toLowerCase().includes('thuốc liều');
            
            let badgeHtml = '';
            if (isCombo) {
                badgeHtml = `<span class="inline-flex mt-1.5 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[9px] font-black rounded uppercase tracking-wider gap-1 items-center"><i class="fa-solid fa-layer-group text-[8px]"></i> Nhóm Combo</span>`;
            } else if (isDose) {
                badgeHtml = `<span class="inline-flex mt-1.5 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[9px] font-black rounded uppercase tracking-wider gap-1 items-center"><i class="fa-solid fa-notes-medical text-[8px]"></i> Cắt Liều</span>`;
            } else {
                badgeHtml = `<span class="inline-flex mt-1.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-400 text-[9px] font-black rounded uppercase tracking-wider gap-1 items-center"><i class="fa-solid fa-box text-[8px]"></i> Hàng Hóa</span>`;
            }
            
            return `
            <div onclick="window.viewProductsByCategory('${cat.id}')" class="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between group hover:border-blue-500 transition-all shadow-sm cursor-pointer">
                <div>
                    <h4 class="font-black text-slate-800 dark:text-white">${cat.name}</h4>
                    <div class="flex flex-col gap-0.5">
                        ${badgeHtml}
                        <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: ${cat.id.substring(0,8)}...</p>
                    </div>
                </div>
                <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onclick="event.stopPropagation(); window.quickEditCategory('${cat.id}', '${cat.name}')" class="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-700 text-blue-600 shadow-sm border border-slate-200 dark:border-slate-600 hover:bg-blue-600 hover:text-white transition-all">
                        <i class="fa-solid fa-pen text-[10px]"></i>
                    </button>
                    <button onclick="event.stopPropagation(); window.quickDeleteCategory('${cat.id}')" class="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-700 text-red-600 shadow-sm border border-slate-200 dark:border-slate-600 hover:bg-red-600 hover:text-white transition-all">
                        <i class="fa-solid fa-trash text-[10px]"></i>
                    </button>
                </div>
            </div>`;
        }).join('');
    }

    container.innerHTML = html;
}

window.viewProductsByCategory = (catId) => {
    window.currentCategoryId = catId;
    const mainTabBtn = document.querySelector('.main-tab-btn[data-tab="products-list"]');
    if (mainTabBtn) mainTabBtn.click();
    window.applyFilters();
};

window.quickAddCategory = async () => {
    const name = prompt('Nhập tên nhóm hàng mới:');
    if (!name || !name.trim()) return;

    try {
        const category = await createCategory(name.trim());
        if (category) {
            populateCategoriesForAdd();
            showToast(`Đã thêm nhóm hàng: ${category.name}`);
        }
    } catch (err) {
        showToast('Lỗi khi thêm nhóm hàng: ' + err.message, 'error');
    }
};

window.quickAddComboCategory = async () => {
    let name = prompt('Nhập tên nhóm Combo mới:');
    if (!name || !name.trim()) return;
    
    name = name.trim();
    if (!name.toLowerCase().includes('combo')) {
        name = `Combo - ${name}`;
    }

    try {
        const category = await createCategory(name);
        if (category) {
            populateCategoriesForAdd();
            showToast(`Đã thêm nhóm Combo: ${category.name}`);
        }
    } catch (err) {
        showToast('Lỗi khi thêm nhóm Combo: ' + err.message, 'error');
    }
};

window.quickEditCategory = async (id, oldName) => {
    const newName = prompt('Nhập tên mới cho nhóm hàng:', oldName);
    if (!newName || newName.trim() === oldName) return;

    try {
        const { error } = await supabaseClient
            .from('categories')
            .update({ name: newName.trim() })
            .eq('id', id);
        
        if (error) throw error;
        populateCategoriesForAdd();
        showToast('Đã cập nhật nhóm hàng');
    } catch (err) {
        showToast('Lỗi khi cập nhật: ' + err.message, 'error');
    }
};

window.quickDeleteCategory = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nhóm hàng này?')) return;

    try {
        const { error } = await supabaseClient
            .from('categories')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        populateCategoriesForAdd();
        showToast('Đã xóa nhóm hàng');
    } catch (err) {
        showToast('Lỗi khi xóa: ' + err.message, 'error');
    }
};

async function loadProductsData() {
    showLoading("Đang tải dữ liệu từ Supabase...");
    try {
        currentProductsList = await fetchProducts();
        
        const hasActiveFilter = window.currentCategoryId || 
            (document.getElementById('filter_status') && document.getElementById('filter_status').value !== 'all') || 
            (document.getElementById('filter_stock') && document.getElementById('filter_stock').value !== 'all') || 
            (document.getElementById('filter_expiry') && document.getElementById('filter_expiry').value !== 'all');
            
        if (hasActiveFilter) {
            window.applyFilters();
        } else {
            renderProducts(currentProductsList);
        }
        setupSearch(currentProductsList);
        
        // Tự động khôi phục lại bộ lọc tìm kiếm trên giao diện nếu đang có từ khóa
        const searchInput = document.getElementById('searchInput');
        if (searchInput && searchInput.value.trim()) {
            searchInput.dispatchEvent(new Event('input'));
        }
        
        // Kích hoạt dòng chữ cảnh báo luân phiên trên bóng chat AI của phần quản trị
        if (window.startAIChatReminders) {
            window.startAIChatReminders();
        }
        
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu sản phẩm:', error);
        showError(error.message || "Đã xảy ra lỗi không xác định khi tải dữ liệu.");
    } finally {
        hideLoading();
    }
}

// ================= GẮN HÀM RA WINDOW ĐỂ HTML GỌI =================

function setupProductEventListeners() {
    document.addEventListener('click', (event) => {
        const mainTabBtn = event.target.closest('.main-tab-btn');
        if (mainTabBtn) {
            const tabId = mainTabBtn.dataset.tab;
            // Update buttons
            document.querySelectorAll('.main-tab-btn').forEach(btn => {
                btn.classList.remove('active', 'bg-blue-600', 'text-white');
                btn.classList.add('text-slate-500');
            });
            mainTabBtn.classList.add('active', 'bg-blue-600', 'text-white');
            mainTabBtn.classList.remove('text-slate-500');

            // Update content
            document.querySelectorAll('.main-tab-content').forEach(content => content.classList.add('hidden'));
            document.getElementById(`tab-${tabId}`)?.classList.remove('hidden');

            // Cập nhật hash url đồng bộ với tab
            window.location.hash = `#${tabId}`;

            // Kích hoạt load dữ liệu tương ứng của Tab
            if (tabId === 'doses-list') {
                loadDosesData();
            } else if (tabId === 'combos-list') {
                loadCombosData();
            } else if (tabId === 'products-list') {
                loadProductsData();
            } else if (tabId === 'onetime-list') {
                window.loadOneTimeProductsData();
            }
            return;
        }

        const editButton = event.target.closest('[data-edit-product-code]');
        if (editButton) {
            window.openEditModalByCode(editButton.dataset.editProductCode);
            return;
        }

        // Form-tab logic removed as we merged tabs

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

        const removeVariantButton = event.target.closest('[data-remove-variant]');
        if (removeVariantButton) {
            window.removeVariantRow(removeVariantButton.dataset.removeVariant);
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
            'reset-filter': () => window.resetFilter(),
            'toggle-all-export-cols': toggleAllExportCols,
            'confirm-export': () => window.confirmExport(),
            'close-import-error-modal': closeImportErrorModal,
            'generate-product-code': () => window.generateProductCode(),
            'add-conversion-unit': () => window.addConversionUnit(),
            'add-batch-row': () => window.addBatchRow(),
            'add-variant-row': () => window.addVariantRow(),
            'quick-add-category': () => window.quickAddCategory(),
            'quick-add-combo-category': () => window.quickAddComboCategory(),
            'toggle-advanced-fields': () => window.toggleAdvancedFields(),
            'submit-add-product': () => window.submitAddProduct(),
            'open-add-dose-modal': () => window.openAddDoseModal(),
            'close-add-dose-modal': () => window.closeAddDoseModal(),
            'generate-dose-code': () => window.generateDoseCode(),
            'open-add-combo-modal': () => window.openAddComboModal(),
            'close-add-combo-modal': () => window.closeAddComboModal(),
            'generate-combo-code': () => window.generateComboCode()
        };

        const handler = actionMap[actionButton.dataset.action];
        if (handler) handler();
    });

    const submitDoseBtn = document.getElementById('submitDoseBtn');
    if (submitDoseBtn) {
        submitDoseBtn.addEventListener('click', () => window.submitDose());
    }

    const submitComboBtn = document.getElementById('submitComboBtn');
    if (submitComboBtn) {
        submitComboBtn.addEventListener('click', () => window.submitCombo());
    }
    
    // Khởi tạo autocomplete cho Combo
    setupComboProductSearch();

    document.addEventListener('change', (event) => {
        const target = event.target;
        
        // Auto-filter when changing select boxes
        if (['filter_category', 'filter_status', 'filter_stock', 'filter_expiry'].includes(target.id)) {
            window.applyFilters();
            return;
        }

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

    const aiCommandInput = document.getElementById('aiCommandInput');
    if (aiCommandInput) {
        aiCommandInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                window.processAICommand();
            }
        });
    }

    const addNameInput = document.getElementById('add_name');
    if (addNameInput) {
        addNameInput.addEventListener('blur', () => window.autoGenerateProductCode());
    }

    const addQuickRowBtn = document.getElementById('addQuickRowBtn');
    if (addQuickRowBtn) {
        addQuickRowBtn.addEventListener('click', () => window.addQuickRow());
    }
    const submitQuickAddBtn = document.getElementById('submitQuickAddBtn');
    if (submitQuickAddBtn) {
        submitQuickAddBtn.addEventListener('click', () => window.submitQuickAddOneTimeProducts());
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
            is_ecommerce:     document.getElementById('add_is_ecommerce')?.checked || false,

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

        const isEcommerce = document.getElementById('add_is_ecommerce')?.checked;
        const ecommercePlatforms = [];
        if (isEcommerce) {
            document.querySelectorAll('#ecommercePlatformsContainer .ecommerce-platform-row').forEach(row => {
                const platform = row.querySelector('.platform-name').value;
                const price = parseFloat(row.querySelector('.platform-price').value) || 0;
                ecommercePlatforms.push({ platform, price });
            });
        }
        productData.ecommerce_platforms = ecommercePlatforms;

        const variantsData = {};
        document.querySelectorAll('#variantsContainer .variant-row').forEach(row => {
            const key = row.querySelector('.variant-key')?.value.trim();
            const values = Array.from(row.querySelectorAll('.variant-value-input'))
                               .map(input => input.value.trim())
                               .filter(v => v);
            
            if (key && values.length > 0) {
                variantsData[key] = values;
            }
        });

        const descObj = {};
        if (Object.keys(variantsData).length > 0) {
            descObj.variants = variantsData;
        }
        if (document.getElementById('add_is_one_time')?.checked) {
            descObj.is_one_time = true;
        }

        if (Object.keys(descObj).length > 0) {
            productData.description = JSON.stringify(descObj);
        } else {
            productData.description = null;
        }

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
        const DEFAULT_FAR_DATE = '2099-12-31';

        document.querySelectorAll('#batchRowsContainer .batch-row').forEach((row, index) => {
            const stock = parseFloat(row.querySelector('.batch-stock')?.value) || 0;
            const batchNumber = row.querySelector('.batch-number')?.value.trim() || `Lô ${index + 1}`;
            const expiryDate = row.querySelector('.batch-expiry')?.value;

            if (hasBatch && !expiryDate) {
                throw new Error(`Vui lòng nhập Hạn sử dụng cho lô hàng "${batchNumber}"`);
            }

            if (hasBatch || stock > 0) {
                batchData.push({
                    batch_number: batchNumber,
                    expiry_date: expiryDate || DEFAULT_FAR_DATE,
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
                                expiry_date: expDate || '2099-12-31',
                                stock_quantity: Number(row['Tồn kho']) || 0,
                                is_tracked: Boolean(row['Lô'] || expDate)
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

// ================= FILTER LOGIC =================
window.applyFilters = () => {
    if (!currentProductsList) return;
    
    const catId = window.currentCategoryId || '';
    
    const status = document.getElementById('filter_status')?.value;
    const stock = document.getElementById('filter_stock')?.value;
    const expiry = document.getElementById('filter_expiry')?.value;
    
    let filtered = currentProductsList;
    
    // 1. Filter by Category
    if (catId) {
        if (catId === 'ecommerce') {
            filtered = filtered.filter(p => p.is_ecommerce === true);
        } else {
            filtered = filtered.filter(p => p.product_categories?.id === catId || p.category_id === catId);
        }
    }
    
    // 2. Filter by Status
    if (status === 'active') {
        filtered = filtered.filter(p => p.is_active !== false);
    } else if (status === 'inactive') {
        filtered = filtered.filter(p => p.is_active === false);
    }
    
    // 3. Filter by Stock & Expiry
    if (stock !== 'all' || expiry !== 'all') {
        filtered = filtered.filter(p => {
            const batches = p.product_batches || [];
            
            // Tính tổng tồn kho
            const totalStock = batches.reduce((sum, b) => sum + (Number(b.stock_quantity) || 0), 0);
            
            // Lấy lô có hạn sử dụng gần nhất
            let nearestExpiryDate = null;
            const batchesWithExpiry = batches.filter(b => b.expiry_date);
            if (batchesWithExpiry.length > 0) {
                batchesWithExpiry.sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
                nearestExpiryDate = new Date(batchesWithExpiry[0].expiry_date);
            }

            let passStock = true;
            if (stock === 'in_stock') passStock = totalStock > 0;
            else if (stock === 'out_of_stock') passStock = totalStock <= 0;
            else if (stock === 'low_stock') passStock = totalStock > 0 && totalStock < 10;

            let passExpiry = true;
            if (expiry !== 'all') {
                if (!nearestExpiryDate) {
                    passExpiry = false; // Không có thông tin hạn
                } else {
                    const daysLeft = (nearestExpiryDate - new Date()) / (1000 * 60 * 60 * 24);
                    if (expiry === 'expired') passExpiry = daysLeft < 0;
                    else if (expiry === 'expiring_soon') passExpiry = daysLeft >= 0 && daysLeft < 90;
                    else if (expiry === 'valid') passExpiry = daysLeft >= 90;
                }
            }

            return passStock && passExpiry;
        });
    }
    
    // Update the UI
    renderProducts(filtered);
    
    // Cập nhật lại số lượng trong bảng (nếu cần)
    const container = document.getElementById('product-container');
    if (filtered.length === 0 && container) {
        container.innerHTML = '<tr><td colspan="6" class="py-10 text-center text-slate-500 font-medium">Không tìm thấy hàng hóa nào phù hợp với bộ lọc.</td></tr>';
    }
};

window.resetFilter = () => {
    if (document.getElementById('filter_status')) document.getElementById('filter_status').value = 'all';
    if (document.getElementById('filter_stock')) document.getElementById('filter_stock').value = 'all';
    if (document.getElementById('filter_expiry')) document.getElementById('filter_expiry').value = 'all';
    
    window.currentCategoryId = '';
    window.applyFilters();
};

window.clearFirstBatch = () => {
    document.getElementById('add_stock').value = '';
    document.getElementById('add_batch_no').value = '';
    document.getElementById('add_expiry').value = '';
};

window.deleteProduct = async (id, name) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn hàng hóa "${name}"?\nThao tác này sẽ xóa toàn bộ ĐVT và lô liên quan.`)) return;

    showLoading("Đang xóa hàng hóa...");
    try {
        const { error } = await supabaseClient
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            if (error.code === '23503') {
                throw new Error("Không thể xóa sản phẩm này vì đã có dữ liệu hóa đơn hoặc phiếu kho liên quan. Bạn nên chọn 'Ngừng kinh doanh' thay vì xóa.");
            }
            throw error;
        }

        showToast(`Đã xóa thành công: ${name}`);
        loadProductsData();
    } catch (err) {
        showToast('Lỗi khi xóa: ' + err.message, 'error', 5000);
    } finally {
        hideLoading();
    }
};

window.toggleAIChat = (showDetails = false) => {
    const chatWindow = document.getElementById('aiChatWindow');
    const tooltip = document.getElementById('aiFloatingTooltip');
    if (chatWindow) {
        if (chatWindow.classList.contains('hidden')) {
            chatWindow.classList.remove('hidden');
            tooltip?.classList.add('hidden'); // Ẩn bong bóng nhắc nhở khi đang mở cửa sổ chat
            const input = document.getElementById('aiCommandInput');
            if (input) setTimeout(() => input.focus(), 100);
            
            // Nếu bấm trực tiếp từ bong bóng nhắc nhở, tự động hiển thị báo cáo chi tiết cảnh báo
            if (showDetails && tooltip && tooltip.dataset.detail) {
                // Dọn dẹp tin nhắn cảnh báo cũ để tránh trùng lặp
                const oldAlerts = document.querySelectorAll('.ai-alert-message');
                oldAlerts.forEach(el => el.remove());
                
                addAIChatMessage(tooltip.dataset.detail, 'bot_success', 'ai_alert_' + Date.now(), 'ai-alert-message');
            }
        } else {
            chatWindow.classList.add('hidden');
            tooltip?.classList.remove('hidden'); // Hiện lại bong bóng khi đóng cửa sổ chat
        }
    }
};

function addAIChatMessage(message, type = 'user', id = null, extraClass = '') {
    const chatBody = document.getElementById('aiChatBody');
    if (!chatBody) return null;

    const msgDiv = document.createElement('div');
    msgDiv.className = 'p-3 rounded-xl shadow-sm text-sm border animate-in fade-in slide-in-from-bottom-2 duration-300 w-[85%] break-words';
    if (id) msgDiv.id = id;
    if (extraClass) msgDiv.className += ' ' + extraClass;
    
    if (type === 'user') {
        msgDiv.className += ' bg-blue-600 text-white rounded-tr-none self-end border-blue-700';
        msgDiv.innerHTML = message;
    } else if (type === 'bot_success') {
        msgDiv.className += ' bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-none border-emerald-200 dark:border-emerald-800 self-start border-l-4 border-l-emerald-500';
        msgDiv.innerHTML = message;
    } else if (type === 'bot_error') {
        msgDiv.className += ' bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-none border-red-200 dark:border-red-800 self-start border-l-4 border-l-red-500';
        msgDiv.innerHTML = message;
    } else if (type === 'bot_loading') {
        msgDiv.className += ' bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-none border-blue-200 dark:border-blue-800 self-start border-l-4 border-l-blue-500';
        msgDiv.innerHTML = message;
    }
    
    chatBody.appendChild(msgDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
    return msgDiv;
}

window.startAIChatReminders = () => {
    const tooltip = document.getElementById('aiFloatingTooltip');
    const textEl = document.getElementById('aiFloatingText');
    if (!tooltip || !textEl) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nearExpiryProducts = [];
    const slowMovingProducts = [];

    (currentProductsList || []).forEach(product => {
        const catName = product.product_categories?.name || product.categories?.name || '';
        const isCombo = catName.toLowerCase().includes('combo');
        const isDose = catName.toLowerCase().includes('cắt liều') || catName.toLowerCase().includes('thuốc liều') || product.product_code?.startsWith('DOSE-');
        if (isCombo || isDose) return;

        (product.product_batches || []).forEach(batch => {
            const stock = Number(batch.stock_quantity || 0);
            if (stock <= 0) return;

            // Kiểm tra cận hạn
            if (batch.expiry_date) {
                const expiry = new Date(`${batch.expiry_date}T00:00:00`);
                if (!isNaN(expiry.getTime())) {
                    const daysLeft = Math.ceil((expiry - today) / 86400000);
                    if (daysLeft <= 90) {
                        nearExpiryProducts.push({ product, batch, daysLeft });
                    }
                }
            }

            // Kiểm tra tồn kho lâu
            if (batch.created_at) {
                const importDate = new Date(batch.created_at);
                if (!isNaN(importDate.getTime())) {
                    const ageInDays = Math.floor((today - importDate) / 86400000);
                    if (ageInDays >= 30) {
                        slowMovingProducts.push({ product, batch, ageInDays });
                    }
                }
            }
        });
    });

    // Fallback: Lấy các lô hàng nhập trước cũ nhất để demo tính năng tồn lâu
    if (slowMovingProducts.length === 0 && currentProductsList.length > 0) {
        const tempBatches = [];
        currentProductsList.forEach(product => {
            const catName = product.product_categories?.name || product.categories?.name || '';
            if (catName.toLowerCase().includes('combo') || catName.toLowerCase().includes('cắt liều') || product.product_code?.startsWith('DOSE-')) return;

            (product.product_batches || []).forEach(batch => {
                const stock = Number(batch.stock_quantity || 0);
                if (stock > 0 && batch.created_at) {
                    const importDate = new Date(batch.created_at);
                    if (!isNaN(importDate.getTime())) {
                        const ageInDays = Math.floor((today - importDate) / 86400000);
                        tempBatches.push({ product, batch, ageInDays });
                    }
                }
            });
        });
        tempBatches.sort((a, b) => new Date(a.batch.created_at) - new Date(b.batch.created_at));
        slowMovingProducts.push(...tempBatches.slice(0, 3));
    }

    const messages = [];

    // Cảnh báo cận hạn / hết hạn
    if (nearExpiryProducts.length > 0) {
        const expiredCount = nearExpiryProducts.filter(item => item.daysLeft < 0).length;
        const nearCount = nearExpiryProducts.filter(item => item.daysLeft >= 0).length;
        
        if (expiredCount > 0) {
            messages.push({
                text: `⚠️ Cảnh báo: Có ${expiredCount} lô thuốc ĐÃ HẾT HẠN! Click để xem.`,
                detailHtml: `🔴 <b>DANH SÁCH LÔ THUỐC HẾT HẠN:</b><br>` + nearExpiryProducts
                    .filter(item => item.daysLeft < 0)
                    .slice(0, 3)
                    .map(item => `• <b>${item.product.name}</b> (Lô: ${item.batch.batch_number}) - Đã hết hạn ${Math.abs(item.daysLeft)} ngày!`)
                    .join('<br>')
            });
        }
        if (nearCount > 0) {
            messages.push({
                text: `⏳ Cảnh báo: Có ${nearCount} lô thuốc cận hạn sử dụng (<90 ngày)!`,
                detailHtml: `🟠 <b>DANH SÁCH LÔ THUỐC CẬN HẠN:</b><br>` + nearExpiryProducts
                    .filter(item => item.daysLeft >= 0)
                    .slice(0, 3)
                    .map(item => `• <b>${item.product.name}</b> (Lô: ${item.batch.batch_number}) - Còn ${item.daysLeft} ngày (HSD: ${new Date(item.batch.expiry_date).toLocaleDateString('vi-VN')})`)
                    .join('<br>')
            });
        }
    } else {
        messages.push({
            text: `✅ An tâm: Kho hàng của bạn không có lô thuốc cận hạn/hết hạn!`,
            detailHtml: `✅ <b>TÌNH TRẠNG HẠN SỬ DỤNG:</b> Tốt!<br>Không phát hiện lô thuốc nào cận hạn sử dụng (<90 ngày) hoặc đã hết hạn.`
        });
    }

    // Cảnh báo tồn lâu chưa bán
    if (slowMovingProducts.length > 0) {
        messages.push({
            text: `📦 Lưu ý: Có ${slowMovingProducts.length} mặt hàng tồn lâu chưa bán! Click xem.`,
            detailHtml: `🟣 <b>HÀNG TỒN KHO LÂU CHƯA BÁN:</b><br>` + slowMovingProducts
                .slice(0, 3)
                .map(item => `• <b>${item.product.name}</b> (Lô: ${item.batch.batch_number}) - Đã nhập từ ${item.ageInDays > 0 ? item.ageInDays + ' ngày trước' : 'hôm nay (mẫu thử)'} chưa bán hết (Tồn: ${item.batch.stock_quantity})`)
                .join('<br>')
        });
    }

    // Lệnh AI cập nhật giá
    messages.push({
        text: `🤖 Trợ lý AI: Thử gõ 'Sửa Panadol giá bán 20k' để cập nhật nhanh!`,
        detailHtml: `🤖 <b>TRỢ LÝ AI CẬP NHẬT GIÁ NHANH:</b><br>Bạn có thể gõ các lệnh cập nhật trực tiếp tại đây:<br>• <i>"Sửa Panadol giá bán 20k"</i><br>• <i>"Đổi tên Panadol thành Panadol Extra"</i><br>• <i>"Ngừng kinh doanh thuốc ho"</i>`
    });

    let currentIndex = 0;
    const updateText = () => {
        const activeMsg = messages[currentIndex];
        textEl.style.opacity = 0;
        setTimeout(() => {
            textEl.textContent = activeMsg.text;
            textEl.style.opacity = 1;
            tooltip.dataset.detail = activeMsg.detailHtml;
        }, 200);
        currentIndex = (currentIndex + 1) % messages.length;
    };

    updateText();
    if (window.aiReminderInterval) clearInterval(window.aiReminderInterval);
    window.aiReminderInterval = setInterval(updateText, 5000);
};

window.aiContext = null;

async function performPriceUpdate(product, newPrice, loadingMsg) {
    const baseUnit = product.product_units?.find(u => u.is_base_unit) || product.product_units?.[0];
    if (!baseUnit) throw new Error("Sản phẩm chưa có đơn vị tính để sửa giá.");

    // Cập nhật giá cho tất cả các đơn vị tính theo tỷ lệ quy đổi
    const updatedUnits = product.product_units.map(u => {
        const rate = u.conversion_rate || 1;
        return {
            ...u,
            retail_price: newPrice * rate
        };
    });

    await updateProductFull(product.id, { name: product.name }, updatedUnits, product.product_batches);
    
    if (loadingMsg) loadingMsg.remove();
    
    let unitsUpdatedText = updatedUnits.map(u => `• ${u.unit_name}: <b>${u.retail_price.toLocaleString()}đ</b>`).join('<br>');
    addAIChatMessage(`<i class="fa-solid fa-check-double mr-2 text-emerald-500"></i> Thành công: Đã cập nhật giá <b>${product.name}</b>.<br><br><div class="bg-emerald-50 dark:bg-emerald-900/30 p-2 rounded border border-emerald-100 dark:border-emerald-800 text-xs mt-2">${unitsUpdatedText}</div>`, 'bot_success');
    
    loadProductsData(); // Refresh list
}

async function performNameUpdate(product, newName, loadingMsg) {
    await updateProductFull(product.id, { name: newName }, product.product_units, product.product_batches);
    if (loadingMsg) loadingMsg.remove();
    addAIChatMessage(`<i class="fa-solid fa-check-double mr-2 text-emerald-500"></i> Thành công: Đã đổi tên <b>${product.name}</b> thành <b>${newName}</b>.`, 'bot_success');
    loadProductsData();
}

async function performBatchUpdate(product, oldBatchNo, newBatchNo, loadingMsg) {
    const batches = [...(product.product_batches || [])];
    const batch = batches.find(b => b.batch_number.toUpperCase() === oldBatchNo.toUpperCase());
    
    if (!batch) {
        if (loadingMsg) loadingMsg.remove();
        throw new Error(`Sản phẩm <b>${product.name}</b> không có lô nào là <b>"${oldBatchNo}"</b>.`);
    }

    batch.batch_number = newBatchNo;
    await updateProductFull(product.id, { name: product.name }, product.product_units, batches);
    
    if (loadingMsg) loadingMsg.remove();
    addAIChatMessage(`<i class="fa-solid fa-check-double mr-2 text-emerald-500"></i> Thành công: Đã đổi số lô <b>${oldBatchNo}</b> thành <b>${newBatchNo}</b> của sản phẩm <b>${product.name}</b>.`, 'bot_success');
    loadProductsData();
}

async function performBatchDelete(product, batchNo, loadingMsg) {
    const batches = (product.product_batches || []).filter(b => b.batch_number.toUpperCase() !== batchNo.toUpperCase());
    
    if (batches.length === (product.product_batches || []).length) {
        if (loadingMsg) loadingMsg.remove();
        throw new Error(`Sản phẩm <b>${product.name}</b> không có lô nào là <b>"${batchNo}"</b>.`);
    }

    try {
        await updateProductFull(product.id, { name: product.name }, product.product_units, batches);
        if (loadingMsg) loadingMsg.remove();
        addAIChatMessage(`<i class="fa-solid fa-check-double mr-2 text-emerald-500"></i> Thành công: Đã xóa lô <b>${batchNo}</b> của sản phẩm <b>${product.name}</b>.`, 'bot_success');
    } catch (err) {
        if (loadingMsg) loadingMsg.remove();
        if (err.message.includes('foreign key') || err.code === '23503') {
            addAIChatMessage(`<i class="fa-solid fa-triangle-exclamation mr-2 text-orange-500"></i> Không thể xóa lô <b>${batchNo}</b> vì đã có hóa đơn liên quan. <br><br><b>Gợi ý:</b> Bạn nên sửa tồn kho của lô này về 0 thay vì xóa.`, 'bot_error');
        } else {
            throw err;
        }
    }
    loadProductsData();
}

function removeTones(str) {
    if (!str) return '';
    return str.normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/đ/g, 'd').replace(/Đ/g, 'D')
              .toUpperCase();
}

/**
 * Xử lý lệnh từ AI Chat Bubble (Có State)
 */
function findProductsByKeyword(keyword) {
    if (!keyword) return [];
    keyword = removeTones(keyword).trim();
    return currentProductsList.filter(p => removeTones(p.name).includes(keyword) || p.product_code.toUpperCase() === keyword);
}

function promptProductSelection(matchingProducts, keyword, action, extraData, loadingMsg) {
    if (loadingMsg) loadingMsg.remove();
    window.aiContext = { action: action, products: matchingProducts, ...extraData };
    const names = matchingProducts.slice(0, 5).map(p => `• <b>${p.name}</b> (${p.product_code})`).join('<br>');
    const moreText = matchingProducts.length > 5 ? `<br>... và ${matchingProducts.length - 5} sản phẩm khác.` : '';
    addAIChatMessage(`Tìm thấy ${matchingProducts.length} sản phẩm chứa "<b>${keyword}</b>". Bạn muốn áp dụng cho sản phẩm nào?<br><br>${names}${moreText}<br><br><i class="text-[11px] opacity-70">👉 Nhập tên sản phẩm bạn chọn, hoặc gõ <b>"Huỷ"</b>.</i>`, 'bot_loading');
}

/**
 * Xử lý lệnh từ AI Chat Bubble (Có State)
 */
window.processAICommand = async () => {
    const input = document.getElementById('aiCommandInput');
    if (!input || !input.value.trim()) return;

    const cmd = input.value.trim();
    const cmdUpper = cmd.toUpperCase();
    const cmdNoTones = removeTones(cmd);
    input.value = ''; // Clear input
    
    addAIChatMessage(cmd, 'user');

    const loadingId = 'ai_loading_' + Date.now();
    const loadingMsg = addAIChatMessage(`<i class="fa-solid fa-spinner fa-spin mr-2 text-blue-500"></i> Đang xử lý...`, 'bot_loading', loadingId);

    try {
        // --- XỬ LÝ CONTEXT (NẾU ĐANG CHỜ PHẢN HỒI) ---
        if (window.aiContext) {
            const ctx = window.aiContext;
            if (cmdUpper === 'HUỶ' || cmdUpper === 'HỦY' || cmdUpper === 'CANCEL') {
                window.aiContext = null;
                if (loadingMsg) loadingMsg.remove();
                addAIChatMessage(`Đã huỷ thao tác.`, 'bot_success');
                return;
            }

            const selectedProduct = ctx.products.find(p => removeTones(p.name).includes(cmdNoTones) || p.product_code.toUpperCase() === cmdNoTones);
            
            if (selectedProduct) {
                window.aiContext = null;
                if (ctx.action === 'wait_for_product_selection_price') {
                    await performPriceUpdate(selectedProduct, ctx.price, loadingMsg);
                } else if (ctx.action === 'wait_for_product_selection_rename') {
                    await performNameUpdate(selectedProduct, ctx.newName, loadingMsg);
                } else if (ctx.action === 'wait_for_product_selection_status') {
                    if (loadingMsg) loadingMsg.remove();
                    if (window.openAddProductModal) {
                        window.openAddProductModal(selectedProduct);
                        const toggle = document.getElementById('add_is_active');
                        if (toggle) toggle.checked = false;
                        addAIChatMessage(`<i class="fa-solid fa-hand-pointer mr-2 text-blue-500"></i> Đã mở bảng thông tin của <b>${selectedProduct.name}</b> và tự động tắt kinh doanh. Vui lòng bấm <b>Lưu thay đổi</b>.`, 'bot_success');
                    }
                } else if (ctx.action === 'wait_for_product_selection_delete') {
                    if (loadingMsg) loadingMsg.remove();
                    if (window.openAddProductModal) {
                        window.openAddProductModal(selectedProduct);
                        addAIChatMessage(`<i class="fa-solid fa-hand-pointer mr-2 text-blue-500"></i> Đã mở bảng thông tin của <b>${selectedProduct.name}</b>. Tự bấm nút Xóa ở góc dưới cùng để xác nhận.`, 'bot_success');
                    }
                } else if (ctx.action === 'wait_for_product_selection_delete_batch') {
                    await performBatchDelete(selectedProduct, ctx.batchNo, loadingMsg);
                } else if (ctx.action === 'wait_for_product_selection_rename_batch') {
                    await performBatchUpdate(selectedProduct, ctx.oldBatch, ctx.newBatch, loadingMsg);
                }
            } else {
                if (loadingMsg) loadingMsg.remove();
                addAIChatMessage(`Không tìm thấy sản phẩm trong danh sách đề xuất. Vui lòng thử gõ lại hoặc gõ <b>"Huỷ"</b>.`, 'bot_error');
            }
            return;
        }

        // --- XỬ LÝ LỆNH MỚI ---
        
        // 1. LỆNH: SỬA TÊN (VD: Sửa tên X thành Y, Đổi X thành Y, Sửa X thành Y)
        const renameMatch = cmdNoTones.match(/(?:SUA|DOI)(?:\s+TEN)?(?:\s+THUOC)?\s+(.*?)\s+(?:THANH|TTHANHF|THAN|THANH)\s+(.*)/);
        
        // Cần đảm bảo đây không phải là lệnh sửa giá. Nếu có chữ GIA hoặc đích đến chỉ toàn số (như 1000, 20k) thì bỏ qua để xuống Sửa Giá.
        const isTargetNumber = renameMatch ? /^[\d\.\,Kk]+$/.test(renameMatch[2].trim()) : false;
        
        if (renameMatch && !cmdNoTones.includes('LO') && !cmdNoTones.includes('GIA') && !isTargetNumber) {
            const oldNameRaw = renameMatch[1].trim();
            // Lấy chính xác tên mới từ câu gốc để không bị mất dấu
            const newNameMatch = cmd.match(/(?:thành|tthanhf|than|thanh)\s+(.*)/i);
            const newName = newNameMatch ? newNameMatch[1].trim() : renameMatch[2].trim();

            const matchingProducts = findProductsByKeyword(oldNameRaw);
            if (matchingProducts.length === 0) {
                throw new Error(`Không tìm thấy sản phẩm nào có chứa tên "${oldNameRaw}".`);
            } else if (matchingProducts.length > 1) {
                const exactMatch = matchingProducts.find(p => removeTones(p.name) === oldNameRaw || p.product_code.toUpperCase() === oldNameRaw);
                if (exactMatch) await performNameUpdate(exactMatch, newName, loadingMsg);
                else promptProductSelection(matchingProducts, oldNameRaw, 'wait_for_product_selection_rename', { newName }, loadingMsg);
            } else {
                await performNameUpdate(matchingProducts[0], newName, loadingMsg);
            }
            return;
        }

        // 2. LỆNH: SỬA LÔ / ĐỔI LÔ
        const batchMatch = cmdNoTones.match(/(?:SUA|DOI) LO (.*?)\s+(?:THANH|TTHANHF|THAN)\s+(.*?)(?:\s+(?:CUA|THUOC)\s+(.*))?$/);
        if (batchMatch) {
            const oldBatch = batchMatch[1].trim();
            const newBatchRaw = batchMatch[2].trim();
            // Try extracting new batch with original case
            const newBatchStrMatch = cmd.match(/(?:thành|tthanhf|than|thanh)\s+(.*?)(?:\s+(?:của|thuốc)\s+|$)/i);
            const newBatch = newBatchStrMatch ? newBatchStrMatch[1].trim() : newBatchRaw;

            const productNameRaw = batchMatch[3] ? batchMatch[3].trim() : '';
            if (!productNameRaw) throw new Error("Vui lòng ghi rõ tên thuốc. Ví dụ: 'Sửa lô L01 thành L02 thuốc Panadol'.");

            const matchingProducts = findProductsByKeyword(productNameRaw);
            if (matchingProducts.length === 0) {
                throw new Error(`Không tìm thấy sản phẩm "${productNameRaw}".`);
            } else if (matchingProducts.length > 1) {
                const exactMatch = matchingProducts.find(p => removeTones(p.name) === productNameRaw || p.product_code.toUpperCase() === productNameRaw);
                if (exactMatch) await performBatchUpdate(exactMatch, oldBatch, newBatch, loadingMsg);
                else promptProductSelection(matchingProducts, productNameRaw, 'wait_for_product_selection_rename_batch', { oldBatch, newBatch }, loadingMsg);
            } else {
                await performBatchUpdate(matchingProducts[0], oldBatch, newBatch, loadingMsg);
            }
            return;
        }

        // 3. LỆNH: XÓA LÔ
        const delBatchMatch = cmdNoTones.match(/XOA LO (.*?)\s+(?:CUA|THUOC)\s+(.*)/);
        if (delBatchMatch) {
            const batchNo = delBatchMatch[1].trim();
            const productNameRaw = delBatchMatch[2].trim();
            const matchingProducts = findProductsByKeyword(productNameRaw);

            if (matchingProducts.length === 0) {
                throw new Error(`Không tìm thấy sản phẩm "${productNameRaw}".`);
            } else if (matchingProducts.length > 1) {
                promptProductSelection(matchingProducts, productNameRaw, 'wait_for_product_selection_delete_batch', { batchNo }, loadingMsg);
            } else {
                await performBatchDelete(matchingProducts[0], batchNo, loadingMsg);
            }
            return;
        }

        // 4. LỆNH: NGỪNG KINH DOANH / XÓA SẢN PHẨM
        const statusMatch = cmdNoTones.match(/(?:NGUNG KINH DOANH|XOA SAN PHAM|XOA THUOC|XOA)\s+(.*)/);
        if (statusMatch && !cmdNoTones.includes('LO') && !/\d+[K]/.test(cmdNoTones) && !cmdNoTones.includes('THANH')) {
            const isInactive = cmdNoTones.includes('NGUNG');
            const productNameRaw = statusMatch[1].trim();
            const matchingProducts = findProductsByKeyword(productNameRaw);

            if (matchingProducts.length === 0) {
                throw new Error(`Không tìm thấy sản phẩm "${productNameRaw}".`);
            } else if (matchingProducts.length > 1) {
                const exactMatch = matchingProducts.find(p => removeTones(p.name) === productNameRaw || p.product_code.toUpperCase() === productNameRaw);
                if (exactMatch) {
                    if (loadingMsg) loadingMsg.remove();
                    if (window.openAddProductModal) {
                        window.openAddProductModal(exactMatch);
                        if (isInactive) {
                            const toggle = document.getElementById('add_is_active');
                            if (toggle) toggle.checked = false;
                            addAIChatMessage(`<i class="fa-solid fa-hand-pointer mr-2 text-blue-500"></i> Đã tắt kinh doanh <b>${exactMatch.name}</b>. Bấm Lưu để xác nhận.`, 'bot_success');
                        } else {
                            addAIChatMessage(`<i class="fa-solid fa-hand-pointer mr-2 text-blue-500"></i> Đã mở <b>${exactMatch.name}</b>. Hãy tự bấm nút Xóa.`, 'bot_success');
                        }
                    }
                } else {
                    promptProductSelection(matchingProducts, productNameRaw, isInactive ? 'wait_for_product_selection_status' : 'wait_for_product_selection_delete', {}, loadingMsg);
                }
            } else {
                if (loadingMsg) loadingMsg.remove();
                if (window.openAddProductModal) {
                    window.openAddProductModal(matchingProducts[0]);
                    if (isInactive) {
                        const toggle = document.getElementById('add_is_active');
                        if (toggle) toggle.checked = false;
                        addAIChatMessage(`<i class="fa-solid fa-hand-pointer mr-2 text-blue-500"></i> Đã tắt kinh doanh <b>${matchingProducts[0].name}</b>. Bấm Lưu để xác nhận.`, 'bot_success');
                    } else {
                        addAIChatMessage(`<i class="fa-solid fa-hand-pointer mr-2 text-blue-500"></i> Đã mở <b>${matchingProducts[0].name}</b>. Hãy tự bấm nút Xóa.`, 'bot_success');
                    }
                }
            }
            return;
        }

        // 5. LỆNH: SỬA GIÁ
        if (cmdNoTones.includes('SUA') || cmdNoTones.includes('CHINH') || cmdNoTones.includes('GIA') || /\d+[K]/.test(cmdNoTones)) {
            const priceMatch = cmdNoTones.match(/(\d+[K]?)/);
            if (!priceMatch) throw new Error("Không tìm thấy giá tiền. Thử: 'Sửa Panadol giá 20k'.");
            
            let rawPrice = priceMatch[1];
            let newPrice = rawPrice.includes('K') ? parseInt(rawPrice.replace('K', '')) * 1000 : parseInt(rawPrice);
            
            let productNameRaw = cmdNoTones.replace(/SUA|CHINH|GIA|BAN|VON|THANH/gi, '').replace(priceMatch[1], '').trim();
            if (!productNameRaw) throw new Error("Không nhận diện được tên sản phẩm.");

            const matchingProducts = findProductsByKeyword(productNameRaw);
            
            if (matchingProducts.length === 0) {
                throw new Error(`Không tìm thấy sản phẩm nào tên là "${productNameRaw}".`);
            } else if (matchingProducts.length > 1) {
                const exactMatch = matchingProducts.find(p => removeTones(p.name) === productNameRaw || p.product_code.toUpperCase() === productNameRaw);
                if (exactMatch) await performPriceUpdate(exactMatch, newPrice, loadingMsg);
                else promptProductSelection(matchingProducts, productNameRaw, 'wait_for_product_selection_price', { price: newPrice }, loadingMsg);
            } else {
                await performPriceUpdate(matchingProducts[0], newPrice, loadingMsg);
            }
            return;
        }

        throw new Error("Tôi chưa hiểu lệnh này. Thử: 'Sửa X giá 20k', 'Đổi tên X thành Y', 'Ngừng kinh doanh X'.");
    } catch (err) {
        if (loadingMsg) loadingMsg.remove();
        addAIChatMessage(`<i class="fa-solid fa-triangle-exclamation mr-2 text-red-500"></i> Lỗi: ${err.message}`, 'bot_error');
    }
};

// ================= THIẾT LẬP THUỐC LIỀU & COMBO =================

async function getDosesCategoryId() {
    const { data, error } = await supabaseClient
        .from('categories')
        .select('id')
        .or('name.ilike.Thuốc cắt liều,name.ilike.Thuốc liều');
    if (data && data.length > 0) return data[0].id;
    
    const { data: newCat, error: createErr } = await supabaseClient
        .from('categories')
        .insert([{ name: 'Thuốc cắt liều' }])
        .select()
        .single();
    return newCat?.id || 'f59542da-6c03-46df-b056-7c26229ab118';
}

async function getCombosCategoryId() {
    const { data, error } = await supabaseClient
        .from('categories')
        .select('id')
        .ilike('name', '%Combo%'); // Dùng wildcard để khớp cả 'Combo Dưỡng Da', 'Combo Trị Mụn', v.v.
    if (data && data.length > 0) return data[0].id;
    
    const { data: newCat, error: createErr } = await supabaseClient
        .from('categories')
        .insert([{ name: 'Combo' }])
        .select()
        .single();
    return newCat?.id || 'c1417a86-7a86-4fa2-bf45-c1417a86a345';
}

async function loadDosesData() {
    const container = document.getElementById('doses-container');
    const loading = document.getElementById('doses-loading');
    if (!container) return;
    if (loading) loading.classList.remove('hidden');
    
    try {
        const catId = await getDosesCategoryId();
        const { data: doses, error } = await supabaseClient
            .from('products')
            .select(`
                *,
                product_units(*),
                categories(name)
            `)
            .eq('category_id', catId);
            
        if (error) throw error;
        
        if (loading) loading.classList.add('hidden');
        
        if (!doses || doses.length === 0) {
            container.innerHTML = `<tr><td colspan="5" class="py-10 text-center text-slate-500 font-medium italic bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">Chưa có liều thuốc nào được thiết lập. Hãy click "Thêm liều mới" để bắt đầu!</td></tr>`;
            return;
        }
        
        container.innerHTML = doses.map(dose => {
            const baseUnit = dose.product_units?.find(u => u.is_base_unit) || dose.product_units?.[0] || {};
            return `
            <tr class="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 shadow-sm transition-colors rounded-2xl">
                <td class="py-4 px-5 font-mono font-bold text-slate-700 dark:text-slate-350 rounded-l-2xl">${dose.product_code}</td>
                <td class="py-4 px-5 font-bold text-slate-800 dark:text-white">${dose.name}</td>
                <td class="py-4 px-5"><span class="px-2.5 py-1 bg-blue-50/50 border border-blue-200 text-blue-700 text-xs font-black rounded-lg">${baseUnit.unit_name || 'Liều'}</span></td>
                <td class="py-4 px-5 font-black text-emerald-600 dark:text-emerald-400 font-mono">${Number(baseUnit.retail_price || 0).toLocaleString()}đ</td>
                <td class="py-4 px-5 text-center rounded-r-2xl">
                    <div class="flex items-center justify-center gap-2">
                        <button onclick="window.openEditDoseModal('${dose.id}')" class="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-slate-200 dark:border-slate-700">
                            <i class="fa-solid fa-pen text-[10px]"></i>
                        </button>
                        <button onclick="window.deleteDose('${dose.id}', '${dose.name}')" class="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm border border-slate-200 dark:border-slate-700">
                            <i class="fa-solid fa-trash text-[10px]"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    } catch (err) {
        console.error("Lỗi khi tải thuốc liều:", err);
        container.innerHTML = `<tr><td colspan="5" class="py-10 text-center text-red-500 font-medium">Lỗi tải dữ liệu: ${err.message}</td></tr>`;
        if (loading) loading.classList.add('hidden');
    }
}

async function loadCombosData() {
    const container = document.getElementById('combos-container');
    const loading = document.getElementById('combos-loading');
    if (!container) return;
    if (loading) loading.classList.remove('hidden');
    
    try {
        const catId = await getCombosCategoryId();
        const { data: combos, error } = await supabaseClient
            .from('products')
            .select(`
                *,
                product_units(*),
                categories(name)
            `)
            .eq('category_id', catId);
            
        if (error) throw error;
        
        if (loading) loading.classList.add('hidden');
        
        if (!combos || combos.length === 0) {
            container.innerHTML = `<tr><td colspan="5" class="py-10 text-center text-slate-500 font-medium italic bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">Chưa có combo nào được thiết lập. Hãy click "Thêm combo mới" để bắt đầu!</td></tr>`;
            return;
        }
        
        container.innerHTML = combos.map(combo => {
            const baseUnit = combo.product_units?.find(u => u.is_base_unit) || combo.product_units?.[0] || {};
            let childDisplay = 'Chưa liên kết thuốc';
            try {
                const descObj = combo.description ? JSON.parse(combo.description) : null;
                if (descObj && descObj.isCombo && descObj.items) {
                    childDisplay = descObj.items.map(item => `${item.name} (x${item.quantity} ${item.unit})`).join(', ');
                }
            } catch (e) {
                console.warn("Lỗi parse JSON combo:", e);
            }
            
            return `
            <tr class="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 shadow-sm transition-colors rounded-2xl">
                <td class="py-4 px-5 font-mono font-bold text-slate-700 dark:text-slate-350 rounded-l-2xl">${combo.product_code}</td>
                <td class="py-4 px-5 font-bold text-slate-800 dark:text-white">${combo.name}</td>
                <td class="py-4 px-5 text-xs text-slate-500 max-w-xs truncate" title="${childDisplay}">${childDisplay}</td>
                <td class="py-4 px-5 font-black text-emerald-600 dark:text-emerald-400 font-mono">${Number(baseUnit.retail_price || 0).toLocaleString()}đ</td>
                <td class="py-4 px-5 text-center rounded-r-2xl">
                    <div class="flex items-center justify-center gap-2">
                        <button onclick="window.openEditComboModal('${combo.id}')" class="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-slate-200 dark:border-slate-700">
                            <i class="fa-solid fa-pen text-[10px]"></i>
                        </button>
                        <button onclick="window.deleteCombo('${combo.id}', '${combo.name}')" class="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm border border-slate-200 dark:border-slate-700">
                            <i class="fa-solid fa-trash text-[10px]"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    } catch (err) {
        console.error("Lỗi khi tải combo:", err);
        container.innerHTML = `<tr><td colspan="5" class="py-10 text-center text-red-500 font-medium">Lỗi tải dữ liệu: ${err.message}</td></tr>`;
        if (loading) loading.classList.add('hidden');
    }
}

window.openAddDoseModal = () => {
    document.getElementById('addDoseModalTitle').textContent = 'Thêm thuốc cắt liều mới';
    document.getElementById('add_dose_id').value = '';
    document.getElementById('add_dose_name').value = '';
    document.getElementById('add_dose_code').value = '';
    document.getElementById('add_dose_unit').value = 'Liều';
    document.getElementById('add_dose_price').value = '';
    document.getElementById('addDoseModal').classList.remove('hidden');
};

window.openEditDoseModal = async (id) => {
    try {
        const { data: dose, error } = await supabaseClient
            .from('products')
            .select('*, product_units(*)')
            .eq('id', id)
            .single();
            
        if (error) throw error;
        
        document.getElementById('addDoseModalTitle').textContent = 'Cập Nhật Thuốc Cắt Liều';
        document.getElementById('add_dose_id').value = dose.id;
        document.getElementById('add_dose_name').value = dose.name;
        document.getElementById('add_dose_code').value = dose.product_code;
        
        const baseUnit = dose.product_units?.find(u => u.is_base_unit) || dose.product_units?.[0] || {};
        document.getElementById('add_dose_unit').value = baseUnit.unit_name || 'Liều';
        document.getElementById('add_dose_price').value = baseUnit.retail_price || 0;
        
        document.getElementById('addDoseModal').classList.remove('hidden');
    } catch (err) {
        showToast('Lỗi khi tải thông tin thuốc cắt liều: ' + err.message, 'error');
    }
};

window.closeAddDoseModal = () => {
    document.getElementById('addDoseModal').classList.add('hidden');
};

window.deleteDose = async (id, name) => {
    if (!confirm(`Bạn có chắc muốn xóa liều thuốc "${name}"?`)) return;
    try {
        const { error } = await supabaseClient
            .from('products')
            .delete()
            .eq('id', id);
        if (error) throw error;
        showToast('Đã xóa liều thuốc thành công!', 'success');
        loadDosesData();
    } catch (err) {
        showToast('Lỗi khi xóa liều thuốc: ' + err.message, 'error');
    }
};

window.generateDoseCode = async () => {
    const codeInput = document.getElementById('add_dose_code');
    if (codeInput) {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        codeInput.value = `TL${randomNum}`;
    }
};

window.submitDose = async () => {
    const form = document.getElementById('addDoseForm');
    if (!form.reportValidity()) return;
    
    const id = document.getElementById('add_dose_id').value;
    const name = document.getElementById('add_dose_name').value.trim();
    const code = document.getElementById('add_dose_code').value.trim().toUpperCase();
    const unitName = document.getElementById('add_dose_unit').value.trim();
    const price = parseFloat(document.getElementById('add_dose_price').value) || 0;
    
    const submitBtn = document.getElementById('submitDoseBtn');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Đang lưu...'; }
    
    try {
        const catId = await getDosesCategoryId();
        
        const productData = {
            name: name,
            product_code: code,
            category_id: catId,
            is_active: true,
            is_direct_sale: true,
            is_component_item: false
        };
        
        let savedProduct;
        if (id) {
            const { data, error } = await supabaseClient
                .from('products')
                .update(productData)
                .eq('id', id)
                .select()
                .single();
                
            if (error) throw error;
            savedProduct = data;
            
            await supabaseClient.from('product_units').delete().eq('product_id', id);
        } else {
            const { data, error } = await supabaseClient
                .from('products')
                .insert([productData])
                .select()
                .single();
                
            if (error) throw error;
            savedProduct = data;
        }
        
        const unitData = {
            product_id: savedProduct.id,
            unit_name: unitName,
            conversion_rate: 1,
            is_base_unit: true,
            cost_price: 0,
            retail_price: price
        };
        
        const { error: unitErr } = await supabaseClient
            .from('product_units')
            .insert([unitData]);
            
        if (unitErr) throw unitErr;
        
        showToast('Lưu thuốc cắt liều thành công!', 'success');
        window.closeAddDoseModal();
        loadDosesData();
    } catch (err) {
        console.error("Lỗi khi lưu thuốc cắt liều:", err);
        showToast('Lỗi khi lưu thuốc cắt liều: ' + err.message, 'error');
    } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Lưu thuốc cắt liều'; }
    }
};

// ================= COMBO MANAGEMENT =================

let selectedComboItems = [];

window.openAddComboModal = () => {
    document.getElementById('addComboModalTitle').textContent = 'Thêm Combo Mới';
    document.getElementById('add_combo_id').value = '';
    document.getElementById('add_combo_name').value = '';
    const catSelect = document.getElementById('add_combo_category');
    if (catSelect) catSelect.value = '';
    document.getElementById('add_combo_code').value = '';
    document.getElementById('add_combo_price').value = '';
    document.getElementById('comboProductSearchInput').value = '';
    selectedComboItems = [];
    renderSelectedComboItems();
    document.getElementById('addComboModal').classList.remove('hidden');
};

window.openEditComboModal = async (id) => {
    try {
        const { data: combo, error } = await supabaseClient
            .from('products')
            .select('*, product_units(*)')
            .eq('id', id)
            .single();
            
        if (error) throw error;
        
        document.getElementById('addComboModalTitle').textContent = 'Cập Nhật Combo';
        document.getElementById('add_combo_id').value = combo.id;
        document.getElementById('add_combo_name').value = combo.name;
        const catSelect = document.getElementById('add_combo_category');
        if (catSelect) catSelect.value = combo.category_id || '';
        document.getElementById('add_combo_code').value = combo.product_code;
        
        const baseUnit = combo.product_units?.find(u => u.is_base_unit) || combo.product_units?.[0] || {};
        document.getElementById('add_combo_price').value = baseUnit.retail_price || 0;
        document.getElementById('comboProductSearchInput').value = '';
        
        selectedComboItems = [];
        try {
            const descObj = combo.description ? JSON.parse(combo.description) : null;
            if (descObj && descObj.isCombo && descObj.items) {
                selectedComboItems = descObj.items;
            }
        } catch (e) {
            console.warn("Lỗi parse combo items:", e);
        }
        
        renderSelectedComboItems();
        document.getElementById('addComboModal').classList.remove('hidden');
    } catch (err) {
        showToast('Lỗi khi tải thông tin combo: ' + err.message, 'error');
    }
};

window.closeAddComboModal = () => {
    document.getElementById('addComboModal').classList.add('hidden');
};

window.generateComboCode = () => {
    const codeInput = document.getElementById('add_combo_code');
    if (codeInput) {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        codeInput.value = `CB${randomNum}`;
    }
};

window.deleteCombo = async (id, name) => {
    if (!confirm(`Bạn có chắc muốn xóa combo "${name}"?`)) return;
    try {
        const { error } = await supabaseClient
            .from('products')
            .delete()
            .eq('id', id);
        if (error) throw error;
        showToast('Đã xóa combo thành công!', 'success');
        loadCombosData();
    } catch (err) {
        showToast('Lỗi khi xóa combo: ' + err.message, 'error');
    }
};

function renderSelectedComboItems() {
    const container = document.getElementById('comboSelectedItemsContainer');
    const noItemsText = document.getElementById('comboNoItemsText');
    if (!container) return;
    
    if (selectedComboItems.length === 0) {
        container.innerHTML = '';
        if (noItemsText) noItemsText.classList.remove('hidden');
        return;
    }
    
    if (noItemsText) noItemsText.classList.add('hidden');
    
    container.innerHTML = selectedComboItems.map((item, idx) => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
            <td class="py-3 text-center">
                <button type="button" onclick="window.removeComboItem(${idx})" class="text-red-500 hover:text-red-700 p-1">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>
            <td class="py-3 font-bold text-slate-700 dark:text-slate-200">${item.name}</td>
            <td class="py-3 text-center">
                <input type="number" min="1" value="${item.quantity}" onchange="window.updateComboItemQty(${idx}, this.value)" class="w-16 px-2 py-1 text-center font-bold font-mono border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded text-slate-800 dark:text-white outline-none">
            </td>
            <td class="py-3 text-center">
                <span class="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded">${item.unit}</span>
            </td>
        </tr>
    `).join('');
}

window.removeComboItem = (idx) => {
    selectedComboItems.splice(idx, 1);
    renderSelectedComboItems();
};

window.updateComboItemQty = (idx, val) => {
    selectedComboItems[idx].quantity = Math.max(1, parseInt(val) || 1);
};

function setupComboProductSearch() {
    const input = document.getElementById('comboProductSearchInput');
    const suggestions = document.getElementById('comboProductSuggestions');
    if (!input || !suggestions) return;
    
    input.addEventListener('input', () => {
        const query = input.value.trim().toLowerCase();
        if (!query) {
            suggestions.classList.add('hidden');
            return;
        }
        
        const matched = currentProductsList.filter(p => {
            const isDose = p.categories?.name === 'Thuốc cắt liều' || p.category_id === 'f59542da-6c03-46df-b056-7c26229ab118';
            const isCombo = p.categories?.name === 'Combo';
            const matchesQuery = p.name.toLowerCase().includes(query) || p.product_code.toLowerCase().includes(query);
            return !isDose && !isCombo && matchesQuery;
        }).slice(0, 10);
        
        if (matched.length === 0) {
            suggestions.innerHTML = `<li class="px-4 py-3 text-slate-400 text-xs italic">Không tìm thấy sản phẩm phù hợp.</li>`;
            suggestions.classList.remove('hidden');
            return;
        }
        
        suggestions.innerHTML = matched.map(p => {
            const baseUnit = p.product_units?.find(u => u.is_base_unit) || p.product_units?.[0] || {};
            return `
            <li onclick="window.addComboProduct('${p.id}', '${p.name.replace(/'/g, "\\'")}', '${baseUnit.unit_name || 'Viên'}')" class="px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-slate-850 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer flex justify-between items-center">
                <span>${p.name} <span class="text-[10px] text-slate-400 font-mono">(${p.product_code})</span></span>
                <span class="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded">${baseUnit.unit_name || 'Đơn vị'}</span>
            </li>`;
        }).join('');
        
        suggestions.classList.remove('hidden');
    });
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#comboProductSearchInput') && !e.target.closest('#comboProductSuggestions')) {
            suggestions.classList.add('hidden');
        }
    });
}

window.addComboProduct = (id, name, unit) => {
    const existing = selectedComboItems.find(item => item.id === id);
    if (existing) {
        existing.quantity += 1;
    } else {
        selectedComboItems.push({
            id: id,
            name: name,
            unit: unit,
            quantity: 1
        });
    }
    
    renderSelectedComboItems();
    document.getElementById('comboProductSearchInput').value = '';
    document.getElementById('comboProductSuggestions').classList.add('hidden');
};

window.submitCombo = async () => {
    const form = document.getElementById('addComboForm');
    if (!form.reportValidity()) return;
    
    if (selectedComboItems.length === 0) {
        showToast('Vui lòng thêm ít nhất 1 sản phẩm vào combo.', 'error');
        return;
    }
    
    const id = document.getElementById('add_combo_id').value;
    const name = document.getElementById('add_combo_name').value.trim();
    const code = document.getElementById('add_combo_code').value.trim().toUpperCase();
    const price = parseFloat(document.getElementById('add_combo_price').value) || 0;
    
    const submitBtn = document.getElementById('submitComboBtn');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Đang lưu...'; }
    
    try {
        let catId = document.getElementById('add_combo_category')?.value;
        if (!catId) {
            catId = await getCombosCategoryId();
        }
        
        const descriptionObj = {
            isCombo: true,
            items: selectedComboItems
        };
        
        const productData = {
            name: name,
            product_code: code,
            category_id: catId,
            is_active: true,
            is_direct_sale: true,
            is_component_item: false,
            description: JSON.stringify(descriptionObj)
        };
        
        let savedProduct;
        if (id) {
            const { data, error } = await supabaseClient
                .from('products')
                .update(productData)
                .eq('id', id)
                .select()
                .single();
                
            if (error) throw error;
            savedProduct = data;
            
            await supabaseClient.from('product_units').delete().eq('product_id', id);
        } else {
            const { data, error } = await supabaseClient
                .from('products')
                .insert([productData])
                .select()
                .single();
                
            if (error) throw error;
            savedProduct = data;
        }
        
        const unitData = {
            product_id: savedProduct.id,
            unit_name: 'Combo',
            conversion_rate: 1,
            is_base_unit: true,
            cost_price: 0,
            retail_price: price
        };
        
        const { error: unitErr } = await supabaseClient
            .from('product_units')
            .insert([unitData]);
            
        if (unitErr) throw unitErr;
        
        showToast('Lưu combo thành công!', 'success');
        window.closeAddComboModal();
        loadCombosData();
    } catch (err) {
        console.error("Lỗi khi lưu combo:", err);
        showToast('Lỗi khi lưu combo: ' + err.message, 'error');
    } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Lưu Combo'; }
    }
};




// WARNING: Hàm này cũng tồn tại trong inventoryController.js.
// Nếu cần sửa logic xóa lô, phải sửa ở CẢ HAI file.
window.deleteZeroBatch = async (batchId, batchNumber) => {
    if (!batchId) return;
    if (!confirm(`Bạn có chắc chắn muốn xóa lô "${batchNumber}" đã về 0 tồn này khỏi hệ thống?`)) return;

    try {
        showLoading("Đang xóa lô...");
        const { error } = await supabaseClient
            .from('product_batches')
            .delete()
            .eq('id', batchId)
            .eq('stock_quantity', 0); // safety check

        if (error) {
            if (error.message?.includes('violates foreign key constraint') || error.code === '23503') {
                throw new Error("Lô hàng này đã có giao dịch phát sinh trong lịch sử (hóa đơn, phiếu nhập/xuất), không thể xóa cứng khỏi cơ sở dữ liệu để bảo toàn dữ liệu kế toán.");
            }
            throw error;
        }
        
        showToast(`Đã xóa thành công lô "${batchNumber}" khỏi hệ thống.`, 'success');
        
        // Cập nhật in-memory để không phải gọi API Supabase tải lại toàn bộ
        currentProductsList.forEach(p => {
            if (p.product_batches) {
                p.product_batches = p.product_batches.filter(b => b.id !== batchId);
            }
        });
        
        // Vẽ lại danh sách sản phẩm tức thời từ bộ nhớ cục bộ
        const hasActiveFilter = window.currentCategoryId || 
            (document.getElementById('filter_status') && document.getElementById('filter_status').value !== 'all') || 
            (document.getElementById('filter_stock') && document.getElementById('filter_stock').value !== 'all') || 
            (document.getElementById('filter_expiry') && document.getElementById('filter_expiry').value !== 'all');
            
        if (hasActiveFilter) {
            window.applyFilters();
        } else {
            renderProducts(currentProductsList);
        }
        setupSearch(currentProductsList);
        
        // Tự động khôi phục từ khóa tìm kiếm (nếu có)
        const searchInput = document.getElementById('searchInput');
        if (searchInput && searchInput.value.trim()) {
            searchInput.dispatchEvent(new Event('input'));
        }
    } catch (err) {
        showToast('Không thể xóa lô: ' + err.message, 'error', 5000);
    } finally {
        hideLoading();
    }
};

// ================= HÀNG BÁN MỘT LẦN & NHẬP NHANH HÀNG LOẠT =================

let quickRowsCount = 0;

window.loadOneTimeProductsData = async () => {
    try {
        const products = await fetchProducts();
        const oneTimeProducts = products.filter(p => {
            if (p.description) {
                try {
                    const descObj = JSON.parse(p.description);
                    return descObj && descObj.is_one_time === true;
                } catch (e) {}
            }
            return false;
        });

        renderOneTimeProductsList(oneTimeProducts);

        const rowsContainer = document.getElementById('quick-add-rows');
        if (rowsContainer && rowsContainer.children.length === 0) {
            quickRowsCount = 0;
            rowsContainer.innerHTML = '';
            // Khởi tạo sẵn 3 dòng trống cho người dùng nhập nhanh
            window.addQuickRow();
            window.addQuickRow();
            window.addQuickRow();
        }
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu hàng bán 1 lần:", error);
        showToast("Lỗi khi tải danh sách: " + error.message, "error");
    }
};

function renderOneTimeProductsList(products) {
    const container = document.getElementById('one-time-products-list-container');
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="7" class="py-8 text-center text-slate-500 font-medium bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    Chưa có mặt hàng bán một lần nào trong kho.
                </td>
            </tr>
        `;
        return;
    }

    container.innerHTML = products.map(p => {
        const baseUnit = p.product_units?.find(u => u.is_base_unit) || {};
        const batches = p.product_batches || [];
        const totalStock = batches.reduce((sum, b) => sum + Number(b.stock_quantity || 0), 0);
        
        let expiryText = 'Không quản lý lô';
        const expiringBatch = batches.find(b => b.is_tracked);
        if (expiringBatch && expiringBatch.expiry_date !== '2099-12-31') {
            expiryText = new Date(expiringBatch.expiry_date).toLocaleDateString('vi-VN');
        }

        const moneyFmt = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

        return `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <td class="py-3 px-4 font-mono font-bold text-slate-500 text-xs">${p.product_code}</td>
                <td class="py-3 px-4 font-bold text-slate-800 dark:text-white">${p.name}</td>
                <td class="py-3 px-4 text-right font-bold text-slate-600 dark:text-slate-400">${moneyFmt.format(baseUnit.cost_price || 0)}</td>
                <td class="py-3 px-4 text-right font-bold text-blue-600 dark:text-blue-400">${moneyFmt.format(baseUnit.retail_price || 0)}</td>
                <td class="py-3 px-4 text-black ${totalStock > 0 ? 'text-slate-800 dark:text-white' : 'text-red-500'}">${totalStock} ${baseUnit.unit_name || 'ĐVT'}</td>
                <td class="py-3 px-4 text-xs font-bold text-slate-500">${expiryText}</td>
                <td class="py-3 px-4 text-center">
                    <button onclick="window.deleteProduct('${p.id}', '${p.name.replace(/'/g, "\\'")}')" class="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-900/20 text-red-600 flex items-center justify-center transition-colors mx-auto" title="Xóa mặt hàng">
                        <i class="fa-solid fa-trash-can text-xs"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

window.addQuickRow = () => {
    const container = document.getElementById('quick-add-rows');
    if (!container) return;

    quickRowsCount++;
    const rowId = `quick-row-${quickRowsCount}`;
    const tr = document.createElement('tr');
    tr.id = rowId;
    tr.className = 'quick-row-item hover:bg-slate-50/70 dark:hover:bg-slate-950/40 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2';
    
    tr.innerHTML = `
        <td class="py-3 px-4 text-center font-bold text-slate-400 text-xs">${container.children.length + 1}</td>
        <td class="py-2 px-2">
            <input type="text" class="quick-name w-full bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" required placeholder="Tên hàng khuyến mãi, quà tặng...">
        </td>
        <td class="py-2 px-1">
            <input type="text" class="quick-unit w-full bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" required value="Viên" placeholder="Viên...">
        </td>
        <td class="py-2 px-1">
            <input type="number" class="quick-cost w-full bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs font-mono text-right text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" min="0" placeholder="0">
        </td>
        <td class="py-2 px-1">
            <input type="number" class="quick-retail w-full bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-right text-blue-600 dark:text-blue-400 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" required min="0" placeholder="0">
        </td>
        <td class="py-2 px-1">
            <div class="quick-conversions-list space-y-1.5 flex flex-col justify-center">
                <!-- Danh sách ĐVT quy đổi con sẽ render ở đây -->
            </div>
            <button type="button" class="add-conversion-unit-btn mt-1 text-[10px] font-black uppercase text-emerald-600 hover:text-emerald-700 dark:text-emerald-450 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors">
                <i class="fa-solid fa-plus-circle"></i> Thêm ĐVT
            </button>
        </td>
        <td class="py-2 px-1">
            <input type="number" class="quick-stock w-full bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs font-mono font-black text-right text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" required min="1" value="10">
        </td>
        <td class="py-2 px-2">
            <input type="date" class="quick-expiry w-full bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs font-mono text-slate-650 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all">
        </td>
        <td class="py-3 px-4 text-center">
            <button type="button" onclick="window.removeQuickRow('${rowId}')" class="w-8 h-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center justify-center transition-colors mx-auto" title="Xóa dòng này">
                <i class="fa-solid fa-xmark text-sm"></i>
            </button>
        </td>
    `;

    container.appendChild(tr);

    const conversionsList = tr.querySelector('.quick-conversions-list');
    const addConvBtn = tr.querySelector('.add-conversion-unit-btn');
    const unitInput = tr.querySelector('.quick-unit');

    // Hàm phụ thêm dòng quy đổi nhỏ
    const appendConversionItem = () => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'conversion-item flex items-center gap-1 animate-in fade-in zoom-in-95 duration-150';
        const baseUnitText = unitInput.value.trim() || 'Viên';
        
        itemDiv.innerHTML = `
            <span class="text-slate-400 text-[10px]">1</span>
            <input type="text" class="quick-large-unit w-16 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl px-2 py-1 text-[10px] font-bold text-center text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" placeholder="Hộp/Vỉ...">
            <span class="text-slate-400 text-[10px]">=</span>
            <input type="number" class="quick-conversion w-12 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl px-1.5 py-1 text-[10px] font-mono font-bold text-center text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" min="2" placeholder="Tỷ lệ">
            <span class="quick-unit-label text-slate-400 text-[10px] font-black truncate max-w-[32px]">${baseUnitText}</span>
            <button type="button" class="remove-conversion-item text-slate-400 hover:text-red-500 transition-colors p-1" title="Xóa quy đổi này">
                <i class="fa-solid fa-xmark text-xs"></i>
            </button>
        `;

        itemDiv.querySelector('.remove-conversion-item').addEventListener('click', () => {
            itemDiv.classList.add('animate-out', 'fade-out', 'scale-95');
            setTimeout(() => itemDiv.remove(), 120);
        });

        conversionsList.appendChild(itemDiv);
    };

    // Khi click nút thêm quy đổi ĐVT
    addConvBtn.addEventListener('click', appendConversionItem);

    // Đồng bộ nhãn ĐVT Nhỏ khi người dùng gõ
    unitInput.addEventListener('input', () => {
        const baseUnitText = unitInput.value.trim() || 'Viên';
        tr.querySelectorAll('.quick-unit-label').forEach(label => {
            label.textContent = baseUnitText;
        });
    });

    // Mặc định tạo sẵn 1 dòng quy đổi đầu tiên để người dùng dễ nhìn thấy cách dùng
    appendConversionItem();

    // Bắt sự kiện nhấn Enter trong hàng để tự động thêm hàng mới
    tr.querySelectorAll('input').forEach(input => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                window.addQuickRow();
                // Focus vào ô tên hàng của hàng mới vừa tạo
                setTimeout(() => {
                    const newRows = container.querySelectorAll('.quick-row-item');
                    if (newRows.length > 0) {
                        const lastRow = newRows[newRows.length - 1];
                        lastRow.querySelector('.quick-name')?.focus();
                    }
                }, 50);
            }
        });
    });

    reindexQuickRows();
};

window.removeQuickRow = (rowId) => {
    const row = document.getElementById(rowId);
    if (!row) return;

    row.classList.add('animate-out', 'fade-out', 'slide-out-to-left-4', 'duration-200');
    setTimeout(() => {
        row.remove();
        reindexQuickRows();
        
        // Luôn đảm bảo có ít nhất 1 dòng
        const container = document.getElementById('quick-add-rows');
        if (container && container.children.length === 0) {
            window.addQuickRow();
        }
    }, 180);
};

function reindexQuickRows() {
    const container = document.getElementById('quick-add-rows');
    if (!container) return;

    Array.from(container.children).forEach((tr, index) => {
        const firstTd = tr.querySelector('td');
        if (firstTd) firstTd.textContent = index + 1;
    });

    const badge = document.getElementById('quick-items-count-badge');
    if (badge) {
        badge.textContent = `${container.children.length} dòng đang soạn thảo`;
    }
}

window.submitQuickAddOneTimeProducts = async () => {
    const container = document.getElementById('quick-add-rows');
    if (!container) return;

    const rows = container.querySelectorAll('.quick-row-item');
    const productsToCreate = [];

    // Lọc lấy các hàng có tên sản phẩm hợp lệ
    rows.forEach(row => {
        const name = row.querySelector('.quick-name').value.trim();
        const unit = row.querySelector('.quick-unit').value.trim() || 'Viên';
        const costPrice = parseFloat(row.querySelector('.quick-cost').value) || 0;
        const retailPrice = parseFloat(row.querySelector('.quick-retail').value) || 0;
        const stock = parseFloat(row.querySelector('.quick-stock').value) || 0;
        const expiry = row.querySelector('.quick-expiry').value;

        // Trích xuất danh sách tất cả các dòng quy đổi ĐVT
        const conversions = [];
        row.querySelectorAll('.conversion-item').forEach(itemEl => {
            const largeUnit = itemEl.querySelector('.quick-large-unit').value.trim();
            const conversionRate = parseFloat(itemEl.querySelector('.quick-conversion').value) || 1;
            if (largeUnit && conversionRate > 1) {
                conversions.push({ largeUnit, conversionRate });
            }
        });

        if (name) {
            productsToCreate.push({ name, unit, costPrice, retailPrice, conversions, stock, expiry });
        }
    });

    if (productsToCreate.length === 0) {
        showToast("Vui lòng điền thông tin của ít nhất 1 mặt hàng!", "error");
        return;
    }

    // Đẩy nút lưu về trạng thái loading
    const submitBtn = document.getElementById('submitQuickAddBtn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Đang tạo sản phẩm...';
    }
    showLoading("Đang tạo hàng loạt sản phẩm bán 1 lần...");

    try {
        // Tìm hoặc tạo nhóm hàng đặc thù "Quà tặng / Khuyến mãi" để gom nhóm quản lý
        const categories = await fetchCategories();
        let promoCategory = categories.find(cat => cat.name === 'Quà tặng / Khuyến mãi');
        if (!promoCategory) {
            promoCategory = await createCategory('Quà tặng / Khuyến mãi');
        }

        const categoryId = promoCategory.id;

        for (const item of productsToCreate) {
            // Sinh mã sản phẩm tự động có tiền tố KM (Khuyến Mãi)
            const randomSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
            const productCode = `KM${Date.now().toString().slice(-6)}${randomSuffix}`;

            const productData = {
                name:              item.name,
                product_code:      productCode,
                category_id:       categoryId,
                is_active:         true,
                is_ecommerce:      false,
                is_direct_sale:    true,
                is_component_item: false,
                // Đánh dấu cờ is_one_time trong description JSON
                description:       JSON.stringify({ is_one_time: true })
            };

            const unitsData = [
                {
                    unit_name:       item.unit,
                    retail_price:    item.retailPrice,
                    cost_price:      item.costPrice,
                    conversion_rate: 1,
                    is_base_unit:    true
                }
            ];

            // Tự động thêm tất cả các quy cách đơn vị lớn quy đổi
            item.conversions.forEach(c => {
                unitsData.push({
                    unit_name:       c.largeUnit,
                    retail_price:    item.retailPrice * c.conversionRate,
                    cost_price:      item.costPrice * c.conversionRate,
                    conversion_rate: c.conversionRate,
                    is_base_unit:    false
                });
            });

            // Tồn kho được quy ước nhập theo ĐVT nhỏ nhất (ví dụ Viên)
            const batchData = [{
                batch_number:   'Lô KM',
                expiry_date:    item.expiry || '2099-12-31',
                stock_quantity: item.stock,
                is_tracked:     Boolean(item.expiry)
            }];

            await createProduct(productData, unitsData, batchData);
        }

        showToast(`Đã thêm thành công ${productsToCreate.length} sản phẩm bán 1 lần!`, "success");
        // Reset bảng nhập nhanh
        container.innerHTML = '';
        quickRowsCount = 0;
        window.addQuickRow();
        window.addQuickRow();
        window.addQuickRow();

        // Tải lại danh sách
        await window.loadOneTimeProductsData();

    } catch (error) {
        console.error("Lỗi khi thêm hàng loạt sản phẩm một lần:", error);
        showToast("Lỗi: " + error.message, "error", 5000);
    } finally {
        const actualSubmitBtn = document.getElementById('submitQuickAddBtn');
        if (actualSubmitBtn) {
            actualSubmitBtn.disabled = false;
            actualSubmitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> LƯU TẤT CẢ SẢN PHẨM';
        }
        hideLoading();
    }
};


// Khởi chạy an toàn: Nếu DOM đã load xong thì chạy ngay, nếu chưa thì đợi
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}



