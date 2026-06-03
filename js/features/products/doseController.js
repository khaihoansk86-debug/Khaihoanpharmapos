import { supabaseClient } from '../../core/supabase.js';

let doseCurrentPage = 1;
let doseItemsPerPage = 20;
let allDoses = [];

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
                categories(name)
            `)
            .eq('category_id', catId);
            
        if (error) throw error;
        
        allDoses = doses || [];
        doseCurrentPage = 1;
        window.renderDosesTable();
    } catch (err) {
        console.error("Lỗi khi tải thuốc liều:", err);
        container.innerHTML = `<tr><td colspan="5" class="py-10 text-center text-red-500 font-medium">Lỗi tải dữ liệu: ${err.message}</td></tr>`;
    } finally {
        if (loading) loading.classList.add('hidden');
    }
};

window.renderDosesTable = () => {
    const container = document.getElementById('doses-container');
    const paginationContainer = document.getElementById('doses-pagination');
    if (!container) return;
    
    if (allDoses.length === 0) {
        container.innerHTML = `<tr><td colspan="5" class="py-10 text-center text-slate-500 font-medium italic bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">Chưa có liều thuốc nào được thiết lập. Hãy click "Thêm liều mới" để bắt đầu!</td></tr>`;
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }
    
    const totalPages = Math.ceil(allDoses.length / doseItemsPerPage) || 1;
    if (doseCurrentPage > totalPages) doseCurrentPage = totalPages;
    
    const startIndex = (doseCurrentPage - 1) * doseItemsPerPage;
    const paginatedDoses = allDoses.slice(startIndex, startIndex + doseItemsPerPage);
    
    container.innerHTML = paginatedDoses.map(dose => {
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
    
    if (paginationContainer) {
        paginationContainer.innerHTML = `
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div class="flex items-center gap-3">
                    <span class="text-xs font-black text-slate-500 uppercase tracking-widest">Hiển thị</span>
                    <select onchange="window.changeDoseItemsPerPage(this.value)" class="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 px-3 py-2 outline-none cursor-pointer hover:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all">
                        <option value="20" ${doseItemsPerPage===20?'selected':''}>20 dòng / trang</option>
                        <option value="50" ${doseItemsPerPage===50?'selected':''}>50 dòng / trang</option>
                        <option value="100" ${doseItemsPerPage===100?'selected':''}>100 dòng / trang</option>
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
    const totalPages = Math.ceil(allDoses.length / doseItemsPerPage) || 1;
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
        
        window.showToast?.('Lưu thuốc cắt liều thành công!', 'success');
        window.closeAddDoseModal();
        window.loadDosesData();
    } catch (err) {
        console.error("Lỗi khi lưu thuốc cắt liều:", err);
        window.showToast?.('Lỗi khi lưu thuốc cắt liều: ' + err.message, 'error');
    } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Lưu thuốc cắt liều'; }
    }
};
