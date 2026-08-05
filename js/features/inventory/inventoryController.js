import { initLayout } from '../../components/layout.js';
import { adjustStocktake, fetchInventoryProducts, issueInternalStock, receiveStock, saveInventoryDocument, fetchBatchSupplier } from './inventoryService.js';
import { removeVietnameseTones } from '../products/productService.js';
import { fetchSuppliers, createSupplier } from '../suppliers/supplierService.js';
import { supabaseClient } from '../../core/supabase.js';
import { cancelOrder } from '../pos/orderService.js';
import { buildInternalIssueNote, parseInternalIssueNote } from './internalIssueMetadata.js';
import { cancelInternalIssueCashbookTransaction, upsertInternalIssueCashbookTransaction } from './internalIssueCashbookService.js';
import { applyStocktakeDocumentAtomic } from '../stocktake/stocktakeAtomicService.js';

const LOW_STOCK_THRESHOLD = 5;
const NEAR_EXPIRY_DAYS = 30;
let allRows = [];
let filteredRows = [];
let documentLines = [];
let currentDocumentType = 'purchase';
let purchasePaymentLastEdited = null;
const els = {};

let inventoryCurrentPage = 1;
let inventoryItemsPerPage = 20;
let issueDocsCurrentPage = 1;
let issueDocsItemsPerPage = 20;
let issueDocsTotalCount = 0;
let receiveDocsCurrentPage = 1;
let receiveDocsItemsPerPage = 20;
let receiveDocsTotalCount = 0;
let stocktakeDocsCurrentPage = 1;
let stocktakeDocsItemsPerPage = 20;
let stocktakeDocsTotalCount = 0;

window.changeInventoryPage = (page) => {
    if (page < 1) return;
    inventoryCurrentPage = page;
    renderTable(filteredRows);
};

window.changeInventoryItemsPerPage = (size) => {
    inventoryItemsPerPage = parseInt(size, 10);
    inventoryCurrentPage = 1;
    renderTable(filteredRows);
};

window.changeIssueDocsPage = (page) => {
    if (page < 1) return;
    issueDocsCurrentPage = page;
    loadInternalIssuesData();
};
window.changeIssueDocsItemsPerPage = (size) => {
    issueDocsItemsPerPage = parseInt(size, 10) || 20;
    issueDocsCurrentPage = 1;
    loadInternalIssuesData();
};
window.changeReceiveDocsPage = (page) => {
    if (page < 1) return;
    receiveDocsCurrentPage = page;
    loadPurchaseDocuments();
};
window.changeReceiveDocsItemsPerPage = (size) => {
    receiveDocsItemsPerPage = parseInt(size, 10) || 20;
    receiveDocsCurrentPage = 1;
    loadPurchaseDocuments();
};
window.changeStocktakeDocsPage = (page) => {
    if (page < 1) return;
    stocktakeDocsCurrentPage = page;
    loadStocktakeDocuments();
};
window.changeStocktakeDocsItemsPerPage = (size) => {
    stocktakeDocsItemsPerPage = parseInt(size, 10) || 20;
    stocktakeDocsCurrentPage = 1;
    loadStocktakeDocuments();
};

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
        const isDose = false;
        return !isCombo && !isDose;
    });

    return physicalProducts.flatMap(product => {
        const baseUnit = getBaseUnit(product);
        // Tự động bỏ qua các lô đã hết hàng (số lượng = 0) để tránh rác giao diện
        const batches = (product.product_batches || []).filter(b => Number(b.stock_quantity || 0) > 0);
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
            isActive: product.is_active !== false,
            _searchKey: product._searchKey || removeVietnameseTones(`${product.product_code || ''} ${product.name || ''} ${product.barcode || ''}`).toUpperCase()
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
            row._searchKey = common._searchKey + ' ' + removeVietnameseTones(row.batchNumber || '').toUpperCase();
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
function getInventoryItemProductDisplay(item) {
    const name = item?.products?.name || item?.product_name || 'Sản phẩm';
    const code = item?.products?.product_code || item?.product_code || '';
    const deletedNote = !item?.products?.name && item?.product_name
        ? '<span class="text-[10px] text-amber-600 block font-bold">Đã xóa khỏi hàng hóa</span>'
        : '';
    return { name, code, deletedNote };
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
        'purchasePaymentWrap', 'purchaseTotalVal', 'purchasePaidInput', 'purchaseDebtInput',
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

function getPurchaseDocumentTotal() {
    if (currentDocumentType !== 'purchase') return 0;
    return documentLines.reduce((sum, line) => sum + (Number(line.quantity || 0) * Number(line.costPrice || 0)), 0);
}

function updatePurchasePaymentFields() {
    const isPurchase = currentDocumentType === 'purchase';
    els.purchasePaymentWrap?.classList.toggle('hidden', !isPurchase);
    if (!isPurchase || !els.purchasePaidInput || !els.purchaseDebtInput) return;

    const total = getPurchaseDocumentTotal();
    if (els.purchaseTotalVal) els.purchaseTotalVal.textContent = formatCurrency(total);

    if (!purchasePaymentLastEdited) {
        els.purchasePaidInput.value = total;
        els.purchaseDebtInput.value = 0;
        return;
    }

    if (purchasePaymentLastEdited === 'paid') {
        const paid = Math.min(Math.max(Number(els.purchasePaidInput.value || 0), 0), total);
        els.purchasePaidInput.value = paid;
        els.purchaseDebtInput.value = Math.max(0, total - paid);
    } else {
        const debt = Math.min(Math.max(Number(els.purchaseDebtInput.value || 0), 0), total);
        els.purchaseDebtInput.value = debt;
        els.purchasePaidInput.value = Math.max(0, total - debt);
    }
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

function updateStats() {
    const groups = getProductGroups(allRows);
    els.statProducts.textContent = formatNumber(groups.length);
    els.statStock.textContent = formatNumber(groups.reduce((sum, group) => sum + Number(group.totalStock || 0), 0));
    els.statOut.textContent = formatNumber(groups.filter(group => group.status === 'out-of-stock').length);
    els.statNearExpiry.textContent = formatNumber(groups.filter(group => group.status === 'near-expiry').length);
    els.statExpired.textContent = formatNumber(groups.filter(group => group.status === 'expired').length);
}

function applyFilters() {
    const query = els.inventorySearch.value.trim().toLowerCase();
    const category = els.categoryFilter.value;
    const status = els.statusFilter.value;
    const sort = els.sortFilter.value;

    // Reset pagination on filter change
    inventoryCurrentPage = 1;

    const queryKey = removeVietnameseTones(query).toUpperCase();
    const baseRows = allRows.filter(row => {
        if (queryKey && !(row._searchKey || '').includes(queryKey)) return false;
        if (category !== 'all' && row.category !== category) return false;
        return true;
    });

    let groups = getProductGroups(baseRows);
    if (status !== 'all') {
        groups = groups.filter(group => group.status === status);
    }

    groups.sort((a, b) => compareProductGroups(a, b, sort));
    filteredRows = groups.flatMap(group => group.batches);

    updateStats();
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

function compareProductGroups(a, b, sort) {
    if (sort === 'stock-asc') {
        return a.totalStock - b.totalStock || a.name.localeCompare(b.name, 'vi');
    }

    if (sort === 'name-asc') {
        return a.name.localeCompare(b.name, 'vi');
    }

    if (sort === 'updated-desc') {
        return b.code.localeCompare(a.code) || a.name.localeCompare(b.name, 'vi');
    }

    const aDays = a.batches.reduce((min, batch) => Math.min(min, batch.daysToExpiry ?? Number.POSITIVE_INFINITY), Number.POSITIVE_INFINITY);
    const bDays = b.batches.reduce((min, batch) => Math.min(min, batch.daysToExpiry ?? Number.POSITIVE_INFINITY), Number.POSITIVE_INFINITY);
    return aDays - bDays || a.name.localeCompare(b.name, 'vi');
}

function renderTable(rows) {
    if (rows.length === 0) {
        els.emptyState.classList.remove('hidden');
        els.inventoryTableWrapper.classList.add('hidden');
        return;
    }

    els.emptyState.classList.add('hidden');
    els.inventoryTableWrapper.classList.remove('hidden');

    const groups = getProductGroups(rows);
    const totalPages = Math.max(1, Math.ceil(groups.length / inventoryItemsPerPage));
    if (inventoryCurrentPage > totalPages) inventoryCurrentPage = totalPages;

    const startIndex = (inventoryCurrentPage - 1) * inventoryItemsPerPage;
    const endIndex = startIndex + inventoryItemsPerPage;
    const renderList = groups.slice(startIndex, endIndex);

    let html = renderList.map(group => renderProductGroup(group)).join('');
    if (groups.length > 0) {
        html += `
            <tr>
                <td colspan="7" class="py-4 px-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
                    <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div class="flex items-center gap-2">
                            <span class="text-sm font-medium text-slate-500 dark:text-slate-400">Hiển thị:</span>
                            <select onchange="window.changeInventoryItemsPerPage(this.value)" class="text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer">
                                <option value="20" ${inventoryItemsPerPage === 20 ? 'selected' : ''}>20 nhóm / trang</option>
                                <option value="50" ${inventoryItemsPerPage === 50 ? 'selected' : ''}>50 nhóm / trang</option>
                                <option value="100" ${inventoryItemsPerPage === 100 ? 'selected' : ''}>100 nhóm / trang</option>
                            </select>
                            <span class="text-sm font-medium text-slate-500 dark:text-slate-400 ml-2">Tổng: ${groups.length}</span>
                        </div>
<div class="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                            <button onclick="window.changeInventoryPage(${Math.max(1, inventoryCurrentPage - 1)})" class="px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${inventoryCurrentPage === 1 ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95'}"><i class="fa-solid fa-chevron-left mr-1"></i> Trước</button>
                            <div class="px-4 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-black text-sm rounded-lg border border-blue-100 dark:border-blue-800/50">Trang ${inventoryCurrentPage} / ${totalPages}</div>
                            <button onclick="window.changeInventoryPage(${Math.min(totalPages, inventoryCurrentPage + 1)})" class="px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${inventoryCurrentPage === totalPages ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95'}">Sau <i class="fa-solid fa-chevron-right ml-1"></i></button>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }

    els.inventoryTableBody.innerHTML = html;
}

function renderProductGroup(group) {
    const [label, cls] = statusMeta(group.status);
    const groupData = encodeURIComponent(JSON.stringify(group));
    const safeCode = escapeHTML(group.code);

    let batchesHtml = '';
    const activeBatches = group.batches || [];
    if (activeBatches.length > 0) {
        batchesHtml = activeBatches.map(batch => renderBatchCard(batch, safeCode)).join('');
    } else {
        batchesHtml = `<span class="text-slate-400 italic text-xs">Chưa có thông tin lô</span>`;
    }

    return `
        <tr class="product-row bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            <td class="py-4 px-5 text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest align-top">${safeCode}</td>
            <td class="py-4 px-5 align-top">
                <div class="font-bold text-slate-800 dark:text-white text-sm mb-1">${escapeHTML(group.name)}</div>
                <div class="text-[10px] text-slate-500 uppercase tracking-wider font-bold">${escapeHTML(group.category)}</div>
            </td>
            <td class="py-4 px-5 align-top">
                <div class="font-bold text-slate-900 dark:text-white text-sm mb-1">${escapeHTML(group.baseUnit)}</div>
                <div class="text-[11px] font-black text-blue-600 dark:text-blue-400">${formatCurrency(group.retailPrice)}</div>
            </td>
            <td class="py-4 px-5 align-top min-w-[300px]">
                ${batchesHtml}
            </td>
            <td class="py-4 px-5 align-top text-center w-24">
                <div class="flex flex-col gap-2 items-center">
                    <button data-action="row-receive" data-row="${groupData}" class="w-full px-3 py-2 rounded-xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200 text-xs font-black"><i class="fa-solid fa-plus mr-1"></i> Nhập lô</button>
                    <span class="inline-flex px-2 py-1 rounded text-[10px] font-black uppercase border border-transparent ${cls} w-full justify-center">${label}</span>
                </div>
            </td>
        </tr>`;
}

function renderBatchCard(row, safeCode) {
    const rowData = encodeURIComponent(JSON.stringify(row));
    
    let expStr = '--/--/----';
    let expColor = 'text-slate-500 dark:text-slate-400';
    if (row.expiryDate) {
        expStr = formatDate(row.expiryDate);
        if (row.daysToExpiry < 0) expColor = 'text-red-500 dark:text-red-400 font-bold';
        else if (row.daysToExpiry < 90) expColor = 'text-orange-500 dark:text-orange-400 font-bold';
        else expColor = 'text-emerald-600 dark:text-emerald-400 font-medium';
    }

    const deleteBtn = row.stock <= 0 && row.batchId ? `
        <button onclick="window.deleteZeroBatch('${row.batchId}', '${escapeHTML(row.batchNumber)}')" class="w-7 h-7 flex items-center justify-center rounded bg-red-100 text-red-700 hover:bg-red-200" title="Xóa lô rỗng">
            <i class="fa-solid fa-trash-can text-[10px]"></i>
        </button>
    ` : '';

    return `
    <div class="flex items-center justify-between gap-3 text-xs mb-1.5 last:mb-0 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow transition-shadow">
        <div class="flex items-center gap-2">
            <span class="font-bold text-slate-800 dark:text-slate-200 text-[11px] uppercase">${escapeHTML(row.batchNumber || 'MẶC ĐỊNH')}</span>
            <span class="text-[10px] font-black bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded ${row.stock <= 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-300'} border border-slate-200 dark:border-slate-600">SL: ${row.stock}</span>
            <span class="${expColor} text-[10px] ml-1">${expStr}</span>
        </div>
        <div class="flex items-center gap-1.5">
            <button data-action="row-stocktake" data-row="${rowData}" class="w-7 h-7 flex items-center justify-center rounded bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400" title="Kiểm kê điều chỉnh"><i class="fa-solid fa-scale-balanced text-[10px]"></i></button>
            <button data-action="row-issue" data-row="${rowData}" class="w-7 h-7 flex items-center justify-center rounded bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400" title="Xuất kho lô này"><i class="fa-solid fa-arrow-right-from-bracket text-[10px]"></i></button>
            ${deleteBtn}
        </div>
    </div>`;
}

function renderBatchRow(row) {
    return renderBatchCard(row, '');
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


// ---------------- DRAFT LOGIC ----------------
function getDraftKey() {
    return `INVENTORY_DRAFT_STATE_${currentDocumentType}`;
}

function saveDraft() {
    if (documentLines.length === 0 && !els.noteInput.value.trim()) {
        localStorage.removeItem(getDraftKey());
        return;
    }
    const draftData = {
        lines: documentLines,
        note: els.noteInput.value.trim(),
        reason: els.reasonInput.value
    };
    try {
        localStorage.setItem(getDraftKey(), JSON.stringify(draftData));
    } catch (e) {
        console.error('Failed to save draft:', e);
    }
}

function restoreDraft() {
    try {
        const draftStr = localStorage.getItem(getDraftKey());
        if (draftStr) {
            const draftData = JSON.parse(draftStr);
            if (draftData.lines && draftData.lines.length > 0) {
                if (confirm(`Bạn có bản nháp phiếu ${els.modalTitle.textContent} chưa hoàn thành. Bạn có muốn khôi phục không?`)) {
                    documentLines = draftData.lines;
                    els.noteInput.value = draftData.note || '';
                    if (draftData.reason) els.reasonInput.value = draftData.reason;
                    return true; // Restored
                } else {
                    localStorage.removeItem(getDraftKey());
                }
            }
        }
    } catch (e) {
        console.error('Failed to restore draft:', e);
    }
    return false; // Not restored
}
// ---------------------------------------------

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
    els.purchasePaymentWrap?.classList.toggle('hidden', !isReceive);
    els.batchNumberInput.required = isReceive;
    els.expiryInput.required = isReceive;
    els.batchSelect.required = !isReceive;
    if (isReceive) populateSupplierSelect();
    updatePurchasePaymentFields();
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
    purchasePaymentLastEdited = null;
    populateProductSelect(row?.productId || '');
    setReasonOptions(type);
    setDocumentMode(type);
    
    // Check and restore draft
    const restored = restoreDraft();
    if (!restored) {
        fillLineFormFromRow(row);
    }
    
    renderDocumentLines();
    els.inventoryModal.classList.remove('hidden');

    // Đồng bộ highlight tab
    const tabName = type === 'purchase' ? 'stock-receive' : type === 'internal_use' ? 'stock-issue' : 'stock-check';
    window.setActiveTab(tabName);

    // Auto-focus standard quantity input for direct entry
    if (row && els.quantityInput) {
        setTimeout(() => {
            els.quantityInput.focus();
            els.quantityInput.select();
        }, 150);
    }
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
        saveDraft();
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
    updatePurchasePaymentFields();
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
        if (currentDocumentType === 'stocktake_adjustment') {
            await applyStocktakeDocumentAtomic({
                note: els.noteInput.value.trim() || null,
                reason: els.reasonInput.value || 'stocktake',
                lines: documentLines.map(line => ({
                    ...line,
                    countedQuantity: line.countedQuantity ?? line.quantity,
                    isNewBatch: !line.batchId,
                    isRenamed: false
                }))
            });
        } else {
            for (const line of documentLines) {
                const payload = { ...line, note: els.noteInput.value.trim() || null };
                if (currentDocumentType === 'purchase') await receiveStock(payload);
                if (currentDocumentType === 'internal_use') await issueInternalStock(payload);
            }
        }
        const purchaseTotal = getPurchaseDocumentTotal();
        const purchasePaid = currentDocumentType === 'purchase'
            ? Math.min(Math.max(Number(els.purchasePaidInput?.value || 0), 0), purchaseTotal)
            : 0;
        const purchaseDebt = currentDocumentType === 'purchase'
            ? Math.max(0, purchaseTotal - purchasePaid)
            : 0;
        if (currentDocumentType !== 'stocktake_adjustment') {
            await saveInventoryDocument({
                documentType: currentDocumentType,
                note: els.noteInput.value.trim() || null,
                lines: documentLines,
                supplier_id: currentDocumentType === 'purchase' ? (els.supplierSelect.value || null) : null,
                total_amount: purchaseTotal,
                paid_amount: purchasePaid,
                debt_amount: purchaseDebt
            });
        }

        // Ghi log hoạt động kho
        if (currentDocumentType === 'internal_use') {
            try {
                const { logActivity } = await import('../logs/auditService.js');
                await logActivity('internal_use', {
                    note: els.noteInput.value.trim() || null,
                    items: documentLines.map(line => ({
                        product_id: line.productId,
                        product_name: line.productName,
                        product_code: line.productCode,
                        batch_number: line.batchNumber,
                        quantity: line.quantity,
                        base_unit: line.baseUnit,
                        reason: line.reasonLabel || line.reason
                    }))
                });
            } catch (logErr) {
                console.warn('Lỗi ghi log xuất nội bộ:', logErr);
            }
        } else if (currentDocumentType === 'stocktake_adjustment') {
            try {
                const { logActivity } = await import('../logs/auditService.js');
                await logActivity('stocktake_adjustment', {
                    note: els.noteInput.value.trim() || null,
                    items: documentLines.map(line => {
                        const batch = findBatchRow(line.batchId);
                        const systemQuantity = batch ? batch.stock : 0;
                        const delta = line.quantity - systemQuantity;
                        return {
                            product_id: line.productId,
                            product_name: line.productName,
                            product_code: line.productCode,
                            batch_number: line.batchNumber,
                            system_quantity: systemQuantity,
                            counted_quantity: line.quantity,
                            delta: delta,
                            delta_value: delta * (line.costPrice || 0),
                            base_unit: line.baseUnit,
                            reason: line.reasonLabel || line.reason
                        };
                    })
                });
            } catch (logErr) {
                console.warn('Lỗi ghi log kiểm kê:', logErr);
            }
        }

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

function checkStocktakeDraft() {
    const draftJson = localStorage.getItem('khaihoan_stocktake_draft');
    const banner = document.getElementById('draftStocktakeBanner');
    if (!banner) return;
    
    if (draftJson) {
        try {
            const draftData = JSON.parse(draftJson);
            const ageHours = (Date.now() - draftData.timestamp) / (1000 * 60 * 60);
            if (ageHours <= 24 * 7) {
                banner.classList.remove('hidden');
                banner.classList.add('flex');
                return;
            }
        } catch(e) {}
    }
    banner.classList.add('hidden');
    banner.classList.remove('flex');
}

function switchTab(tabId) {
    document.querySelectorAll('.inv-tab-btn').forEach(btn => {
        const tab = btn.dataset.tab;
        if (tab === tabId) {
            btn.className = 'inv-tab-btn active px-6 py-2.5 rounded-xl text-sm font-black bg-blue-600 text-white transition-all flex items-center gap-2 whitespace-nowrap';
        } else {
            btn.className = 'inv-tab-btn px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-all flex items-center gap-2 whitespace-nowrap';
        }
    });

    document.querySelectorAll('.inv-tab-content').forEach(content => {
        content.classList.add('hidden');
    });

    if (tabId === 'stock-balances') {
        document.getElementById('tab-stock-balances')?.classList.remove('hidden');
    } else if (tabId === 'stock-receive') {
        document.getElementById('tab-stock-receive')?.classList.remove('hidden');
        loadPurchaseDocuments();
    } else if (tabId === 'stock-issue') {
        document.getElementById('tab-stock-issue')?.classList.remove('hidden');
        loadInternalIssuesData();
    } else if (tabId === 'stock-check') {
        document.getElementById('tab-stock-check')?.classList.remove('hidden');
        loadStocktakeDocuments();
        checkStocktakeDraft();
    } else if (tabId === 'daily-check') {
        document.getElementById('tab-daily-check')?.classList.remove('hidden');
    }
}

function handleHashChange() {
    const hash = window.location.hash;
    if (hash === '#receive') {
        window.location.href = 'receive.html';
        return;
    }
    if (hash === '#stocktake') {
        window.location.href = 'stocktake.html';
        return;
    }
    if (hash === '#stock-receive' || hash === '#receive-list') {
        switchTab('stock-receive');
        return;
    }
    if (hash === '#stock-issue' || hash === '#internal-issues-list' || hash === '#internal-issue') {
        switchTab('stock-issue');
        return;
    }
    if (hash === '#stock-check' || hash === '#stocktake-list') {
        switchTab('stock-check');
        return;
    }
    if (hash === '#daily-check') {
        switchTab('daily-check');
        return;
    }
    switchTab('stock-balances');
}

function bindEvents() {
    if (els.noteInput) {
        els.noteInput.addEventListener('input', () => {
            if (documentLines.length > 0 || els.noteInput.value.trim() !== '') saveDraft();
        });
    }
    if (els.reasonInput) {
        els.reasonInput.addEventListener('change', () => {
            if (documentLines.length > 0) saveDraft();
        });
    }
    let searchTimeout;
    ['inventorySearch', 'categoryFilter', 'statusFilter', 'sortFilter'].forEach(id => {
        if (id === 'inventorySearch') {
            els[id].addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(applyFilters, 300);
            });
        } else {
            els[id].addEventListener('change', applyFilters);
        }
    });
    els.productSelect.addEventListener('change', () => populateBatchSelect());
    els.batchSelect.addEventListener('change', syncBatchFields);
    els.purchasePaidInput?.addEventListener('input', () => {
        purchasePaymentLastEdited = 'paid';
        updatePurchasePaymentFields();
    });
    els.purchaseDebtInput?.addEventListener('input', () => {
        purchasePaymentLastEdited = 'debt';
        updatePurchasePaymentFields();
    });

    // Đăng ký click cho các tab tồn kho
    document.querySelectorAll('.inv-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
            window.location.hash = `#${tabName}`;
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
        if (action === 'open-issue-modal') {
            switchTab('stock-issue');
            window.location.hash = '#stock-issue';
        }
        if (action === 'open-stocktake-modal') window.location.href = 'stocktake.html';
        if (action === 'row-receive') {
            const row = decodeRow(event.target);
            if (row) {
                window.location.href = `receive.html?productId=${row.productId}&batchNumber=${row.batchNumber}&expiryDate=${row.expiryDate}&costPrice=${row.costPrice}`;
            } else {
                window.location.href = 'receive.html';
            }
        }
        if (action === 'row-issue') {
            const row = decodeRow(event.target);
            if (row) {
                // Mở phiếu xuất nội bộ và chọn đúng mặt hàng đó cho nhân viên tiện sử dụng
                document.getElementById('openIssueCreateBtn')?.click();
                setTimeout(() => {
                    if (issueProductSelect) {
                        const matched = internalPhysicalProducts.find(prod => prod.id === row.productId);
                        issueProductSelect.value = matched ? issueProductLabel(matched) : row.productId;
                        issueProductSelect.dispatchEvent(new Event('change'));
                        setTimeout(() => {
                            if (issueBatchSelect) {
                                issueBatchSelect.value = row.batchId;
                                issueBatchSelect.dispatchEvent(new Event('change'));
                                if (issueQtyInput) {
                                    issueQtyInput.focus();
                                }
                            }
                        }, 200);
                    }
                }, 300);
            }
        }
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
    if (!await initLayout('admin', 'inventory')) return;
    cacheElements();
    bindEvents();
    window.addEventListener('hashchange', handleHashChange);
    await loadInventory();
    handleHashChange();
    // Khởi tạo module Xuất nội bộ SAU KHI DOM đã sẵn sàng
    initInternalIssueModule();
    // Khởi tạo module Quản lý phiếu
    initDocumentManagementModule();
    
    // Phiếu kiểm kê nháp chỉ hiện banner; không ép người dùng tiếp tục/xóa khi vừa "Lưu & thoát".
    checkAndPromptDraftOnLoad();
});

function checkAndPromptDraftOnLoad() {
    const receiveDraftJson = localStorage.getItem('khaihoan_receive_draft');

    // Check receive draft
    if (receiveDraftJson) {
        try {
            const draftData = JSON.parse(receiveDraftJson);
            const ageHours = (Date.now() - draftData.timestamp) / (1000 * 60 * 60);
            if (ageHours <= 48) {
                setTimeout(() => {
                    const wantToContinue = confirm('Bạn đang có một phiếu NHẬP HÀNG chưa hoàn thành.\n\nBấm [OK] để TIẾP TỤC làm phiếu đó.\nBấm [Cancel / Hủy] để XÓA BỎ bản nháp này và làm việc khác.');
                    if (wantToContinue) {
                        window.location.href = 'receive.html';
                    } else {
                        localStorage.removeItem('khaihoan_receive_draft');
                    }
                }, 500);
            } else {
                localStorage.removeItem('khaihoan_receive_draft');
            }
        } catch(e) {}
    }
}

// WARNING: Hàm này cũng tồn tại trong productController.js.
// Nếu cần sửa logic xóa lô, phải sửa ở CẢ HAI file.
window.deleteZeroBatch = async (batchId, batchNumber) => {
    if (!batchId) return;
    if (!confirm(`Bạn có chắc chắn muốn xóa lô "${batchNumber}" đã về 0 tồn này khỏi hệ thống?`)) return;

    try {
        const { error } = await supabaseClient
            .from('product_batches')
            .delete()
            .eq('id', batchId)
            .eq('stock_quantity', 0); // safety check

        if (error) {
            if (error.message?.includes('violates foreign key constraint') || error.code === '23503') {
                throw new Error("Lô hàng này đã có giao dịch phát sinh trong lịch sử (hóa đơn, phiếu nhập/xuất), không thể xóa cứng để bảo toàn dữ liệu kế toán.");
            }
            throw error;
        }

        alert(`Đã xóa thành công lô "${batchNumber}" khỏi hệ thống.`);

        // Tìm dòng bị xóa để lấy thông tin productId
        const deletedRow = allRows.find(row => row.batchId === batchId);
        if (deletedRow) {
            const productId = deletedRow.productId;
            // Tìm các lô khác của cùng sản phẩm này
            const otherBatches = allRows.filter(row => row.productId === productId && row.batchId !== batchId);

            if (otherBatches.length === 0) {
                // Đây là lô cuối cùng! Chuyển đổi dòng này thành trạng thái "Chưa có lô" thay vì xóa hẳn
                allRows = allRows.map(row => {
                    if (row.batchId === batchId) {
                        return {
                            productId: row.productId,
                            code: row.code,
                            barcode: row.barcode,
                            name: row.name,
                            category: row.category,
                            baseUnit: row.baseUnit,
                            retailPrice: row.retailPrice,
                            costPrice: row.costPrice,
                            updatedAt: row.updatedAt,
                            isActive: row.isActive,
                            batchId: null,
                            batchNumber: 'Chưa có lô',
                            expiryDate: null,
                            daysToExpiry: null,
                            stock: 0,
                            noBatch: true,
                            status: 'no-batch'
                        };
                    }
                    return row;
                });
            } else {
                // Vẫn còn các lô khác, an toàn loại bỏ lô đã xóa
                allRows = allRows.filter(row => row.batchId !== batchId);
            }
        }

        // Gọi applyFilters để vẽ lại bảng ngay lập tức bằng dữ liệu bộ nhớ cục bộ
        applyFilters();
    } catch (err) {
        console.error("Lỗi xóa lô:", err);
        alert(err.message || "Đã xảy ra lỗi khi xóa lô.");
    }
};

// WARNING: Hàm này cũng tồn tại trong productController.js.
// Nếu cần sửa logic xóa lô, phải sửa ở CẢ HAI file.
window.deleteZeroBatch = async (batchId, batchNumber) => {
    if (!batchId) return;
    if (!confirm(`Bạn có chắc chắn muốn xóa lô "${batchNumber}" đã về 0 tồn này khỏi hệ thống?`)) return;

    try {
        const { error } = await supabaseClient
            .from('product_batches')
            .delete()
            .eq('id', batchId)
            .eq('stock_quantity', 0); // safety check

        if (error) {
            if (error.message?.includes('violates foreign key constraint') || error.code === '23503') {
                throw new Error("Lô hàng này đã có giao dịch phát sinh trong lịch sử (hóa đơn, phiếu nhập/xuất), không thể xóa cứng để bảo toàn dữ liệu kế toán.");
            }
            throw error;
        }

        alert(`Đã xóa thành công lô "${batchNumber}" khỏi hệ thống.`);

        // Tìm dòng bị xóa để lấy thông tin productId
        const deletedRow = allRows.find(row => row.batchId === batchId);
        if (deletedRow) {
            const productId = deletedRow.productId;
            // Tìm các lô khác của cùng sản phẩm này
            const otherBatches = allRows.filter(row => row.productId === productId && row.batchId !== batchId);

            if (otherBatches.length === 0) {
                // Đây là lô cuối cùng! Chuyển đổi dòng này thành trạng thái "Chưa có lô" thay vì xóa hẳn
                allRows = allRows.map(row => {
                    if (row.batchId === batchId) {
                        return {
                            productId: row.productId,
                            code: row.code,
                            barcode: row.barcode,
                            name: row.name,
                            category: row.category,
                            baseUnit: row.baseUnit,
                            retailPrice: row.retailPrice,
                            costPrice: row.costPrice,
                            updatedAt: row.updatedAt,
                            isActive: row.isActive,
                            batchId: null,
                            batchNumber: 'Chưa có lô',
                            expiryDate: null,
                            daysToExpiry: null,
                            stock: 0,
                            noBatch: true,
                            status: 'no-batch'
                        };
                    }
                    return row;
                });
            } else {
                // Vẫn còn các lô khác, an toàn loại bỏ lô đã xóa
                allRows = allRows.filter(row => row.batchId !== batchId);
            }
        }

        // Gọi applyFilters để vẽ lại bảng ngay lập tức bằng dữ liệu bộ nhớ cục bộ
        applyFilters();
    } catch (err) {
        alert('Không thể xóa lô: ' + err.message);
    }
};

// ==========================================
// PHẦN XUẤT NỘI BỘ / XUẤT HỦY HÀNG HÓA
// ==========================================
function normalizeReasonKey(reason) {
    const r = String(reason || '').trim().toLowerCase();
    if (r === 'dose_cutting' || r === 'cắt liều thuốc' || r === 'cắt liều' || r === 'cắt liều thuốc') return 'dose_cutting';
    if (r === 'damage' || r === 'hao hụt/hết hạn' || r === 'hỏng lẻ/vỡ' || r === 'hỏng/vỡ' || r === 'hao hụt hỏng') return 'damage';
    if (r === 'sample' || r === 'tiêu hao nội bộ' || r === 'tiêu hao' || r === 'dùng nội bộ' || r === 'dùng mẫu') return 'sample';
    if (r === 'other' || r === 'khác' || r === 'lý do khác') return 'other';
    return r;
}

function getReasonLabel(reason) {
    const r = normalizeReasonKey(reason);
    if (r === 'dose_cutting') return 'Cắt liều';
    if (r === 'damage') return 'Hao hụt hỏng';
    if (r === 'sample') return 'Tiêu hao';
    if (r === 'other') return 'Khác';
    return reason || 'Khác';
}

let internalIssuesHistory = [];
let internalIssueLines = [];
let internalPhysicalProducts = [];

function generateIssueCode() {
    const today = new Date();
    const dateStr = today.getFullYear().toString() +
        (today.getMonth() + 1).toString().padStart(2, '0') +
        today.getDate().toString().padStart(2, '0');
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `PXNB-${dateStr}-${rand}`;
}

async function loadInternalIssuesData() {
    const tbody = document.getElementById('internalIssuesTableBody');
    const pagination = document.getElementById('internalIssuesPagination');
    const search = document.getElementById('internalIssueSearch')?.value.trim() || '';
    const reasonFilter = document.getElementById('internalIssueReasonFilter')?.value || 'all';
    const targetFilter = document.getElementById('internalIssueTargetFilter')?.value || 'all';
    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="py-12 text-center text-slate-400">
                <i class="fa-solid fa-spinner animate-spin text-4xl mb-3 block text-orange-500"></i>
                Đang tải lịch sử xuất nội bộ...
            </td>
        </tr>
    `;

    try {
        const { data, error } = await supabaseClient
            .from('inventory_documents')
            .select(`
                id,
                document_code,
                confirmed_at,
                status,
                note,
                inventory_document_items(
                    id,
                    product_id,
                    batch_id,
                    batch_number,
                    expiry_date,
                    quantity_base,
                    cost_price,
                    reason,
                    product_name,
                    product_code,
                    products(name, product_code)
                )
            `, { count: 'exact' })
            .eq('document_type', 'internal_use')
            .order('confirmed_at', { ascending: false });

        if (error) throw error;

        const normalizedSearch = removeVietnameseTones(search).toUpperCase();
        const filtered = (data || []).filter(doc => {
            const meta = parseInternalIssueNote(doc.note || '');
            const reason = normalizeReasonKey(doc.inventory_document_items?.[0]?.reason);
            const matchesSearch = !normalizedSearch || removeVietnameseTones([
                doc.document_code || '',
                meta.userNote || '',
                meta.targetName || '',
                meta.targetLabel || ''
            ].join(' ')).toUpperCase().includes(normalizedSearch);
            const matchesReason = reasonFilter === 'all' || reason === normalizeReasonKey(reasonFilter);
            const matchesTarget = targetFilter === 'all' || meta.targetType === targetFilter;
            return matchesSearch && matchesReason && matchesTarget;
        });

        issueDocsTotalCount = filtered.length;
        const from = (issueDocsCurrentPage - 1) * issueDocsItemsPerPage;
        const to = from + issueDocsItemsPerPage;
        internalIssuesHistory = filtered.slice(from, to);
        renderInternalIssuesList(internalIssuesHistory, issueDocsTotalCount);

    } catch (err) {
        console.error('Lỗi khi tải lịch sử xuất kho:', err);
        if (pagination) pagination.innerHTML = '';
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="py-12 text-center text-rose-500 font-bold">
                    Không thể tải dữ liệu: ${err.message}
                </td>
            </tr>
        `;
    }
}

function renderInternalIssuesList(items, totalCount = issueDocsTotalCount) {
    const tbody = document.getElementById('internalIssuesTableBody');
    const pagination = document.getElementById('internalIssuesPagination');
    if (!tbody) return;

    if (items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="py-12 text-center text-slate-400">
                    <i class="fa-solid fa-arrow-up-from-bracket text-4xl mb-3 opacity-30 block"></i>
                    Chưa có phiếu xuất nội bộ nào được ghi nhận.
                </td>
            </tr>
        `;
        if (pagination) pagination.innerHTML = '';
        return;
    }

    tbody.innerHTML = items.map(doc => {
        const itemsList = doc.inventory_document_items || [];
        const meta = parseInternalIssueNote(doc.note || '');
        const uniqueProducts = [...new Set(itemsList.map(item => item.products?.name || item.product_name).filter(Boolean))];
        const productsSummary = uniqueProducts.length > 2
            ? `${uniqueProducts.slice(0, 2).join(', ')} và ${uniqueProducts.length - 2} mặt hàng khác`
            : uniqueProducts.join(', ') || 'Chưa xác định';

        const totalQty = itemsList.reduce((sum, item) => sum + Math.abs(Number(item.quantity_base || 0)), 0);
        const reason = getReasonLabel(itemsList[0]?.reason);
        const isCancelled = doc.status === 'cancelled';
        const rowClass = isCancelled
            ? 'bg-rose-50/50 dark:bg-rose-950/10 text-slate-400'
            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40';
        const statusBadge = isCancelled
            ? '<span class="ml-2 px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[10px] font-black uppercase">Đã hủy</span>'
            : '';
        const cancelButton = isCancelled
            ? '<span class="text-xs font-bold text-slate-400">Đã hủy</span>'
            : `<button type="button" data-action="cancel-issue-doc" data-id="${doc.id}" class="h-8 px-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-850 hover:bg-rose-600 hover:text-white transition-all text-xs font-bold">Hủy</button>`;

        return `
            <tr class="${rowClass} border-b border-slate-100 dark:border-slate-800">
                <td class="py-3.5 px-5 font-bold text-orange-600 dark:text-orange-400">${escapeHTML(doc.document_code)}${statusBadge}</td>
                <td class="py-3.5 px-5 text-slate-500">${new Date(doc.confirmed_at).toLocaleString('vi-VN')}</td>
                <td class="py-3.5 px-5 font-black uppercase text-xs text-slate-700 dark:text-slate-200">
                    <span class="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">${escapeHTML(reason)}</span>
                </td>
                <td class="py-3.5 px-5 text-slate-600 dark:text-slate-300">
                    <div class="font-bold">${escapeHTML(meta.targetName || 'Chưa ghi nhận')}</div>
                    <div class="text-[11px] font-semibold text-slate-400">${escapeHTML(meta.targetLabel || 'Khác')}</div>
                </td>
                <td class="py-3.5 px-5 text-right font-black text-slate-700 dark:text-slate-200">${totalQty}</td>
                <td class="py-3.5 px-5 text-slate-500 font-medium max-w-xs truncate">${escapeHTML(meta.userNote || '---')}</td>
                <td class="py-3.5 px-5 text-center flex items-center justify-center gap-2">
                    <button type="button" data-action="view-issue-detail" data-id="${doc.id}" class="h-8 px-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-850 hover:bg-orange-600 hover:text-white transition-all text-xs font-bold">Xem</button>
                    ${cancelButton}
                </td>
            </tr>
        `;
    }).join('');
    renderDocumentPagination(pagination, totalCount || items.length, issueDocsCurrentPage, issueDocsItemsPerPage, 'issue');
}

function getLinkedPOSOrderId(note = '') {
    const match = String(note || '').match(/\[POS_ORDER:([^\]]+)\]/);
    return match?.[1] || null;
}

async function fetchInternalIssueDocument(docId) {
    const cached = internalIssuesHistory.find(doc => doc.id === docId);
    if (cached?.inventory_document_items) return cached;

    const { data, error } = await supabaseClient
        .from('inventory_documents')
        .select(`
            id,
            document_code,
            confirmed_at,
            status,
            note,
            inventory_document_items(
                id,
                product_id,
                batch_id,
                batch_number,
                expiry_date,
                quantity_base,
                cost_price,
                reason,
                product_name,
                product_code,
                products(name, product_code)
            )
        `)
        .eq('id', docId)
        .single();

    if (error) throw error;
    return data;
}

async function restoreStockFromIssueItems(items = []) {
    for (const item of items) {
        if (!item.batch_id) continue;
        const restoreQty = Math.abs(Number(item.quantity_base || 0));
        if (restoreQty <= 0) continue;

        const { data: batch, error: batchErr } = await supabaseClient
            .from('product_batches')
            .select('id, stock_quantity')
            .eq('id', item.batch_id)
            .single();
        if (batchErr) throw batchErr;

        const { error: updateErr } = await supabaseClient
            .from('product_batches')
            .update({ stock_quantity: Number(batch.stock_quantity || 0) + restoreQty })
            .eq('id', item.batch_id);
        if (updateErr) throw updateErr;
    }
}

async function insertIssueCancelMovements(doc, reasonText) {
    const rows = (doc.inventory_document_items || [])
        .filter(item => item.product_id && item.batch_id)
        .map(item => ({
            document_id: doc.id,
            product_id: item.product_id,
            batch_id: item.batch_id,
            movement_type: 'internal_use',
            quantity_base: Math.abs(Number(item.quantity_base || 0)),
            cost_price: Number(item.cost_price || 0),
            reason: item.reason || 'cancel_issue',
            note: `[HỦY PHIẾU ${doc.document_code}] ${reasonText}`
        }));

    if (!rows.length) return;
    const { error } = await supabaseClient.from('inventory_movements').insert(rows);
    if (error) throw error;
}

async function markIssueDocumentCancelled(doc, reasonText) {
    const note = `${doc.note || ''} [ĐÃ HỦY PHIẾU: ${reasonText}]`;
    const { error } = await supabaseClient
        .from('inventory_documents')
        .update({ status: 'cancelled', note })
        .eq('id', doc.id);
    if (error) throw error;
}

async function cancelInternalIssueDocument(docId) {
    const doc = await fetchInternalIssueDocument(docId);
    if (!doc || doc.status === 'cancelled') return;

    const linkedOrderId = getLinkedPOSOrderId(doc.note);
    const reasonText = prompt(`Lý do hủy phiếu xuất ${doc.document_code}:`);
    if (!reasonText?.trim()) return;

    const message = linkedOrderId
        ? `Phiếu này liên kết hóa đơn POS. Hủy phiếu sẽ hủy luôn hóa đơn liên kết, hoàn tồn và loại vốn/doanh thu liên quan. Tiếp tục?`
        : `Hủy phiếu sẽ cộng lại tồn kho theo các dòng xuất và loại chi phí khỏi báo cáo bằng dòng đảo. Tiếp tục?`;
    if (!confirm(message)) return;

    if (linkedOrderId) {
        const { data: linkedOrder, error: orderErr } = await supabaseClient
            .from('orders')
            .select('status')
            .eq('id', linkedOrderId)
            .maybeSingle();
        if (orderErr) throw orderErr;

        if (linkedOrder && linkedOrder.status !== 'cancelled') {
            await cancelOrder(linkedOrderId, `Hủy phiếu xuất ${doc.document_code}: ${reasonText.trim()}`);
        } else {
            await restoreStockFromIssueItems(doc.inventory_document_items || []);
            await insertIssueCancelMovements(doc, reasonText.trim());
            await markIssueDocumentCancelled(doc, reasonText.trim());
            await cancelInternalIssueCashbookTransaction(doc.id, reasonText.trim());
        }
    } else {
        await restoreStockFromIssueItems(doc.inventory_document_items || []);
        await insertIssueCancelMovements(doc, reasonText.trim());
        await markIssueDocumentCancelled(doc, reasonText.trim());
        await cancelInternalIssueCashbookTransaction(doc.id, reasonText.trim());
    }

    await loadInternalIssuesData();
    await loadInventory();
    alert('Đã hủy phiếu xuất và cập nhật tồn kho.');
}

// =============================================
// MODULE XUẤT NỘI BỘ — Khởi tạo sau DOMContentLoaded
// =============================================
function initInternalIssueModule() {

    let internalIssueSearchTimeout;
    // Bind search filter for internal issues history
    document.getElementById('internalIssueSearch')?.addEventListener('input', (e) => {
        clearTimeout(internalIssueSearchTimeout);
        internalIssueSearchTimeout = setTimeout(() => {
            issueDocsCurrentPage = 1;
            loadInternalIssuesData();
        }, 300);
    });
    ['internalIssueReasonFilter', 'internalIssueTargetFilter'].forEach((id) => {
        document.getElementById(id)?.addEventListener('change', () => {
            issueDocsCurrentPage = 1;
            loadInternalIssuesData();
        });
    });

    // Modal selectors — DOM đã ready nên getElementById luôn trả về đúng element
    const issueModal = document.getElementById('internalIssueModal');
    const issueProductSelect = document.getElementById('issueProductSelect');
    const issueProductOptions = document.getElementById('issueProductOptions');
    const issueBatchSelect = document.getElementById('issueBatchSelect');
    const issueQtyInput = document.getElementById('issueQtyInput');
    const issueNoteInput = document.getElementById('issueNoteInput');
    const issueLinesBody = document.getElementById('issueLinesBody');
    const issueDocCode = document.getElementById('issueDocCode');
    const issueDateInput = document.getElementById('issueDateInput');
    const issueReasonSelect = document.getElementById('issueReasonSelect');
    const issueTargetTypeSelect = document.getElementById('issueTargetTypeSelect');
    const issueTargetNameInput = document.getElementById('issueTargetNameInput');
    const issueProductLookup = new Map();

    const issueProductLabel = (product) => `${product.name || ''} - ${product.product_code || 'Chưa có mã'}`;
    const issueProductSearchKey = (product) => removeVietnameseTones(`${product.name || ''} ${product.product_code || ''}`).toUpperCase();
    const fillIssueProductOptions = () => {
        if (!issueProductOptions) return;
        issueProductLookup.clear();
        issueProductOptions.innerHTML = internalPhysicalProducts.map(product => {
            const label = issueProductLabel(product);
            issueProductLookup.set(label, product.id);
            issueProductLookup.set(product.id, product.id);
            return `<option value="${escapeHTML(label)}"></option>`;
        }).join('');
    };
    const resolveIssueProductId = () => {
        const rawValue = issueProductSelect?.value?.trim() || '';
        if (!rawValue) return '';
        if (issueProductLookup.has(rawValue)) return issueProductLookup.get(rawValue);

        const query = removeVietnameseTones(rawValue).toUpperCase();
        const matched = internalPhysicalProducts.find(product => issueProductSearchKey(product).includes(query));
        return matched?.id || '';
    };
    const syncIssueProductSelection = () => {
        const productId = resolveIssueProductId();
        if (!productId) {
            issueBatchSelect.innerHTML = '<option value="">-- Không tìm thấy sản phẩm phù hợp --</option>';
            issueQtyInput.value = '';
            return null;
        }

        const product = internalPhysicalProducts.find(prod => prod.id === productId);
        if (!product) {
            issueBatchSelect.innerHTML = '<option value="">-- Không tìm thấy sản phẩm phù hợp --</option>';
            issueQtyInput.value = '';
            return null;
        }

        if (issueProductSelect) issueProductSelect.value = issueProductLabel(product);

        const batches = product.product_batches.filter(b => Number(b.stock_quantity || 0) > 0);
        issueBatchSelect.innerHTML = batches.length === 0
            ? '<option value="">-- Không có lô nào còn tồn kho --</option>'
            : '<option value="">-- Chọn lô đang tồn --</option>' +
            batches.map(b => `<option value="${b.id}">Lô: ${escapeHTML(b.batch_number)} - HSD: ${b.expiry_date} - Còn tồn: ${b.stock_quantity}</option>`).join('');

        issueQtyInput.value = '';
        return product;
    };

    window.openInternalIssueModal = async (preselectProductCode = null) => {
        if (!issueModal) return;

        // 1. Reset Form
        issueDocCode.value = generateIssueCode();
        issueDateInput.value = new Date().toISOString().substring(0, 10);
        issueNoteInput.value = '';
        issueQtyInput.value = '';
        if (issueTargetTypeSelect) issueTargetTypeSelect.value = 'staff';
        if (issueTargetNameInput) issueTargetNameInput.value = '';
        internalIssueLines = [];
        renderIssueLines();

        // 2. Open Modal
        issueModal.classList.remove('hidden');

        // 3. Load active products
        issueProductSelect.value = '';
        issueBatchSelect.innerHTML = '<option value="">-- Chọn sản phẩm trước --</option>';
        try {
            const { data, error } = await supabaseClient
                .from('products')
                .select(`
                id,
                name,
                product_code,
                categories(name),
                product_units(unit_name, is_base_unit),
                product_batches(id, batch_number, stock_quantity, expiry_date, cost_price)
            `)
                .order('name', { ascending: true });

            if (error) throw error;

            // Filter only physical goods
            internalPhysicalProducts = (data || []).filter(p => {
                const catName = p.categories?.name || '';
                return !catName.toLowerCase().includes('combo');
            });

            fillIssueProductOptions();

            if (preselectProductCode) {
                const productToSelect = internalPhysicalProducts.find(p => p.product_code === preselectProductCode);
                if (productToSelect) {
                    setTimeout(() => {
                        issueProductSelect.value = productToSelect.id;
                        syncIssueProductSelection();
                    }, 50);
                }
            }

        } catch (err) {
            console.error('Lỗi khi tải hàng hóa cho phiếu xuất:', err);
        }
    };

    document.getElementById('openIssueCreateBtn')?.addEventListener('click', () => window.openInternalIssueModal());

    const closeIssueModal = () => {
        if (issueModal) issueModal.classList.add('hidden');
    };
    document.getElementById('closeIssueModalBtn')?.addEventListener('click', closeIssueModal);
    document.getElementById('cancelIssueModalBtn')?.addEventListener('click', closeIssueModal);

    issueProductSelect?.addEventListener('change', syncIssueProductSelection);
    issueProductSelect?.addEventListener('blur', syncIssueProductSelection);

    document.getElementById('addIssueLineBtn')?.addEventListener('click', () => {
        const productId = resolveIssueProductId();
        const batchId = issueBatchSelect.value;
        const qty = Number(issueQtyInput.value);

        if (!productId || !batchId) {
            alert('Vui lòng chọn sản phẩm và lô hàng cụ thể.');
            return;
        }
        if (Number.isNaN(qty) || qty <= 0) {
            alert('Số lượng xuất phải lớn hơn 0.');
            return;
        }

        const p = internalPhysicalProducts.find(prod => prod.id === productId);
        const batch = p ? p.product_batches.find(b => b.id === batchId) : null;

        if (!batch) {
            alert('Lô hàng không hợp lệ.');
            return;
        }

        if (qty > Number(batch.stock_quantity || 0)) {
            alert(`Số lượng xuất (${qty}) vượt quá lượng tồn kho thực tế (${batch.stock_quantity}).`);
            return;
        }

        if (internalIssueLines.some(line => line.batchId === batchId)) {
            alert('Lô hàng này đã được đưa vào danh sách xuất bên dưới.');
            return;
        }

        const baseUnit = p.product_units?.find(u => u.is_base_unit)?.unit_name || 'ĐVT';

        internalIssueLines.push({
            id: crypto.randomUUID(),
            productId,
            productName: p.name,
            batchId,
            batchNumber: batch.batch_number,
            expiryDate: batch.expiry_date,
            costPrice: Number(batch.cost_price || 0),
            quantity: qty,
            baseUnit
        });

        renderIssueLines();
        issueQtyInput.value = '';
    });

    function renderIssueLines() {
        if (!issueLinesBody) return;

        if (internalIssueLines.length === 0) {
            issueLinesBody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-slate-400 font-semibold">Chưa có sản phẩm nào được chọn.</td></tr>';
            return;
        }

        issueLinesBody.innerHTML = internalIssueLines.map(line => {
            const totalVal = line.quantity * line.costPrice;
            return `
            <tr class="border-b border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-350">
                <td class="py-2.5 px-4 font-bold">${escapeHTML(line.productName)}</td>
                <td class="py-2.5 px-4 font-semibold text-slate-500">Lô: ${escapeHTML(line.batchNumber)} - HSD: ${line.expiryDate}</td>
                <td class="py-2.5 px-4 text-right font-black text-orange-600">${line.quantity} ${escapeHTML(line.baseUnit)}</td>
                <td class="py-2.5 px-4 text-right font-semibold text-slate-500">${formatCurrency(line.costPrice)}</td>
                <td class="py-2.5 px-4 text-right font-bold text-slate-700 dark:text-slate-200">${formatCurrency(totalVal)}</td>
                <td class="py-2.5 px-4 text-center">
                    <button type="button" data-action="remove-issue-line" data-id="${line.id}" class="w-8 h-8 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all flex items-center justify-center"><i class="fa-solid fa-trash-can"></i></button>
                </td>
            </tr>
        `;
        }).join('');
    }

    issueLinesBody?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action="remove-issue-line"]');
        if (!btn) return;
        const id = btn.dataset.id;
        internalIssueLines = internalIssueLines.filter(line => line.id !== id);
        renderIssueLines();
    });

    document.getElementById('internalIssueForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (internalIssueLines.length === 0) {
            alert('Vui lòng thêm ít nhất một sản phẩm cần xuất kho.');
            return;
        }

        const targetType = issueTargetTypeSelect?.value || 'staff';
        const targetName = issueTargetNameInput?.value.trim() || '';
        if (!targetName) {
            alert('Vui lòng nhập người / đối tượng tiêu hao.');
            issueTargetNameInput?.focus();
            return;
        }

        const submitBtn = document.getElementById('submitIssueDocBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch animate-spin"></i> Đang xuất kho...';

        try {
            // 1. Create document header
            const docPayload = {
                document_code: issueDocCode.value,
                document_type: 'internal_use',
                status: 'confirmed',
                note: buildInternalIssueNote({
                    note: issueNoteInput.value || '',
                    targetType,
                    targetName
                }) || null,
                confirmed_at: new Date().toISOString()
            };

            const { data: doc, error: docErr } = await supabaseClient
                .from('inventory_documents')
                .insert([docPayload])
                .select('id')
                .single();

            if (docErr) throw docErr;

            // 2. Loop lines to update batch stock levels and insert detail items
            const detailItems = [];
            for (let i = 0; i < internalIssueLines.length; i++) {
                const line = internalIssueLines[i];

                const { data: batch, error: getErr } = await supabaseClient
                    .from('product_batches')
                    .select('stock_quantity')
                    .eq('id', line.batchId)
                    .single();

                if (getErr) throw getErr;

                const currentStock = Number(batch.stock_quantity || 0);
                if (currentStock < line.quantity) {
                    throw new Error(`Mặt hàng ${line.productName} không đủ số lượng tồn kho để xuất.`);
                }

                const { error: updErr } = await supabaseClient
                    .from('product_batches')
                    .update({ stock_quantity: currentStock - line.quantity })
                    .eq('id', line.batchId);

                if (updErr) throw updErr;

                await supabaseClient.from('inventory_movements').insert([{
                    product_id: line.productId,
                    batch_id: line.batchId,
                    movement_type: 'internal_use',
                    quantity_base: -line.quantity,
                    cost_price: line.costPrice,
                    reason: issueReasonSelect.value,
                    note: issueNoteInput.value || null
                }]);

                detailItems.push({
                    document_id: doc.id,
                    line_no: i + 1,
                    product_id: line.productId,
                    batch_id: line.batchId,
                    batch_number: line.batchNumber,
                    expiry_date: line.expiryDate,
                    quantity_base: -line.quantity,
                    cost_price: line.costPrice,
                    reason: issueReasonSelect.value,
                    note: issueNoteInput.value || null
                });
            }

            const { error: itemsErr } = await supabaseClient
                .from('inventory_document_items')
                .insert(detailItems);

            if (itemsErr) throw itemsErr;

            try {
                const totalCost = internalIssueLines.reduce((sum, line) => sum + (Number(line.quantity || 0) * Number(line.costPrice || 0)), 0);
                await upsertInternalIssueCashbookTransaction({
                    documentId: doc.id,
                    documentCode: issueDocCode.value,
                    amount: totalCost,
                    transactionDate: docPayload.confirmed_at,
                    reason: issueReasonSelect.value,
                    targetType,
                    targetName,
                    note: issueNoteInput.value || ''
                });
            } catch (cashbookErr) {
                console.warn('Lỗi ghi sổ quỹ phiếu xuất nội bộ:', cashbookErr);
            }

            alert('Xuất kho nội bộ thành công!');
            closeIssueModal();
            loadInternalIssuesData();
            await loadInventory(); // Reload inventory balances

        } catch (err) {
            console.error('Lỗi khi xuất kho:', err);
            alert(`Xuất kho thất bại: ${err.message}`);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-check-double"></i> Xác nhận xuất kho';
        }
    });

    // ================= CHI TIẾT PHIẾU XUẤT =================
    const detailModal = document.getElementById('issueDetailModal');

    document.getElementById('internalIssuesTableBody')?.addEventListener('click', async (e) => {
        const cancelBtn = e.target.closest('[data-action="cancel-issue-doc"]');
        if (cancelBtn) {
            e.stopPropagation();
            try {
                await cancelInternalIssueDocument(cancelBtn.dataset.id);
            } catch (err) {
                console.error('Lỗi hủy phiếu xuất:', err);
                alert(`Hủy phiếu xuất thất bại: ${err.message}`);
            }
            return;
        }

        const btn = e.target.closest('[data-action="view-issue-detail"]');
        if (!btn) return;

        const id = btn.dataset.id;
        const doc = internalIssuesHistory.find(d => d.id === id);
        if (!doc) return;
        const meta = parseInternalIssueNote(doc.note || '');

        if (detailModal) {
            document.getElementById('detailDocCode').textContent = doc.document_code;
            document.getElementById('detailDate').textContent = new Date(doc.confirmed_at).toLocaleString('vi-VN');

            const items = doc.inventory_document_items || [];
            const reason = getReasonLabel(items[0]?.reason);
            document.getElementById('detailReason').textContent = reason;
            document.getElementById('detailTarget').textContent = meta.targetName
                ? `${meta.targetLabel} - ${meta.targetName}`
                : 'Chưa ghi nhận';

            const totalQty = items.reduce((sum, item) => sum + Math.abs(Number(item.quantity_base || 0)), 0);
            document.getElementById('detailTotalQty').textContent = `${totalQty} Đơn vị`;

            const totalCost = items.reduce((sum, item) => sum + (Math.abs(Number(item.quantity_base || 0)) * Number(item.cost_price || 0)), 0);
            document.getElementById('detailTotalCost').textContent = formatCurrency(totalCost);

            document.getElementById('detailNote').textContent = meta.userNote || '--- Không có ghi chú ---';

            const linesBody = document.getElementById('detailLinesBody');
            if (linesBody) {
                linesBody.innerHTML = items.map(item => {
                    const qty = Math.abs(Number(item.quantity_base || 0));
                    const cost = Number(item.cost_price || 0);
                    const productDisplay = getInventoryItemProductDisplay(item);
                    return `
                    <tr class="border-b border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-350">
                        <td class="py-2.5 px-4 font-bold">
                            ${escapeHTML(productDisplay.name)}
                            <span class="text-[10px] text-slate-400 block font-normal">${escapeHTML(productDisplay.code)}</span>
                            ${productDisplay.deletedNote}
                        </td>
                        <td class="py-2.5 px-4 font-semibold text-slate-500">Lô: ${escapeHTML(item.batch_number)} - HSD: ${item.expiry_date}</td>
                        <td class="py-2.5 px-4 text-right font-black text-orange-600">${qty}</td>
                        <td class="py-2.5 px-4 text-right font-semibold text-slate-500">${formatCurrency(cost)}</td>
                        <td class="py-2.5 px-4 text-right font-bold text-slate-700 dark:text-slate-200">${formatCurrency(qty * cost)}</td>
                    </tr>
                `;
                }).join('');
            }

            detailModal.classList.remove('hidden');
        }
    });

    const closeDetailModal = () => {
        if (detailModal) detailModal.classList.add('hidden');
    };
    document.getElementById('closeDetailModalBtn')?.addEventListener('click', closeDetailModal);
    document.getElementById('closeDetailModalBtn2')?.addEventListener('click', closeDetailModal);

    const prepareAssistantIssueDraftFromUrl = async () => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('assistantAction') !== 'discard-batch') return;

        const productCode = String(params.get('productCode') || '').trim();
        const batchId = String(params.get('batchId') || '').trim();
        if (!productCode || !batchId) return;

        switchTab('stock-issue');
        await window.openInternalIssueModal(productCode);

        const product = internalPhysicalProducts.find(
            item => String(item.product_code || '') === productCode
        );
        const batch = product?.product_batches?.find(
            item => String(item.id) === batchId && Number(item.stock_quantity || 0) > 0
        );
        if (!product || !batch) {
            alert('Không còn tìm thấy mặt hàng hoặc lô đang tồn để lập phiếu xuất bỏ.');
            return;
        }

        issueProductSelect.value = issueProductLabel(product);
        syncIssueProductSelection();
        issueBatchSelect.value = batch.id;
        issueQtyInput.value = String(Number(batch.stock_quantity || 0));
        if (issueReasonSelect) issueReasonSelect.value = 'damage';
        if (issueTargetTypeSelect) issueTargetTypeSelect.value = 'other';
        if (issueTargetNameInput) issueTargetNameInput.value = 'Xuất bỏ theo yêu cầu quản trị';
        if (issueNoteInput) {
            issueNoteInput.value = `Trợ lý quản trị chuẩn bị xuất bỏ toàn bộ lô ${batch.batch_number} của ${product.name}.`;
        }

        document.getElementById('addIssueLineBtn')?.click();
        document.getElementById('submitIssueDocBtn')?.focus();
        window.history.replaceState({}, '', `${window.location.pathname}#stock-issue`);
    };

    void prepareAssistantIssueDraftFromUrl();

} // end initInternalIssueModule()

// =============================================
// PHẦN QUẢN LÝ PHIẾU NHẬP HÀNG & PHIẾU KIỂM KÊ
// =============================================
let purchaseDocuments = [];
let stocktakeDocuments = [];

async function loadPurchaseDocuments() {
    const tbody = document.getElementById('receiveDocumentsTableBody');
    const pagination = document.getElementById('receiveDocumentsPagination');
    const search = document.getElementById('receiveDocumentsSearch')?.value.trim() || '';
    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="7" class="py-12 text-center text-slate-400">
                <i class="fa-solid fa-spinner animate-spin text-4xl mb-3 block text-emerald-500"></i>
                Đang tải lịch sử phiếu nhập...
            </td>
        </tr>
    `;

    try {
        let query = supabaseClient
            .from('inventory_documents')
            .select(`
                id,
                document_code,
                document_type,
                confirmed_at,
                note,
                supplier_id,
                suppliers(name),
                inventory_document_items(
                    quantity_base,
                    cost_price,
                    product_name,
                    product_code,
                    products(name, product_code)
                )
            `, { count: 'exact' })
            .eq('document_type', 'purchase')
            .order('confirmed_at', { ascending: false });

        if (search) query = query.or(`document_code.ilike.%${search}%,note.ilike.%${search}%`);
        query = query.range((receiveDocsCurrentPage - 1) * receiveDocsItemsPerPage, receiveDocsCurrentPage * receiveDocsItemsPerPage - 1);
        const { data, error, count } = await query;

        if (error) throw error;

        purchaseDocuments = data || [];
        receiveDocsTotalCount = count || 0;
        renderReceiveDocumentsList(purchaseDocuments, receiveDocsTotalCount);
    } catch (err) {
        console.error('Lỗi khi tải danh sách phiếu nhập:', err);
        if (pagination) pagination.innerHTML = '';
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="py-12 text-center text-rose-500 font-bold">
                    Không thể tải dữ liệu: ${err.message}
                </td>
            </tr>
        `;
    }
}

function renderReceiveDocumentsList(items, totalCount = receiveDocsTotalCount) {
    const tbody = document.getElementById('receiveDocumentsTableBody');
    const pagination = document.getElementById('receiveDocumentsPagination');
    if (!tbody) return;

    if (items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="py-12 text-center text-slate-400">
                    <i class="fa-solid fa-circle-plus text-4xl mb-3 opacity-30 block"></i>
                    Chưa có phiếu nhập hàng nào được ghi nhận.
                </td>
            </tr>
        `;
        if (pagination) pagination.innerHTML = '';
        return;
    }

    tbody.innerHTML = items.map(doc => {
        const itemsList = doc.inventory_document_items || [];
        const totalQty = itemsList.reduce((sum, item) => sum + Math.abs(Number(item.quantity_base || 0)), 0);
        const totalValue = itemsList.reduce((sum, item) => sum + (Math.abs(Number(item.quantity_base || 0)) * Number(item.cost_price || 0)), 0);
        const supplierName = doc.suppliers?.name || '---';

        return `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                <td class="py-3.5 px-5 font-bold text-emerald-600 dark:text-emerald-450 font-mono">${escapeHTML(doc.document_code)}</td>
                <td class="py-3.5 px-5 text-slate-700 dark:text-slate-200 font-semibold">${escapeHTML(supplierName)}</td>
                <td class="py-3.5 px-5 text-slate-550">${doc.confirmed_at ? new Date(doc.confirmed_at).toLocaleString('vi-VN') : '---'}</td>
                <td class="py-3.5 px-5 text-slate-500 font-medium max-w-xs truncate">${escapeHTML(doc.note || '---')}</td>
                <td class="py-3.5 px-5 text-right font-bold text-slate-700 dark:text-slate-200">${formatNumber(itemsList.length)}</td>
                <td class="py-3.5 px-5 text-right font-black text-emerald-600 dark:text-emerald-400">${formatCurrency(totalValue)}</td>
                <td class="py-3.5 px-5 text-center">
                    <button type="button" data-action="view-doc-detail" data-id="${doc.id}" class="h-8 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-850 hover:bg-emerald-600 hover:text-white transition-all text-xs font-bold">Xem</button>
                </td>
            </tr>
        `;
    }).join('');
    renderDocumentPagination(pagination, totalCount || items.length, receiveDocsCurrentPage, receiveDocsItemsPerPage, 'receive');
}

async function loadStocktakeDocuments() {
    const tbody = document.getElementById('stocktakeDocumentsTableBody');
    const pagination = document.getElementById('stocktakeDocumentsPagination');
    const search = document.getElementById('stocktakeDocumentsSearch')?.value.trim() || '';
    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="py-12 text-center text-slate-400">
                <i class="fa-solid fa-spinner animate-spin text-4xl mb-3 block text-violet-500"></i>
                Đang tải lịch sử phiếu kiểm kê...
            </td>
        </tr>
    `;

    try {
        let query = supabaseClient
            .from('inventory_documents')
            .select(`
                id,
                document_code,
                document_type,
                confirmed_at,
                note,
                inventory_document_items(
                    quantity_base,
                    counted_quantity_base,
                    cost_price,
                    reason,
                    product_name,
                    product_code,
                    products(name, product_code)
                )
            `, { count: 'exact' })
            .eq('document_type', 'stocktake_adjustment')
            .order('confirmed_at', { ascending: false });

        if (search) query = query.or(`document_code.ilike.%${search}%,note.ilike.%${search}%`);
        query = query.range((stocktakeDocsCurrentPage - 1) * stocktakeDocsItemsPerPage, stocktakeDocsCurrentPage * stocktakeDocsItemsPerPage - 1);
        const { data, error, count } = await query;

        if (error) throw error;

        stocktakeDocuments = data || [];
        stocktakeDocsTotalCount = count || 0;
        renderStocktakeDocumentsList(stocktakeDocuments, stocktakeDocsTotalCount);
    } catch (err) {
        console.error('Lỗi khi tải danh sách phiếu kiểm kê:', err);
        if (pagination) pagination.innerHTML = '';
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="py-12 text-center text-rose-500 font-bold">
                    Không thể tải dữ liệu: ${err.message}
                </td>
            </tr>
        `;
    }
}

function renderStocktakeDocumentsList(items, totalCount = stocktakeDocsTotalCount) {
    const tbody = document.getElementById('stocktakeDocumentsTableBody');
    const pagination = document.getElementById('stocktakeDocumentsPagination');
    if (!tbody) return;

    if (items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="py-12 text-center text-slate-400">
                    <i class="fa-solid fa-clipboard-check text-4xl mb-3 opacity-30 block"></i>
                    Chưa có phiếu kiểm kê nào được ghi nhận.
                </td>
            </tr>
        `;
        if (pagination) pagination.innerHTML = '';
        return;
    }

    tbody.innerHTML = items.map(doc => {
        const itemsList = doc.inventory_document_items || [];
        const reason = itemsList[0]?.reason || 'stocktake';
        const reasonLabel = reason === 'stocktake' ? 'Kiểm định kỳ' : reason === 'correction' ? 'Sửa sai lệch' : 'Lý do khác';

        return `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                <td class="py-3.5 px-5 font-bold text-violet-600 dark:text-violet-400 font-mono">${escapeHTML(doc.document_code)}</td>
                <td class="py-3.5 px-5 text-slate-550">${doc.confirmed_at ? new Date(doc.confirmed_at).toLocaleString('vi-VN') : '---'}</td>
                <td class="py-3.5 px-5">
                    <span class="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold">${escapeHTML(reasonLabel)}</span>
                </td>
                <td class="py-3.5 px-5 text-right font-black text-slate-755 dark:text-slate-200">${itemsList.length} dòng lệch</td>
                <td class="py-3.5 px-5 text-slate-500 font-medium max-w-xs truncate">${escapeHTML(doc.note || '---')}</td>
                <td class="py-3.5 px-5 text-center">
                    <button type="button" data-action="view-doc-detail" data-id="${doc.id}" class="h-8 px-3 rounded-lg bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-850 hover:bg-violet-600 hover:text-white transition-all text-xs font-bold">Xem</button>
                </td>
            </tr>
        `;
    }).join('');
    renderDocumentPagination(pagination, totalCount || items.length, stocktakeDocsCurrentPage, stocktakeDocsItemsPerPage, 'stocktake');
}

function renderDocumentPagination(container, totalCount, currentPage, itemsPerPage, type) {
    if (!container) return;
    const totalPages = Math.max(1, Math.ceil((totalCount || 0) / itemsPerPage));
    const changePageFn = type === 'issue' ? 'changeIssueDocsPage' : type === 'receive' ? 'changeReceiveDocsPage' : 'changeStocktakeDocsPage';
    const changeSizeFn = type === 'issue' ? 'changeIssueDocsItemsPerPage' : type === 'receive' ? 'changeReceiveDocsItemsPerPage' : 'changeStocktakeDocsItemsPerPage';
    container.innerHTML = `
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
            <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-slate-500 dark:text-slate-400">Hiển thị:</span>
                <select onchange="window.${changeSizeFn}(this.value)" class="text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5">
                    <option value="20" ${itemsPerPage === 20 ? 'selected' : ''}>20 phiếu / trang</option>
                    <option value="50" ${itemsPerPage === 50 ? 'selected' : ''}>50 phiếu / trang</option>
                    <option value="100" ${itemsPerPage === 100 ? 'selected' : ''}>100 phiếu / trang</option>
                </select>
                <span class="text-sm font-medium text-slate-500 dark:text-slate-400">Tổng: ${totalCount}</span>
            </div>
            <div class="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                <button onclick="window.${changePageFn}(${Math.max(1, currentPage - 1)})" class="px-3 py-1.5 rounded-lg text-sm font-bold ${currentPage === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}"><i class="fa-solid fa-chevron-left mr-1"></i>Trước</button>
                <div class="px-4 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-black text-sm rounded-lg border border-blue-100 dark:border-blue-800/50">Trang ${currentPage} / ${totalPages}</div>
                <button onclick="window.${changePageFn}(${Math.min(totalPages, currentPage + 1)})" class="px-3 py-1.5 rounded-lg text-sm font-bold ${currentPage === totalPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}">Sau<i class="fa-solid fa-chevron-right ml-1"></i></button>
            </div>
        </div>
    `;
}

// Khởi tạo quản lý phiếu kho riêng biệt
function initDocumentManagementModule() {
    // 1. Gắn sự kiện tìm kiếm độc lập cho Phiếu Nhập
    let receiveSearchTimeout;
    document.getElementById('receiveDocumentsSearch')?.addEventListener('input', (e) => {
        clearTimeout(receiveSearchTimeout);
        receiveSearchTimeout = setTimeout(() => {
            receiveDocsCurrentPage = 1;
            loadPurchaseDocuments();
        }, 300);
    });

    // 2. Gắn sự kiện tìm kiếm độc lập cho Phiếu Kiểm Kê
    let stocktakeSearchTimeout;
    document.getElementById('stocktakeDocumentsSearch')?.addEventListener('input', (e) => {
        clearTimeout(stocktakeSearchTimeout);
        stocktakeSearchTimeout = setTimeout(() => {
            stocktakeDocsCurrentPage = 1;
            loadStocktakeDocuments();
        }, 300);
    });

    // 3. Modal xem chi tiết phiếu dùng chung (Dynamic Rendering cho từng loại phiếu)
    const docDetailModal = document.getElementById('documentDetailModal');
    
    const showDetailHandler = async (id) => {
        // Tìm trong cả 3 nguồn lịch sử
        let doc = purchaseDocuments.find(d => d.id === id) || 
                  internalIssuesHistory.find(d => d.id === id) || 
                  stocktakeDocuments.find(d => d.id === id);
                  
        if (!doc) {
            // Nếu không tìm thấy cục bộ, thử tải từ Supabase trực tiếp
            try {
                const { data, error } = await supabaseClient
                    .from('inventory_documents')
                    .select(`
                        id,
                        document_code,
                        document_type,
                        confirmed_at,
                        note,
                        supplier_id,
                        suppliers(name),
                        inventory_document_items(
                            quantity_base,
                            counted_quantity_base,
                            cost_price,
                            reason,
                            product_name,
                            product_code,
                            products(name, product_code)
                        )
                    `)
                    .eq('id', id)
                    .single();
                if (error) throw error;
                doc = data;
            } catch (err) {
                alert('Không thể tải chi tiết phiếu: ' + err.message);
                return;
            }
        }

        if (docDetailModal && doc) {
            document.getElementById('docDetailCode').textContent = doc.document_code;
            
            let typeLabel = 'Khác';
            if (doc.document_type === 'purchase') typeLabel = 'Nhập hàng';
            else if (doc.document_type === 'internal_use') typeLabel = 'Xuất nội bộ';
            else if (doc.document_type === 'stocktake_adjustment') typeLabel = 'Kiểm kê kho';
            
            document.getElementById('docDetailType').textContent = typeLabel;
            document.getElementById('docDetailDate').textContent = doc.confirmed_at ? new Date(doc.confirmed_at).toLocaleString('vi-VN') : '---';

            const items = doc.inventory_document_items || [];
            document.getElementById('docDetailItems').textContent = `${items.length} mặt hàng`;
            
            const totalQty = items.reduce((sum, item) => sum + Math.abs(Number(item.quantity_base || 0)), 0);
            document.getElementById('docDetailQty').textContent = `${formatNumber(totalQty)} ĐV`;
            
            // Nếu là phiếu nhập, bổ sung thông tin Nhà cung cấp vào ghi chú
            let noteHtml = doc.note || '--- Không có ghi chú ---';
            if (doc.document_type === 'purchase' && doc.suppliers?.name) {
                noteHtml = `[NCC: ${doc.suppliers.name}] ` + noteHtml;
            }
            document.getElementById('docDetailNote').textContent = noteHtml;

            // Render động TABLE HEADER dựa trên loại phiếu
            const header = document.getElementById('docDetailLinesHeader');
            if (doc.document_type === 'purchase') {
                header.innerHTML = `
                    <tr>
                        <th class="py-2.5 px-4">Sản phẩm</th>
                        <th class="py-2.5 px-4">Số lô / HSD</th>
                        <th class="py-2.5 px-4 text-right">SL nhập</th>
                        <th class="py-2.5 px-4 text-right">Giá nhập</th>
                        <th class="py-2.5 px-4 text-right">Thành tiền</th>
                    </tr>
                `;
            } else if (doc.document_type === 'internal_use') {
                header.innerHTML = `
                    <tr>
                        <th class="py-2.5 px-4">Sản phẩm</th>
                        <th class="py-2.5 px-4">Số lô / HSD</th>
                        <th class="py-2.5 px-4 text-right">SL xuất</th>
                        <th class="py-2.5 px-4 text-right">Giá vốn</th>
                        <th class="py-2.5 px-4 text-right">Thành tiền</th>
                        <th class="py-2.5 px-4">Lý do</th>
                    </tr>
                `;
            } else if (doc.document_type === 'stocktake_adjustment') {
                header.innerHTML = `
                    <tr>
                        <th class="py-2.5 px-4">Sản phẩm</th>
                        <th class="py-2.5 px-4">Số lô / HSD</th>
                        <th class="py-2.5 px-4 text-right">Lệch Qty</th>
                        <th class="py-2.5 px-4 text-right">Thực tế</th>
                    </tr>
                `;
            }

            // Render động TABLE BODY
            const linesBody = document.getElementById('docDetailLinesBody');
            if (linesBody) {
                if (items.length === 0) {
                    linesBody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-slate-400">Không có dữ liệu chi tiết</td></tr>`;
                } else {
                    linesBody.innerHTML = items.map(item => {
                        const qty = Math.abs(Number(item.quantity_base || 0));
                        const cost = Number(item.cost_price || 0);
                        const counted = item.counted_quantity_base !== null ? Number(item.counted_quantity_base) : '-';
                        const lot = item.batch_number || '---';
                        const hsd = item.expiry_date ? formatDate(item.expiry_date) : '---';
                        const productDisplay = getInventoryItemProductDisplay(item);

                        if (doc.document_type === 'purchase') {
                            return `
                                <tr class="border-b border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-350">
                                    <td class="py-2.5 px-4 font-bold">
                                        ${escapeHTML(productDisplay.name)}
                                        <span class="text-[10px] text-slate-400 block font-normal">${escapeHTML(productDisplay.code)}</span>
                                        ${productDisplay.deletedNote}
                                    </td>
                                    <td class="py-2.5 px-4 font-semibold text-slate-500">Lô: ${escapeHTML(lot)} - HSD: ${hsd}</td>
                                    <td class="py-2.5 px-4 text-right font-black text-emerald-600">${qty}</td>
                                    <td class="py-2.5 px-4 text-right font-semibold text-slate-500">${formatCurrency(cost)}</td>
                                    <td class="py-2.5 px-4 text-right font-bold text-slate-700 dark:text-slate-200">${formatCurrency(qty * cost)}</td>
                                </tr>
                            `;
                        } else if (doc.document_type === 'internal_use') {
                            const reasonStr = item.reason === 'dose_cutting' ? 'Cắt liều' : item.reason === 'damage' ? 'Hao hụt hỏng' : item.reason === 'sample' ? 'Tiêu hao' : item.reason || 'Khác';
                            return `
                                <tr class="border-b border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-350">
                                    <td class="py-2.5 px-4 font-bold">
                                        ${escapeHTML(productDisplay.name)}
                                        <span class="text-[10px] text-slate-400 block font-normal">${escapeHTML(productDisplay.code)}</span>
                                        ${productDisplay.deletedNote}
                                    </td>
                                    <td class="py-2.5 px-4 font-semibold text-slate-500">Lô: ${escapeHTML(lot)} - HSD: ${hsd}</td>
                                    <td class="py-2.5 px-4 text-right font-black text-orange-600">${qty}</td>
                                    <td class="py-2.5 px-4 text-right font-semibold text-slate-500">${formatCurrency(cost)}</td>
                                    <td class="py-2.5 px-4 text-right font-bold text-slate-700 dark:text-slate-200">${formatCurrency(qty * cost)}</td>
                                    <td class="py-2.5 px-4 text-slate-500 font-medium">${escapeHTML(reasonStr)}</td>
                                </tr>
                            `;
                        } else if (doc.document_type === 'stocktake_adjustment') {
                            const deltaQty = Number(item.quantity_base || 0);
                            const deltaSign = deltaQty > 0 ? '+' : '';
                            const deltaClass = deltaQty < 0 ? 'text-rose-600 font-bold' : deltaQty > 0 ? 'text-emerald-600 font-bold' : 'text-slate-500 font-semibold';
                            return `
                                <tr class="border-b border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-350">
                                    <td class="py-2.5 px-4 font-bold">
                                        ${escapeHTML(productDisplay.name)}
                                        <span class="text-[10px] text-slate-400 block font-normal">${escapeHTML(productDisplay.code)}</span>
                                        ${productDisplay.deletedNote}
                                    </td>
                                    <td class="py-2.5 px-4 font-semibold text-slate-500">Lô: ${escapeHTML(lot)} - HSD: ${hsd}</td>
                                    <td class="py-2.5 px-4 text-right ${deltaClass}">${deltaSign}${deltaQty}</td>
                                    <td class="py-2.5 px-4 text-right font-black text-slate-700 dark:text-slate-200">${counted}</td>
                                </tr>
                            `;
                        }
                    }).join('');
                }
            }

            docDetailModal.classList.remove('hidden');
        }
    };

    // Lắng nghe xem chi tiết cho cả 3 bảng danh sách
    document.getElementById('receiveDocumentsTableBody')?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action="view-doc-detail"]');
        if (btn) showDetailHandler(btn.dataset.id);
    });
    
    document.getElementById('stocktakeDocumentsTableBody')?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action="view-doc-detail"]');
        if (btn) showDetailHandler(btn.dataset.id);
    });

    // Xuất nội bộ có nút xem chi tiết riêng, ta cũng gắn lắng nghe chung để hỗ trợ modal thống nhất
    document.getElementById('internalIssuesTableBody')?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action="view-issue-detail"]');
        if (btn) {
            e.stopPropagation();
            showDetailHandler(btn.dataset.id);
        }
    });

    const closeDocDetail = () => {
        if (docDetailModal) docDetailModal.classList.add('hidden');
    };
    document.getElementById('closeDocDetailBtn')?.addEventListener('click', closeDocDetail);
    document.getElementById('closeDocDetailBtn2')?.addEventListener('click', closeDocDetail);
}
