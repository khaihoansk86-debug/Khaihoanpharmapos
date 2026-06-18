import { supabaseClient } from '../../core/supabase.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const LOW_STOCK_THRESHOLD = 10;

function getLocalTimeSeconds(dateStr) {
    const d = new Date(dateStr);
    return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
}

function normalizeTimeToSeconds(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map(Number);
    const hrs = parts[0] || 0;
    const mins = parts[1] || 0;
    const secs = parts[2] || 0;
    return hrs * 3600 + mins * 60 + secs;
}

function isTimeInInterval(timeSec, startSec, endSec) {
    if (endSec >= startSec) {
        return timeSec >= startSec && timeSec < endSec;
    } else {
        // Ca qua dem (vi du 22h dem hom nay den 6h sang hom sau)
        return timeSec >= startSec || timeSec < endSec;
    }
}

async function fetchShifts(range) {
    if (!supabaseClient) return [];
    const { data, error } = await supabaseClient
        .from('employee_shifts')
        .select('*')
        .gte('shift_date', range.dateFrom)
        .lte('shift_date', range.dateTo);
    if (error) {
        console.warn('Không tải được lịch ca từ Supabase, thử local storage:', error);
        try {
            if (typeof localStorage !== 'undefined') {
                return JSON.parse(localStorage.getItem('khp_employee_shifts') || '[]')
                    .filter(item => item.shift_date >= range.dateFrom && item.shift_date <= range.dateTo);
            }
        } catch {
            return [];
        }
    }
    return data || [];
}


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

async function fetchOrderItems(orderIds) {
    if (!orderIds.length) return [];
    const chunks = chunk(orderIds, 500);
    const promises = chunks.map(async (ids) => {
        const { data, error } = await supabaseClient
            .from('order_items')
            .select('id, order_id, product_id, batch_id, product_name, product_code, unit_name, unit_price, quantity, total_price, created_at')
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

    if (productIds.length === 0 && batchIds.length === 0) {
        return { unitCosts, batchCosts, isDoseProductMap };
    }

    const productChunks = chunk(productIds, 500);
    const batchChunks = chunk(batchIds, 500);

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

    const [productRes, unitRes, batchRes] = await Promise.all([
        Promise.all(productPromises),
        Promise.all(unitPromises),
        Promise.all(batchPromises)
    ]);

    productRes.forEach(({ data, error }) => {
        if (error) {
            console.warn('Lỗi tải metadata sản phẩm:', error);
            return;
        }
        (data || []).forEach(p => {
            let isDose = false;
            if (p.description) {
                try {
                    const descObj = JSON.parse(p.description);
                    isDose = descObj && descObj.is_dose_cut === true;
                } catch(e) {}
            }
            const catName = p.categories?.name || '';
            if (catName.toLowerCase().includes('cắt liều') || catName.toLowerCase().includes('thuốc liều')) {
                isDose = true;
            }
            isDoseProductMap.set(p.id, isDose);
        });
    });

    unitRes.forEach(({ data, error }) => {
        if (error) throw error;
        (data || []).forEach(unit => {
            unitCosts.set(`${unit.product_id}::${unit.unit_name || ''}`, unit);
            if (unit.is_base_unit && !unitCosts.has(`${unit.product_id}::__base__`)) {
                unitCosts.set(`${unit.product_id}::__base__`, unit);
            }
        });
    });

    batchRes.forEach(({ data, error }) => {
        if (error) throw error;
        (data || []).forEach(batch => batchCosts.set(batch.id, toNumber(batch.cost_price)));
    });

    return { unitCosts, batchCosts, isDoseProductMap };
}

async function fetchStockByProduct(productIds) {
    const stockByProduct = new Map();
    const ids = [...new Set(productIds.filter(Boolean))];
    if (!ids.length) return stockByProduct;

    const chunks = chunk(ids, 500);
    const promises = chunks.map(async (group) => {
        const { data, error } = await supabaseClient
            .from('product_batches')
            .select('product_id, stock_quantity')
            .in('product_id', group);
        if (error) throw error;
        return data || [];
    });

    const results = await Promise.all(promises);
    results.flat().forEach(batch => {
        const productId = batch.product_id;
        stockByProduct.set(productId, toNumber(stockByProduct.get(productId)) + toNumber(batch.stock_quantity));
    });

    return stockByProduct;
}

async function fetchCatalogProductsWithStock() {
    if (!supabaseClient) return [];
    const { data, error } = await supabaseClient
        .from('products')
        .select(`
            id,
            name,
            product_code,
            description,
            categories(name),
            product_units(unit_name, retail_price, cost_price, is_base_unit),
            product_batches(stock_quantity)
        `);
    if (error) throw error;
    return data || [];
}

async function fetchRecentCompletedSalesLookback(days = 120) {
    if (!supabaseClient) return { orders: [], items: [] };
    const from = new Date(Date.now() - days * DAY_MS).toISOString();
    const { data: orders, error: orderError } = await supabaseClient
        .from('orders')
        .select('id, created_at, status, order_type')
        .gte('created_at', from)
        .eq('status', 'completed')
        .or('order_type.eq.retail,order_type.is.null')
        .order('created_at', { ascending: false });
    if (orderError) throw orderError;

    const orderIds = (orders || []).map(order => order.id);
    const items = await fetchOrderItems(orderIds);
    return { orders: orders || [], items };
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
        retailRevenue: 0,
        retailProfit: 0,
        retailInvoices: 0,
        
        ecommerceRevenue: 0,
        ecommerceProfit: 0,
        ecommerceCost: 0,
        ecommerceInvoices: 0,
        ecommerceItemsSold: 0,
        
        internalExpense: 0,
        
        revenue: 0,
        grossProfit: 0,
        cost: 0,
        retailCost: 0,
        discounts: 0,
        invoices: 0,
        cancelledOrders: 0,
        returnOrders: 0,
        averageOrder: 0,
        itemsSold: 0,
        missingCostItems: 0,
        uniqueCustomers: 0,
        customers: new Set(),
        unscheduledRetailRevenue: 0,
        
        dosePackageRevenue: 0,
        doseIngredientCost: 0,
        doseProfit: 0
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

function finalizeSummary(summary = emptySummary()) {
    const safeSummary = summary || emptySummary();
    const uniqueCustomers = safeSummary.customers instanceof Set
        ? safeSummary.customers.size
        : toNumber(safeSummary.uniqueCustomers);
    return {
        ...safeSummary,
        averageOrder: safeSummary.invoices ? safeSummary.revenue / safeSummary.invoices : 0,
        uniqueCustomers,
        doseProfit: (safeSummary.dosePackageRevenue || 0) - (safeSummary.doseIngredientCost || 0),
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

function isDoseCatalogProduct(product) {
    let isDose = false;
    if (product?.description) {
        try {
            const descObj = JSON.parse(product.description);
            isDose = descObj && descObj.is_dose_cut === true;
        } catch (error) {
            isDose = false;
        }
    }
    const catName = product?.categories?.name || '';
    if (catName.toLowerCase().includes('cắt liều') || catName.toLowerCase().includes('thuốc liều')) {
        isDose = true;
    }
    return isDose;
}

function buildBusinessInsights(rangeProducts, catalogProducts, lookbackOrders, lookbackItems, isDoseProductMap = new Map()) {
    const performanceById = new Map(rangeProducts.filter(product => product.productId).map(product => [product.productId, product]));
    const lastSoldByProduct = new Map();
    const orderDateById = new Map((lookbackOrders || []).map(order => [order.id, order.created_at]));

    (lookbackItems || []).forEach(item => {
        if (!item.product_id) return;
        if (isDoseProductMap.get(item.product_id) === true) return;
        const soldAt = orderDateById.get(item.order_id) || item.created_at;
        if (!soldAt) return;
        const current = lastSoldByProduct.get(item.product_id);
        if (!current || new Date(soldAt) > new Date(current)) {
            lastSoldByProduct.set(item.product_id, soldAt);
        }
    });

    const catalog = (catalogProducts || [])
        .filter(product => !isDoseCatalogProduct(product))
        .map(product => {
        const baseUnit = (product.product_units || []).find(unit => unit.is_base_unit) || product.product_units?.[0] || {};
        const stock = (product.product_batches || []).reduce((sum, batch) => sum + toNumber(batch.stock_quantity), 0);
        const perf = performanceById.get(product.id);
        const lastSoldAt = lastSoldByProduct.get(product.id) || null;
        const daysSinceLastSold = lastSoldAt ? Math.floor((Date.now() - new Date(lastSoldAt).getTime()) / DAY_MS) : null;
        return {
            productId: product.id,
            code: product.product_code || '',
            name: product.name || 'Không rõ tên',
            unit: baseUnit.unit_name || '',
            stock,
            quantity: toNumber(perf?.quantity),
            revenue: toNumber(perf?.revenue),
            profit: toNumber(perf?.profit),
            marginRate: toNumber(perf?.marginRate),
            lastSoldAt,
            daysSinceLastSold
        };
    });

    return {
        lowStockHotProducts: catalog
            .filter(product => product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD && product.quantity > 0)
            .sort((a, b) => b.quantity - a.quantity || a.stock - b.stock)
            .slice(0, 12),
        slowMovingProducts: catalog
            .filter(product => product.stock > LOW_STOCK_THRESHOLD && product.quantity <= 2)
            .sort((a, b) => a.quantity - b.quantity || b.stock - a.stock)
            .slice(0, 12),
        staleProducts: catalog
            .filter(product => product.stock > 0 && (product.daysSinceLastSold === null || product.daysSinceLastSold >= 30))
            .sort((a, b) => (b.daysSinceLastSold || 9999) - (a.daysSinceLastSold || 9999))
            .slice(0, 12),
        highProfitProducts: [...rangeProducts]
            .filter(product => isDoseProductMap.get(product.productId) !== true)
            .filter(product => product.profit > 0)
            .sort((a, b) => b.profit - a.profit || b.revenue - a.revenue)
            .slice(0, 12)
    };
}

function buildDoseInsights(summary, internalMovements, catalogProducts) {
    const catalogById = new Map((catalogProducts || []).map(product => [product.id, product]));
    const materialMap = new Map();

    (internalMovements || []).forEach(movement => {
        if (movement.reason !== 'dose_cutting' && movement.reason !== 'cắt liều thuốc') return;
        const productId = movement.product_id || `unknown-${movement.created_at}`;
        const catalog = catalogById.get(movement.product_id) || {};
        const key = productId;
        if (!materialMap.has(key)) {
            materialMap.set(key, {
                productId: movement.product_id,
                name: catalog.name || 'Nguyên liệu không rõ tên',
                code: catalog.product_code || '',
                quantityBase: 0,
                cost: 0,
                cutCount: 0
            });
        }
        const entry = materialMap.get(key);
        entry.quantityBase += Math.abs(toNumber(movement.quantity_base));
        entry.cost += Math.abs(toNumber(movement.quantity_base)) * toNumber(movement.cost_price);
        entry.cutCount += 1;
    });

    const materials = [...materialMap.values()].sort((a, b) => b.quantityBase - a.quantityBase || b.cost - a.cost);

    return {
        revenue: toNumber(summary?.dosePackageRevenue),
        ingredientCost: toNumber(summary?.doseIngredientCost),
        profit: toNumber(summary?.doseProfit),
        heavyCutMaterials: materials.slice(0, 8),
        lightCutMaterials: [...materials]
            .filter(item => item.quantityBase > 0)
            .sort((a, b) => a.quantityBase - b.quantityBase || a.cost - b.cost)
            .slice(0, 8)
    };
}

function buildAnalytics(orders, items, lookups, stockByProduct, range, orderTypeFilter = 'all', shiftData = [], internalMovements = []) {
    const shiftsByDay = new Map();
    shiftData.forEach(shift => {
        if (shift.status !== 'worked') return;
        const date = shift.shift_date;
        if (!shiftsByDay.has(date)) {
            shiftsByDay.set(date, []);
        }
        const dayShifts = shiftsByDay.get(date);
        const exists = dayShifts.some(s => 
            s.name === shift.shift_name && 
            s.start_time === shift.start_time && 
            s.end_time === shift.end_time
        );
        if (!exists) {
            dayShifts.push({
                name: shift.shift_name,
                start_time: shift.start_time,
                end_time: shift.end_time,
                revenue: 0
            });
        }
    });

    shiftsByDay.forEach(dayShifts => {
        dayShifts.sort((a, b) => {
            const timeA = a.start_time || '00:00:00';
            const timeB = b.start_time || '00:00:00';
            return timeA.localeCompare(timeB);
        });
    });

    const completedOrders = orders.filter(order => order.status === 'completed');
    const completedIds = new Set(completedOrders.map(order => order.id));
    let completedItems = items.filter(item => completedIds.has(item.order_id));

    const allDoseOrderIds = new Set(items.filter(item => lookups.isDoseProductMap?.get(item.product_id) === true).map(item => item.order_id));

    if (orderTypeFilter === 'dose_cut') {
        completedItems = completedItems.filter(item => lookups.isDoseProductMap?.get(item.product_id) === true);
        const doseOrderIds = new Set(completedItems.map(item => item.order_id));
        const filteredCompletedOrders = completedOrders.filter(order => doseOrderIds.has(order.id));
        const filteredCompletedIds = new Set(filteredCompletedOrders.map(order => order.id));
        completedIds.clear();
        filteredCompletedIds.forEach(id => completedIds.add(id));
    }

    const orderById = new Map(completedOrders.filter(order => completedIds.has(order.id)).map(order => [order.id, order]));
    const daySummaries = new Map(range.keys.map(key => [key, emptySummary()]));
    const dayProducts = new Map(range.keys.map(key => [key, new Map()]));
    const platformsSummary = new Map();

    let activeOrders = orders;
    if (orderTypeFilter === 'dose_cut') {
        activeOrders = orders.filter(order => allDoseOrderIds.has(order.id));
    }

    activeOrders.forEach(order => {
        const key = dateKey(order.created_at);
        const day = daySummaries.get(key);
        if (!day) return;
        if (order.status === 'cancelled') day.cancelledOrders += 1;
        if (order.status !== 'completed') return;

        const total = toNumber(order.total);
        if (order.order_type === 'internal') {
            if (orderTypeFilter === 'internal') {
                day.revenue += total;
                day.invoices += 1;
                if (total < 0) day.returnOrders += 1;
            }
        } else if (order.order_type === 'ecommerce') {
            day.ecommerceRevenue += total;
            day.ecommerceInvoices += 1;
            if (total < 0) day.returnOrders += 1;
        } else {
            // retail / dose_cut
            if (orderTypeFilter === 'dose_cut') {
                day.retailInvoices += 1;
                day.invoices += 1;
                if (total < 0) day.returnOrders += 1;
            } else {
                day.retailInvoices += 1;
                day.invoices += 1;
                day.discounts += toNumber(order.discount);
                day.revenue -= toNumber(order.discount);
                day.retailRevenue -= toNumber(order.discount);
                day.grossProfit -= toNumber(order.discount);
                day.retailProfit -= toNumber(order.discount);
                if (total < 0) day.returnOrders += 1;
            }

            // Phân bổ doanh thu cho ca làm việc
            const dayShifts = shiftsByDay.get(key) || [];
            if (dayShifts.length > 0) {
                const orderTimeSec = getLocalTimeSeconds(order.created_at);
                let matched = false;
                for (const shift of dayShifts) {
                    const startSec = normalizeTimeToSeconds(shift.start_time);
                    const endSec = normalizeTimeToSeconds(shift.end_time);
                    if (isTimeInInterval(orderTimeSec, startSec, endSec)) {
                        shift.revenue = (shift.revenue || 0) + total;
                        matched = true;
                        break;
                    }
                }
                if (!matched) {
                    day.unscheduledRetailRevenue = (day.unscheduledRetailRevenue || 0) + total;
                }
            } else {
                day.unscheduledRetailRevenue = (day.unscheduledRetailRevenue || 0) + total;
            }
        }
        if (order.customer_phone) day.customers.add(order.customer_phone);

        if (order.order_type === 'ecommerce' && order.ecommerce_platform) {
            const platform = order.ecommerce_platform;
            if (!platformsSummary.has(platform)) {
                platformsSummary.set(platform, { name: platform, revenue: 0, orders: 0 });
            }
            const pStat = platformsSummary.get(platform);
            pStat.revenue += total;
            pStat.orders += 1;
        }
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

        if (order && order.order_type === 'internal') {
            // Chi phí internal sẽ được tính qua internalMovements để tránh đúp và phân tách lý do
        } else if (order && order.order_type === 'ecommerce') {
            day.ecommerceProfit += profit;
            day.ecommerceItemsSold += quantity;
            day.ecommerceCost += costMeta.cost;
        } else {
            // retail / dose_cut
            const isDosePackage = lookups.isDoseProductMap?.get(item.product_id) === true;
            if (isDosePackage) {
                day.dosePackageRevenue += revenue;
                day.revenue += revenue;
                day.retailRevenue += revenue;
                day.retailProfit += revenue; // Cost is subtracted in internalMovements
                day.grossProfit += revenue;
                day.itemsSold += quantity;
            } else {
                day.retailRevenue += revenue;
                day.retailCost += costMeta.cost;
                day.retailProfit += profit;
                day.revenue += revenue;
                day.cost += costMeta.cost;
                day.itemsSold += quantity;
                day.grossProfit += profit;
            }
        }

        if (costMeta.source === 'missing') day.missingCostItems += 1;

        const product = ensureProduct(productMapForDay, item);
        product.quantity += quantity;
        product.revenue += revenue;
        product.cost += costMeta.cost;
        product.profit += profit;
        product.invoices.add(item.order_id);
        if (costMeta.source === 'missing') product.missingCost += 1;
    });

    // Phân bổ chi phí từ phiếu xuất nội bộ theo lý do
    internalMovements.forEach(m => {
        const key = dateKey(m.created_at);
        const day = daySummaries.get(key);
        if (!day) return;

        const cost = Math.abs(toNumber(m.quantity_base)) * toNumber(m.cost_price);
        day.internalExpense += cost;
        
        if (m.reason === 'dose_cutting' || m.reason === 'cắt liều thuốc') {
            day.doseIngredientCost += cost;
            if (orderTypeFilter === 'all' || orderTypeFilter === 'retail' || orderTypeFilter === 'dose_cut') {
                day.cost += cost;
                day.retailCost += cost;
                day.retailProfit -= cost;
                day.grossProfit -= cost;
            }
        } else {
            // Lý do khác: Hao hụt, dùng nội bộ, hỏng vỡ...
            // Tính vào phần âm doanh thu offline (bán lẻ) theo yêu cầu
            if (orderTypeFilter === 'all' || orderTypeFilter === 'retail') {
                day.retailRevenue -= cost;
                day.revenue -= cost;
                day.retailProfit -= cost;
                day.grossProfit -= cost;
            }
        }
    });

    function aggregateSummaries(daySummaries, keys) {
        const agg = emptySummary();
        keys.forEach(key => {
            const day = daySummaries.get(key);
            if (!day) return;
            agg.retailRevenue += toNumber(day.retailRevenue);
            agg.retailProfit += toNumber(day.retailProfit);
            agg.retailCost += toNumber(day.retailCost);
            
            agg.ecommerceRevenue += toNumber(day.ecommerceRevenue);
            agg.ecommerceProfit += toNumber(day.ecommerceProfit);
            agg.ecommerceCost += toNumber(day.ecommerceCost);
            agg.ecommerceItemsSold += toNumber(day.ecommerceItemsSold);
            
            agg.internalExpense += toNumber(day.internalExpense);
            
            agg.revenue += toNumber(day.revenue);
            agg.grossProfit += toNumber(day.grossProfit);
            agg.cost += toNumber(day.cost);
            agg.discounts += toNumber(day.discounts);
            agg.invoices += toNumber(day.invoices);
            agg.cancelledOrders += toNumber(day.cancelledOrders);
            agg.returnOrders += toNumber(day.returnOrders);
            agg.itemsSold += toNumber(day.itemsSold);
            agg.missingCostItems += toNumber(day.missingCostItems);
            
            agg.unscheduledRetailRevenue += toNumber(day.unscheduledRetailRevenue);
            agg.dosePackageRevenue += toNumber(day.dosePackageRevenue);
            agg.doseIngredientCost += toNumber(day.doseIngredientCost);
            
            if (day.customers instanceof Set) {
                day.customers.forEach(c => agg.customers.add(c));
            }
        });
        return finalizeSummary(agg);
    }

    const daily = range.currentKeys.map(key => {
        const summary = finalizeSummary(daySummaries.get(key));
        const dayShifts = shiftsByDay.get(key) || [];
        return {
            date: key,
            revenue: summary.revenue,
            retailRevenue: summary.retailRevenue,
            ecommerceRevenue: summary.ecommerceRevenue,
            profit: summary.grossProfit,
            retailProfit: summary.retailProfit,
            invoices: summary.invoices,
            itemsSold: summary.itemsSold,
            shifts: dayShifts.map(s => ({
                name: s.name,
                start_time: s.start_time,
                end_time: s.end_time,
                revenue: s.revenue
            })),
            unscheduledRetailRevenue: summary.unscheduledRetailRevenue || 0,
            dosePackageRevenue: summary.dosePackageRevenue,
            doseIngredientCost: summary.doseIngredientCost,
            doseProfit: summary.doseProfit
        };
    });

    const currentSummary = aggregateSummaries(daySummaries, range.currentKeys);
    const previousSummary = aggregateSummaries(daySummaries, range.previousKeys);

    const rangeProductMap = new Map();
    range.currentKeys.forEach(key => {
        const dayMap = dayProducts.get(key);
        if (!dayMap) return;
        dayMap.forEach((product, pKey) => {
            if (!rangeProductMap.has(pKey)) {
                rangeProductMap.set(pKey, {
                    ...product,
                    invoices: new Set(product.invoices)
                });
            } else {
                const existing = rangeProductMap.get(pKey);
                existing.quantity += product.quantity;
                existing.revenue += product.revenue;
                existing.cost += product.cost;
                existing.profit += product.profit;
                existing.missingCost += product.missingCost;
                if (product.invoices instanceof Set) {
                    product.invoices.forEach(invId => existing.invoices.add(invId));
                }
            }
        });
    });

    const rangeProducts = finalizeProducts(rangeProductMap, stockByProduct)
        .sort((a, b) => b.quantity - a.quantity);

    // Gắn thông tin chu kỳ trước để so sánh
    let currentDoseItemsSold = 0;
    let previousDoseItemsSold = 0;
    completedItems.forEach(item => {
        const order = orderById.get(item.order_id);
        const key = order ? dateKey(order.created_at) : dateKey(item.created_at);
        const isDosePackage = lookups.isDoseProductMap?.get(item.product_id) === true;
        if (isDosePackage) {
            if (range.currentKeys.includes(key)) {
                currentDoseItemsSold += Math.abs(toNumber(item.quantity));
            } else if (range.previousKeys.includes(key)) {
                previousDoseItemsSold += Math.abs(toNumber(item.quantity));
            }
        }
    });
    currentSummary.doseItemsSold = currentDoseItemsSold;
    currentSummary.yesterdayDoseItemsSold = previousDoseItemsSold;

    currentSummary.yesterdayRetailRevenue = previousSummary.retailRevenue || 0;
    currentSummary.yesterdayEcommerceRevenue = previousSummary.ecommerceRevenue || 0;
    currentSummary.yesterdayEcommerceCost = previousSummary.ecommerceCost || 0;
    currentSummary.yesterdayInternalExpense = previousSummary.internalExpense || 0;
    currentSummary.yesterdayRetailProfit = previousSummary.retailProfit || 0;
    currentSummary.yesterdayEcommerceItemsSold = previousSummary.ecommerceItemsSold || 0;
    currentSummary.yesterdayRetailInvoices = previousSummary.retailInvoices || 0;
    currentSummary.yesterdayInvoices = previousSummary.invoices || 0;
    currentSummary.yesterdayItemsSold = previousSummary.itemsSold || 0;

    return {
        summary: currentSummary,
        comparison: {
            revenueDelta: currentSummary.revenue - previousSummary.revenue,
            profitDelta: currentSummary.grossProfit - previousSummary.grossProfit,
            invoiceDelta: currentSummary.invoices - previousSummary.invoices,
            averageOrderDelta: currentSummary.averageOrder - previousSummary.averageOrder
        },
        alerts: {
            missingCostItems: currentSummary.missingCostItems,
            cancelledOrders: currentSummary.cancelledOrders,
            returnOrders: currentSummary.returnOrders,
            lowStockHotProducts: rangeProducts.filter(product => product.isLowStock && product.quantity > 0).length
        },
        daily,
        productPerformance: rangeProducts,
        platformsPerformance: [...platformsSummary.values()].sort((a, b) => b.revenue - a.revenue)
    };
}

async function fetchInternalMovements(range) {
    if (!supabaseClient) return [];
    const { data, error } = await supabaseClient
        .from('inventory_movements')
        .select('product_id, quantity_base, cost_price, created_at, reason')
        .eq('movement_type', 'internal_use')
        .gte('created_at', range.fromIso)
        .lte('created_at', range.toIso);

    if (error) {
        console.warn('Lỗi fetch internal movements:', error.message);
        return [];
    }
    return data || [];
}

export async function fetchDashboardAnalytics(orderTypeFilter = 'all', dateFrom = null, dateTo = null) {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');
    const range = buildDateRange(dateFrom, dateTo);
    
    // Tải song song các dữ liệu ban đầu
    const [orders, shiftData, internalMovements, catalogProducts, lookbackSales] = await Promise.all([
        fetchOrders(range, orderTypeFilter),
        fetchShifts(range),
        fetchInternalMovements(range),
        fetchCatalogProductsWithStock(),
        fetchRecentCompletedSalesLookback()
    ]);
    
    // Tải items của các đơn hàng
    const items = await fetchOrderItems(orders.map(order => order.id));
    
    // Tải song song metadata chi phí và số lượng tồn kho của các sản phẩm bán ra
    const soldProductIds = items.map(item => item.product_id).filter(Boolean);
    const [lookups, stockByProduct] = await Promise.all([
        fetchCostLookups(items),
        fetchStockByProduct(soldProductIds)
    ]);
    
    const analytics = buildAnalytics(orders, items, lookups, stockByProduct, range, orderTypeFilter, shiftData, internalMovements);
    analytics.businessInsights = buildBusinessInsights(
        analytics.productPerformance,
        catalogProducts,
        lookbackSales.orders,
        lookbackSales.items,
        lookups.isDoseProductMap
    );
    analytics.doseInsights = buildDoseInsights(analytics.summary, internalMovements, catalogProducts);
    return { range, ...analytics };
}
