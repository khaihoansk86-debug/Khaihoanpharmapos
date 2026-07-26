import { supabaseClient } from '../../core/supabase.js';
import { buildEcommerceReturnPayload } from './ecommerceReturnRules.js';

const PRODUCT_SELECT = `
    id,
    name,
    product_code,
    description,
    product_units(id, unit_name, conversion_rate, is_base_unit, cost_price),
    product_batches(id, batch_number, expiry_date, stock_quantity, cost_price, is_tracked)
`;

function mergeProducts(groups) {
    const byId = new Map();
    groups.flat().forEach(product => {
        if (product?.id) byId.set(product.id, product);
    });
    return [...byId.values()].slice(0, 20);
}

export async function searchEcommerceReturnProducts(keyword, limit = 12) {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');
    const term = String(keyword || '').trim();
    if (term.length < 2) return [];

    const pattern = `%${term}%`;
    const [byName, byCode] = await Promise.all([
        supabaseClient.from('products').select(PRODUCT_SELECT).ilike('name', pattern).limit(limit),
        supabaseClient.from('products').select(PRODUCT_SELECT).ilike('product_code', pattern).limit(limit)
    ]);
    if (byName.error) throw byName.error;
    if (byCode.error) throw byCode.error;

    return mergeProducts([byName.data || [], byCode.data || []]);
}

export async function fetchEcommerceReturns({ limit = 200 } = {}) {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');
    const { data, error } = await supabaseClient
        .from('ecommerce_returns')
        .select('*, ecommerce_return_items(*)')
        .order('received_at', { ascending: false })
        .limit(Math.min(500, Math.max(1, Number(limit || 200))));
    if (error) throw error;
    return data || [];
}

export async function createEcommerceReturn(input) {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');
    const payload = buildEcommerceReturnPayload(input);
    const { data, error } = await supabaseClient.rpc('create_ecommerce_return', {
        p_return: payload.returnData,
        p_items: payload.items
    });
    if (error) throw error;
    return data;
}

export async function cancelEcommerceReturn(returnId, reason) {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');
    const cleanReason = String(reason || '').trim();
    if (!returnId) throw new Error('Phiếu hoàn không hợp lệ.');
    if (!cleanReason) throw new Error('Vui lòng nhập lý do hủy phiếu hoàn.');

    const { data, error } = await supabaseClient.rpc('cancel_ecommerce_return', {
        p_return_id: returnId,
        p_reason: cleanReason
    });
    if (error) throw error;
    return data;
}
