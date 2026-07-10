// js/features/products/productController.js
import { supabaseClient } from '../../core/supabase.js';
import './aiChatController.js';
import { setupComboProductSearch } from './comboController.js';
import './doseController.js';
import './oneTimeProductController.js';
import { issueInternalStock, saveInventoryDocument } from '../inventory/inventoryService.js';
import { fetchProducts, updateProduct, updateProductFull, syncCategories, syncProducts, syncProductUnits, syncProductBatches, createProduct, fetchCategories, createCategory } from './productService.js';
import {
    toggleFilter, showLoading, hideLoading, showError,
    showSupabaseError, renderProducts, toggleAllCheckboxes, updateBulkEditButton,
    setupSearch, showToast, setupProductSorting,
    openExportModal, closeExportModal, showImportErrorsModal, closeImportErrorModal,
    openAddProductModal, closeAddProductModal
} from './productUI.js';
import { initLayout } from '../../components/layout.js';

window.currentProductsList = [];

window.currentCategoryId = '';
window.currentProductStatusView = 'active';

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
        window.loadCombosData?.();
    }
}

async function populateCategoriesForAdd() {
    try {
        const categories = await fetchCategories();

        // 1. Nhóm hàng hóa thường (Loại trừ Combo nhưng KHÔNG loại trừ Cắt Liều)
        const select = document.getElementById('add_category');
        if (select) {
            let optionsHtml = '<option value="">-- Chọn nhóm hàng --</option>';
            categories
                .filter(cat => !cat.name.toLowerCase().includes('combo'))
                .forEach(cat => {
                    optionsHtml += `<option value="${cat.id}">${cat.name}</option>`;
                });
            select.innerHTML = optionsHtml;
        }

        // 2. Nhóm Combo (Chỉ lấy các nhóm chứa từ "combo")
        const comboSelect = document.getElementById('add_combo_category');
        if (comboSelect) {
            let comboOptionsHtml = '<option value="">-- Chọn nhóm Combo --</option>';
            categories
                .filter(cat => cat.name.toLowerCase().includes('combo'))
                .forEach(cat => {
                    comboOptionsHtml += `<option value="${cat.id}">${cat.name}</option>`;
                });
            comboSelect.innerHTML = comboOptionsHtml;
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
        const filteredCats = categories.filter(cat => {
            const isCombo = isComboCategoryName(cat.name);
            const isDose = isDoseCategoryName(cat.name);
            return !isCombo && !isDose;
        });
        html += filteredCats.map(cat => {
            const isCombo = isComboCategoryName(cat.name);
            const isDose = isDoseCategoryName(cat.name);
            const safeCategoryName = String(cat.name || '').replace(/'/g, "\\'");

            let badgeHtml = '';
            if (isCombo) {
                badgeHtml = `<span class="inline-flex mt-1.5 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[9px] font-black rounded uppercase tracking-wider gap-1 items-center"><i class="fa-solid fa-layer-group text-[8px]"></i> Nhóm Combo</span>`;
            } else if (isDose) {
                badgeHtml = `<span class="inline-flex mt-1.5 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[9px] font-black rounded uppercase tracking-wider gap-1 items-center"><i class="fa-solid fa-notes-medical text-[8px]"></i> Cắt Liều</span>`;
            } else {
                badgeHtml = `<span class="inline-flex mt-1.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-400 text-[9px] font-black rounded uppercase tracking-wider gap-1 items-center"><i class="fa-solid fa-box text-[8px]"></i> Hàng Hóa</span>`;
            }

            return `
            <div onclick="window.openCategoryManagementTarget('${cat.id}', '${safeCategoryName}')" class="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between group hover:border-blue-500 transition-all shadow-sm cursor-pointer">
                <div>
                    <h4 class="font-black text-slate-800 dark:text-white">${cat.name}</h4>
                    <div class="flex flex-col gap-0.5">
                        ${badgeHtml}
                        <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: ${cat.id.substring(0, 8)}...</p>
                    </div>
                </div>
                <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onclick="event.stopPropagation(); window.quickEditCategory('${cat.id}', '${safeCategoryName}')" class="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-700 text-blue-600 shadow-sm border border-slate-200 dark:border-slate-600 hover:bg-blue-600 hover:text-white transition-all">
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

function isComboCategoryName(name = '') {
    return String(name || '').toLowerCase().includes('combo');
}

function isDoseCategoryName(name = '') {
    return false;
}

function getProductDescriptionFlags(product) {
    try {
        const parsed = typeof product?.description === 'string'
            ? JSON.parse(product.description)
            : product?.description;
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
        return {};
    }
}

function isDoseTaggedProduct(product) {
    const flags = getProductDescriptionFlags(product);
    return flags.is_dose_cut === true || flags.is_dose_retail === true;
}

async function ensureUniqueComboCategoryName(name, excludeId = null) {
    const normalizedName = String(name || '').trim().toLowerCase();
    if (!normalizedName) return;

    const categories = await fetchCategories();
    const duplicated = (categories || []).find(category => {
        if (!isComboCategoryName(category?.name)) return false;
        if (excludeId && String(category.id) === String(excludeId)) return false;
        return String(category.name || '').trim().toLowerCase() === normalizedName;
    });

    if (duplicated) {
        throw new Error(`Tên nhóm combo "${duplicated.name}" đã tồn tại.`);
    }
}

window.viewProductsByCategory = (catId) => {
    window.currentCategoryId = catId;
    const mainTabBtn = document.querySelector('.main-tab-btn[data-tab="products-list"]');
    if (mainTabBtn) mainTabBtn.click();
    window.applyFilters();
};

window.openCategoryManagementTarget = (catId, categoryName = '') => {
    if (isComboCategoryName(categoryName)) {
        const comboTabBtn = document.querySelector('.main-tab-btn[data-tab="combos-list"]');
        if (comboTabBtn) {
            comboTabBtn.click();
            return;
        }
    }

    if (isDoseCategoryName(categoryName)) {
        const doseTabBtn = document.querySelector('.main-tab-btn[data-tab="doses-list"]');
        if (doseTabBtn) {
            doseTabBtn.click();
            return;
        }
    }

    window.viewProductsByCategory(catId);
};

window.quickAddCategory = async () => {
    const name = prompt('Nhập tên nhóm hàng mới:');
    if (!name || !name.trim()) return;

    try {
        const category = await createCategory(name.trim());
        if (category) {
            populateCategoriesForAdd();
            window.loadCombosData?.();
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
        await ensureUniqueComboCategoryName(name);
        const category = await createCategory(name);
        if (category) {
            populateCategoriesForAdd();
            window.loadCombosData?.();
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
        const normalizedName = newName.trim();
        if (isComboCategoryName(oldName) || isComboCategoryName(normalizedName)) {
            await ensureUniqueComboCategoryName(normalizedName, id);
        }

        const { error } = await supabaseClient
            .from('categories')
            .update({ name: normalizedName })
            .eq('id', id);

        if (error) throw error;
        populateCategoriesForAdd();
        window.loadCombosData?.();
        showToast('Đã cập nhật nhóm hàng');
    } catch (err) {
        showToast('Lỗi khi cập nhật: ' + err.message, 'error');
    }
};

async function ensureCategoryCanBeDeleted(categoryId) {
    const { count, error: countError } = await supabaseClient
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', categoryId);
    if (countError) throw countError;

    if (Number(count || 0) <= 0) return;

    const { data: sampleProducts, error: sampleError } = await supabaseClient
        .from('products')
        .select('name, product_code')
        .eq('category_id', categoryId)
        .order('name', { ascending: true })
        .limit(3);
    if (sampleError) throw sampleError;

    const sampleLabel = (sampleProducts || [])
        .map(product => `${product.name}${product.product_code ? ` (${product.product_code})` : ''}`)
        .join(', ');

    throw new Error(
        `Không thể xóa nhóm hàng vì vẫn còn ${count} mặt hàng đang dùng nhóm này`
        + (sampleLabel ? `: ${sampleLabel}.` : '.')
    );
}

window.quickDeleteCategory = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nhóm hàng này?')) return;

    try {
        await ensureCategoryCanBeDeleted(id);
        const { error } = await supabaseClient
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) throw error;
        populateCategoriesForAdd();
        window.loadCombosData?.();
        showToast('Đã xóa nhóm hàng');
    } catch (err) {
        showToast('Lỗi khi xóa: ' + err.message, 'error');
    }
};

window.loadProductsData = loadProductsData;
async function loadProductsData() {
    showLoading("Đang tải dữ liệu từ Supabase...");
    try {
        const allProducts = await fetchProducts();

        // Lọc bỏ Thuốc cắt liều và Combo khỏi kho hàng hóa chính để tránh thống kê lộn xộn
        window.currentProductsList = allProducts.filter(p => {
            const catName = p.product_categories?.name || p.categories?.name || '';
            const isDose = isDoseTaggedProduct(p);
            const isCombo = catName.toLowerCase().includes('combo') || p.product_code?.startsWith('CB');
            return !isDose && !isCombo;
        });

        const filterStatus = document.getElementById('filter_status');
        if (filterStatus) {
            filterStatus.value = window.currentProductStatusView || 'active';
        }

        const hasActiveFilter = window.currentCategoryId ||
            (document.getElementById('filter_status') && document.getElementById('filter_status').value !== 'all') ||
            (document.getElementById('filter_stock') && document.getElementById('filter_stock').value !== 'all') ||
            (document.getElementById('filter_expiry') && document.getElementById('filter_expiry').value !== 'all');

        if (hasActiveFilter) {
            window.applyFilters();
        } else {
            const activeProducts = window.currentProductsList.filter(p => p.is_active !== false);
            renderProducts(activeProducts);
            setupSearch(activeProducts);
            const searchInput = document.getElementById('searchInput');
            if (searchInput && searchInput.value.trim()) {
                searchInput.dispatchEvent(new Event('input'));
            }
            if (window.startAIChatReminders) {
                window.startAIChatReminders();
            } else {
                window.refreshProductAITasks?.();
            }
            return;
        }
        setupSearch(window.currentProductsList);

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

window.setProductsStatusView = (statusView = 'active') => {
    const normalizedView = statusView === 'inactive' ? 'inactive' : 'active';
    window.currentProductStatusView = normalizedView;

    const filterStatus = document.getElementById('filter_status');
    if (filterStatus) filterStatus.value = normalizedView;

    document.querySelectorAll('.products-status-tab').forEach(btn => {
        const isActive = btn.dataset.statusView === normalizedView;
        btn.classList.toggle('bg-blue-600', isActive);
        btn.classList.toggle('text-white', isActive);
        btn.classList.toggle('shadow-sm', isActive);
        btn.classList.toggle('text-slate-600', !isActive);
        btn.classList.toggle('dark:text-slate-300', !isActive);
    });

    window.applyFilters();
};

window.focusProductForAI = productId => {
    const product = (window.currentProductsList || [])
        .find(item => String(item.id) === String(productId));
    if (!product) {
        showToast('Không tìm thấy mặt hàng trong danh sách hiện tại.', 'error');
        return;
    }

    document.getElementById('aiChatWindow')?.classList.add('hidden');
    document.getElementById('aiFloatingTooltip')?.classList.add('hidden');
    window.currentCategoryId = '';
    window.currentProductStatusView = product.is_active === false ? 'inactive' : 'active';

    const statusFilter = document.getElementById('filter_status');
    const stockFilter = document.getElementById('filter_stock');
    const expiryFilter = document.getElementById('filter_expiry');
    const searchType = document.getElementById('searchType');
    const searchInput = document.getElementById('searchInput');
    if (statusFilter) statusFilter.value = window.currentProductStatusView;
    if (stockFilter) stockFilter.value = 'all';
    if (expiryFilter) expiryFilter.value = 'all';
    if (searchType) searchType.value = 'code';
    if (searchInput) searchInput.value = product.product_code || product.name || '';

    document.querySelectorAll('.products-status-tab').forEach(btn => {
        const isActive = btn.dataset.statusView === window.currentProductStatusView;
        btn.classList.toggle('bg-blue-600', isActive);
        btn.classList.toggle('text-white', isActive);
        btn.classList.toggle('shadow-sm', isActive);
        btn.classList.toggle('text-slate-600', !isActive);
        btn.classList.toggle('dark:text-slate-300', !isActive);
    });

    renderProducts([product]);
    document.getElementById('product-table-wrapper')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    window.setTimeout(() => {
        const row = document.querySelector(`.product-row[data-product-id="${product.id}"]`);
        if (!row) return;
        row.classList.add('ring-4', 'ring-blue-400', 'ring-offset-2', 'dark:ring-offset-slate-950');
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        window.setTimeout(() => {
            row.classList.remove('ring-4', 'ring-blue-400', 'ring-offset-2', 'dark:ring-offset-slate-950');
        }, 3500);
    }, 250);
};

// ================= GẮN HÀM RA WINDOW ĐỂ HTML GỌI =================

function setupProductEventListeners() {
    setupProductSorting();
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
            'open-add-combo-modal': () => window.openAddComboModal(),
            'close-add-combo-modal': () => window.closeAddComboModal(),
            'generate-combo-code': () => window.generateComboCode()
        };

        const handler = actionMap[actionButton.dataset.action];
        if (handler) handler();
    });

    document.querySelectorAll('.products-status-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            window.setProductsStatusView(btn.dataset.statusView || 'active');
        });
    });

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
        if (target.id === 'add_category') {
            const optionText = target.options[target.selectedIndex]?.text || '';
            if (window.toggleDoseCutFields) {
                window.toggleDoseCutFields(optionText);
            }
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
window.toggleDarkMode = window.toggleDarkMode || (() => { }); // handled by layout.js
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
    const selectedProduct = window.currentProductsList.find(product => product.product_code === productCode);
    if (selectedProduct) {
        openAddProductModal(selectedProduct);
    }
};

window.submitAddProduct = async () => {
    const form = document.getElementById('addProductForm');
    if (!form.reportValidity()) return;

    const productId = document.getElementById('add_product_id').value;
    const isEditMode = Boolean(productId);
    const submitBtn = document.querySelector('[data-action="submit-add-product"]');

    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Đang lưu...'; }
    showLoading(isEditMode ? 'Đang cập nhật sản phẩm...' : 'Đang lưu hàng hóa mới...');

    try {
        // Collect Data
        const productData = {
            name: document.getElementById('add_name').value.trim(),
            product_code: document.getElementById('add_code').value.trim(),
            category_id: document.getElementById('add_category').value || null,
            is_active: document.getElementById('add_is_active').checked,
            is_ecommerce: document.getElementById('add_is_ecommerce')?.checked || false,

            // Advanced Info — field names match Supabase columns
            barcode: document.getElementById('add_barcode').value.trim() || null,
            registration_no: document.getElementById('add_reg_no').value.trim() || null,
            active_ingredient: document.getElementById('add_active_ingredient').value.trim() || null,
            concentration: document.getElementById('add_concentration').value.trim() || null,
            route_of_admin: document.getElementById('add_route').value.trim() || null,
            packaging_spec: document.getElementById('add_packaging').value.trim() || null,
            manufacturer: document.getElementById('add_manufacturer').value.trim() || null,
            is_direct_sale: true,
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
        
        const hasVariantsEl = document.getElementById('add_has_variants');
        if (hasVariantsEl && hasVariantsEl.checked) {
            descObj.has_variants = true;
        }
        if (document.getElementById('add_is_one_time')?.checked) {
            descObj.is_one_time = true;
        }
        if (document.getElementById('add_is_dose_cut')?.checked) {
            descObj.is_dose_cut = true;
        }
        if (document.getElementById('add_is_dose_retail')?.checked) {
            descObj.is_dose_retail = true;
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
                    unit_name: unitName,
                    retail_price: parseFloat(row.querySelector('.unit-retail').value) || 0,
                    cost_price: parseFloat(row.querySelector('.unit-cost').value) || 0,
                    conversion_rate: parseFloat(row.querySelector('.unit-conversion').value) || 1,
                    is_base_unit: index === 0
                });
            }
        });

        if (unitsData.length === 0) throw new Error('Vui lòng nhập ít nhất 1 đơn vị tính.');

        let batchData = [];
        const hasBatch = document.getElementById('add_has_batch').checked;
        const DEFAULT_FAR_DATE = '2099-12-31';

        document.querySelectorAll('#batchRowsContainer .batch-row').forEach((row, index) => {
            const stock = parseFloat(row.querySelector('.batch-stock')?.value) || 0;
            const batchCostPrice = parseFloat(row.querySelector('.batch-cost-price')?.value) || 0;
            const batchNumber = row.querySelector('.batch-number')?.value.trim() || `Lô ${index + 1}`;
            const expiryDate = row.querySelector('.batch-expiry')?.value;
            const batchId = row.dataset.batchId || null;

            if (hasBatch && !expiryDate) {
                throw new Error(`Vui lòng nhập Hạn sử dụng cho lô hàng "${batchNumber}"`);
            }

            if (hasBatch || stock > 0) {
                const item = {
                    batch_number: batchNumber,
                    expiry_date: expiryDate || DEFAULT_FAR_DATE,
                    stock_quantity: stock,
                    cost_price: batchCostPrice,
                    is_tracked: hasBatch
                };
                if (batchId) {
                    item.id = batchId;
                }
                batchData.push(item);
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
        if (typeof window.loadDosesData === 'function') {
            window.loadDosesData();
        }

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
    fileReader.onload = async function (e) {
        try {
            const fileData = new Uint8Array(e.target.result);
            if (!window.XLSX) throw new Error("Thư viện Excel (SheetJS) chưa được tải.");

            const workbook = window.XLSX.read(fileData, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const jsonData = window.XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName]);

            const BATCH_SIZE = 500;
            const totalItems = jsonData.length;
            let successCount = 0;
            const errorLogs = [];

            showLoading(`Chuẩn bị xử lý ${totalItems} dòng dữ liệu...`);

            for (let i = 0; i < totalItems; i += BATCH_SIZE) {
                const rawBatch = jsonData.slice(i, i + BATCH_SIZE);
                showLoading(`Đang xử lý Lô ${Math.ceil((i + 1) / BATCH_SIZE)}... (${Math.min(i + BATCH_SIZE, totalItems)}/${totalItems})`);

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

    if (!window.currentProductsList || window.currentProductsList.length === 0) {
        alert("Không có dữ liệu để xuất!");
        return;
    }
    if (!window.XLSX) {
        alert("Lỗi: Thư viện xuất Excel chưa được tải.");
        return;
    }

    const exportDataArray = [];

    window.currentProductsList.forEach(product => {
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
    const columnWidths = selectedCols.map(() => ({ wch: 20 }));
    worksheet['!cols'] = columnWidths;

    const workbook = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(workbook, worksheet, "DuLieuHangHoa");

    window.XLSX.writeFile(workbook, "KhaiHoanPOS_Data_Custom.xlsx");

    closeExportModal();
};

// ================= FILTER LOGIC =================
window.applyFilters = () => {
    if (!window.currentProductsList) return;

    const catId = window.currentCategoryId || '';

    const status = document.getElementById('filter_status')?.value || window.currentProductStatusView || 'active';
    const stock = document.getElementById('filter_stock')?.value;
    const expiry = document.getElementById('filter_expiry')?.value;

    window.activeExpiryFilter = expiry;
    let filtered = window.currentProductsList;

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
            let batches = p.product_batches || [];
            
            // Gộp lô của biến thể con nếu là sản phẩm cha
            const childVariants = (window.currentProductsList || []).filter(v => v.parent_id === p.id);
            if (childVariants.length > 0) {
                batches = childVariants.reduce((acc, v) => acc.concat(v.product_batches || []), []);
            }

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
    if (document.getElementById('filter_stock')) document.getElementById('filter_stock').value = 'all';
    if (document.getElementById('filter_expiry')) document.getElementById('filter_expiry').value = 'all';

    window.currentCategoryId = '';
    window.setProductsStatusView(window.currentProductStatusView || 'active');
};

window.clearFirstBatch = () => {
    document.getElementById('add_stock').value = '';
    document.getElementById('add_batch_no').value = '';
    document.getElementById('add_expiry').value = '';
};

async function getProductDeleteGuard(productId) {
    const { data: batches, error: batchError } = await supabaseClient
        .from('product_batches')
        .select('id, stock_quantity')
        .eq('product_id', productId);
    if (batchError) throw batchError;

    const totalStock = (batches || []).reduce((sum, batch) => sum + Number(batch.stock_quantity || 0), 0);

    const { data: orderItems, error: orderItemsError } = await supabaseClient
        .from('order_items')
        .select('id')
        .eq('product_id', productId)
        .limit(1);
    if (orderItemsError) throw orderItemsError;

    const batchIds = (batches || []).map(batch => batch.id).filter(Boolean);
    let hasInventoryHistory = false;
    if (batchIds.length) {
        const { data: inventoryItems, error: inventoryItemsError } = await supabaseClient
            .from('inventory_document_items')
            .select('id')
            .in('batch_id', batchIds)
            .limit(1);
        if (inventoryItemsError) throw inventoryItemsError;
        hasInventoryHistory = (inventoryItems || []).length > 0;
    }

    return {
        totalStock,
        hasOrderHistory: (orderItems || []).length > 0,
        hasInventoryHistory
    };
}

// ================= THIẾT LẬP THUỐC LIỀU & COMBO =================


// WARNING: Hàm này cũng tồn tại trong inventoryController.js.
// Nếu cần sửa logic xóa lô, phải sửa ở CẢ HAI file.

window.toggleProductActiveStatus = async (id, newStatus, name) => {
    const actionName = newStatus ? "Tiếp tục kinh doanh" : "Ngừng kinh doanh";
    if (!confirm(`Bạn có chắc chắn muốn ${actionName} sản phẩm "${name}"?`)) return;

    showLoading(`Đang cập nhật trạng thái...`);
    try {
        const { error } = await supabaseClient
            .from('products')
            .update({ is_active: newStatus })
            .eq('id', id);

        if (error) throw error;
        
        showToast(newStatus ? 'Đã kích hoạt lại sản phẩm' : 'Đã ngừng kinh doanh sản phẩm', 'success');
        await loadProducts();
    } catch (error) {
        showError(error.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
    } finally {
        hideLoading();
    }
};

window.deleteProduct = async (id, name) => {
    if (!confirm(`Bạn muốn xử lý hàng hóa "${name}"?\n\nHệ thống sẽ kiểm tra tồn kho và lịch sử phát sinh trước. Nếu còn tồn kho, cần kiểm kho/xuất hủy về 0 trước khi xóa hoặc ngừng kinh doanh.`)) return;

    showLoading("Đang kiểm tra hàng hóa...");
    try {
        const guard = await getProductDeleteGuard(id);

        if (guard.totalStock > 0) {
            throw new Error(`Sản phẩm vẫn còn tồn kho (${guard.totalStock.toLocaleString('vi-VN')}). Vui lòng lập phiếu kiểm kho hoặc phiếu xuất hủy/xuất nội bộ để đưa tồn về 0 trước. Cách này giữ đúng giá vốn và lịch sử quản lý kho.`);
        }

        showLoading("Đang xóa hàng hóa...");
        const { error } = await supabaseClient
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            if (error.code === '23503') {
                throw new Error("Không thể xóa cứng do ràng buộc CSDL cũ. Hãy chạy migration snapshot/xóa an toàn trước, sau đó thử lại.");
            }
            throw error;
        }

        showToast(`Đã xóa thành công: ${name}`);
        loadProductsData();
    } catch (err) {
        showToast('Không thể xóa: ' + err.message, 'error', 7000);
    } finally {
        hideLoading();
    }
};

window.quickIssueInactiveProductStock = async (productId, productName) => {
    const product = window.currentProductsList.find(item => item.id === productId);
    if (!product) {
        showToast('Không tìm thấy sản phẩm để xuất tồn nhanh.', 'error');
        return;
    }

    const positiveBatches = (product.product_batches || []).filter(batch => Number(batch.stock_quantity || 0) > 0);
    if (positiveBatches.length === 0) {
        showToast(`"${productName}" đã hết tồn, có thể xóa ngay nếu cần.`, 'info');
        return;
    }

    const totalStock = positiveBatches.reduce((sum, batch) => sum + Number(batch.stock_quantity || 0), 0);
    const confirmed = confirm(
        `Xuất tồn nhanh cho "${productName}"?\n\n` +
        `Hệ thống sẽ xuất hủy ${positiveBatches.length} lô còn tồn, tổng ${totalStock.toLocaleString('vi-VN')} đơn vị.\n` +
        `Phiếu kho sẽ được ghi tự động để vẫn giữ lịch sử đối chiếu.\n\nTiếp tục?`
    );
    if (!confirmed) return;

    const note = `Xuất hủy nhanh từ danh sách ngừng kinh doanh cho ${product.name}`;
    const baseUnit = product.product_units?.find(unit => unit.is_base_unit)?.unit_name || 'ĐVT';
    const lines = positiveBatches.map(batch => ({
        productId: product.id,
        productName: product.name,
        productCode: product.product_code || '',
        batchId: batch.id,
        batchNumber: batch.batch_number || '',
        expiryDate: batch.expiry_date || null,
        costPrice: Number(batch.cost_price || 0),
        quantity: Number(batch.stock_quantity || 0),
        baseUnit,
        reason: 'damage',
        reasonLabel: 'Hao hụt hỏng'
    }));

    showLoading('Đang xuất tồn nhanh...');
    try {
        for (const line of lines) {
            await issueInternalStock({
                productId: line.productId,
                batchId: line.batchId,
                quantity: line.quantity,
                reason: line.reason,
                note
            });
        }

        await saveInventoryDocument({
            documentType: 'internal_use',
            note,
            lines
        });

        try {
            const { logActivity } = await import('../logs/auditService.js');
            await logActivity('internal_use', {
                note,
                items: lines.map(line => ({
                    product_id: line.productId,
                    product_name: line.productName,
                    product_code: line.productCode,
                    batch_number: line.batchNumber,
                    quantity: line.quantity,
                    base_unit: line.baseUnit,
                    reason: line.reasonLabel
                }))
            });
        } catch (logErr) {
            console.warn('Lỗi ghi log xuất tồn nhanh:', logErr);
        }

        showToast(`Đã xuất tồn nhanh "${productName}" về 0.`, 'success', 5000);
        await loadProductsData();
    } catch (err) {
        showToast('Không thể xuất tồn nhanh: ' + err.message, 'error', 7000);
    } finally {
        hideLoading();
    }
};

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
        window.currentProductsList.forEach(p => {
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
            renderProducts(window.currentProductsList);
        }
        setupSearch(window.currentProductsList);

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



// Khởi chạy an toàn: Nếu DOM đã load xong thì chạy ngay, nếu chưa thì đợi
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}




