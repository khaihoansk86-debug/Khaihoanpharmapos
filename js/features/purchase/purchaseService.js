import { supabaseClient } from '../../core/supabase.js';
import { normalizeUnitName, normalizeProductUnits } from '../../core/unitCatalog.js';

const LOCAL_PURCHASE_ORDERS_KEY = 'khp_purchase_orders_local';
const LOW_STOCK_THRESHOLD = 10;
const TARGET_DAYS = 14;
const LOOKBACK_DAYS = 7;

function toNumber(value) {
    const number = Number(value || 0);
    return Number.isFinite(number) ? number : 0;
}

function todayDate() {
    return new Date().toISOString().slice(0, 10);
}

function buildPurchaseOrderCode() {
    const date = todayDate().replace(/-/g, '');
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `DH-${date}-${suffix}`;
}

function dateDaysAgo(days) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - days);
    return date.toISOString();
}

function readLocalOrders() {
    try {
        return JSON.parse(localStorage.getItem(LOCAL_PURCHASE_ORDERS_KEY) || '[]');
    } catch {
        return [];
    }
}

function writeLocalOrders(orders) {
    localStorage.setItem(LOCAL_PURCHASE_ORDERS_KEY, JSON.stringify(orders));
}

function getBaseUnit(product) {
    const units = normalizeProductUnits(product.product_units || []);
    return units.find(unit => unit.is_base_unit) || units[0] || null;
}

function normalizeProduct(product, soldMap) {
    const unit = getBaseUnit(product);
    const batches = product.product_batches || [];
    const stock = batches.reduce((sum, batch) => sum + toNumber(batch.stock_quantity), 0);
    const costFromBatch = batches.find(batch => toNumber(batch.cost_price) > 0)?.cost_price;
    const cost = toNumber(costFromBatch || unit?.cost_price || 0);
    const sold7d = toNumber(soldMap.get(product.id));
    const avgDailySold = sold7d / LOOKBACK_DAYS;
    const targetStock = Math.max(LOW_STOCK_THRESHOLD, Math.ceil(avgDailySold * TARGET_DAYS));
    const suggestedQuantity = Math.max(0, Math.ceil(targetStock - stock));
    const urgencyScore = (stock <= LOW_STOCK_THRESHOLD ? 100 : 0) + sold7d * 3 + suggestedQuantity;

    return {
        productId: product.id,
        code: product.product_code || '',
        name: product.name || 'Không rõ tên',
        category: product.categories?.name || product.product_categories?.name || 'Chưa phân nhóm',
        supplierId: product.supplier_id || null,
        supplierName: product.suppliers?.name || null,
        unitName: normalizeUnitName(unit?.unit_name, 'Đơn vị'),
        currentStock: stock,
        costPrice: cost,
        sold7d,
        avgDailySold,
        suggestedQuantity,
        targetStock,
        urgencyScore,
        reason: stock <= 0
            ? 'Hết hàng'
            : stock <= LOW_STOCK_THRESHOLD
                ? 'Tồn thấp'
                : sold7d > 0
                    ? 'Có bán gần đây'
                    : 'Theo dõi'
    };
}

async function fetchSoldQuantities7d() {
    const from = dateDaysAgo(LOOKBACK_DAYS - 1);
    let orders = [];
    let pageOrders = 0;
    let hasMoreOrders = true;
    const pageSize = 1000;
    while (hasMoreOrders) {
        const { data, error: orderError } = await supabaseClient
            .from('orders')
            .select('id')
            .eq('status', 'completed')
            .gte('created_at', from)
            .range(pageOrders * pageSize, (pageOrders + 1) * pageSize - 1);

        if (orderError) throw orderError;
        if (data && data.length > 0) {
            orders = orders.concat(data);
            if (data.length < pageSize) hasMoreOrders = false;
            else pageOrders++;
        } else {
            hasMoreOrders = false;
        }
    }
    const orderIds = (orders || []).map(order => order.id);
    const soldMap = new Map();
    if (!orderIds.length) return soldMap;

    for (let index = 0; index < orderIds.length; index += 80) {
        const ids = orderIds.slice(index, index + 80);
        const { data: items, error: itemError } = await supabaseClient
            .from('order_items')
            .select('product_id, quantity')
            .in('order_id', ids);
        if (itemError) throw itemError;
        (items || []).forEach(item => {
            if (!item.product_id) return;
            soldMap.set(item.product_id, toNumber(soldMap.get(item.product_id)) + toNumber(item.quantity));
        });
    }

    return soldMap;
}

export async function fetchPurchaseSuggestions() {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');
    const soldMap = await fetchSoldQuantities7d();
    const baseSelect = `
            id,
            product_code,
            name,
            is_active,
            categories(name),
            product_units(id, unit_name, cost_price, retail_price, conversion_rate, is_base_unit),
            product_batches(id, stock_quantity, cost_price)
        `;
    let { data, error } = await supabaseClient
        .from('products')
        .select(`
            id,
            product_code,
            name,
            is_active,
            categories(name),
            product_units(id, unit_name, cost_price, retail_price, conversion_rate, is_base_unit),
            product_batches(id, stock_quantity, cost_price),
            supplier_id,
            suppliers(name)
        `)
        .order('name', { ascending: true });

    if (error && (error.message?.includes('supplier_id') || error.message?.includes('suppliers') || error.message?.includes('schema cache'))) {
        const fallback = await supabaseClient
            .from('products')
            .select(baseSelect)
            .order('name', { ascending: true });
        data = fallback.data;
        error = fallback.error;
    }

    if (error) throw error;

    return (data || [])
        .filter(product => product.is_active !== false)
        .map(product => normalizeProduct(product, soldMap))
        .filter(item => item.suggestedQuantity > 0 || item.sold7d > 0 || item.currentStock <= LOW_STOCK_THRESHOLD)
        .sort((a, b) => b.urgencyScore - a.urgencyScore || a.name.localeCompare(b.name, 'vi'));
}

export async function fetchUnassignedProducts() {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');
    const { data, error } = await supabaseClient
        .from('products')
        .select(`
            id,
            product_code,
            name,
            categories(name)
        `)
        .is('supplier_id', null)
        .eq('is_active', true)
        .order('name', { ascending: true });

    if (error) {
        if (error.message?.includes('supplier_id') || error.message?.includes('schema cache')) return [];
        throw error;
    }

    return (data || []).map(product => ({
        productId: product.id,
        code: product.product_code || '',
        name: product.name || 'Không rõ tên',
        category: product.categories?.name || 'Chưa phân nhóm'
    }));
}

export async function fetchSuppliers() {
    if (!supabaseClient) return [];
    const { data, error } = await supabaseClient
        .from('suppliers')
        .select('id, supplier_code, name, contact_type, contact_info, address, note, is_active')
        .order('name', { ascending: true });

    if (error) {
        if (error.message?.includes('schema cache') || error.message?.includes('suppliers')) return [];
        throw error;
    }
    return data || [];
}

export async function updateProductSupplier(productId, supplierId) {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');
    const { error } = await supabaseClient
        .from('products')
        .update({ supplier_id: supplierId || null })
        .eq('id', productId);

    if (error) {
        if (error.message?.includes('supplier_id') || error.message?.includes('schema cache')) {
            throw new Error('Chưa có cột supplier_id trong bảng products. Hãy chạy migration 008_link_products_to_suppliers.sql.');
        }
        throw error;
    }
    return true;
}

export async function fetchPurchaseOrders() {
    if (!supabaseClient) return readLocalOrders();
    const { data, error } = await supabaseClient
        .from('purchase_orders')
        .select('*, purchase_order_items(*)')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        if (error.message?.includes('schema cache') || error.message?.includes('purchase_orders')) return readLocalOrders();
        throw error;
    }
    return data || [];
}

export async function savePurchaseOrder({ supplierId, supplierName, expectedDate, note, lines, status = 'draft' }) {
    if (!Array.isArray(lines) || lines.length === 0) throw new Error('Vui lòng thêm ít nhất một mặt hàng cần đặt.');
    const normalizedLines = lines.map((line, index) => ({
        line_no: index + 1,
        product_id: line.productId || null,
        product_code: line.code || null,
        product_name: line.name,
        unit_name: normalizeUnitName(line.unitName, 'Đơn vị'),
        current_stock: toNumber(line.currentStock),
        suggested_quantity: toNumber(line.suggestedQuantity),
        ordered_quantity: toNumber(line.orderedQuantity || line.suggestedQuantity || 1),
        estimated_cost: toNumber(line.costPrice),
        last_7d_sold: toNumber(line.sold7d),
        note: line.note || null
    }));
    const totalEstimated = normalizedLines.reduce((sum, line) => sum + line.ordered_quantity * line.estimated_cost, 0);
    const orderCode = buildPurchaseOrderCode();

    if (!supabaseClient) return saveLocalOrder({ orderCode, supplierId, supplierName, expectedDate, note, status, totalEstimated, lines: normalizedLines });

    const orderPayload = {
        order_code: orderCode,
        supplier_id: supplierId || null,
        supplier_name: supplierName || null,
        status,
        expected_date: expectedDate || null,
        note: note || null,
        total_estimated: totalEstimated
    };

    const { data: order, error: orderError } = await supabaseClient
        .from('purchase_orders')
        .insert([orderPayload])
        .select('id, order_code, created_at')
        .single();

    if (orderError) {
        if (orderError.message?.includes('schema cache') || orderError.message?.includes('purchase_orders')) {
            return saveLocalOrder({ orderCode, supplierId, supplierName, expectedDate, note, status, totalEstimated, lines: normalizedLines });
        }
        throw orderError;
    }

    const itemPayloads = normalizedLines.map(line => ({ ...line, purchase_order_id: order.id }));
    const { error: itemError } = await supabaseClient
        .from('purchase_order_items')
        .insert(itemPayloads);

    if (itemError) throw itemError;

    // Tự động cập nhật nhà cung cấp mặc định cho các sản phẩm trong phiếu đặt hàng
    if (supabaseClient && supplierId) {
        try {
            const productIds = normalizedLines.map(l => l.product_id).filter(Boolean);
            if (productIds.length > 0) {
                await supabaseClient
                    .from('products')
                    .update({ supplier_id: supplierId })
                    .in('id', productIds);
            }
        } catch (updateErr) {
            console.warn('Lỗi khi tự động cập nhật nhà cung cấp cho sản phẩm:', updateErr.message);
        }
    }

    return { ...orderPayload, ...order, purchase_order_items: itemPayloads, source: 'supabase' };
}

function saveLocalOrder({ orderCode, supplierId, supplierName, expectedDate, note, status, totalEstimated, lines }) {
    const orders = readLocalOrders();
    const order = {
        id: `local-${Date.now()}`,
        order_code: orderCode,
        supplier_id: supplierId || null,
        supplier_name: supplierName || null,
        status,
        expected_date: expectedDate || null,
        note: note || null,
        total_estimated: totalEstimated,
        created_at: new Date().toISOString(),
        purchase_order_items: lines,
        source: 'local'
    };
    orders.unshift(order);
    writeLocalOrders(orders.slice(0, 50));
    return order;
}
