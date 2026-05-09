// js/features/inventory/inventoryService.js
import { supabaseClient } from '../../core/supabase.js';

// ─── Helpers ngày ────────────────────────────────────────────────────────────
const todayISO    = ()        => new Date().toISOString().split('T')[0];
const futureDateISO = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
};

/**
 * Số ngày còn lại đến ngày hết hạn (âm = đã quá hạn)
 */
export function daysUntilExpiry(expiryDateStr) {
    if (!expiryDateStr) return null;
    const diff = new Date(expiryDateStr) - new Date(todayISO());
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// ─── Cảnh báo theo LÔ hàng ───────────────────────────────────────────────────

/**
 * Lô đã hết hạn (expiry_date < hôm nay) và còn tồn kho > 0
 */
export async function fetchExpiredBatches() {
    if (!supabaseClient) throw new Error('Supabase chưa kết nối.');

    const { data, error } = await supabaseClient
        .from('product_batches')
        .select(`
            id, batch_number, expiry_date, stock_quantity,
            products(id, name, product_code, categories(name))
        `)
        .lt('expiry_date', todayISO())
        .gt('stock_quantity', 0)
        .order('expiry_date', { ascending: true });

    if (error) throw error;
    return data || [];
}

/**
 * Lô sắp hết hạn (hôm nay <= expiry_date <= hôm nay + days) và còn tồn kho
 * @param {number} days - ngưỡng ngày cảnh báo (mặc định 90)
 */
export async function fetchNearExpiryBatches(days = 90) {
    if (!supabaseClient) throw new Error('Supabase chưa kết nối.');

    const { data, error } = await supabaseClient
        .from('product_batches')
        .select(`
            id, batch_number, expiry_date, stock_quantity,
            products(id, name, product_code, categories(name))
        `)
        .gte('expiry_date', todayISO())
        .lte('expiry_date', futureDateISO(days))
        .gt('stock_quantity', 0)
        .order('expiry_date', { ascending: true });

    if (error) throw error;
    return data || [];
}

// ─── Cảnh báo theo SẢN PHẨM ──────────────────────────────────────────────────

/**
 * Cảnh báo tồn kho theo sản phẩm.
 * Trả về { outOfStock: [], lowStock: [] }
 * @param {number} lowStockThreshold - ngưỡng "sắp hết" (mặc định 10)
 */
export async function fetchStockAlerts(lowStockThreshold = 10) {
    if (!supabaseClient) throw new Error('Supabase chưa kết nối.');

    // Chỉ lấy sản phẩm đang kinh doanh
    const { data, error } = await supabaseClient
        .from('products')
        .select(`
            id, name, product_code, is_active,
            categories(name),
            product_units(unit_name, is_base_unit),
            product_batches(stock_quantity)
        `)
        .eq('is_active', true)
        .order('name', { ascending: true });

    if (error) throw error;

    const outOfStock = [];
    const lowStock   = [];

    (data || []).forEach(product => {
        const totalStock = (product.product_batches || [])
            .reduce((sum, b) => sum + (Number(b.stock_quantity) || 0), 0);

        const baseUnit = (product.product_units || []).find(u => u.is_base_unit)
            || (product.product_units || [])[0]
            || null;

        const enriched = {
            ...product,
            total_stock: totalStock,
            base_unit_name: baseUnit?.unit_name || 'đơn vị',
        };

        if (totalStock === 0) {
            outOfStock.push(enriched);
        } else if (totalStock <= lowStockThreshold) {
            lowStock.push(enriched);
        }
    });

    // Sắp xếp low stock: ít hàng nhất lên đầu
    lowStock.sort((a, b) => a.total_stock - b.total_stock);

    return { outOfStock, lowStock };
}
