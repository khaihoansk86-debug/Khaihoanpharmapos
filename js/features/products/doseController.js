import { supabaseClient } from '../../core/supabase.js';
import { removeVietnameseTones } from './productService.js';

let doseCurrentPage = 1;
let doseItemsPerPage = 20;
let allDoses = [];
let doseSearchQuery = '';

function getFilteredDoses() {
    if (!doseSearchQuery) return allDoses;
    const query = removeVietnameseTones(doseSearchQuery).trim().toUpperCase();
    if (!query) return allDoses;
    return allDoses.filter(dose => {
        const searchStr = `${dose.product_code || ''} ${dose.name || ''} ${dose.active_ingredient || ''}`.toUpperCase();
        return removeVietnameseTones(searchStr).includes(query);
    });
}

// Thiết lập bộ lắng nghe sự kiện tìm kiếm thuốc liều nguyên liệu
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('doseSearchInput');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                doseSearchQuery = e.target.value;
                doseCurrentPage = 1;
                window.renderDosesTable();
            }, 300);
        });
    }
});

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

window.loadDosesData = async () => {
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
                product_batches(*),
                categories(name)
            `)
            .eq('category_id', catId);

        if (error) throw error;

        allDoses = doses || [];
        doseCurrentPage = 1;
        window.renderDosesTable();
    } catch (err) {
        console.error("Lỗi khi tải thuốc liều:", err);
        container.innerHTML = `<tr><td colspan="6" class="py-10 text-center text-red-500 font-medium">Lỗi tải dữ liệu: ${err.message}</td></tr>`;
    } finally {
        if (loading) loading.classList.add('hidden');
    }
};

window.renderDosesTable = () => {
    const container = document.getElementById('doses-container');
    const paginationContainer = document.getElementById('doses-pagination');
    if (!container) return;

    const filteredDoses = getFilteredDoses();

    if (filteredDoses.length === 0) {
        if (doseSearchQuery) {
            container.innerHTML = `<tr><td colspan="6" class="py-10 text-center text-slate-500 font-medium italic bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">Không tìm thấy thuốc liều nào khớp với từ khóa tìm kiếm.</td></tr>`;
        } else {
            container.innerHTML = `<tr><td colspan="6" class="py-10 text-center text-slate-500 font-medium italic bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">Chưa có liều thuốc nào được thiết lập. Hãy click "Thêm liều mới" để bắt đầu!</td></tr>`;
        }
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    const totalPages = Math.ceil(filteredDoses.length / doseItemsPerPage) || 1;
    if (doseCurrentPage > totalPages) doseCurrentPage = totalPages;

    const startIndex = (doseCurrentPage - 1) * doseItemsPerPage;
    const paginatedDoses = filteredDoses.slice(startIndex, startIndex + doseItemsPerPage);

    container.innerHTML = paginatedDoses.map(dose => {
        const baseUnit = dose.product_units?.find(u => u.is_base_unit) || dose.product_units?.[0] || {};
        const totalStock = (dose.product_batches || []).reduce((sum, b) => sum + (Number(b.stock_quantity) || 0), 0);
        return `
        <tr class="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 shadow-sm transition-colors rounded-2xl">
            <td class="py-4 px-5 font-mono font-bold text-slate-700 dark:text-slate-350 rounded-l-2xl">${dose.product_code}</td>
            <td class="py-4 px-5 font-bold text-slate-800 dark:text-white">${dose.name}</td>
            <td class="py-4 px-5"><span class="px-2.5 py-1 bg-blue-50/50 border border-blue-200 text-blue-700 text-xs font-black rounded-lg">${baseUnit.unit_name || 'Liều'}</span></td>
            <td class="py-4 px-5 font-bold text-slate-800 dark:text-white font-mono">${totalStock.toLocaleString('vi-VN')}</td>
            <td class="py-4 px-5 font-black text-emerald-600 dark:text-emerald-400 font-mono">${Number(baseUnit.cost_price || 0).toLocaleString('vi-VN')}đ</td>
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

    if (paginationContainer) {
        paginationContainer.innerHTML = `
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div class="flex items-center gap-3">
                    <span class="text-xs font-black text-slate-500 uppercase tracking-widest">Hiển thị</span>
                    <select onchange="window.changeDoseItemsPerPage(this.value)" class="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 px-3 py-2 outline-none cursor-pointer hover:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all">
                        <option value="20" ${doseItemsPerPage === 20 ? 'selected' : ''}>20 dòng / trang</option>
                        <option value="50" ${doseItemsPerPage === 50 ? 'selected' : ''}>50 dòng / trang</option>
                        <option value="100" ${doseItemsPerPage === 100 ? 'selected' : ''}>100 dòng / trang</option>
                    </select>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="window.changeDosePage(${doseCurrentPage - 1})" ${doseCurrentPage === 1 ? 'disabled class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-400 border border-slate-200 dark:border-slate-800 cursor-not-allowed"' : 'class="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 hover:text-blue-600 shadow-sm transition-all"'}>
                        <i class="fa-solid fa-chevron-left text-xs"></i>
                    </button>
                    <div class="px-4 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-black text-sm rounded-lg border border-blue-100 dark:border-blue-800/50">Trang ${doseCurrentPage} / ${totalPages}</div>
                    <button onclick="window.changeDosePage(${doseCurrentPage + 1})" ${doseCurrentPage === totalPages ? 'disabled class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-400 border border-slate-200 dark:border-slate-800 cursor-not-allowed"' : 'class="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 hover:text-blue-600 shadow-sm transition-all"'}>
                        <i class="fa-solid fa-chevron-right text-xs"></i>
                    </button>
                </div>
            </div>
        `;
    }
};

window.changeDosePage = (page) => {
    const filteredDoses = getFilteredDoses();
    const totalPages = Math.ceil(filteredDoses.length / doseItemsPerPage) || 1;
    if (page >= 1 && page <= totalPages) {
        doseCurrentPage = page;
        window.renderDosesTable();
    }
};

window.changeDoseItemsPerPage = (limit) => {
    doseItemsPerPage = parseInt(limit);
    doseCurrentPage = 1;
    window.renderDosesTable();
};

window.openAddDoseModal = async () => {
    const catId = await getDosesCategoryId();
    if (typeof window.openAddProductModal === 'function') {
        window.openAddProductModal();
        const catSelect = document.getElementById('add_category');
        if (catSelect) {
            catSelect.value = catId;
            catSelect.dispatchEvent(new Event('change'));
        }
    }
};

window.openEditDoseModal = async (id) => {
    try {
        const { data: dose, error } = await supabaseClient
            .from('products')
            .select('*, product_units(*), product_batches(*)')
            .eq('id', id)
            .single();

        if (error) throw error;

        if (typeof window.openAddProductModal === 'function') {
            window.openAddProductModal(dose);
            const catSelect = document.getElementById('add_category');
            if (catSelect) {
                if (!catSelect.value) {
                    const catId = await getDosesCategoryId();
                    catSelect.value = catId;
                }
                catSelect.dispatchEvent(new Event('change'));
            }
        }
    } catch (err) {
        window.showToast?.('Lỗi khi tải thông tin thuốc cắt liều: ' + err.message, 'error');
    }
};

window.closeAddDoseModal = () => {
    if (typeof window.closeAddProductModal === 'function') {
        window.closeAddProductModal();
    }
};

window.deleteDose = async (id, name) => {
    if (!confirm(`Bạn có chắc muốn xóa liều thuốc "${name}"?`)) return;
    try {
        const { error } = await supabaseClient
            .from('products')
            .delete()
            .eq('id', id);
        if (error) throw error;
        window.showToast?.('Đã xóa liều thuốc thành công!', 'success');
        window.loadDosesData();
    } catch (err) {
        window.showToast?.('Lỗi khi xóa liều thuốc: ' + err.message, 'error');
    }
};

