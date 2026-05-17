import { initLayout } from '../../components/layout.js';
import { fetchPurchaseOrders, fetchPurchaseSuggestions, fetchSuppliers, savePurchaseOrder } from './purchaseService.js';

let suggestions = [];
let suppliers = [];
let cartLines = [];
let purchaseOrders = [];
let currentFilter = 'all';
let searchTerm = '';

const moneyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const numberFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });

function formatCurrency(value) { return moneyFormatter.format(Number(value || 0)); }
function formatNumber(value) { return numberFormatter.format(Number(value || 0)); }
function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('purchaseToast');
    if (!toast) return;
    toast.className = `fixed top-5 right-5 z-[9999] px-5 py-3 rounded-2xl shadow-2xl text-sm font-black ${type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`;
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function setLoading(loading) {
    document.getElementById('loadingState')?.classList.toggle('hidden', !loading);
    document.getElementById('mainContent')?.classList.toggle('hidden', loading);
}

function reasonBadge(item) {
    if (item.currentStock <= 0) return '<span class="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 px-2 py-0.5 rounded-md text-[10px] font-black uppercase">Hết hàng</span>';
    if (item.currentStock <= 10) return '<span class="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 px-2 py-0.5 rounded-md text-[10px] font-black uppercase">Tồn thấp</span>';
    return '<span class="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-md text-[10px] font-black uppercase">Có bán</span>';
}

function filteredSuggestions() {
    const keyword = searchTerm.toLowerCase();
    return suggestions.filter(item => {
        const matchSearch = `${item.name} ${item.code} ${item.category}`.toLowerCase().includes(keyword);
        const matchFilter = currentFilter === 'all'
            || (currentFilter === 'out' && item.currentStock <= 0)
            || (currentFilter === 'low' && item.currentStock > 0 && item.currentStock <= 10)
            || (currentFilter === 'sold' && item.sold7d > 0);
        return matchSearch && matchFilter;
    });
}

function renderStats() {
    const urgent = suggestions.filter(item => item.currentStock <= 10).length;
    const out = suggestions.filter(item => item.currentStock <= 0).length;
    const sold = suggestions.filter(item => item.sold7d > 0).length;
    const cartTotal = cartLines.reduce((sum, line) => sum + Number(line.orderedQuantity || 0) * Number(line.costPrice || 0), 0);
    const cards = [
        ['Cần xem xét', suggestions.length, 'Mặt hàng có tồn thấp hoặc bán gần đây', 'fa-list-check', 'text-blue-600', 'bg-blue-50 border-blue-200'],
        ['Ưu tiên đặt', urgent, `${out} mặt hàng đã hết`, 'fa-triangle-exclamation', 'text-orange-600', 'bg-orange-50 border-orange-200'],
        ['Có bán 7 ngày', sold, 'Dùng để dự báo số lượng đặt', 'fa-chart-line', 'text-emerald-600', 'bg-emerald-50 border-emerald-200'],
        ['Phiếu đang soạn', formatCurrency(cartTotal), `${cartLines.length} dòng hàng`, 'fa-cart-flatbed', 'text-violet-600', 'bg-violet-50 border-violet-200']
    ];
    document.getElementById('purchaseStats').innerHTML = cards.map(card => `
        <article class="rounded-2xl border ${card[5]} dark:bg-slate-900 dark:border-slate-800 bg-white p-5 shadow-sm">
            <div class="flex items-start justify-between gap-4">
                <div>
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">${card[0]}</p>
                    <p class="mt-3 text-2xl font-black text-slate-900 dark:text-white">${card[1]}</p>
                    <p class="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">${card[2]}</p>
                </div>
                <div class="w-11 h-11 rounded-xl ${card[4]} bg-white dark:bg-slate-800 border border-white/80 dark:border-slate-700 flex items-center justify-center shadow-sm"><i class="fa-solid ${card[3]}"></i></div>
            </div>
        </article>`).join('');
}

function renderSuggestions() {
    const rows = filteredSuggestions();
    document.getElementById('suggestionCount').textContent = `${formatNumber(rows.length)} mặt hàng`;
    document.getElementById('suggestionList').innerHTML = rows.length ? rows.map(item => `
        <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-md transition-all duration-200">
            <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">${reasonBadge(item)}<span class="text-[10px] font-black text-slate-400 uppercase">${escapeHTML(item.category)}</span></div>
                    <h3 class="mt-2 font-black text-slate-900 dark:text-white leading-snug">${escapeHTML(item.name)}</h3>
                    <p class="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">${escapeHTML(item.code || 'Chưa có mã')} - ${escapeHTML(item.unitName)}</p>
                </div>
                <button data-action="add-line" data-product-id="${escapeHTML(item.productId)}" class="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all" title="Thêm vào phiếu"><i class="fa-solid fa-plus"></i></button>
            </div>
            <div class="mt-4 grid grid-cols-4 gap-2 text-center">
                <div class="rounded-xl bg-slate-50 dark:bg-slate-800 p-2"><p class="text-[10px] font-black text-slate-400 uppercase">Tồn</p><p class="font-black text-slate-900 dark:text-white">${formatNumber(item.currentStock)}</p></div>
                <div class="rounded-xl bg-slate-50 dark:bg-slate-800 p-2"><p class="text-[10px] font-black text-slate-400 uppercase">Bán 7N</p><p class="font-black text-emerald-600">${formatNumber(item.sold7d)}</p></div>
                <div class="rounded-xl bg-slate-50 dark:bg-slate-800 p-2"><p class="text-[10px] font-black text-slate-400 uppercase">Gợi ý</p><p class="font-black text-blue-600">${formatNumber(item.suggestedQuantity)}</p></div>
                <div class="rounded-xl bg-slate-50 dark:bg-slate-800 p-2"><p class="text-[10px] font-black text-slate-400 uppercase">Giá vốn</p><p class="font-black text-slate-900 dark:text-white">${formatCurrency(item.costPrice)}</p></div>
            </div>
        </div>`).join('') : '<div class="py-12 text-center text-sm font-bold text-slate-400">Không có mặt hàng phù hợp</div>';
}

function renderSupplierSelect() {
    const select = document.getElementById('supplierSelect');
    if (!select) return;
    select.innerHTML = '<option value="">Chọn nhà cung cấp</option>' + suppliers.map(supplier => `<option value="${escapeHTML(supplier.id)}">${escapeHTML(supplier.name)}</option>`).join('');
}

function addLine(productId) {
    const item = suggestions.find(suggestion => suggestion.productId === productId);
    if (!item) return;
    const existing = cartLines.find(line => line.productId === productId);
    if (existing) {
        existing.orderedQuantity += Math.max(1, item.suggestedQuantity || 1);
    } else {
        cartLines.push({ ...item, orderedQuantity: Math.max(1, item.suggestedQuantity || 1), note: '' });
    }
    renderCart();
    renderStats();
}

function removeLine(productId) {
    cartLines = cartLines.filter(line => line.productId !== productId);
    renderCart();
    renderStats();
}

function updateLine(productId, field, value) {
    const line = cartLines.find(item => item.productId === productId);
    if (!line) return;
    if (field === 'orderedQuantity' || field === 'costPrice') line[field] = Math.max(0, Number(value || 0));
    else line[field] = value;
    renderCartTotals();
    renderStats();
}

function renderCart() {
    const body = document.getElementById('cartLinesBody');
    body.innerHTML = cartLines.length ? cartLines.map(line => `
        <tr class="group bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200">
            <td class="py-4 px-4 border-y border-l border-slate-200 dark:border-slate-800 rounded-l-2xl">
                <div class="font-black text-slate-900 dark:text-white">${escapeHTML(line.name)}</div>
                <div class="mt-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">Tồn ${formatNumber(line.currentStock)} - Bán 7 ngày ${formatNumber(line.sold7d)} - ${escapeHTML(line.unitName)}</div>
            </td>
            <td class="py-4 px-4 border-y border-slate-200 dark:border-slate-800 text-right"><input data-action="line-input" data-product-id="${escapeHTML(line.productId)}" data-field="orderedQuantity" type="number" min="0" value="${line.orderedQuantity}" class="w-24 h-10 px-3 text-right rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-black outline-none focus:ring-2 focus:ring-blue-500"></td>
            <td class="py-4 px-4 border-y border-slate-200 dark:border-slate-800 text-right"><input data-action="line-input" data-product-id="${escapeHTML(line.productId)}" data-field="costPrice" type="number" min="0" step="100" value="${line.costPrice}" class="w-32 h-10 px-3 text-right rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold outline-none focus:ring-2 focus:ring-blue-500"></td>
            <td class="py-4 px-4 border-y border-slate-200 dark:border-slate-800 text-right font-black text-blue-600 dark:text-blue-400">${formatCurrency(line.orderedQuantity * line.costPrice)}</td>
            <td class="py-4 px-4 border-y border-r border-slate-200 dark:border-slate-800 rounded-r-2xl text-center"><button data-action="remove-line" data-product-id="${escapeHTML(line.productId)}" class="w-9 h-9 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300"><i class="fa-solid fa-trash"></i></button></td>
        </tr>`).join('') : '<tr><td colspan="5" class="py-12 text-center text-sm font-bold text-slate-400">Chưa có mặt hàng trong phiếu</td></tr>';
    renderCartTotals();
}

function renderCartTotals() {
    const total = cartLines.reduce((sum, line) => sum + Number(line.orderedQuantity || 0) * Number(line.costPrice || 0), 0);
    document.getElementById('cartLineCount').textContent = `${cartLines.length} dòng`;
    document.getElementById('cartTotal').textContent = formatCurrency(total);
}

function renderHistory() {
    document.getElementById('historyBody').innerHTML = purchaseOrders.length ? purchaseOrders.slice(0, 8).map(order => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <td class="py-3 px-4 font-mono text-xs font-black text-blue-600">${escapeHTML(order.order_code)}</td>
            <td class="py-3 px-4 font-bold text-slate-900 dark:text-white">${escapeHTML(order.supplier_name || 'Chưa chọn')}</td>
            <td class="py-3 px-4 text-right font-black text-slate-900 dark:text-white">${formatCurrency(order.total_estimated)}</td>
            <td class="py-3 px-4 text-center"><span class="px-2 py-1 rounded-lg text-[10px] font-black uppercase ${order.source === 'local' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}">${order.source === 'local' ? 'Nháp local' : order.status}</span></td>
        </tr>`).join('') : '<tr><td colspan="4" class="py-8 text-center text-sm font-bold text-slate-400">Chưa có phiếu đặt hàng</td></tr>';
}

async function saveCurrentOrder() {
    const supplierSelect = document.getElementById('supplierSelect');
    const selectedSupplier = suppliers.find(supplier => supplier.id === supplierSelect.value);
    const supplierName = selectedSupplier?.name || document.getElementById('supplierNameInput').value.trim();
    const expectedDate = document.getElementById('expectedDateInput').value;
    const note = document.getElementById('orderNoteInput').value.trim();

    try {
        const saved = await savePurchaseOrder({ supplierId: selectedSupplier?.id || null, supplierName, expectedDate, note, lines: cartLines, status: 'draft' });
        purchaseOrders.unshift(saved);
        cartLines = [];
        renderCart();
        renderStats();
        renderHistory();
        showToast(saved.source === 'local' ? 'Đã lưu nháp trên máy. Chạy migration để lưu Supabase.' : 'Đã lưu phiếu đặt hàng.');
    } catch (error) {
        showToast(error.message || 'Không lưu được phiếu đặt hàng.', 'error');
    }
}

async function loadData() {
    setLoading(true);
    try {
        const [suggestionData, supplierData, orderData] = await Promise.all([
            fetchPurchaseSuggestions(),
            fetchSuppliers(),
            fetchPurchaseOrders()
        ]);
        suggestions = suggestionData;
        suppliers = supplierData;
        purchaseOrders = orderData;
        renderSupplierSelect();
        renderStats();
        renderSuggestions();
        renderCart();
        renderHistory();
    } catch (error) {
        showToast(error.message || 'Không tải được dữ liệu đặt hàng.', 'error');
    } finally {
        setLoading(false);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initLayout('admin', 'purchase');
    loadData();

    document.addEventListener('click', event => {
        const button = event.target.closest('[data-action]');
        if (!button) return;
        const action = button.dataset.action;
        if (action === 'add-line') addLine(button.dataset.productId);
        if (action === 'remove-line') removeLine(button.dataset.productId);
        if (action === 'save-order') saveCurrentOrder();
        if (action === 'reload-purchase') loadData();
        if (action === 'filter-suggestions') {
            currentFilter = button.dataset.filter || 'all';
            document.querySelectorAll('[data-action="filter-suggestions"]').forEach(item => {
                const active = item.dataset.filter === currentFilter;
                item.classList.toggle('bg-blue-600', active);
                item.classList.toggle('text-white', active);
                item.classList.toggle('bg-slate-100', !active);
                item.classList.toggle('dark:bg-slate-800', !active);
            });
            renderSuggestions();
        }
    });

    document.addEventListener('input', event => {
        const target = event.target;
        if (target.id === 'purchaseSearch') {
            searchTerm = target.value.trim();
            renderSuggestions();
        }
        if (target.dataset.action === 'line-input') {
            updateLine(target.dataset.productId, target.dataset.field, target.value);
        }
    });
});
