import { supabaseClient } from '../../core/supabase.js';

const TABLE = 'customers';

function ensureClient() {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');
}

function normalizePhone(phone) {
    return String(phone || '').replace(/\s+/g, '').trim();
}

export function buildCustomerCode() {
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `KH${date}${random}`;
}

export async function fetchCustomers() {
    ensureClient();
    
    const [custRes, debtRes] = await Promise.all([
        supabaseClient.from(TABLE).select('*').order('created_at', { ascending: false }),
        supabaseClient.from('view_customer_debts').select('customer_id, customer_phone, debt_amount')
    ]);

    if (custRes.error) throw custRes.error;
    if (debtRes.error) console.error("Lỗi tải công nợ:", debtRes.error);

    const customers = custRes.data || [];
    const debts = debtRes.data || [];

    // Tính tổng nợ từ sổ quỹ
    const debtById = new Map();
    const debtByPhone = new Map();

    for (const d of debts) {
        const amt = Number(d.debt_amount || 0);
        if (d.customer_id) {
            debtById.set(d.customer_id, (debtById.get(d.customer_id) || 0) + amt);
        } else if (d.customer_phone) {
            debtByPhone.set(d.customer_phone, (debtByPhone.get(d.customer_phone) || 0) + amt);
        }
    }

    // Gán nợ động vào danh sách khách hàng
    for (const c of customers) {
        let debt = 0;
        let matched = false;

        if (c.id && debtById.has(c.id)) {
            debt += debtById.get(c.id);
            matched = true;
        }
        
        if (!matched && c.phone && debtByPhone.has(c.phone)) {
            debt += debtByPhone.get(c.phone);
        }

        c.debt_amount = debt; // Ghi đè cột tĩnh bằng số nợ thực tế
    }

    return customers;
}

export async function createCustomer(payload) {
    ensureClient();
    const fullName = String(payload.full_name || '').trim();
    if (!fullName) throw new Error('Vui lòng nhập tên khách hàng.');

    const dataToInsert = {
        customer_code: payload.customer_code || buildCustomerCode(),
        full_name: fullName,
        phone: normalizePhone(payload.phone) || null,
        email: String(payload.email || '').trim() || null,
        gender: payload.gender || null,
        birth_date: payload.birth_date || null,
        address: String(payload.address || '').trim() || null,
        tax_code: String(payload.tax_code || '').trim() || null,
        customer_group: payload.customer_group || 'retail',
        note: String(payload.note || '').trim() || null,
        is_active: payload.is_active !== false
    };

    const { data, error } = await supabaseClient
        .from(TABLE)
        .insert([dataToInsert])
        .select()
        .single();

    if (error) {
        if (error.code === '23505') throw new Error('Số điện thoại hoặc mã khách hàng đã tồn tại.');
        throw error;
    }
    return data;
}

export async function updateCustomer(id, payload) {
    ensureClient();
    if (!id) throw new Error('Thiếu khách hàng cần cập nhật.');

    const dataToUpdate = {
        full_name: String(payload.full_name || '').trim(),
        phone: normalizePhone(payload.phone) || null,
        email: String(payload.email || '').trim() || null,
        gender: payload.gender || null,
        birth_date: payload.birth_date || null,
        address: String(payload.address || '').trim() || null,
        tax_code: String(payload.tax_code || '').trim() || null,
        customer_group: payload.customer_group || 'retail',
        note: String(payload.note || '').trim() || null,
        is_active: payload.is_active !== false,
        updated_at: new Date().toISOString()
    };

    if (!dataToUpdate.full_name) throw new Error('Vui lòng nhập tên khách hàng.');

    const { data, error } = await supabaseClient
        .from(TABLE)
        .update(dataToUpdate)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        if (error.code === '23505') throw new Error('Số điện thoại hoặc mã khách hàng đã tồn tại.');
        throw error;
    }
    return data;
}

export async function setCustomerActive(id, isActive) {
    ensureClient();
    if (!id) throw new Error('Thiếu khách hàng cần cập nhật.');

    const { error } = await supabaseClient
        .from(TABLE)
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) throw error;
    return true;
}

export async function deleteCustomers(ids = []) {
    ensureClient();

    const customerIds = [...new Set((ids || []).filter(Boolean))];
    if (!customerIds.length) throw new Error('Thiếu khách hàng cần xóa.');

    const { error: unlinkError } = await supabaseClient
        .from('orders')
        .update({ customer_id: null })
        .in('customer_id', customerIds);

    if (unlinkError) throw unlinkError;

    const { error } = await supabaseClient
        .from(TABLE)
        .delete()
        .in('id', customerIds);

    if (error) {
        if (error.code === '23503') {
            throw new Error('Không thể xóa khách hàng vì vẫn còn dữ liệu liên quan.');
        }
        throw error;
    }

    return true;
}

export async function deleteCustomer(id) {
    return deleteCustomers([id]);
}

export async function fetchCustomerGroups() {
    ensureClient();
    const { data, error } = await supabaseClient
        .from('customer_groups')
        .select('*')
        .order('group_name', { ascending: true });

    if (error) {
        if (error.message?.includes('customer_groups') || error.message?.includes('schema cache')) {
            return [
                { group_code: 'retail', group_name: 'Khách lẻ', discount_percent: 0, is_active: true },
                { group_code: 'vip', group_name: 'VIP', discount_percent: 0, is_active: true },
                { group_code: 'wholesale', group_name: 'Bán sỉ', discount_percent: 0, is_active: true },
                { group_code: 'clinic', group_name: 'Phòng khám', discount_percent: 0, is_active: true },
                { group_code: 'internal', group_name: 'Nội bộ', discount_percent: 0, is_active: true }
            ];
        }
        throw error;
    }
    return data || [];
}

export async function createCustomerGroup(payload) {
    ensureClient();
    const groupName = String(payload.group_name || '').trim();
    if (!groupName) throw new Error('Vui lòng nhập tên nhóm khách.');

    const groupCode = String(payload.group_code || groupName)
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || `group_${Date.now()}`;

    const { data, error } = await supabaseClient
        .from('customer_groups')
        .insert([{
            group_code: groupCode,
            group_name: groupName,
            description: String(payload.description || '').trim() || null,
            discount_percent: Number(payload.discount_percent || 0),
            is_active: payload.is_active !== false
        }])
        .select()
        .single();

    if (error) {
        if (error.code === '23505') throw new Error('Mã nhóm hoặc tên nhóm đã tồn tại.');
        throw error;
    }
    return data;
}

export async function updateCustomerGroup(id, payload) {
    ensureClient();
    if (!id) throw new Error('Thiếu nhóm khách cần cập nhật.');
    const groupName = String(payload.group_name || '').trim();
    if (!groupName) throw new Error('Vui lòng nhập tên nhóm khách.');

    const { data, error } = await supabaseClient
        .from('customer_groups')
        .update({
            group_name: groupName,
            description: String(payload.description || '').trim() || null,
            discount_percent: Number(payload.discount_percent || 0),
            is_active: payload.is_active !== false,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        if (error.code === '23505') throw new Error('Tên nhóm đã tồn tại.');
        throw error;
    }
    return data;
}

export async function setCustomerGroupActive(id, isActive) {
    ensureClient();
    if (!id) throw new Error('Thiếu nhóm khách cần cập nhật.');

    const { error } = await supabaseClient
        .from('customer_groups')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) throw error;
    return true;
}
