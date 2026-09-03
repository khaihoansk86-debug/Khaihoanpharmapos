import { supabaseClient } from '../../core/supabase.js';
import { fetchProductSalesHistoryWithClient } from './productStockLimitHistoryRepository.js';

/**
 * Fetch demand rows for one SKU without changing the frozen catalog service.
 * Filtering by status/type remains in the pure rules module so this service
 * can never silently count internal, draft or cancelled transactions.
 */
export async function fetchProductSalesHistory(productId, client = supabaseClient) {
    if (!client) throw new Error('Supabase client chưa được khởi tạo.');
    if (!productId) return [];
    return fetchProductSalesHistoryWithClient(client, productId);
}
