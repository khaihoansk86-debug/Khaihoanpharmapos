import { supabaseClient } from '../../core/supabase.js';

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
};

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
        window.showToast?.('Lỗi khi tải thông tin thuốc cắt liều: ' + err.message, 'error');
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
