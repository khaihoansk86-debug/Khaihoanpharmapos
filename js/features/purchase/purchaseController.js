import { initLayout } from '../../components/layout.js';
import { fetchPurchaseOrders, fetchPurchaseSuggestions, fetchSuppliers, savePurchaseOrder, updateProductSupplier, fetchUnassignedProducts } from './purchaseService.js';
import { createSupplier, updateSupplier, deleteSupplier, buildSupplierCode } from '../suppliers/supplierService.js';

let suggestions = [];
let suppliers = [];
let cartLines = [];
let purchaseOrders = [];
let unassignedProducts = [];
let currentFilter = 'all';
let searchTerm = '';
let supplierSearchTerm = '';
let unassignedSearchTerm = '';
let supplierTypeFilter = 'all';

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
        const matchSearch = `${item.name} ${item.code} ${item.category} ${item.supplierName || ''}`.toLowerCase().includes(keyword);
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
                    <p class="mt-1 text-[11px] font-black text-blue-600 dark:text-blue-400"><i class="fa-solid fa-handshake mr-1"></i>${escapeHTML(item.supplierName || 'Chưa gán NCC')}</p>
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
    select.innerHTML = '<option value="">NCC mặc định cho dòng chưa chọn</option>' + suppliers
        .filter(supplier => supplier.is_active !== false)
        .map(supplier => `<option value="${escapeHTML(supplier.id)}">${escapeHTML(supplier.name)}</option>`)
        .join('');
}

function supplierNameById(id) {
    return suppliers.find(supplier => supplier.id === id)?.name || '';
}

function renderSupplierOptions(selectedId = '') {
    return '<option value="">Chưa gán NCC</option>' + suppliers.filter(supplier => supplier.is_active !== false).map(supplier => `
        <option value="${escapeHTML(supplier.id)}" ${supplier.id === selectedId ? 'selected' : ''}>${escapeHTML(supplier.name)}</option>
    `).join('');
}

function addLine(productId) {
    const item = suggestions.find(suggestion => suggestion.productId === productId);
    if (!item) return;
    const existing = cartLines.find(line => line.productId === productId);
    if (existing) {
        existing.orderedQuantity += Math.max(1, item.suggestedQuantity || 1);
    } else {
        const fallbackSupplierId = document.getElementById('supplierSelect')?.value || '';
        const supplierId = item.supplierId || fallbackSupplierId || '';
        cartLines.push({
            ...item,
            supplierId,
            supplierName: supplierNameById(supplierId) || item.supplierName || '',
            orderedQuantity: Math.max(1, item.suggestedQuantity || 1),
            note: ''
        });
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
    else if (field === 'supplierId') {
        line.supplierId = value || '';
        line.supplierName = supplierNameById(line.supplierId);
    } else line[field] = value;
    renderCartTotals();
    renderStats();
}

function renderCart() {
    const body = document.getElementById('cartLinesBody');
    const grouped = new Map();
    cartLines.forEach(line => {
        const key = line.supplierId || 'unassigned';
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(line);
    });

    const rows = [];
    grouped.forEach((lines, key) => {
        const groupName = key === 'unassigned' ? 'Chưa gán nhà cung cấp' : supplierNameById(key) || lines[0]?.supplierName || 'Nhà cung cấp';
        const groupTotal = lines.reduce((sum, line) => sum + Number(line.orderedQuantity || 0) * Number(line.costPrice || 0), 0);
        
        // Cảnh báo nếu chưa gán NCC
        const actionsHtml = key === 'unassigned' 
            ? `<span class="text-[10px] text-red-500 font-bold bg-red-50 px-2 py-1 rounded">Vui lòng chọn NCC từng mặt hàng bên dưới</span>`
            : `<div class="flex items-center gap-2">
                 <button data-action="copy-supplier-order" data-supplier-id="${escapeHTML(key)}" class="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-[10px] font-black border border-emerald-200 transition-colors shadow-sm flex items-center gap-1.5">
                     <i class="fa-solid fa-copy"></i> Copy Zalo
                 </button>
                 <button data-action="save-supplier-order" data-supplier-id="${escapeHTML(key)}" class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black shadow-sm flex items-center gap-1.5">
                     <i class="fa-solid fa-floppy-disk"></i> Lưu phiếu
                 </button>
               </div>`;

        rows.push(`
            <tr>
                <td colspan="6" class="pt-4 pb-1">
                    <div class="flex items-center justify-between rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-2">
                        <div class="flex items-center gap-3">
                            <span class="text-xs font-black uppercase text-slate-600 dark:text-slate-300"><i class="fa-solid fa-layer-group mr-1"></i>${escapeHTML(groupName)}</span>
                            <span class="text-xs font-black text-blue-600 dark:text-blue-400">${formatCurrency(groupTotal)}</span>
                        </div>
                        ${actionsHtml}
                    </div>
                </td>
            </tr>
        `);
        lines.forEach(line => rows.push(`
        <tr class="group bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200">
            <td class="py-4 px-4 border-y border-l border-slate-200 dark:border-slate-800 rounded-l-2xl">
                <div class="font-black text-slate-900 dark:text-white">${escapeHTML(line.name)}</div>
                <div class="mt-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">Tồn ${formatNumber(line.currentStock)} - Bán 7 ngày ${formatNumber(line.sold7d)} - ${escapeHTML(line.unitName)}</div>
            </td>
            <td class="py-4 px-4 border-y border-slate-200 dark:border-slate-800">
                <select data-action="line-input" data-product-id="${escapeHTML(line.productId)}" data-field="supplierId" class="w-52 h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500">
                    ${renderSupplierOptions(line.supplierId)}
                </select>
                <button data-action="save-product-supplier" data-product-id="${escapeHTML(line.productId)}" class="mt-2 text-[10px] font-black uppercase text-blue-600 hover:text-blue-700">Lưu làm NCC mặc định</button>
            </td>
            <td class="py-4 px-4 border-y border-slate-200 dark:border-slate-800 text-right"><input data-action="line-input" data-product-id="${escapeHTML(line.productId)}" data-field="orderedQuantity" type="number" min="0" value="${line.orderedQuantity}" class="w-24 h-10 px-3 text-right rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-black outline-none focus:ring-2 focus:ring-blue-500"></td>
            <td class="py-4 px-4 border-y border-slate-200 dark:border-slate-800 text-right"><input data-action="line-input" data-product-id="${escapeHTML(line.productId)}" data-field="costPrice" type="number" min="0" step="100" value="${line.costPrice}" class="w-32 h-10 px-3 text-right rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold outline-none focus:ring-2 focus:ring-blue-500"></td>
            <td class="py-4 px-4 border-y border-slate-200 dark:border-slate-800 text-right font-black text-blue-600 dark:text-blue-400">${formatCurrency(line.orderedQuantity * line.costPrice)}</td>
            <td class="py-4 px-4 border-y border-r border-slate-200 dark:border-slate-800 rounded-r-2xl text-center"><button data-action="remove-line" data-product-id="${escapeHTML(line.productId)}" class="w-9 h-9 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300"><i class="fa-solid fa-trash"></i></button></td>
        </tr>`));
    });

    body.innerHTML = cartLines.length ? rows.join('') : '<tr><td colspan="6" class="py-12 text-center text-sm font-bold text-slate-400">Chưa có mặt hàng trong phiếu</td></tr>';
    renderCartTotals();
}

function renderCartTotals() {
    const total = cartLines.reduce((sum, line) => sum + Number(line.orderedQuantity || 0) * Number(line.costPrice || 0), 0);
    document.getElementById('cartLineCount').textContent = `${cartLines.length} dòng`;
    document.getElementById('cartTotal').textContent = formatCurrency(total);
    try { localStorage.setItem('PURCHASE_DRAFT_STATE', JSON.stringify(cartLines)); } catch(e) {}
}

function renderHistory() {
    document.getElementById('historyBody').innerHTML = purchaseOrders.length ? purchaseOrders.slice(0, 8).map(order => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" data-action="view-order" data-order-id="${escapeHTML(order.id)}">
            <td class="py-3 px-4 font-mono text-xs font-black text-blue-600">${escapeHTML(order.order_code)}</td>
            <td class="py-3 px-4 font-bold text-slate-900 dark:text-white">${escapeHTML(order.supplier_name || 'Chưa chọn')}</td>
            <td class="py-3 px-4 text-right font-black text-slate-900 dark:text-white">${formatCurrency(order.total_estimated)}</td>
            <td class="py-3 px-4 text-center"><span class="px-2 py-1 rounded-lg text-[10px] font-black uppercase ${order.source === 'local' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}">${order.source === 'local' ? 'Nháp local' : order.status}</span></td>
        </tr>`).join('') : '<tr><td colspan="4" class="py-8 text-center text-sm font-bold text-slate-400">Chưa có phiếu đặt hàng</td></tr>';
}

function renderSupplierGrid() {
    const grid = document.getElementById('supplierGrid');
    if (!grid) return;
    const keyword = supplierSearchTerm.toLowerCase();
    const filtered = suppliers.filter(supplier => {
        const haystack = `${supplier.name || ''} ${supplier.supplier_code || ''} ${supplier.contact_info || ''}`.toLowerCase();
        return haystack.includes(keyword) && (supplierTypeFilter === 'all' || supplier.contact_type === supplierTypeFilter);
    });

    grid.innerHTML = filtered.length ? filtered.map(supplier => {
        const isWeb = supplier.contact_type === 'web';
        const isPhone = supplier.contact_type === 'phone';
        const icon = isWeb ? 'fa-globe' : isPhone ? 'fa-phone' : 'fa-building-user';
        const contactLabel = supplier.contact_info || 'Chưa có thông tin';
        const contactUrl = isWeb
            ? (supplier.contact_info?.startsWith('http') ? supplier.contact_info : `https://${supplier.contact_info}`)
            : isPhone ? `tel:${supplier.contact_info}` : '';

        return `
            <article class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
                <div class="flex items-start justify-between gap-3">
                    <div class="w-11 h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-blue-600 flex items-center justify-center">
                        <i class="fa-solid ${icon}"></i>
                    </div>
                    <div class="flex gap-2">
                        <button data-action="edit-supplier" data-supplier-id="${escapeHTML(supplier.id)}" class="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 text-slate-500 hover:text-blue-600 border border-slate-200 dark:border-slate-800" title="Sửa"><i class="fa-solid fa-pen text-xs"></i></button>
                        <button data-action="delete-supplier" data-supplier-id="${escapeHTML(supplier.id)}" class="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 text-slate-500 hover:text-red-600 border border-slate-200 dark:border-slate-800" title="Xóa"><i class="fa-solid fa-trash-can text-xs"></i></button>
                    </div>
                </div>
                <h3 class="mt-4 font-black text-slate-900 dark:text-white">${escapeHTML(supplier.name)}</h3>
                <p class="mt-1 text-[10px] font-black uppercase text-slate-400">${escapeHTML(supplier.supplier_code || '')}</p>
                <p class="mt-3 text-sm font-bold text-slate-600 dark:text-slate-400 truncate">${escapeHTML(contactLabel)}</p>
                <div class="mt-4 flex items-center justify-between gap-3">
                    <span class="px-2 py-1 rounded-lg text-[10px] font-black uppercase ${supplier.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}">${supplier.is_active ? 'Hoạt động' : 'Tạm dừng'}</span>
                    ${contactUrl ? `<a href="${escapeHTML(contactUrl)}" target="_blank" class="text-xs font-black text-blue-600 hover:text-blue-700">Liên hệ</a>` : ''}
                </div>
            </article>
        `;
    }).join('') : '<div class="col-span-full py-12 text-center text-sm font-bold text-slate-400">Chưa có nhà cung cấp phù hợp</div>';
}

function openSupplierModal(supplierId = '') {
    const supplier = suppliers.find(item => item.id === supplierId);
    document.getElementById('supplierForm').reset();
    document.getElementById('supplier_id').value = supplier?.id || '';
    document.getElementById('supplierModalTitle').textContent = supplier ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp';
    document.getElementById('supplier_name').value = supplier?.name || '';
    document.getElementById('supplier_code').value = supplier?.supplier_code || buildSupplierCode();
    document.getElementById('supplier_contact_type').value = supplier?.contact_type || 'phone';
    document.getElementById('supplier_contact_info').value = supplier?.contact_info || '';
    document.getElementById('supplier_note').value = supplier?.note || '';
    document.getElementById('supplier_is_active').checked = supplier?.is_active !== false;
    document.getElementById('supplierModal').classList.remove('hidden');
}

function closeSupplierModal() {
    document.getElementById('supplierModal')?.classList.add('hidden');
}

async function submitSupplierForm() {
    const id = document.getElementById('supplier_id').value;
    const payload = {
        name: document.getElementById('supplier_name').value,
        supplier_code: document.getElementById('supplier_code').value,
        contact_type: document.getElementById('supplier_contact_type').value,
        contact_info: document.getElementById('supplier_contact_info').value,
        note: document.getElementById('supplier_note').value,
        is_active: document.getElementById('supplier_is_active').checked
    };

    try {
        if (id) await updateSupplier(id, payload);
        else await createSupplier(payload);
        closeSupplierModal();
        suppliers = await fetchSuppliers();
        renderSupplierSelect();
        renderSupplierGrid();
        renderCart();
        showToast('Đã lưu nhà cung cấp.');
    } catch (error) {
        showToast(error.message || 'Không lưu được nhà cung cấp.', 'error');
    }
}

async function saveLineSupplierAsDefault(productId) {
    const line = cartLines.find(item => item.productId === productId);
    if (!line) return;
    try {
        await updateProductSupplier(productId, line.supplierId || null);
        const suggestion = suggestions.find(item => item.productId === productId);
        if (suggestion) {
            suggestion.supplierId = line.supplierId || null;
            suggestion.supplierName = line.supplierName || null;
        }
        showToast('Đã lưu nhà cung cấp mặc định cho sản phẩm.');
    } catch (error) {
        showToast(error.message || 'Không lưu được NCC mặc định.', 'error');
    }
}

async function saveSupplierOrder(supplierId) {
    if (supplierId === 'unassigned') {
        showToast('Vui lòng chọn nhà cung cấp cho các mặt hàng này trước khi lưu.', 'error');
        return;
    }

    const lines = cartLines.filter(line => (line.supplierId || 'unassigned') === supplierId);
    if (!lines.length) {
        showToast('Không có mặt hàng nào của nhà cung cấp này trong phiếu.', 'error');
        return;
    }

    try {
        const saved = await savePurchaseOrder({
            supplierId: supplierId,
            supplierName: supplierNameById(supplierId) || lines[0].supplierName,
            expectedDate: null,
            note: '',
            lines: lines,
            status: 'sent'
        });
        
        purchaseOrders.unshift(saved);
        
        // Remove saved lines from cart
        cartLines = cartLines.filter(line => (line.supplierId || 'unassigned') !== supplierId);
        if (cartLines.length === 0) {
            try { localStorage.removeItem('PURCHASE_DRAFT_STATE'); } catch(e) {}
        }
        
        renderCart();
        renderStats();
        renderHistory();
        renderHistoryManageView();
        showToast(`Đã lưu phiếu đặt hàng cho ${saved.supplier_name}.`);
        
    } catch (error) {
        showToast(error.message || 'Không thể lưu phiếu đặt hàng.', 'error');
    }
}

function copySupplierOrder(supplierId) {
    if (supplierId === 'unassigned') {
        showToast('Vui lòng chọn nhà cung cấp cho các mặt hàng này trước khi copy.', 'error');
        return;
    }

    const lines = cartLines.filter(line => (line.supplierId || 'unassigned') === supplierId);
    if (!lines.length) return;

    const supplierName = supplierNameById(supplierId) || lines[0].supplierName || 'Chưa chọn';
    const dateStr = new Date().toLocaleDateString('vi-VN');
    const total = lines.reduce((sum, line) => sum + (Number(line.orderedQuantity || 0) * Number(line.costPrice || 0)), 0);

    let text = `💊 ĐƠN ĐẶT HÀNG DƯỢC PHẨM KHẢI HOÀN\n`;
    text += `--------------------------------------\n`;
    text += `📅 Ngày đặt: ${dateStr}\n`;
    text += `🤝 Nhà cung cấp: ${supplierName}\n`;
    text += `--------------------------------------\n`;
    text += `Danh sách mặt hàng đặt:\n`;
    lines.forEach((line, index) => {
        const qty = line.orderedQuantity || 1;
        text += `${index + 1}. [${line.code || 'SP'}] ${line.name} - ĐVT: ${line.unitName} - SL: ${qty}\n`;
    });
    text += `--------------------------------------\n`;
    text += `💰 Tổng tiền dự kiến: ${formatCurrency(total)}\n`;
    text += `--------------------------------------\n`;
    text += `Xin vui lòng xác nhận đơn hàng sớm nhất. Cảm ơn!`;

    navigator.clipboard.writeText(text)
        .then(() => showToast('Đã sao chép nội dung đặt hàng để gửi NCC qua Zalo/SMS!'))
        .catch(err => {
            console.error('Lỗi copy clipboard:', err);
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                showToast('Đã sao chép nội dung đơn hàng!');
            } catch (copyErr) {
                showToast('Lỗi khi sao chép đơn hàng.', 'error');
            }
            document.body.removeChild(textarea);
        });
}

function addAllSuggested() {
    const toAdd = suggestions.filter(item => item.suggestedQuantity > 0);
    if (!toAdd.length) {
        showToast('Không có mặt hàng nào cần gợi ý nhập.');
        return;
    }
    
    let addedCount = 0;
    toAdd.forEach(item => {
        const existing = cartLines.find(line => line.productId === item.productId);
        if (existing) {
            // Already in cart, optionally increase, but here we can just skip or add
        } else {
            const supplierId = item.supplierId || '';
            cartLines.push({
                ...item,
                supplierId,
                supplierName: supplierNameById(supplierId) || item.supplierName || '',
                orderedQuantity: Math.max(1, item.suggestedQuantity || 1),
                note: ''
            });
            addedCount++;
        }
    });
    
    if (addedCount > 0) {
        renderCart();
        renderStats();
        showToast(`Đã thêm ${addedCount} mặt hàng gợi ý vào phiếu.`);
    } else {
        showToast('Các mặt hàng gợi ý đã có sẵn trong phiếu.');
    }
}

function openOrderDetailModal(orderId) {
    const order = purchaseOrders.find(item => item.id === orderId);
    if (!order) return;

    document.getElementById('orderDetailSub').textContent = `Mã đơn: ${order.order_code}`;
    document.getElementById('orderDetailSupplier').textContent = order.supplier_name || 'Chưa chọn';
    document.getElementById('orderDetailDate').textContent = new Date(order.created_at || Date.now()).toLocaleString('vi-VN');
    document.getElementById('orderDetailNote').textContent = order.note || 'Chưa có ghi chú';
    document.getElementById('orderDetailTotal').textContent = formatCurrency(order.total_estimated);

    const items = order.purchase_order_items || [];
    document.getElementById('orderDetailLinesBody').innerHTML = items.length ? items.map(line => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
            <td class="py-3 px-2 font-bold text-slate-900 dark:text-white">${escapeHTML(line.product_name)} <span class="text-[10px] text-slate-450 block font-normal">${escapeHTML(line.product_code || '')}</span></td>
            <td class="py-3 px-2 text-right font-black text-blue-600">${formatNumber(line.ordered_quantity || line.suggested_quantity)}</td>
            <td class="py-3 px-2 text-right font-semibold text-slate-500">${escapeHTML(line.unit_name || 'Đơn vị')}</td>
            <td class="py-3 px-2 text-right font-semibold text-slate-600 dark:text-slate-400">${formatCurrency(line.estimated_cost)}</td>
            <td class="py-3 px-2 text-right font-black text-slate-800 dark:text-white">${formatCurrency((line.ordered_quantity || line.suggested_quantity) * line.estimated_cost)}</td>
        </tr>
    `).join('') : '<tr><td colspan="5" class="py-4 text-center text-sm font-bold text-slate-400">Không có chi tiết sản phẩm</td></tr>';

    document.getElementById('copyOrderTextBtn').dataset.orderId = orderId;
    document.getElementById('orderDetailModal').classList.remove('hidden');
}

function closeOrderDetailModal() {
    document.getElementById('orderDetailModal')?.classList.add('hidden');
}

function copyOrderToClipboard(orderId) {
    const order = purchaseOrders.find(item => item.id === orderId);
    if (!order) return;

    const items = order.purchase_order_items || [];
    const dateStr = new Date(order.created_at || Date.now()).toLocaleDateString('vi-VN');
    let text = `💊 ĐƠN ĐẶT HÀNG DƯỢC PHẨM KHẢI HOÀN\n`;
    text += `--------------------------------------\n`;
    text += `📄 Mã đơn: ${order.order_code}\n`;
    text += `📅 Ngày đặt: ${dateStr}\n`;
    text += `🤝 Nhà cung cấp: ${order.supplier_name || 'Chưa chọn'}\n`;
    if (order.note) {
        text += `📝 Ghi chú: ${order.note}\n`;
    }
    text += `--------------------------------------\n`;
    text += `Danh sách mặt hàng đặt:\n`;
    items.forEach((line, index) => {
        const qty = line.ordered_quantity || line.suggested_quantity || 1;
        text += `${index + 1}. [${line.product_code || 'SP'}] ${line.product_name} - ĐVT: ${line.unit_name} - SL: ${qty}\n`;
    });
    text += `--------------------------------------\n`;
    text += `💰 Tổng tiền dự kiến: ${formatCurrency(order.total_estimated)}\n`;
    text += `--------------------------------------\n`;
    text += `Xin vui lòng xác nhận đơn hàng sớm nhất. Cảm ơn!`;

    navigator.clipboard.writeText(text)
        .then(() => showToast('Đã sao chép nội dung đơn hàng để gửi NCC qua Zalo/SMS!'))
        .catch(err => {
            console.error('Lỗi copy clipboard:', err);
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                showToast('Đã sao chép nội dung đơn hàng!');
            } catch (copyErr) {
                showToast('Lỗi khi sao chép đơn hàng.', 'error');
            }
            document.body.removeChild(textarea);
        });
}

let historySearchTerm = '';
let historyStatusFilter = 'all';
let historySupplierFilter = 'all';

function renderHistoryManageView() {
    // 1. Populate filters if not done already
    const supplierFilterSelect = document.getElementById('historySupplierFilter');
    if (supplierFilterSelect) {
        // Collect unique suppliers from orders
        const uniqueSuppliers = Array.from(new Set(purchaseOrders.map(o => o.supplier_name).filter(Boolean)));
        const currentVal = supplierFilterSelect.value || 'all';
        supplierFilterSelect.innerHTML = '<option value="all">Tất cả nhà cung cấp</option>' + 
            uniqueSuppliers.map(name => `<option value="${escapeHTML(name)}" ${name === currentVal ? 'selected' : ''}>${escapeHTML(name)}</option>`).join('');
    }

    // 2. Calculate statistics
    const statsTotalOrders = purchaseOrders.length;
    const statsTotalSpend = purchaseOrders.reduce((sum, o) => sum + Number(o.total_estimated || 0), 0);
    const statsPendingOrders = purchaseOrders.filter(o => o.status === 'draft' || o.status === 'sent' || o.source === 'local').length;

    const elTotalOrders = document.getElementById('statsTotalOrders');
    const elTotalSpend = document.getElementById('statsTotalSpend');
    const elPendingOrders = document.getElementById('statsPendingOrders');

    if (elTotalOrders) elTotalOrders.textContent = formatNumber(statsTotalOrders);
    if (elTotalSpend) elTotalSpend.textContent = formatCurrency(statsTotalSpend);
    if (elPendingOrders) elPendingOrders.textContent = formatNumber(statsPendingOrders);

    // 3. Filter orders list
    const search = historySearchTerm.toLowerCase();
    const filtered = purchaseOrders.filter(order => {
        const matchesSearch = `${order.order_code || ''} ${order.supplier_name || ''}`.toLowerCase().includes(search);
        
        // Handle source local as 'draft'
        const orderStatus = order.source === 'local' ? 'draft' : (order.status || 'draft');
        const matchesStatus = historyStatusFilter === 'all' || orderStatus === historyStatusFilter;
        
        const matchesSupplier = historySupplierFilter === 'all' || order.supplier_name === historySupplierFilter;

        return matchesSearch && matchesStatus && matchesSupplier;
    });

    // 4. Render rows
    const tbody = document.getElementById('historyManageBody');
    if (!tbody) return;

    tbody.innerHTML = filtered.length ? filtered.map(order => {
        const orderStatus = order.source === 'local' ? 'draft' : (order.status || 'draft');
        let statusBadge = '';
        if (orderStatus === 'draft') {
            statusBadge = '<span class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">Nháp local</span>';
        } else if (orderStatus === 'sent') {
            statusBadge = '<span class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">Đã gửi (Sent)</span>';
        } else if (orderStatus === 'received') {
            statusBadge = '<span class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-350">Đã nhận (Received)</span>';
        } else {
            statusBadge = `<span class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">${orderStatus}</span>`;
        }

        const dateStr = order.created_at ? new Date(order.created_at).toLocaleDateString('vi-VN') : '---';
        const expectedDateStr = order.expected_date ? new Date(order.expected_date).toLocaleDateString('vi-VN') : '---';

        return `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <td class="px-4 py-3 font-mono text-xs font-black text-blue-600 border-b border-slate-100 dark:border-slate-800">${escapeHTML(order.order_code)}</td>
                <td class="px-4 py-3 font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800">${escapeHTML(order.supplier_name || 'Chưa chọn')}</td>
                <td class="px-4 py-3 text-xs font-semibold text-slate-500 border-b border-slate-100 dark:border-slate-800">${dateStr}</td>
                <td class="px-4 py-3 text-xs font-semibold text-slate-500 border-b border-slate-100 dark:border-slate-800">${expectedDateStr}</td>
                <td class="px-4 py-3 text-right font-black text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800">${formatCurrency(order.total_estimated)}</td>
                <td class="px-4 py-3 text-center border-b border-slate-100 dark:border-slate-800">${statusBadge}</td>
                <td class="px-4 py-3 text-center border-b border-slate-100 dark:border-slate-800">
                    <button data-action="view-order" data-order-id="${escapeHTML(order.id)}" class="w-8 h-8 rounded-lg bg-blue-50 dark:bg-slate-800 hover:bg-blue-600 dark:hover:bg-blue-600 text-blue-600 hover:text-white dark:text-blue-400 text-xs flex items-center justify-center mx-auto transition-all shadow-sm" title="Xem chi tiết">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('') : '<tr><td colspan="7" class="py-12 text-center text-sm font-bold text-slate-400">Không tìm thấy phiếu đặt hàng phù hợp</td></tr>';
}

function renderUnassignedProducts() {
    const search = unassignedSearchTerm.toLowerCase();
    const filtered = unassignedProducts.filter(item => 
        `${item.name} ${item.code} ${item.category}`.toLowerCase().includes(search)
    );

    const badge = document.getElementById('unassignedBadge');
    if (badge) {
        badge.textContent = unassignedProducts.length;
        badge.classList.toggle('hidden', unassignedProducts.length === 0);
    }

    const tbody = document.getElementById('unassignedProductsBody');
    if (!tbody) return;

    tbody.innerHTML = filtered.length ? filtered.map(item => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
            <td class="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <p class="font-black text-slate-900 dark:text-white">${escapeHTML(item.name)}</p>
            </td>
            <td class="px-4 py-3 text-xs font-bold text-slate-500 border-b border-slate-100 dark:border-slate-800">${escapeHTML(item.code || '---')}</td>
            <td class="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <span class="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">${escapeHTML(item.category)}</span>
            </td>
            <td class="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <div class="flex items-center gap-2">
                    <select data-action="assign-unassigned" data-product-id="${escapeHTML(item.productId)}" class="w-full max-w-[200px] h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500">
                        ${renderSupplierOptions('')}
                    </select>
                </div>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="4" class="py-12 text-center text-sm font-bold text-slate-400">Tất cả sản phẩm đã được gán Nhà cung cấp</td></tr>';
}

async function assignUnassignedSupplier(productId, supplierId) {
    if (!supplierId) return;
    try {
        await updateProductSupplier(productId, supplierId);
        unassignedProducts = unassignedProducts.filter(p => p.productId !== productId);
        renderUnassignedProducts();
        
        // Cập nhật lại gợi ý nếu sản phẩm này đang ở trong danh sách gợi ý
        const suggestion = suggestions.find(item => item.productId === productId);
        if (suggestion) {
            suggestion.supplierId = supplierId;
            suggestion.supplierName = supplierNameById(supplierId);
            renderSuggestions();
        }
        showToast('Đã gán nhà cung cấp thành công.');
    } catch (error) {
        showToast(error.message || 'Không thể gán nhà cung cấp.', 'error');
    }
}

window.addEventListener('productsUpdated', (e) => {
    if (e.detail) {
        allProducts = e.detail;
        console.log("Purchase: Đã cập nhật danh mục sản phẩm từ Background Sync.");
    }
});

window.addEventListener('productsUpdated', (e) => {
    if (e.detail) {
        console.log("Purchase UI: Đã nhận sự kiện productsUpdated, đang tải lại dữ liệu...");
        loadData();
    }
});

async function loadData() {
    setLoading(true);
    try {
        const [suggestionData, supplierData, orderData, unassignedData] = await Promise.all([
            fetchPurchaseSuggestions(),
            fetchSuppliers(),
            fetchPurchaseOrders(),
            fetchUnassignedProducts()
        ]);
        suggestions = suggestionData;
        suppliers = supplierData;
        purchaseOrders = orderData;
        unassignedProducts = unassignedData;
        renderSupplierSelect();
        renderSupplierGrid();
        renderStats();
        renderSuggestions();
        renderCart();
        renderHistory();
        renderHistoryManageView();
        renderUnassignedProducts();

        // Load Draft
        try {
            const draftStr = localStorage.getItem('PURCHASE_DRAFT_STATE');
            if (draftStr) {
                const draftLines = JSON.parse(draftStr);
                if (Array.isArray(draftLines) && draftLines.length > 0) {
                    if (confirm('Hệ thống tìm thấy một Phiếu Nhập Hàng đang làm dở trước đó. Bạn có muốn phục hồi lại không?\n\n- Bấm OK để tiếp tục phiếu cũ.\n- Bấm Cancel để xóa nháp và tạo phiếu mới.')) {
                        cartLines = draftLines;
                        renderCart();
                        renderStats();
                    } else {
                        localStorage.removeItem('PURCHASE_DRAFT_STATE');
                    }
                }
            }
        } catch(e) {
            localStorage.removeItem('PURCHASE_DRAFT_STATE');
        }

    } catch (error) {
        showToast(error.message || 'Không tải được dữ liệu đặt hàng.', 'error');
    } finally {
        setLoading(false);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!await initLayout('admin', 'purchase')) return;
    loadData();

    document.addEventListener('click', event => {
        const button = event.target.closest('[data-action]');
        if (!button) return;
        const action = button.dataset.action;
        if (action === 'add-line') addLine(button.dataset.productId);
        if (action === 'remove-line') removeLine(button.dataset.productId);
        if (action === 'save-supplier-order') saveSupplierOrder(button.dataset.supplierId);
        if (action === 'copy-supplier-order') copySupplierOrder(button.dataset.supplierId);
        if (action === 'add-all-suggested') addAllSuggested();
        if (action === 'reload-purchase') loadData();
        if (action === 'save-product-supplier') saveLineSupplierAsDefault(button.dataset.productId);
        if (action === 'open-supplier-modal') openSupplierModal();
        if (action === 'close-supplier-modal') closeSupplierModal();
        if (action === 'view-order') openOrderDetailModal(button.dataset.orderId);
        if (action === 'close-order-modal') closeOrderDetailModal();
        if (action === 'edit-supplier') openSupplierModal(button.dataset.supplierId);
        if (action === 'delete-supplier') {
            if (confirm('Xóa nhà cung cấp này?')) {
                deleteSupplier(button.dataset.supplierId)
                    .then(async () => {
                        suppliers = await fetchSuppliers();
                        renderSupplierSelect();
                        renderSupplierGrid();
                        renderCart();
                        showToast('Đã xóa nhà cung cấp.');
                    })
                    .catch(error => showToast(error.message || 'Không xóa được nhà cung cấp.', 'error'));
            }
        }
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
        if (target.id === 'supplierSearch') {
            supplierSearchTerm = target.value.trim();
            renderSupplierGrid();
        }
        if (target.id === 'historyOrderSearch') {
            historySearchTerm = target.value.trim();
            renderHistoryManageView();
        }
        if (target.id === 'unassignedSearchInput') {
            unassignedSearchTerm = target.value.trim();
            renderUnassignedProducts();
        }
        if (target.dataset.action === 'line-input') {
            updateLine(target.dataset.productId, target.dataset.field, target.value);
        }
    });

    document.addEventListener('change', event => {
        const target = event.target;
        if (target.id === 'contactTypeFilter') {
            supplierTypeFilter = target.value || 'all';
            renderSupplierGrid();
        }
        if (target.id === 'historyStatusFilter') {
            historyStatusFilter = target.value || 'all';
            renderHistoryManageView();
        }
        if (target.id === 'historySupplierFilter') {
            historySupplierFilter = target.value || 'all';
            renderHistoryManageView();
        }
        if (target.dataset.action === 'line-input') {
            updateLine(target.dataset.productId, target.dataset.field, target.value);
            renderCart();
        }
        if (target.dataset.action === 'assign-unassigned') {
            assignUnassignedSupplier(target.dataset.productId, target.value);
        }
    });

    document.getElementById('supplierForm')?.addEventListener('submit', async event => {
        event.preventDefault();
        await submitSupplierForm();
    });

    document.querySelectorAll('.purchase-tab').forEach(button => {
        button.addEventListener('click', () => {
            const tab = button.dataset.purchaseTab;
            window.location.hash = `#${tab}`;
            document.querySelectorAll('.purchase-tab').forEach(item => {
                const active = item.dataset.purchaseTab === tab;
                item.classList.toggle('bg-blue-600', active);
                item.classList.toggle('text-white', active);
                item.classList.toggle('text-slate-500', !active);
                item.classList.toggle('dark:text-slate-300', !active);
            });
             document.getElementById('purchaseOrderView')?.classList.toggle('hidden', tab !== 'orders');
             document.getElementById('historyManageView')?.classList.toggle('hidden', tab !== 'history');
             document.getElementById('supplierManageView')?.classList.toggle('hidden', tab !== 'suppliers');
             document.getElementById('unassignedProductsView')?.classList.toggle('hidden', tab !== 'unassigned');
        });
    });

    const handleHash = () => {
        const hash = window.location.hash || '#orders';
        const tab = hash.substring(1);
        const btn = document.querySelector(`.purchase-tab[data-purchase-tab="${tab}"]`);
        if (btn) btn.click();
    };

    document.getElementById('copyOrderTextBtn')?.addEventListener('click', event => {
        const orderId = event.currentTarget.dataset.orderId;
        if (orderId) copyOrderToClipboard(orderId);
    });

    window.addEventListener('hashchange', handleHash);
    setTimeout(handleHash, 100);
});
