const { createClient } = require('@supabase/supabase-js');
const supabaseClient = createClient('https://iejgtdcdzababydaqjef.supabase.co', 'sb_publishable_AjGRJy05OUTeqEJxvhy8eg_Rck3CpU1');

const DAY_MS = 24 * 60 * 60 * 1000;
const LOW_STOCK_THRESHOLD = 10;
const POS_INVENTORY_REF_PREFIX = '[POS_ORDER:';

function toNumber(value) {
    const number = Number(value || 0);
    return Number.isFinite(number) ? number : 0;
}

function startOfDay(date) {
    const next = new Date(date);
    next.setHours(0, 0, 0, 0);
    return next;
}

function endOfDay(date) {
    const next = new Date(date);
    next.setHours(23, 59, 59, 999);
    return next;
}

function dateKey(value) {
    const d = new Date(value);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function chunk(array, size = 100) {
    const chunks = [];
    for (let index = 0; index < array.length; index += size) {
        chunks.push(array.slice(index, index + size));
    }
    return chunks;
}

function buildDateRange(customFrom = null, customTo = null) {
    const today = startOfDay(new Date());
    const yesterday = startOfDay(new Date(today.getTime() - DAY_MS));

    let from, to;
    if (customFrom) {
        from = startOfDay(new Date(customFrom));
    } else {
        from = startOfDay(new Date(today.getTime() - 6 * DAY_MS));
    }

    if (customTo) {
        to = endOfDay(new Date(customTo));
    } else {
        to = endOfDay(today);
    }

    const days = Math.round((to.getTime() - from.getTime()) / DAY_MS) || 1;
    const prevFrom = new Date(from.getTime() - days * DAY_MS);
    const prevTo = new Date(to.getTime() - days * DAY_MS);

    const keys = [];
    const currentKeys = [];
    const previousKeys = [];

    // Fill previous keys
    let current = new Date(prevFrom);
    let limit = 0;
    while (current <= prevTo && limit < 366) {
        previousKeys.push(dateKey(current));
        keys.push(dateKey(current));
        current.setTime(current.getTime() + DAY_MS);
        limit++;
    }

    // Fill current keys
    current = new Date(from);
    limit = 0;
    while (current <= to && limit < 366) {
        currentKeys.push(dateKey(current));
        keys.push(dateKey(current));
        current.setTime(current.getTime() + DAY_MS);
        limit++;
    }

    return {
        todayKey: dateKey(today),
        yesterdayKey: dateKey(yesterday),
        dateFrom: dateKey(from),
        dateTo: dateKey(to),
        fromIso: prevFrom.toISOString(),
        toIso: to.toISOString(),
        keys,
        currentKeys,
        previousKeys
    };
}

async function fetchOrders(range, orderTypeFilter = 'all') {
    let query = supabaseClient
        .from('orders')
        .select('id, order_code, customer_name, customer_phone, subtotal, discount, total, status, created_at, order_type, ecommerce_platform')
        .gte('created_at', range.fromIso)
        .lte('created_at', range.toIso);

    if (orderTypeFilter === 'ecommerce') {
        query = query.eq('order_type', 'ecommerce');
    } else if (orderTypeFilter === 'retail') {
        query = query.eq('order_type', 'retail');
    } else if (orderTypeFilter === 'internal') {
        query = query.eq('order_type', 'internal');
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
}

async function fetchShifts(range) {
    const { data, error } = await supabaseClient
        .from('employee_shifts')
        .select('*')
        .gte('shift_date', range.dateFrom)
        .lte('shift_date', range.dateTo);
    if (error) throw error;
    return data || [];
}

async function fetchInternalMovements(range) {
    const { data, error } = await supabaseClient
        .from('inventory_movements')
        .select('product_id, quantity_base, cost_price, created_at, reason, note, products(name, product_code)')
        .eq('movement_type', 'internal_use')
        .gte('created_at', range.fromIso)
        .lte('created_at', range.toIso);

    if (error) {
        console.warn('Lỗi fetch internal movements:', error.message);
        return [];
    }
    return data || [];
}

async function fetchCatalogProductsWithStock() {
    const { data, error } = await supabaseClient
        .from('products')
        .select('id, name, description, product_code, categories(name)')
        .eq('is_active', true);
    if (error) throw error;
    return data || [];
}

async function fetchRecentCompletedSalesLookback() {
    const { data, error } = await supabaseClient.rpc('fn_get_product_last_sold');
    if (error) throw error;
    return data || [];
}

async function fetchOrderItems(orderIds) {
    if (!orderIds.length) return [];
    const chunks = chunk(orderIds, 100); // FIXED HERE
    const promises = chunks.map(async (ids) => {
        const { data, error } = await supabaseClient
            .from('order_items')
            .select('id, order_id, product_id, batch_id, product_name, product_code, unit_name, unit_price, quantity, total_price, created_at, line_type, parent_order_item_id, sort_index')
            .in('order_id', ids);
        if (error) throw error;
        return data || [];
    });
    const results = await Promise.all(promises);
    return results.flat();
}

async function fetchCostLookups(items) {
    const productIds = [...new Set(items.map(item => item.product_id).filter(Boolean))];
    const batchIds = [...new Set(items.map(item => item.batch_id).filter(Boolean))];
    const unitCosts = new Map();
    const batchCosts = new Map();
    const isDoseProductMap = new Map();
    const isDoseRetailMap = new Map();
    const comboDefinitionMap = new Map();

    if (productIds.length === 0 && batchIds.length === 0) {
        return { unitCosts, batchCosts, isDoseProductMap, isDoseRetailMap, comboDefinitionMap };
    }

    const productChunks = chunk(productIds, 100); // FIXED HERE
    const batchChunks = chunk(batchIds, 100); // FIXED HERE

    const productPromises = productChunks.map(ids =>
        supabaseClient
            .from('products')
            .select('id, description, category_id, categories(name)')
            .in('id', ids)
    );
    const unitPromises = productChunks.map(ids =>
        supabaseClient
            .from('product_units')
            .select('product_id, unit_name, cost_price, conversion_rate, is_base_unit')
            .in('product_id', ids)
    );
    const batchPromises = batchChunks.map(ids =>
        supabaseClient
            .from('product_batches')
            .select('id, cost_price')
            .in('id', ids)
    );

    const productResults = await Promise.all(productPromises);
    const products = productResults.flatMap(r => r.data || []);

    products.forEach(p => {
        let isDose = false;
        let isDoseRetail = false;
        if (p.description) {
            try {
                const descObj = JSON.parse(p.description);
                isDose = descObj && descObj.is_dose_cut === true;
                isDoseRetail = descObj && descObj.is_dose_retail === true;
            } catch (e) {}
        }
        isDoseProductMap.set(p.id, isDose);
        isDoseRetailMap.set(p.id, isDoseRetail);
    });

    const unitResults = await Promise.all(unitPromises);
    const units = unitResults.flatMap(r => r.data || []);
    units.forEach(u => {
        unitCosts.set(`${u.product_id}::${u.unit_name || ''}`, u);
        if (u.is_base_unit) {
            unitCosts.set(`${u.product_id}::__base__`, u);
        }
    });

    const batchResults = await Promise.all(batchPromises);
    const batches = batchResults.flatMap(r => r.data || []);
    batches.forEach(b => {
        batchCosts.set(b.id, toNumber(b.cost_price));
    });

    return { unitCosts, batchCosts, isDoseProductMap, isDoseRetailMap, comboDefinitionMap };
}

async function fetchStockByProduct(productIds) {
    if (!productIds.length) return new Map();
    const chunks = chunk(productIds, 100); // FIXED HERE
    const promises = chunks.map(async (ids) => {
        const { data, error } = await supabaseClient
            .from('product_batches')
            .select('product_id, stock_quantity')
            .in('product_id', ids);
        if (error) throw error;
        return data || [];
    });
    const results = await Promise.all(promises);
    const stockMap = new Map();
    results.flat().forEach(b => {
        const current = stockMap.get(b.product_id) || 0;
        stockMap.set(b.product_id, current + toNumber(b.stock_quantity));
    });
    return stockMap;
}

async function test() {
    const { buildAnalytics: buildAnalyticsSummary } = await import('../js/features/reports/reportAnalyticsRules.js');
    console.log("Starting test...");
    const range = buildDateRange("2026-07-01", "2026-07-06");
    console.log("Range:", range);
    
    console.log("Fetching orders...");
    const orders = await fetchOrders(range, "all");
    console.log("Orders count:", orders.length);
    
    console.log("Fetching shifts...");
    const shiftData = await fetchShifts(range);
    console.log("Shifts count:", shiftData.length);
    
    console.log("Fetching internal movements...");
    const internalMovements = await fetchInternalMovements(range);
    
    console.log("Fetching catalog products...");
    const catalogProducts = await fetchCatalogProductsWithStock();
    
    console.log("Fetching last sold...");
    const productLastSold = await fetchRecentCompletedSalesLookback();
    
    console.log("Fetching items...");
    const items = await fetchOrderItems(orders.map(o => o.id));
    console.log("Items count:", items.length);
    
    console.log("Fetching lookups and stock...");
    const [lookups, stockByProduct] = await Promise.all([
        fetchCostLookups(items),
        fetchStockByProduct(items.map(item => item.product_id).filter(Boolean))
    ]);
    
    console.log("Building analytics...");
    const analytics = buildAnalyticsSummary(orders, items, lookups, stockByProduct, range, "all", shiftData, internalMovements);
    console.log("Done building analytics!");
}

test().catch(console.error);
