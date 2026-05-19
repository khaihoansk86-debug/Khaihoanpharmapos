import { initLayout } from '../../components/layout.js';
import { adjustStocktake, fetchInventoryProducts, issueInternalStock, receiveStock, saveInventoryDocument, fetchBatchSupplier } from './inventoryService.js';
import { fetchSuppliers } from '../suppliers/supplierService.js';

const LOW_STOCK_THRESHOLD = 5;
const NEAR_EXPIRY_DAYS = 30;
let allRows = [];
let filteredRows = [];
let documentLines = [];
let currentDocumentType = 'purchase';
const els = {};

function getBaseUnit(product) {
    const units = product.product_units || [];
    return units.find(unit => unit.is_base_unit) || units[0] || null;
}

function daysUntil(dateString) {
    if (!dateString) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(`${dateString}T00:00:00`);
    if (Number.isNaN(expiry.getTime())) return null;
    return Math.ceil((expiry - today) / 86400000);
}

function classifyRow(row) {
    if (row.noBatch) return 'no-batch';
    if (row.daysToExpiry !== null && row.daysToExpiry < 0) return 'expired';
    if (row.stock <= 0) return 'out-of-stock';
    if (row.daysToExpiry !== null && row.daysToExpiry <= NEAR_EXPIRY_DAYS) return 'near-expiry';
    if (row.stock <= LOW_STOCK_THRESHOLD) return 'low-stock';
    return 'in-stock';
}

function normalizeProducts(products) {
    const physicalProducts = products.filter(product => {
        const catName = product.categories?.name || '';
        const isCombo = catName.toLowerCase().includes('combo');
        const isDose = catName.toLowerCase().includes('cắt liều') || catName.toLowerCase().includes('thuốc liều');
        return !isCombo && !isDose;
    });

    return physicalProducts.flatMap(product => {
        const baseUnit = getBaseUnit(product);
        const batches = product.product_batches || [];
        const common = {
            productId: product.id,
            code: product.product_code || '',
            barcode: product.barcode || '',
            name: product.name || 'Chưa có tên',
            category: product.categories?.name || 'Chưa phân nhóm',
            baseUnit: baseUnit?.unit_name || 'N/A',
            retailPrice: Number(baseUnit?.retail_price || 0),
            costPrice: Number(baseUnit?.cost_price || 0),
            updatedAt: '',
            isActive: product.is_active !== false
        };

        if (batches.length === 0) {
            const row = { ...common, batchId: null, batchNumber: 'Chưa có lô', expiryDate: null, daysToExpiry: null, stock: 0, noBatch: true };
            row.status = classifyRow(row);
            return [row];
        }

        return batches.map(batch => {
            const row = {
                ...common,
                batchId: batch.id,
                batchNumber: batch.batch_number || 'Lô mặc định',
                expiryDate: batch.expiry_date || null,
                daysToExpiry: daysUntil(batch.expiry_date),
                stock: Number(batch.stock_quantity || 0),
                costPrice: Number(batch.cost_price ?? common.costPrice ?? 0),
                noBatch: false
            };
            row.status = classifyRow(row);
            return row;
        });
    });
}

function formatNumber(value) { return new Intl.NumberFormat('vi-VN').format(Number(value || 0)); }
function formatCurrency(value) { return `${formatNumber(value)} đ`; }
function formatDate(value) {
    if (!value) return '-';
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('vi-VN');
}
function escapeHTML(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function statusMeta(status) {
    const map = {
        'in-stock': ['Còn hàng', 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'],
        'low-stock': ['Sắp hết', 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'],
        'out-of-stock': ['Hết hàng', 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'],
        'near-expiry': ['Cận date', 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'],
        'expired': ['Hết hạn', 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'],
        'no-batch': ['Chưa có lô', 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300']
    };
    return map[status] || map['in-stock'];
}

function cacheElements() {
    [
        'statProducts', 'statStock', 'statOut', 'statNearExpiry', 'statExpired',
        'inventorySearch', 'categoryFilter', 'statusFilter', 'sortFilter',
        'loadingState', 'errorState', 'emptyState', 'inventoryTableWrapper', 'inventoryTableBody',
        'inventoryModal', 'inventoryForm', 'modalTitle', 'movementType', 'selectedBatchId',
        'productSelect', 'batchSelect', 'batchSelectWrap', 'batchNumberWrap', 'expiryWrap', 'costWrap',
        'batchNumberInput', 'expiryInput', 'quantityInput', 'quantityLabel', 'costInput', 'reasonInput',
        'noteInput', 'modalHint', 'documentLinesBody', 'documentLineCount',
        'supplierSelect', 'supplierSelectWrap'
    ].forEach(id => { els[id] = document.getElementById(id); });
}

function setLoading(isLoading) {
    els.loadingState?.classList.toggle('hidden', !isLoading);
    els.errorState?.classList.add('hidden');
    els.emptyState?.classList.add('hidden');
    els.inventoryTableWrapper?.classList.add('hidden');
}

function uniqueProducts() {
    const map = new Map();
    allRows.forEach(row => {
        if (!map.has(row.productId)) map.set(row.productId, row);
    });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}

function getProductRows(productId) {
    return allRows.filter(row => row.productId === productId && !row.noBatch);
}

function findProductRow(productId) {
    return allRows.find(row => row.productId === productId) || null;
}

function findBatchRow(batchId) {
    return allRows.find(row => row.batchId === batchId) || null;
}

function populateProductSelect(selectedProductId = '') {
    els.productSelect.innerHTML = '<option value="">Chọn hàng hóa</option>' + uniqueProducts().map(row => (
        `<option value="${escapeHTML(row.productId)}" ${row.productId === selectedProductId ? 'selected' : ''}>${escapeHTML(row.name)} - ${escapeHTML(row.code)} (${escapeHTML(row.baseUnit)})</option>`
    )).join('');
}

async function populateSupplierSelect() {
    if (!els.supplierSelect) return;
    try {
        const suppliers = await fetchSuppliers();
        els.supplierSelect.innerHTML = '<option value="">-- Chọn Nhà cung cấp / Đối tác --</option>' + suppliers.map(s => (
            `<option value="${s.id}">${escapeHTML(s.name)} ${s.contact_info ? `(${s.contact_info})` : ''}</option>`
        )).join('');
    } catch (err) {
        console.error('Lỗi tải danh sách đối tác:', err);
    }
}

function populateBatchSelect(selectedBatchId = '') {
    if (!els.batchSelect) return;
    const rows = getProductRows(els.productSelect.value);
    els.batchSelect.innerHTML = '<option value="">Chọn lô tồn kho</option>' + rows.map(row => (
        `<option value="${escapeHTML(row.batchId)}" ${row.batchId === selectedBatchId ? 'selected' : ''}>${escapeHTML(row.batchNumber)} - HSD ${formatDate(row.expiryDate)} - Tồn ${formatNumber(row.stock)} ${escapeHTML(row.baseUnit)}</option>`
    )).join('');
    els.selectedBatchId.value = els.batchSelect.value || '';
    syncBatchFields();
}

function syncBatchFields() {
    const row = findBatchRow(els.batchSelect?.value || els.selectedBatchId?.value);
    if (!row) return;
    els.selectedBatchId.value = row.batchId || '';
    els.batchNumberInput.value = row.batchNumber || '';
    els.expiryInput.value = row.expiryDate || '';
    els.costInput.value = row.costPrice || '';
}

function populateCategories(rows) {
    const categories = [...new Set(rows.map(row => row.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi'));
    const current = els.categoryFilter.value || 'all';
    els.categoryFilter.innerHTML = '<option value="all">Tất cả</option>' + categories.map(category => `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`).join('');
    els.categoryFilter.value = categories.includes(current) ? current : 'all';
}

function updateStats(rows) {
    els.statProducts.textContent = formatNumber(new Set(rows.map(row => row.productId)).size);
    els.statStock.textContent = formatNumber(rows.reduce((sum, row) => sum + row.stock, 0));
    els.statOut.textContent = formatNumber(rows.filter(row => row.status === 'out-of-stock').length);
    els.statNearExpiry.textContent = formatNumber(rows.filter(row => row.status === 'near-expiry').length);
    els.statExpired.textContent = formatNumber(rows.filter(row => row.status === 'expired').length);
}

function applyFilters() {
    const query = els.inventorySearch.value.trim().toLowerCase();
    const category = els.categoryFilter.value;
    const status = els.statusFilter.value;
    const sort = els.sortFilter.value;

    filteredRows = allRows.filter(row => {
        const haystack = `${row.name} ${row.code} ${row.barcode} ${row.batchNumber}`.toLowerCase();
        if (query && !haystack.includes(query)) return false;
        if (category !== 'all' && row.category !== category) return false;
        if (status !== 'all' && row.status !== status) return false;
        return true;
    });

    filteredRows.sort((a, b) => {
        if (sort === 'stock-asc') return a.stock - b.stock || a.name.localeCompare(b.name, 'vi');
        if (sort === 'name-asc') return a.name.localeCompare(b.name, 'vi');
        if (sort === 'updated-desc') return b.code.localeCompare(a.code) || a.name.localeCompare(b.name, 'vi');
        const aDays = a.daysToExpiry === null ? Number.POSITIVE_INFINITY : a.daysToExpiry;
        const bDays = b.daysToExpiry === null ? Number.POSITIVE_INFINITY : b.daysToExpiry;
        return aDays - bDays || a.name.localeCompare(b.name, 'vi');
    });

    updateStats(filteredRows);
    renderTable(filteredRows);
}

function getProductGroups(rows) {
    const groups = new Map();
    rows.forEach(row => {
        if (!groups.has(row.productId)) {
            groups.set(row.productId, { ...row, batches: [], totalStock: 0, statusCounts: new Map() });
        }
        const group = groups.get(row.productId);
        group.batches.push(row);
        group.totalStock += row.stock;
        group.statusCounts.set(row.status, (group.statusCounts.get(row.status) || 0) + 1);
    });

    return [...groups.values()].map(group => {
        group.batchCount = group.batches.filter(batch => !batch.noBatch).length;
        group.status = classifyProductGroup(group);
        group.batches.sort((a, b) => {
            const aDays = a.daysToExpiry === null ? Number.POSITIVE_INFINITY : a.daysToExpiry;
            const bDays = b.daysToExpiry === null ? Number.POSITIVE_INFINITY : b.daysToExpiry;
            return aDays - bDays || a.batchNumber.localeCompare(b.batchNumber, 'vi');
        });
        return group;
    });
}

function classifyProductGroup(group) {
    if (group.statusCounts.has('expired')) return 'expired';
    if (group.statusCounts.has('near-expiry')) return 'near-expiry';
    if (group.totalStock <= 0) return 'out-of-stock';
    if (group.statusCounts.has('low-stock')) return 'low-stock';
    if (group.statusCounts.has('no-batch')) return 'no-batch';
    return 'in-stock';
}

function renderTable(rows) {
    if (rows.length === 0) {
        els.emptyState.classList.remove('hidden');
        els.inventoryTableWrapper.classList.add('hidden');
        return;
    }

    els.emptyState.classList.add('hidden');
    els.inventoryTableWrapper.classList.remove('hidden');
    els.inventoryTableBody.innerHTML = getProductGroups(rows).map(group => renderProductGroup(group)).join('');
}

function renderProductGroup(group) {
    const [label, cls] = statusMeta(group.status);
    const groupData = encodeURIComponent(JSON.stringify(group));
    const batchesHtml = group.batches.map(batch => renderBatchRow(batch)).join('');

    return `
        <tr class="group/product bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-slate-800 transition-all duration-200 hover:shadow-md">
            <td class="py-4 px-5 align-top"><div class="font-black text-slate-900 dark:text-white group-hover/product:text-blue-700 dark:group-hover/product:text-blue-300 transition-colors">${escapeHTML(group.name)}</div><div class="text-xs text-slate-600 mt-1 font-mono">${escapeHTML(group.code)}</div></td>
            <td class="py-4 px-5 align-top text-sm font-medium text-slate-700 dark:text-slate-300">${escapeHTML(group.category)}</td>
            <td class="py-4 px-5 align-top text-right font-black ${group.totalStock <= 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-white'}">${formatNumber(group.totalStock)}</td>
            <td class="py-4 px-5 align-top text-sm font-medium text-slate-700 dark:text-slate-300">${escapeHTML(group.baseUnit)}</td>
            <td class="py-4 px-5 align-top text-sm font-bold text-slate-700 dark:text-slate-200">${formatNumber(group.batchCount)}</td>
            <td class="py-4 px-5 align-top text-sm font-bold text-blue-600 dark:text-blue-400">${formatCurrency(group.retailPrice)}</td>
            <td class="py-4 px-5 align-top"><span class="inline-flex px-2.5 py-1 rounded-lg text-xs font-black uppercase border border-transparent ${cls}">${label}</span></td>
            <td class="py-4 px-5 align-top text-center"><button data-action="row-receive" data-row="${groupData}" class="px-3 py-2 rounded-xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200 text-xs font-black"><i class="fa-solid fa-plus mr-1"></i> Nhập lô</button></td>
        </tr>
        <tr class="bg-slate-50 dark:bg-slate-950/50">
            <td colspan="8" class="px-5 pb-5">
                <div class="rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden shadow-sm">
                    <table class="w-full text-left text-sm">
                        <thead class="bg-slate-100 dark:bg-slate-800 text-xs font-black uppercase text-slate-700 dark:text-slate-300 border-b-2 border-slate-300 dark:border-slate-700"><tr><th class="py-2.5 px-4">Lô</th><th class="py-2.5 px-4">Hạn dùng</th><th class="py-2.5 px-4 text-right">Tồn ĐV cơ sở</th><th class="py-2.5 px-4">Đơn vị</th><th class="py-2.5 px-4 text-right">Giá nhập</th><th class="py-2.5 px-4">Trạng thái</th><th class="py-2.5 px-4 text-center">Thao tác</th></tr></thead>
                        <tbody class="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">${batchesHtml}</tbody>
                    </table>
                </div>
            </td>
        </tr>`;
}

function renderBatchRow(row) {
    const [label, cls] = statusMeta(row.status);
    const rowData = encodeURIComponent(JSON.stringify(row));
    const expiryNote = row.daysToExpiry === null ? '' : row.daysToExpiry < 0 ? `<div class="text-xs text-rose-500 font-bold mt-1">Quá hạn ${Math.abs(row.daysToExpiry)} ngày</div>` : `<div class="text-xs text-slate-600 dark:text-slate-400 mt-1">Còn ${row.daysToExpiry} ngày</div>`;

    return `
        <tr class="hover:bg-blue-50 dark:hover:bg-slate-800 transition-all duration-200">
            <td class="py-3 px-4"><span class="font-mono text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 px-2 py-1 rounded-lg">${escapeHTML(row.batchNumber)}</span></td>
            <td class="py-3 px-4"><div class="font-bold text-slate-800 dark:text-slate-200">${formatDate(row.expiryDate)}</div>${expiryNote}</td>
            <td class="py-3 px-4 text-right font-black ${row.stock <= 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-white'}">${formatNumber(row.stock)}</td>
            <td class="py-3 px-4 text-slate-700 dark:text-slate-300">${escapeHTML(row.baseUnit)}</td>
            <td class="py-3 px-4 text-right font-bold text-slate-800 dark:text-slate-200">${formatCurrency(row.costPrice)}</td>
            <td class="py-3 px-4"><span class="inline-flex px-2.5 py-1 rounded-lg text-xs font-black uppercase border border-transparent ${cls}">${label}</span></td>
            <td class="py-3 px-4 text-center"><div class="inline-flex items-center gap-1"><button onclick="window.viewSupplierInfo('${row.batchId}')" class="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200" title="Xem đối tác cung cấp"><i class="fa-solid fa-handshake"></i></button><button data-action="row-receive" data-row="${rowData}" class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200" title="Nhập thêm"><i class="fa-solid fa-plus"></i></button><button data-action="row-issue" data-row="${rowData}" class="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-200" title="Xuất nội bộ"><i class="fa-solid fa-arrow-up"></i></button><button data-action="row-stocktake" data-row="${rowData}" class="w-8 h-8 rounded-lg bg-violet-100 text-violet-700 hover:bg-violet-200 border border-violet-200" title="Kiểm kê"><i class="fa-solid fa-clipboard-check"></i></button></div></td>
        </tr>`;
}

async function loadInventory() {
    setLoading(true);
    try {
        const products = await fetchInventoryProducts();
        allRows = normalizeProducts(products);
        populateCategories(allRows);
        populateProductSelect();
        applyFilters();
    } catch (error) {
        console.error('Không thể tải tồn kho:', error);
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) errorMessage.textContent = `Lỗi tải tồn kho: ${error.message}`;
        else els.errorState.textContent = `Lỗi tải tồn kho: ${error.message}`;
        els.errorState.classList.remove('hidden');
    } finally {
        els.loadingState.classList.add('hidden');
    }
}

window.setActiveTab = (tabName) => {
    const tabButtons = document.querySelectorAll('.inv-tab-btn');
    tabButtons.forEach(btn => {
        if (btn.dataset.tab === tabName) {
            btn.className = 'inv-tab-btn active px-6 py-2.5 rounded-xl text-sm font-black bg-blue-600 text-white transition-all flex items-center gap-2 whitespace-nowrap';
        } else {
            btn.className = 'inv-tab-btn px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-all flex items-center gap-2 whitespace-nowrap';
        }
    });
};

function closeModal() {
    els.inventoryModal.classList.add('hidden');
    window.setActiveTab('stock-balances');
    if (['#receive', '#internal-issue', '#stocktake'].includes(window.location.hash)) {
        history.replaceState(null, '', window.location.pathname);
    }
}
function closeRowMenus() { document.querySelectorAll('.row-action-menu').forEach(menu => menu.classList.add('hidden')); }

function setReasonOptions(type) {
    const options = {
        purchase: [['purchase', 'Nhập hàng'], ['return', 'Trả hàng'], ['opening_balance', 'Tồn đầu kỳ']],
        internal_use: [['dose_cutting', 'Cắt liều'], ['damage', 'Hỏng/vỡ'], ['sample', 'Dùng nội bộ'], ['other', 'Khác']],
        stocktake_adjustment: [['stocktake', 'Kiểm kê định kỳ'], ['correction', 'Sửa sai tồn'], ['other', 'Khác']]
    }[type] || [];
    els.reasonInput.innerHTML = options.map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
}

function setDocumentMode(type) {
    currentDocumentType = type;
    els.movementType.value = type;
    const isReceive = type === 'purchase';
    const isIssue = type === 'internal_use';
    els.modalTitle.textContent = isReceive ? 'Tạo phiếu nhập hàng' : isIssue ? 'Tạo phiếu xuất nội bộ' : 'Tạo phiếu kiểm kê';
    els.quantityLabel.textContent = isReceive ? 'Số lượng nhập' : isIssue ? 'Số lượng xuất' : 'Tồn thực tế';
    els.modalHint.textContent = isReceive ? 'Thêm các dòng hàng nhập theo từng lô/hạn dùng. Khi xác nhận, hệ thống mới cộng tồn.' : isIssue ? 'Thêm các dòng xuất cho cắt liều/hao hụt/dùng nội bộ. Khi xác nhận, hệ thống mới trừ tồn.' : 'Thêm các dòng kiểm kê theo lô. Khi xác nhận, tồn lô sẽ được đặt về số thực tế.';
    els.batchSelectWrap.classList.toggle('hidden', isReceive);
    els.batchNumberWrap.classList.toggle('hidden', !isReceive);
    els.expiryWrap.classList.toggle('hidden', !isReceive);
    els.costWrap.classList.toggle('hidden', !isReceive);
    els.supplierSelectWrap.classList.toggle('hidden', !isReceive);
    els.batchNumberInput.required = isReceive;
    els.expiryInput.required = isReceive;
    els.batchSelect.required = !isReceive;
    if (isReceive) populateSupplierSelect();
}

function fillLineFormFromRow(row) {
    if (!row) return;
    els.productSelect.value = row.productId || '';
    populateBatchSelect(row.batchId || '');
    els.selectedBatchId.value = row.batchId || '';
    els.batchNumberInput.value = row.noBatch ? '' : row.batchNumber || '';
    els.expiryInput.value = row.expiryDate || '';
    els.costInput.value = row.costPrice || '';
}

function resetLineInputs(keepProduct = true) {
    els.quantityInput.value = '';
    if (currentDocumentType !== 'purchase') return;
    els.batchNumberInput.value = '';
    els.expiryInput.value = '';
    els.costInput.value = '';
    if (!keepProduct) els.productSelect.value = '';
}

function openModal(type, row = null) {
    els.inventoryForm.reset();
    documentLines = [];
    populateProductSelect(row?.productId || '');
    setReasonOptions(type);
    setDocumentMode(type);
    fillLineFormFromRow(row);
    renderDocumentLines();
    els.inventoryModal.classList.remove('hidden');
    
    // Đồng bộ highlight tab
    const tabName = type === 'purchase' ? 'stock-receive' : type === 'internal_use' ? 'stock-issue' : 'stock-check';
    window.setActiveTab(tabName);
}

function buildLineFromForm() {
    const productId = els.productSelect.value;
    const product = findProductRow(productId);
    const qty = Number(els.quantityInput.value || 0);
    const reasonLabel = els.reasonInput.options[els.reasonInput.selectedIndex]?.textContent || '';
    if (!product) throw new Error('Vui lòng chọn hàng hóa.');
    if (Number.isNaN(qty) || qty < 0) throw new Error('Số lượng không hợp lệ.');
    if (currentDocumentType !== 'stocktake_adjustment' && qty <= 0) throw new Error('Số lượng phải lớn hơn 0.');

    if (currentDocumentType === 'purchase') {
        const batchNumber = els.batchNumberInput.value.trim();
        const expiryDate = els.expiryInput.value;
        if (!batchNumber) throw new Error('Vui lòng nhập mã lô.');
        if (!expiryDate) throw new Error('Vui lòng nhập hạn dùng.');
        return {
            id: crypto.randomUUID(),
            type: currentDocumentType,
            productId,
            productName: product.name,
            productCode: product.code,
            batchId: null,
            batchNumber,
            expiryDate,
            quantity: qty,
            countedQuantity: qty,
            costPrice: Number(els.costInput.value || 0),
            reason: els.reasonInput.value,
            reasonLabel,
            baseUnit: product.baseUnit
        };
    }

    const batch = findBatchRow(els.batchSelect.value);
    if (!batch) throw new Error('Vui lòng chọn lô tồn kho.');
    if (currentDocumentType === 'internal_use' && batch.stock < qty) throw new Error(`Không đủ tồn lô ${batch.batchNumber}: còn ${formatNumber(batch.stock)}.`);

    return {
        id: crypto.randomUUID(),
        type: currentDocumentType,
        productId,
        productName: batch.name,
        productCode: batch.code,
        batchId: batch.batchId,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        quantity: qty,
        countedQuantity: qty,
        costPrice: batch.costPrice,
        reason: els.reasonInput.value,
        reasonLabel,
        baseUnit: batch.baseUnit
    };
}

function addDocumentLine() {
    try {
        documentLines.push(buildLineFromForm());
        renderDocumentLines();
        resetLineInputs();
    } catch (error) {
        alert(error.message);
    }
}

function validateDocumentLinesBeforeSubmit() {
    if (currentDocumentType === 'internal_use') {
        const totalsByBatch = new Map();
        documentLines.forEach(line => {
            totalsByBatch.set(line.batchId, (totalsByBatch.get(line.batchId) || 0) + Number(line.quantity || 0));
        });
        for (const [batchId, total] of totalsByBatch.entries()) {
            const batch = findBatchRow(batchId);
            if (batch && total > batch.stock) {
                throw new Error(`Lô ${batch.batchNumber} không đủ tồn: cần ${formatNumber(total)}, còn ${formatNumber(batch.stock)}.`);
            }
        }
    }

    if (currentDocumentType === 'stocktake_adjustment') {
        const seen = new Set();
        for (const line of documentLines) {
            if (seen.has(line.batchId)) throw new Error(`Phiếu kiểm kê bị trùng lô ${line.batchNumber}. Vui lòng giữ một dòng kiểm kê cho mỗi lô.`);
            seen.add(line.batchId);
        }
    }
}
function renderDocumentLines() {
    els.documentLineCount.textContent = `${formatNumber(documentLines.length)} dòng`;
    if (documentLines.length === 0) {
        els.documentLinesBody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-slate-500 font-medium">Chưa có dòng nào trong phiếu</td></tr>';
        return;
    }

    els.documentLinesBody.innerHTML = documentLines.map(line => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200">
            <td class="py-3 px-4"><div class="font-black text-slate-900 dark:text-white">${escapeHTML(line.productName)}</div><div class="text-xs font-mono text-slate-500">${escapeHTML(line.productCode)}</div></td>
            <td class="py-3 px-4"><div class="font-bold text-slate-800 dark:text-slate-200">${escapeHTML(line.batchNumber)}</div><div class="text-xs text-slate-500">HSD ${formatDate(line.expiryDate)}</div></td>
            <td class="py-3 px-4 text-right font-black text-slate-900 dark:text-white">${formatNumber(line.quantity)} ${escapeHTML(line.baseUnit)}</td>
            <td class="py-3 px-4 text-right font-bold text-slate-700 dark:text-slate-300">${currentDocumentType === 'purchase' ? formatCurrency(line.costPrice) : '-'}</td>
            <td class="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">${escapeHTML(line.reasonLabel)}</td>
            <td class="py-3 px-4 text-center"><button type="button" data-action="remove-document-line" data-line-id="${line.id}" class="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-all duration-200"><i class="fa-solid fa-trash"></i></button></td>
        </tr>`).join('');
}

async function submitInventoryForm() {
    if (documentLines.length === 0) {
        alert('Vui lòng thêm ít nhất một dòng vào phiếu.');
        return;
    }

    try {
        validateDocumentLinesBeforeSubmit();
    } catch (error) {
        alert(error.message);
        return;
    }

    const submitButton = document.querySelector('[data-action="submit-inventory-form"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...';

    try {
        for (const line of documentLines) {
            const payload = { ...line, note: els.noteInput.value.trim() || null };
            if (currentDocumentType === 'purchase') await receiveStock(payload);
            if (currentDocumentType === 'internal_use') await issueInternalStock(payload);
            if (currentDocumentType === 'stocktake_adjustment') await adjustStocktake(payload);
        }
        await saveInventoryDocument({ 
            documentType: currentDocumentType, 
            note: els.noteInput.value.trim() || null, 
            lines: documentLines,
            supplier_id: currentDocumentType === 'purchase' ? (els.supplierSelect.value || null) : null
        });
        closeModal();
        await loadInventory();
    } catch (error) {
        alert(`Không thể lưu phiếu: ${error.message}`);
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fa-solid fa-check"></i> Xác nhận phiếu';
    }
}

window.viewSupplierInfo = async (batchId) => {
    if (!batchId) return;
    try {
        const supplier = await fetchBatchSupplier(batchId);
        if (!supplier) {
            alert('Lô hàng này chưa được gán thông tin đối tác cung cấp (hoặc là tồn đầu kỳ).');
            return;
        }

        let actionHtml = '';
        if (supplier.contact_type === 'phone') {
            actionHtml = `<a href="tel:${supplier.contact_info}" class="mt-4 w-full bg-emerald-600 text-white py-3 rounded-xl font-black text-center block uppercase tracking-wider"><i class="fa-solid fa-phone mr-2"></i> Gọi điện / Zalo (${supplier.contact_info})</a>`;
        } else if (supplier.contact_type === 'web') {
            const url = supplier.contact_info?.startsWith('http') ? supplier.contact_info : `https://${supplier.contact_info}`;
            actionHtml = `<a href="${url}" target="_blank" class="mt-4 w-full bg-blue-600 text-white py-3 rounded-xl font-black text-center block uppercase tracking-wider"><i class="fa-solid fa-globe mr-2"></i> Mở Website đặt hàng</a>`;
        }

        // Tạo một modal đơn giản để hiển thị
        const infoHtml = `
            <div id="supplierInfoModal" class="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
                <div class="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                    <div class="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <h4 class="font-black text-slate-800 dark:text-white uppercase text-sm tracking-tight">Thông tin đối tác cung cấp</h4>
                        <button onclick="this.closest('#supplierInfoModal').remove()" class="text-slate-400 hover:text-red-500"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="p-6">
                        <div class="flex items-center gap-4 mb-4">
                            <div class="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl">
                                <i class="fa-solid fa-handshake"></i>
                            </div>
                            <div>
                                <div class="font-black text-lg text-slate-800 dark:text-white">${supplier.name}</div>
                                <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest">${supplier.contact_type === 'phone' ? 'Trình dược viên' : supplier.contact_type === 'web' ? 'Đặt qua Web' : 'Nội bộ'}</div>
                            </div>
                        </div>
                        ${supplier.note ? `<p class="text-sm text-slate-600 dark:text-slate-400 mb-4 italic">"${supplier.note}"</p>` : ''}
                        ${actionHtml}
                        <button onclick="this.closest('#supplierInfoModal').remove()" class="mt-2 w-full py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">Đóng</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', infoHtml);
    } catch (err) {
        alert('Lỗi: ' + err.message);
    }
};

function exportCsv() {
    const rows = filteredRows;
    const header = ['Mã hàng', 'Tên hàng', 'Nhóm hàng', 'Lô', 'Hạn dùng', 'Tồn ĐV cơ sở', 'Đơn vị cơ sở', 'Trạng thái', 'Giá bán'];
    const lines = rows.map(row => [row.code, row.name, row.category, row.batchNumber, row.expiryDate || '', row.stock, row.baseUnit, statusMeta(row.status)[0], row.retailPrice]);
    const csv = [header, ...lines].map(cols => cols.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ton-kho-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function decodeRow(target) {
    const encoded = target.closest('[data-row]')?.dataset.row;
    return encoded ? JSON.parse(decodeURIComponent(encoded)) : null;
}

function openActionFromHash() {
    if (window.location.hash === '#receive') {
        window.location.href = 'receive.html';
        return;
    }
    if (window.location.hash === '#stocktake') {
        window.location.href = 'stocktake.html';
        return;
    }
    const actionByHash = {
        '#internal-issue': 'internal_use'
    };
    const type = actionByHash[window.location.hash];
    if (type) openModal(type);
}

function bindEvents() {
    ['inventorySearch', 'categoryFilter', 'statusFilter', 'sortFilter'].forEach(id => els[id].addEventListener(id === 'inventorySearch' ? 'input' : 'change', applyFilters));
    els.productSelect.addEventListener('change', () => populateBatchSelect());
    els.batchSelect.addEventListener('change', syncBatchFields);
    
    // Đăng ký click cho các tab tồn kho
    document.querySelectorAll('.inv-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            if (tabName === 'stock-balances') {
                closeModal();
            } else if (tabName === 'stock-receive') {
                window.location.href = 'receive.html';
            } else if (tabName === 'stock-issue') {
                window.location.href = 'products.html#internal-issues-list';
            } else if (tabName === 'stock-check') {
                window.location.href = 'stocktake.html';
            }
        });
    });

    document.addEventListener('click', event => {
        const actionEl = event.target.closest('[data-action]');
        const action = actionEl?.dataset.action;
        if (!action) { closeRowMenus(); return; }
        if (action !== 'row-menu') closeRowMenus();
        if (action === 'reload-inventory') loadInventory();
        if (action === 'export-inventory') exportCsv();
        if (action === 'open-receive-modal') window.location.href = 'receive.html';
        if (action === 'open-issue-modal') window.location.href = 'products.html#internal-issues-list';
        if (action === 'open-stocktake-modal') window.location.href = 'stocktake.html';
        if (action === 'row-receive') {
            const row = decodeRow(event.target);
            if (row) {
                window.location.href = `receive.html?productId=${row.productId}&batchNumber=${row.batchNumber}&expiryDate=${row.expiryDate}&costPrice=${row.costPrice}`;
            } else {
                window.location.href = 'receive.html';
            }
        }
        if (action === 'row-issue') window.location.href = 'products.html#internal-issues-list';
        if (action === 'row-stocktake') {
            const row = decodeRow(event.target);
            if (row) {
                window.location.href = `stocktake.html?productId=${row.productId}&batchId=${row.batchId}`;
            } else {
                window.location.href = 'stocktake.html';
            }
        }
        if (action === 'add-document-line') addDocumentLine();
        if (action === 'remove-document-line') {
            documentLines = documentLines.filter(line => line.id !== actionEl.dataset.lineId);
            renderDocumentLines();
        }
        if (action === 'close-inventory-modal') closeModal();
        if (action === 'submit-inventory-form') submitInventoryForm();
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    initLayout('admin', 'inventory');
    cacheElements();
    bindEvents();
    window.addEventListener('hashchange', openActionFromHash);
    await loadInventory();
    openActionFromHash();
});
