import { supabaseClient } from '../../core/supabase.js';
import { buildProductLifecycleCandidates } from './productLifecycleRules.js';

let cachedResult = null;
let cachedAt = 0;
const CACHE_MS = 5 * 60 * 1000;

async function fetchCompletedSaleRows(days = 365) {
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const rows = [];
    const pageSize = 1000;

    for (let from = 0; ; from += pageSize) {
        const { data, error } = await supabaseClient
            .from('order_items')
            .select('product_id, quantity, created_at, orders!inner(status, created_at)')
            .gt('quantity', 0)
            .eq('orders.status', 'completed')
            .gte('orders.created_at', since)
            .range(from, from + pageSize - 1);
        if (error) throw error;

        const page = data || [];
        rows.push(...page.map(row => ({
            product_id: row.product_id,
            quantity: row.quantity,
            created_at: row.created_at,
            sold_at: row.orders?.created_at || row.created_at
        })));
        if (page.length < pageSize) break;
    }

    return rows;
}

export async function fetchProductLifecycleCandidates(products = [], options = {}) {
    const now = Date.now();
    if (!options.force && cachedResult && now - cachedAt < CACHE_MS) return cachedResult;
    if (!supabaseClient) return [];

    const sales = await fetchCompletedSaleRows(365);
    cachedResult = buildProductLifecycleCandidates(products, sales, new Date(now));
    cachedAt = now;
    return cachedResult;
}

export function clearProductLifecycleCache() {
    cachedResult = null;
    cachedAt = 0;
}
