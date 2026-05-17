import { supabaseClient } from '../../core/supabase.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const LOW_STOCK_THRESHOLD = 10;

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
    return new Date(value).toISOString().slice(0, 10);
}

function chunk(array, size = 100) {
    const chunks = [];
    for (let index = 0; index < array.length; index += size) {
        chunks.push(array.slice(index, index + size));
    }
    return chunks;
}

function buildSevenDayRange() {
    const today = startOfDay(new Date());
    const yesterday = startOfDay(new Date(today.getTime() - DAY_MS));
    const from = startOfDay(new Date(today.getTime() - 6 * DAY_MS));
    const to = endOfDay(today);
    const keys = [];
    const current = new Date(from);
    while (current <= today) {
        keys.push(dateKey(current));
        current.setTime(current.getTime() + DAY_MS);
    }
    return {
        todayKey: dateKey(today),
        yesterdayKey: dateKey(yesterday),
        dateFrom: dateKey(from),
        dateTo: dateKey(today),
        fromIso: from.toISOString(),
        toIso: to.toISOString(),
        keys
    };
}

async function fetchOrders(range) {
    const { data, error } = await supabaseClient
        .from('orders')
        .select('id, order_code, customer_name, customer_phone, subtotal, discount, total, status, created_at')
        .gte('created_at', range.fromIso)
        .lte('created_at', range.toIso)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
}

async function fetchOrderItems(orderIds) {
    if (!orderIds.length) return [];
    const results = [];
    for (const ids of chunk(orderIds, 80)) {
        const { data, error } = await supabaseClient
            .from('order_items')
            .select('id, order_id, product_id, batch_id, product_name, product_code, unit_name, unit_price, quantity, total_price, created_at')
            .in('order_id', ids);
        if (error) throw error;
        results.push(...(data || []));
    }
    return results;
}

async function fetchCostLookups(items) {
    const productIds = [...new Set(items.map(item => item.product_id).filter(Boolean))];
    const batchIds = [...new Set(items.map(item => item.batch_id).filter(Boolean))];
    const unitCosts = new Map();
    const batchCosts = new Map();

    for (const ids of chunk(productIds, 80)) {
        const { data, error } = await supabaseClient
            .from('product_units')
            .select('product_id, unit_name, cost_price, conversion_rate, is_base_unit')
            .in('product_id', ids);
        if (error) throw error;
        (data || []).forEach(unit => {
            unitCosts.set(`${unit.product_id}::${unit.unit_name || ''}`, unit);
            if (unit.is_base_unit && !unitCosts.has(`${unit.product_id}::__base__`)) {
                unitCosts.set(`${unit.product_id}::__base__`, unit);
            }
        });
    }

    for (const ids of chunk(batchIds, 80)) {
        const { data, error } = await supabaseClient
            .from('product_batches')
            .select('id, cost_price')
            .in('id', ids);
        if (error) throw error;
        (data || []).forEach(batch => batchCosts.set(batch.id, toNumber(batch.cost_price)));
    }

    return { unitCosts, batchCosts };
}

async function fetchStockByProduct(productIds) {
    const stockByProduct = new Map();
    const ids = [...new Set(productIds.filter(Boolean))];
    if (!ids.length) return stockByProduct;

    for (const group of chunk(ids, 80)) {
        const { data, error } = await supabaseClient
            .from('product_batches')
            .select('product_id, stock_quantity')
            .in('product_id', group);
        if (error) throw error;
        (data || []).forEach(batch => {
            const productId = batch.product_id;
            stockByProduct.set(productId, toNumber(stockByProduct.get(productId)) + toNumber(batch.stock_quantity));
        });
    }

    return stockByProduct;
}

function estimateItemCost(item, lookups) {
    const sign = toNumber(item.total_price) < 0 ? -1 : 1;
    const quantity = Math.abs(toNumber(item.quantity));
    const unit = lookups.unitCosts.get(`${item.product_id}::${item.unit_name || ''}`)
        || lookups.unitCosts.get(`${item.product_id}::__base__`);
    const conversionRate = toNumber(unit?.conversion_rate) || 1;
    const batchCost = item.batch_id ? lookups.batchCosts.get(item.batch_id) : null;

    if (batchCost !== null && batchCost !== undefined && batchCost > 0) {
        return { cost: sign * batchCost * conversionRate * quantity, source: 'batch' };
    }

    const unitCost = toNumber(unit?.cost_price);
    if (unitCost > 0) return { cost: sign * unitCost * quantity, source: 'unit' };

    return { cost: 0, source: 'missing' };
}

function emptySummary() {
    return {
        revenue: 0,
        grossProfit: 0,
        cost: 0,
        discounts: 0,
        invoices: 0,
        cancelledOrders: 0,
        returnOrders: 0,
        averageOrder: 0,
        itemsSold: 0,
        missingCostItems: 0,
        uniqueCustomers: 0,
        customers: new Set()
    };
}

function productKey(item) {
    return item.product_id || item.product_code || item.product_name;
}

function ensureProduct(map, item) {
    const key = productKey(item);
    if (!map.has(key)) {
        map.set(key, {
            key,
            productId: item.product_id,
            code: item.product_code || '',
            name: item.product_name || 'Không rõ tên',
            unit: item.unit_name || '',
            quantity: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
            invoices: new Set(),
            missingCost: 0,
            stock: null,
            isLowStock: false
        });
    }
    return map.get(key);
}

function finalizeSummary(summary) {
    const uniqueCustomers = summary.customers instanceof Set
        ? summary.customers.size
        : toNumber(summary.uniqueCustomers);
    return {
        ...summary,
        averageOrder: summary.invoices ? summary.revenue / summary.invoices : 0,
        uniqueCustomers,
        customers: undefined
    };
}

function finalizeProducts(productMap, stockByProduct) {
    return [...productMap.values()].map(product => {
        const stock = product.productId ? stockByProduct.get(product.productId) : null;
        return {
            ...product,
            stock,
            isLowStock: stock !== null && stock !== undefined && stock <= LOW_STOCK_THRESHOLD,
            invoiceCount: product.invoices.size,
            marginRate: product.revenue ? product.profit / product.revenue : 0,
            invoices: undefined
        };
    });
}

function buildAnalytics(orders, items, lookups, stockByProduct, range) {
    const completedOrders = orders.filter(order => order.status === 'completed');
    const completedIds = new Set(completedOrders.map(order => order.id));
    const completedItems = items.filter(item => completedIds.has(item.order_id));
    const orderById = new Map(completedOrders.map(order => [order.id, order]));
    const daySummaries = new Map(range.keys.map(key => [key, emptySummary()]));
    const dayProducts = new Map(range.keys.map(key => [key, new Map()]));

    orders.forEach(order => {
        const key = dateKey(order.created_at);
        const day = daySummaries.get(key);
        if (!day) return;
        if (order.status === 'cancelled') day.cancelledOrders += 1;
        if (order.status !== 'completed') return;

        const total = toNumber(order.total);
        day.revenue += total;
        day.discounts += toNumber(order.discount);
        day.invoices += 1;
        if (total < 0) day.returnOrders += 1;
        if (order.customer_phone) day.customers.add(order.customer_phone);
    });

    completedItems.forEach(item => {
        const order = orderById.get(item.order_id);
        const key = order ? dateKey(order.created_at) : dateKey(item.created_at);
        const day = daySummaries.get(key);
        const productMapForDay = dayProducts.get(key);
        if (!day || !productMapForDay) return;

        const revenue = toNumber(item.total_price);
        const quantity = toNumber(item.quantity);
        const costMeta = estimateItemCost(item, lookups);
        const profit = revenue - costMeta.cost;

        day.cost += costMeta.cost;
        day.grossProfit += profit;
        day.itemsSold += quantity;
        if (costMeta.source === 'missing') day.missingCostItems += 1;

        const product = ensureProduct(productMapForDay, item);
        product.quantity += quantity;
        product.revenue += revenue;
        product.cost += costMeta.cost;
        product.profit += profit;
        product.invoices.add(item.order_id);
        if (costMeta.source === 'missing') product.missingCost += 1;
    });

    const daily = range.keys.map(key => {
        const summary = finalizeSummary(daySummaries.get(key));
        return {
            date: key,
            revenue: summary.revenue,
            profit: summary.grossProfit,
            invoices: summary.invoices,
            itemsSold: summary.itemsSold
        };
    });

    const todaySummary = finalizeSummary(daySummaries.get(range.todayKey));
    const yesterdaySummary = finalizeSummary(daySummaries.get(range.yesterdayKey) || emptySummary());
    const todayProducts = finalizeProducts(dayProducts.get(range.todayKey) || new Map(), stockByProduct)
        .sort((a, b) => b.quantity - a.quantity);

    return {
        summary: todaySummary,
        comparison: {
            revenueDelta: todaySummary.revenue - yesterdaySummary.revenue,
            profitDelta: todaySummary.grossProfit - yesterdaySummary.grossProfit,
            invoiceDelta: todaySummary.invoices - yesterdaySummary.invoices,
            averageOrderDelta: todaySummary.averageOrder - yesterdaySummary.averageOrder
        },
        alerts: {
            missingCostItems: todaySummary.missingCostItems,
            cancelledOrders: todaySummary.cancelledOrders,
            returnOrders: todaySummary.returnOrders,
            lowStockHotProducts: todayProducts.filter(product => product.isLowStock && product.quantity > 0).length
        },
        daily,
        productPerformance: todayProducts
    };
}

export async function fetchDashboardAnalytics() {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');
    const range = buildSevenDayRange();
    const orders = await fetchOrders(range);
    const items = await fetchOrderItems(orders.map(order => order.id));
    const lookups = await fetchCostLookups(items);
    const soldProductIds = items.map(item => item.product_id).filter(Boolean);
    const stockByProduct = await fetchStockByProduct(soldProductIds);
    return { range, ...buildAnalytics(orders, items, lookups, stockByProduct, range) };
}
