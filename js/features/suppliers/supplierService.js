import { supabaseClient } from '../../core/supabase.js';

const TABLE = 'suppliers';

function ensureClient() {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');
}

export function buildSupplierCode() {
    return `DT${Date.now().toString().slice(-6)}${Math.random().toString(36).slice(2, 4).toUpperCase()}`;
}

export async function fetchSuppliers() {
    ensureClient();
    let allSuppliers = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabaseClient
            .from(TABLE)
            .select('*')
            .order('name', { ascending: true })
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;
        if (data && data.length > 0) {
            allSuppliers = allSuppliers.concat(data);
            if (data.length < pageSize) hasMore = false;
            else page++;
        } else {
            hasMore = false;
        }
    }
    return allSuppliers;
}

export async function createSupplier(payload) {
    ensureClient();
    const name = String(payload.name || '').trim();
    if (!name) throw new Error('Vui lòng nhập tên đối tác.');

    const dataToInsert = {
        supplier_code: payload.supplier_code || buildSupplierCode(),
        name: name,
        contact_type: payload.contact_type || 'phone',
        contact_info: String(payload.contact_info || '').trim() || null,
        address: String(payload.address || '').trim() || null,
        note: String(payload.note || '').trim() || null,
        is_active: payload.is_active !== false
    };

    const { data, error } = await supabaseClient
        .from(TABLE)
        .insert([dataToInsert])
        .select()
        .single();

    if (error) {
        if (error.code === '23505') throw new Error('Mã đối tác đã tồn tại.');
        throw error;
    }
    return data;
}

export async function updateSupplier(id, payload) {
    ensureClient();
    if (!id) throw new Error('Thiếu đối tác cần cập nhật.');

    const dataToUpdate = {
        name: String(payload.name || '').trim(),
        contact_type: payload.contact_type || 'phone',
        contact_info: String(payload.contact_info || '').trim() || null,
        address: String(payload.address || '').trim() || null,
        note: String(payload.note || '').trim() || null,
        is_active: payload.is_active !== false,
        updated_at: new Date().toISOString()
    };

    if (!dataToUpdate.name) throw new Error('Vui lòng nhập tên đối tác.');

    const { data, error } = await supabaseClient
        .from(TABLE)
        .update(dataToUpdate)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteSupplier(id) {
    ensureClient();
    if (!id) throw new Error('Thiếu đối tác cần xóa.');

    const { error } = await supabaseClient
        .from(TABLE)
        .delete()
        .eq('id', id);

    if (error) {
        if (error.code === '23503') throw new Error('Không thể xóa đối tác này vì đã có dữ liệu nhập hàng liên quan.');
        throw error;
    }
    return true;
}
