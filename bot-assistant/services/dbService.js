import { createClient } from '@supabase/supabase-js';
try {
    const dotenv = await import('dotenv');
    dotenv.default?.config?.();
} catch {}
import { getVietnamDateKey, getVietnamDayRange } from '../rules/stocktakeReportRules.js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://iejgtdcdzababydaqjef.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_AjGRJy05OUTeqEJxvhy8eg_Rck3CpU1';
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function getExpiringBatches(days = 90) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    const isoDate = targetDate.toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('product_batches')
        .select('batch_number, expiry_date, stock_quantity, products(name, product_code)')
        .lte('expiry_date', isoDate)
        .gt('stock_quantity', 0)
        .order('expiry_date', { ascending: true });
    if (error) { console.error('Lỗi khi lấy thuốc cận date:', error); return []; }
    return data;
}

export async function getLowStockProducts(threshold = 10) {
    const { data, error } = await supabase
        .from('product_batches')
        .select('stock_quantity, products(id, name, product_code)')
        .gt('stock_quantity', 0);
    if (error) { console.error('Lỗi khi lấy thuốc sắp hết:', error); return []; }

    const stockMap = {};
    data.forEach(batch => {
        if (!batch.products) return;
        const pId = batch.products.id;
        if (!stockMap[pId]) stockMap[pId] = { name: batch.products.name, code: batch.products.product_code, total_stock: 0 };
        stockMap[pId].total_stock += Number(batch.stock_quantity || 0);
    });

    const lowStockList = [];
    for (const key in stockMap) {
        if (stockMap[key].total_stock < threshold) lowStockList.push(stockMap[key]);
    }
    lowStockList.sort((a, b) => a.total_stock - b.total_stock);
    return lowStockList.slice(0, 20);
}

export async function getRandomProductsForInventoryCheck(count = 5) {
    const { data, error } = await supabase.from('products').select('id, name, product_code').eq('is_active', true).limit(100);
    if (error) { console.error('Lỗi khi lấy thuốc random:', error); return []; }
    for (let i = data.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [data[i], data[j]] = [data[j], data[i]];
    }
    return data.slice(0, count);
}

export async function triggerAndGetDailyInventoryTasks() {
    // 1. Kích hoạt tạo danh sách 20 ngày trên POS (nếu hôm nay chưa tạo)
    const { error: genErr } = await supabase.rpc('bot_generate_daily_inventory_tasks');
    if (genErr) {
        console.error('Lỗi khi tạo danh sách 20 ngày:', genErr);
    }

    // 2. Lấy danh sách vừa tạo
    const { data: tasks, error: fetchErr } = await supabase.rpc('bot_get_daily_inventory_tasks');
    if (fetchErr) {
        console.error('Lỗi khi lấy danh sách kiểm hàng:', fetchErr);
        return [];
    }

    const rows = tasks || [];
    if (rows.length === 0) return [];
    const details = await getInventoryAuditProductDetails(rows.map(task => task.product_id));
    return rows.map(task => ({
        ...task,
        units: details.get(task.product_id)?.units || [],
        batches: details.get(task.product_id)?.batches || []
    }));
}

export async function getInventoryAuditProductDetails(productIds = []) {
    const ids = [...new Set(productIds.filter(Boolean))];
    const result = new Map(ids.map(id => [id, { units: [], batches: [] }]));
    if (ids.length === 0) return result;

    const [{ data: units, error: unitError }, { data: batches, error: batchError }] = await Promise.all([
        supabase
            .from('product_units')
            .select('id, product_id, unit_name, conversion_rate, is_base_unit')
            .in('product_id', ids),
        supabase
            .from('product_batches')
            .select('id, product_id, batch_number, expiry_date, stock_quantity, is_tracked')
            .in('product_id', ids)
    ]);
    if (unitError) throw unitError;
    if (batchError) throw batchError;

    (units || []).forEach(unit => result.get(unit.product_id)?.units.push(unit));
    (batches || []).forEach(batch => {
        if (Number(batch.stock_quantity || 0) > 0 || batch.is_tracked === true) {
            result.get(batch.product_id)?.batches.push(batch);
        }
    });
    result.forEach(detail => {
        detail.units.sort((a, b) => Number(b.is_base_unit) - Number(a.is_base_unit));
        detail.batches.sort((a, b) => String(a.expiry_date || '').localeCompare(String(b.expiry_date || '')));
    });
    return result;
}

export async function getInventoryAuditMovements(productIds = [], since) {
    const ids = [...new Set(productIds.filter(Boolean))];
    if (ids.length === 0) return [];
    let query = supabase
        .from('inventory_movements')
        .select('id, product_id, batch_id, movement_type, quantity_base, reason, note, created_at, product_name, product_code, batch_number')
        .in('product_id', ids)
        .order('created_at', { ascending: true });
    if (since) query = query.gte('created_at', since);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

export async function fetchStocktakeDocuments(client, dateKey) {
    const { start, end } = getVietnamDayRange(dateKey);
    const { data: docs, error } = await client
        .from('inventory_documents')
        .select(`
            document_code,
            note,
            created_at,
            inventory_document_items(
                product_id,
                quantity_base,
                counted_quantity_base,
                products(name, product_code)
            )
        `)
        .eq('document_type', 'stocktake_adjustment')
        .gte('created_at', start)
        .lt('created_at', end);

    if (error) {
        throw new Error('Không thể đọc phiếu kiểm kho từ cơ sở dữ liệu.', { cause: error });
    }
    return docs || [];
}

export async function getTodayStocktakeDocuments(options = {}) {
    const dateKey = options.dateKey || getVietnamDateKey(options.now || new Date());
    return fetchStocktakeDocuments(options.client || supabase, dateKey);
}
