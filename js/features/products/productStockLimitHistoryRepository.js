import { unitIdentity } from '../../core/unitCatalog.js';

/**
 * Read one SKU's completed-order candidates with selling quantities converted
 * later by the rules module into the SKU's base stock unit.
 *
 * The client is injected deliberately: browser code supplies the shared
 * Supabase client while tests can verify the exact database projection.
 */
export async function fetchProductSalesHistoryWithClient(client, productId) {
    if (!client?.from) throw new Error('Supabase client chưa được khởi tạo.');
    if (!productId) return [];

    const { data: units, error: unitsError } = await client
        .from('product_units')
        .select('unit_name, conversion_rate, is_base_unit')
        .eq('product_id', productId)
        .order('is_base_unit', { ascending: false });
    if (unitsError) throw unitsError;

    const conversionByUnit = new Map();
    (units || []).forEach(unit => {
        const key = unitIdentity(unit.unit_name);
        const conversionRate = Number(unit.conversion_rate);
        if (!key || !Number.isFinite(conversionRate) || conversionRate <= 0) return;
        if (!conversionByUnit.has(key)) conversionByUnit.set(key, conversionRate);
    });

    const rows = [];
    const pageSize = 1000;
    let page = 0;
    while (true) {
        const { data, error } = await client
            .from('order_items')
            .select('quantity, unit_name, orders(status, order_type, created_at)')
            .eq('product_id', productId)
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;
        rows.push(...data.map(item => ({
            quantity: item.quantity,
            unit_name: item.unit_name,
            conversion_rate: conversionByUnit.get(unitIdentity(item.unit_name)) || 1,
            ...(item.orders || {})
        })));
        if (data.length < pageSize) break;
        page += 1;
    }
    return rows;
}
