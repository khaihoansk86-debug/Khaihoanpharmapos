import { supabaseClient } from '../../core/supabase.js';

function normalizeUnitName(value) {
    return String(value || '').trim().toLocaleLowerCase('vi-VN');
}

/**
 * Fetch demand rows for one SKU without changing the frozen catalog service.
 * Filtering by status/type remains in the pure rules module so this service
 * can never silently count internal, draft or cancelled transactions.
 */
export async function fetchProductSalesHistory(productId) {
    if (!supabaseClient) throw new Error('Supabase client chưa được khởi tạo.');
    if (!productId) return [];

    // order_items stores quantity in the unit used at checkout, while stock
    // limits are configured in the SKU's base/smallest unit.  Read the SKU
    // packaging map once and normalize each history row before the rules run.
    const { data: units, error: unitsError } = await supabaseClient
        .from('product_units')
        .select('unit_name, conversion_rate, is_base_unit')
        .eq('product_id', productId)
        .order('is_base_unit', { ascending: false });
    if (unitsError) throw unitsError;

    const conversionByUnit = new Map();
    (units || []).forEach(unit => {
        const key = normalizeUnitName(unit.unit_name);
        const conversionRate = Number(unit.conversion_rate);
        if (!key || !Number.isFinite(conversionRate) || conversionRate <= 0) return;
        if (!conversionByUnit.has(key)) conversionByUnit.set(key, conversionRate);
    });

    const rows = [];
    const pageSize = 1000;
    let page = 0;
    while (true) {
        const { data, error } = await supabaseClient
            .from('order_items')
            .select('quantity, orders(status, order_type, created_at)')
            .eq('product_id', productId)
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;
        rows.push(...data.map(item => ({
            quantity: item.quantity,
            unit_name: item.unit_name,
            conversion_rate: conversionByUnit.get(normalizeUnitName(item.unit_name)) || 1,
            ...(item.orders || {})
        })));
        if (data.length < pageSize) break;
        page += 1;
    }
    return rows;
}
