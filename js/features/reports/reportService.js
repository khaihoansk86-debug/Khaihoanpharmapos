import { supabaseClient } from '../../core/supabase.js';
import { buildOverviewShiftsByDay } from './overviewShiftService.js';
import { buildComboDefinitionMap, collectComboComponentIds, estimateComboCost } from './comboReportRules.js';
import { getDoseProductPerformanceValues, isDosePackageSaleLine, isDoseReportLine, shouldCountMissingCostForReportLine } from './doseReportRules.js?v=20260709j';
import { buildAnalytics as buildAnalyticsSummary } from './reportAnalyticsRules.js?v=20260709j';
import { parseInternalIssueNote } from '../inventory/internalIssueMetadata.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const LOW_STOCK_THRESHOLD = 10;
const POS_INVENTORY_REF_PREFIX = '[POS_ORDER:';

function isRetailPOSMovement(m, orderById) {
    const note = String(m.note || '');
    if (!note.includes(POS_INVENTORY_REF_PREFIX)) return false;
    const match = note.match(/\[POS_ORDER:([^\]]+)\]/);
    if (!match) return true;
    const orderId = match[1];
    const order = orderById.get(orderId);
    if (order && order.status === 'cancelled') return 'CANCELLED';
    if (order && order.order_type === 'internal') {
        return false;
    }
    return true;
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

function chunk(array, size = 40) {
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
    let allOrders = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
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

        const { data, error } = await query.order('created_at', { ascending: true })
                                           .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;
        if (data && data.length > 0) {
            allOrders = allOrders.concat(data);
            if (data.length < pageSize) {
                hasMore = false;
            } else {
                page++;
            }
        } else {
            hasMore = false;
        }
    }
    return allOrders;
}

async function fetchOrderItems(orderIds) {
    if (!orderIds.length) return [];
    const chunks = chunk(orderIds, 40);
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

    const productChunks = chunk(productIds, 40);
    const batchChunks = chunk(batchIds, 40);

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

    const productMetadata = [];

    productRes.forEach(({ data, error }) => {
        if (error) {
            console.warn('Lỗi tải metadata sản phẩm:', error);
            return;
        }
        productMetadata.push(...(data || []));
        (data || []).forEach(p => {
            let isDose = false;
            let isDoseRetail = false;
            if (p.description) {
                try {
                    const descObj = JSON.parse(p.description);
                    isDose = descObj && descObj.is_dose_cut === true;
                    isDoseRetail = descObj && descObj.is_dose_retail === true;
                } catch (e) { }
            }

            isDoseProductMap.set(p.id, isDose);
            isDoseRetailMap.set(p.id, isDoseRetail);
        });
    });

    buildComboDefinitionMap(productMetadata).forEach((definition, productId) => {
        comboDefinitionMap.set(productId, definition);
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

    const comboComponentIds = collectComboComponentIds(productMetadata)
        .filter(productId => !unitCosts.has(`${productId}::__base__`));
    if (comboComponentIds.length > 0) {
        const comboUnitChunks = chunk(comboComponentIds, 40);
        const extraUnitRes = await Promise.all(comboUnitChunks.map(ids =>
            supabaseClient
                .from('product_units')
                .select('product_id, unit_name, cost_price, conversion_rate, is_base_unit')
                .in('product_id', ids)
        ));
        extraUnitRes.forEach(({ data, error }) => {
            if (error) throw error;
            (data || []).forEach(unit => {
                unitCosts.set(`${unit.product_id}::${unit.unit_name || ''}`, unit);
                if (unit.is_base_unit && !unitCosts.has(`${unit.product_id}::__base__`)) {
                    unitCosts.set(`${unit.product_id}::__base__`, unit);
                }
            });
        });
    }

    batchRes.forEach(({ data, error }) => {
        if (error) throw error;
        (data || []).forEach(batch => batchCosts.set(batch.id, toNumber(batch.cost_price)));
    });

    return { unitCosts, batchCosts, isDoseProductMap, isDoseRetailMap, comboDefinitionMap };
}

async function fetchStockByProduct(productIds) {
    const stockByProduct = new Map();
    const ids = [...new Set(productIds.filter(Boolean))];
    if (!ids.length) return stockByProduct;

    const chunks = chunk(ids, 40);
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

async function fetchRecentCompletedSalesLookback() {
    if (!supabaseClient) return [];
    const { data, error } = await supabaseClient.rpc('fn_get_product_last_sold');
    if (error) {
        console.warn('Lỗi gọi rpc fn_get_product_last_sold, fallback rỗng:', error);
        return [];
    }
    return data || [];
}

function estimateItemCost(item, lookups) {
    const sign = toNumber(item.total_price) < 0 ? -1 : 1;
    const comboCost = estimateComboCost({
        item,
        comboDefinitionMap: lookups.comboDefinitionMap,
        unitCosts: lookups.unitCosts,
        sign
    });
    if (comboCost) return comboCost;

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
        retailItemsSold: 0,

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
        doseIngredientPOSCost: 0,
        doseIngredientInternalCost: 0,
        doseProfit: 0,
        doseItemsSold: 0
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
    if (product?.description) {
        try {
            const descObj = JSON.parse(product.description);
            return descObj && descObj.is_dose_cut === true;
        } catch (error) {}
    }
    return false;
}

function buildBusinessInsights(rangeProducts, catalogProducts, productLastSold, isDoseProductMap = new Map(), orderTypeFilter = 'all') {
    const performanceById = new Map(rangeProducts.filter(product => product.productId).map(product => [product.productId, product]));
    const lastSoldByProduct = new Map((productLastSold || []).map(p => [p.product_id, p.last_sold_at]));

    // Lọc catalog theo loại tab
    // - retail: chỉ sản phẩm không phải dose
    // - dose_cut: chỉ sản phẩm dose
    // - ecommerce: tất cả (vì ecommerce bán cả hàng thường)
    // - all: tất cả (loại dose ra cho insights tồn kho)
    let catalogFilter;
    if (orderTypeFilter === 'dose_cut') {
        catalogFilter = product => isDoseCatalogProduct(product);
    } else if (orderTypeFilter === 'retail') {
        catalogFilter = product => !isDoseCatalogProduct(product);
    } else {
        // all / ecommerce: giữ logic cũ (loại dose ra)
        catalogFilter = product => !isDoseCatalogProduct(product);
    }

    const catalog = (catalogProducts || [])
        .filter(catalogFilter)
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

    // highProfitProducts: lấy từ rangeProducts (đã được lọc theo tab từ buildAnalytics)
    // Không cần lọc thêm vì rangeProducts đã chỉ chứa sản phẩm đúng tab
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
            .filter(product => product.profit > 0)
            .sort((a, b) => b.profit - a.profit || b.revenue - a.revenue)
            .slice(0, 12)
    };
}

function buildDoseInsights(summary, internalMovements, catalogProducts, orderById = new Map()) {
    const catalogById = new Map((catalogProducts || []).map(product => [product.id, product]));
    const materialMap = new Map();

    (internalMovements || []).forEach(movement => {
        if (movement.reason !== 'dose_cutting' && movement.reason !== 'cắt liều thuốc') return;
        if (isRetailPOSMovement(movement, orderById)) return;
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
        const issuedQty = -toNumber(movement.quantity_base);
        entry.quantityBase += issuedQty;
        entry.cost += issuedQty * toNumber(movement.cost_price);
        if (issuedQty > 0) entry.cutCount += 1;
    });

    const materials = [...materialMap.values()]
        .filter(item => item.quantityBase > 0 || item.cost > 0)
        .sort((a, b) => b.quantityBase - a.quantityBase || b.cost - a.cost);

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

    const completedOrders = orders.filter(order => order.status === 'completed');
    const completedIds = new Set(completedOrders.map(order => order.id));
    let completedItems = items.filter(item => completedIds.has(item.order_id));

    const allDoseOrderIds = new Set(
        items.filter(item => {
            // A dose order can be ingredient-only: revenue stays 0, but cost must
            // still be reported as dose ingredient cost.
            return isDoseReportLine(item, lookups);
        }).map(item => item.order_id)
    );

    if (orderTypeFilter === 'dose_cut') {
        completedItems = completedItems.filter(item => allDoseOrderIds.has(item.order_id));
        const doseOrderIds = new Set(completedItems.map(item => item.order_id));
        const filteredCompletedOrders = completedOrders.filter(order => doseOrderIds.has(order.id));
        const filteredCompletedIds = new Set(filteredCompletedOrders.map(order => order.id));
        completedIds.clear();
        filteredCompletedIds.forEach(id => completedIds.add(id));
    }

    // Tab Tổng hợp (all): chỉ lấy retail + dose (bỏ ecommerce, internal)
    const USE_ALL_TAB = orderTypeFilter === 'all';
    if (USE_ALL_TAB) {
        const retailAndDoseIds = new Set(
            completedOrders
                .filter(o => o.order_type === 'retail' || allDoseOrderIds.has(o.id))
                .map(o => o.id)
        );
        completedItems = completedItems.filter(item => retailAndDoseIds.has(item.order_id));
        const newCompletedIds = new Set(retailAndDoseIds);
        completedIds.clear();
        retailAndDoseIds.forEach(id => completedIds.add(id));
    }

    const orderById = new Map(completedOrders.filter(order => completedIds.has(order.id)).map(order => [order.id, order]));
    const allOrdersById = new Map(orders.map(o => [o.id, o]));
    const daySummaries = new Map(range.keys.map(key => [key, emptySummary()]));
    const dayProducts = new Map(range.keys.map(key => [key, new Map()]));
    const dayDoseIngredients = new Map(range.keys.map(key => [key, new Map()]));
    const platformsSummary = new Map();
    const internalIssuesList = [];
    const internalIssuesSummary = {
        totalCost: 0,
        totalItems: 0,
        byReason: new Map(),
        byTarget: new Map()
    };

    const relevantCompletedOrders = completedOrders.filter(order => completedIds.has(order.id));

    buildOverviewShiftsByDay({
        keys: range.keys,
        shiftData,
        orders: relevantCompletedOrders
    }).forEach((dayShifts, key) => shiftsByDay.set(key, dayShifts));

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
            const discount = toNumber(order.discount);
            day.discounts += discount;
            day.invoices += 1;
            if (total < 0) day.returnOrders += 1;

            if (allDoseOrderIds.has(order.id)) {
                // Đơn hàng thuốc liều: giảm trừ doanh thu & lợi nhuận gộp mảng cắt liều
                day.revenue -= discount;
                day.dosePackageRevenue -= discount;
                day.grossProfit -= discount;
            } else {
                // Đơn bán lẻ thường: cộng hóa đơn bán lẻ và giảm trừ mảng bán lẻ
                day.retailInvoices += 1;
                day.revenue -= discount;
                day.retailRevenue -= discount;
                day.grossProfit -= discount;
                day.retailProfit -= discount;
            }
            // Overview revenue is calculated from orders/items. Employee shift sales stay isolated in employee_shifts.
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
        if (item.line_type === 'combo_component') return;
        const order = orderById.get(item.order_id);
        const key = order ? dateKey(order.created_at) : dateKey(item.created_at);
        const day = daySummaries.get(key);
        const productMapForDay = dayProducts.get(key);
        const doseIngredientMapForDay = dayDoseIngredients.get(key);
        if (!day || !productMapForDay || !doseIngredientMapForDay) return;

        const revenue = toNumber(item.total_price);
        const quantity = toNumber(item.quantity);
        const costMeta = estimateItemCost(item, lookups);
        const profit = revenue - costMeta.cost;

        // Xác định loại sản phẩm để lọc bảng sản phẩm theo tab
        const isDosePackage = lookups.isDoseProductMap?.get(item.product_id) === true;
        const isDoseRetailPackage = lookups.isDoseRetailMap?.get(item.product_id) === true;
        const isDoseOrderItem = allDoseOrderIds.has(item.order_id);
        const isDosePackageSale = isDosePackageSaleLine(item, lookups, isDoseOrderItem, revenue);
        const isEcommerceOrder = order && order.order_type === 'ecommerce';
        const isInternalOrder = order && order.order_type === 'internal';

        const isDoseIngredient = isDosePackage === true && !isDoseRetailPackage;

        if (orderTypeFilter === 'dose_cut' && !isDosePackageSale && !isDoseIngredient) {
            return;
        }

        if (isInternalOrder) {
            // Chi phí internal sẽ được tính qua internalMovements để tránh đúp và phân tách lý do
        } else if (isEcommerceOrder) {
            day.ecommerceProfit += profit;
            day.ecommerceItemsSold += quantity;
            day.ecommerceCost += costMeta.cost;
        } else {
            // retail / dose_cut / all
            if (isDosePackageSale) {
                // "Bán lẻ thuốc liều": doanh thu → dosePackageRevenue, KHÔNG tính vào retailRevenue
                day.dosePackageRevenue += revenue;
                day.revenue += revenue;
                day.grossProfit += revenue; // Cost will be accounted by the ingredients below
                day.itemsSold += quantity; // Number of doses
                day.doseItemsSold = (day.doseItemsSold || 0) + quantity;
            } else if (isDoseIngredient) {
                // Nguyên liệu thuốc liều xuất bằng giá vốn
                day.doseIngredientCost += costMeta.cost;
                day.doseIngredientPOSCost = (day.doseIngredientPOSCost || 0) + costMeta.cost;
                day.cost += costMeta.cost;
                day.grossProfit -= costMeta.cost;
            } else if (isDosePackage) {
                // This is a raw dose ingredient sold directly (not as a price-0 ingredient in a dose cut order)
                day.revenue += revenue;
                day.retailRevenue += revenue;
                if (orderTypeFilter !== 'all') {
                    day.retailProfit += revenue;
                }
                day.grossProfit += revenue;
                day.itemsSold += quantity;
            } else {
                // Hàng bán lẻ thường
                day.retailRevenue += revenue;
                day.retailCost += costMeta.cost;
                day.retailProfit += profit;
                day.revenue += revenue;
                day.cost += costMeta.cost;
                day.itemsSold += quantity;
                day.retailItemsSold = (day.retailItemsSold || 0) + quantity;
                day.grossProfit += profit;
            }
        }

        if (shouldCountMissingCostForReportLine({ costSource: costMeta.source, isDosePackageSale })) {
            day.missingCostItems += 1;
        }

        if (isDoseIngredient) {
            const ingredientProduct = ensureProduct(doseIngredientMapForDay, item);
            ingredientProduct.quantity += quantity;
            ingredientProduct.cost += costMeta.cost;
            ingredientProduct.profit -= costMeta.cost;
            ingredientProduct.invoices.add(item.order_id);
            if (costMeta.source === 'missing') ingredientProduct.missingCost += 1;
        }

        // Lọc sản phẩm vào bảng hiệu suất theo tab đang chọn
        let includeInProductTable = true;
        if (orderTypeFilter === 'retail') {
            if (isDosePackage || isDoseRetailPackage || isEcommerceOrder || isInternalOrder) includeInProductTable = false;
        } else if (orderTypeFilter === 'dose_cut') {
            // Trong tab dose_cut, chỉ hiển thị gói liều chính, không hiển thị nguyên liệu thành phần (đã bán giá 0đ)
            if (!isDosePackageSale) includeInProductTable = false;
        } else if (orderTypeFilter === 'ecommerce') {
            if (!isEcommerceOrder) includeInProductTable = false;
        } else if (orderTypeFilter === 'all') {
            if (isEcommerceOrder || isInternalOrder) includeInProductTable = false;
        }

        if (includeInProductTable) {
            const performanceValues = getDoseProductPerformanceValues({
                revenue,
                cost: costMeta.cost,
                profit,
                isDosePackageSale
            });
            const product = ensureProduct(productMapForDay, item);
            product.quantity += quantity;
            product.revenue += revenue;
            product.cost += performanceValues.cost;
            product.profit += performanceValues.profit;
            product.invoices.add(item.order_id);
            if (shouldCountMissingCostForReportLine({ costSource: costMeta.source, isDosePackageSale })) product.missingCost += 1;
        }
    });

    // Phân bổ chi phí từ phiếu xuất nội bộ theo lý do
    // CHỈ tính cho dose section riêng, KHÔNG trừ vào retail profit
    internalMovements.forEach(m => {
        const key = dateKey(m.created_at);
        const day = daySummaries.get(key);
        if (!day) return;
        const isPOSLinkedMovement = isRetailPOSMovement(m, allOrdersById);

        const issuedQty = -toNumber(m.quantity_base);
        const cost = issuedQty * toNumber(m.cost_price);
        if (m.reason === 'dose_cutting' || m.reason === 'cắt liều thuốc') {
            if (isPOSLinkedMovement) return;
            day.doseIngredientCost += cost;
            day.doseIngredientInternalCost = (day.doseIngredientInternalCost || 0) + cost;
            day.grossProfit -= cost;

            const ingredientMap = dayDoseIngredients.get(key);
            if (ingredientMap) {
                const movementItem = {
                    product_id: m.product_id,
                    product_name: m.products?.name || 'Nguyên liệu thuốc liều',
                    product_code: m.products?.product_code || '',
                    unit_name: '',
                    quantity: issuedQty,
                    total_price: 0
                };
                const ingredientProduct = ensureProduct(ingredientMap, movementItem);
                ingredientProduct.quantity += issuedQty;
                ingredientProduct.cost += cost;
                ingredientProduct.profit -= cost;
                if (issuedQty > 0) ingredientProduct.invoices.add(`movement-${m.created_at}-${m.product_id || ''}`);
                if (toNumber(m.cost_price) <= 0 && issuedQty > 0) {
                    ingredientProduct.missingCost += 1;
                    day.missingCostItems += 1;
                }
            }
                    return;
        } else if (!isPOSLinkedMovement) {
            day.internalExpense += cost;
            // Các lý do xuất dùng nội bộ khác: trừ vào lợi nhuận tổng (không trừ vào retailProfit)
            day.grossProfit -= cost;
        }

        // Add to internal issues list if within current range keys
        if (range.currentKeys.includes(key) && !isPOSLinkedMovement) {
            const parsedNote = parseInternalIssueNote(m.note);
            const reason = m.reason || 'other';
            const targetName = parsedNote.targetName || parsedNote.targetLabel || 'Không xác định';

            internalIssuesList.push({
                date: key,
                productName: m.products?.name || 'Sản phẩm không rõ',
                productCode: m.products?.product_code || '',
                quantity: issuedQty,
                costPrice: toNumber(m.cost_price),
                totalCost: cost,
                reason,
                targetName,
                rawNote: parsedNote.rawNote
            });

            internalIssuesSummary.totalCost += cost;
            internalIssuesSummary.totalItems += issuedQty;

            internalIssuesSummary.byReason.set(reason, (internalIssuesSummary.byReason.get(reason) || 0) + cost);
            internalIssuesSummary.byTarget.set(targetName, (internalIssuesSummary.byTarget.get(targetName) || 0) + cost);
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
            agg.retailInvoices += toNumber(day.retailInvoices);

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
            agg.doseIngredientPOSCost += toNumber(day.doseIngredientPOSCost || 0);
            agg.doseIngredientInternalCost += toNumber(day.doseIngredientInternalCost || 0);
            agg.doseItemsSold += toNumber(day.doseItemsSold || 0);
            agg.retailItemsSold += toNumber(day.retailItemsSold || 0);

            if (day.customers instanceof Set) {
                day.customers.forEach(c => agg.customers.add(c));
            }
        });
        return finalizeSummary(agg);
    }

    daySummaries.forEach((day, key) => {
        const dayShifts = shiftsByDay.get(key) || [];
        const shiftsTotal = dayShifts.reduce((sum, s) => sum + s.revenue, 0);
        const totalRevenueForTab = orderTypeFilter === 'dose_cut' 
            ? (day.dosePackageRevenue || 0) 
            : (orderTypeFilter === 'ecommerce' 
                ? (day.ecommerceRevenue || 0) 
                : (orderTypeFilter === 'all' ? (day.revenue || 0) : (day.retailRevenue || 0)));
        day.unscheduledRetailRevenue = Math.max(0, totalRevenueForTab - shiftsTotal);
    });

    const daily = range.currentKeys.map(key => {
        const summary = finalizeSummary(daySummaries.get(key));
        const dayShifts = shiftsByDay.get(key) || [];
        return {
            date: key,
            revenue: orderTypeFilter === 'ecommerce' ? summary.ecommerceCost : summary.revenue,
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
            doseIngredientPOSCost: summary.doseIngredientPOSCost || 0,
            doseIngredientInternalCost: summary.doseIngredientInternalCost || 0,
            doseProfit: summary.doseProfit,
            retailItemsSold: summary.retailItemsSold
        };
    });

    const currentSummary = aggregateSummaries(daySummaries, range.currentKeys);
    const previousSummary = aggregateSummaries(daySummaries, range.previousKeys);

    const rangeProductMap = new Map();
    const rangeDoseIngredientMap = new Map();
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

        const ingredientMap = dayDoseIngredients.get(key);
        if (!ingredientMap) return;
        ingredientMap.forEach((product, pKey) => {
            if (!rangeDoseIngredientMap.has(pKey)) {
                rangeDoseIngredientMap.set(pKey, {
                    ...product,
                    invoices: new Set(product.invoices)
                });
            } else {
                const existing = rangeDoseIngredientMap.get(pKey);
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
    const rangeDoseIngredients = finalizeProducts(rangeDoseIngredientMap, stockByProduct)
        .filter(product => Math.abs(toNumber(product.quantity)) > 0 || Math.abs(toNumber(product.cost)) > 0 || product.missingCost > 0)
        .sort((a, b) => b.cost - a.cost || b.quantity - a.quantity);

    // Gắn thông tin chu kỳ trước để so sánh
    let currentDoseItemsSold = 0;
    let previousDoseItemsSold = 0;
    completedItems.forEach(item => {
        if (item.line_type === 'combo_component') return;
        const order = orderById.get(item.order_id);
        const key = order ? dateKey(order.created_at) : dateKey(item.created_at);
        const isDosePackage = lookups.isDoseProductMap?.get(item.product_id) === true || lookups.isDoseRetailMap?.get(item.product_id) === true;
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

    // Tab Tổng hợp (all): chỉ dùng yesterday retail (không dùng ecommerce)
    if (orderTypeFilter === 'all') {
        currentSummary.yesterdayRetailRevenue = previousSummary.retailRevenue || 0;
        currentSummary.yesterdayRetailCost = previousSummary.retailCost || 0;
        currentSummary.yesterdayRetailProfit = previousSummary.retailProfit || 0;
        currentSummary.yesterdayRetailInvoices = previousSummary.retailInvoices || 0;
        currentSummary.yesterdayItemsSold = previousSummary.itemsSold || 0;
        currentSummary.yesterdayRetailItemsSold = previousSummary.retailItemsSold || 0;
        currentSummary.yesterdayDosePackageRevenue = previousSummary.dosePackageRevenue || 0;
        currentSummary.yesterdayDoseIngredientCost = previousSummary.doseIngredientCost || 0;
    } else {
        currentSummary.yesterdayRetailRevenue = previousSummary.retailRevenue || 0;
        currentSummary.yesterdayRetailCost = previousSummary.retailCost || 0;
        currentSummary.yesterdayEcommerceRevenue = previousSummary.ecommerceRevenue || 0;
        currentSummary.yesterdayEcommerceCost = previousSummary.ecommerceCost || 0;
        currentSummary.yesterdayEcommerceProfit = previousSummary.ecommerceProfit || 0;
        currentSummary.yesterdayInternalExpense = previousSummary.internalExpense || 0;
        currentSummary.yesterdayRetailProfit = previousSummary.retailProfit || 0;
        currentSummary.yesterdayEcommerceItemsSold = previousSummary.ecommerceItemsSold || 0;
        currentSummary.yesterdayEcommerceInvoices = previousSummary.ecommerceInvoices || 0;
        currentSummary.yesterdayRetailInvoices = previousSummary.retailInvoices || 0;
        currentSummary.yesterdayInvoices = previousSummary.invoices || 0;
        currentSummary.yesterdayItemsSold = previousSummary.itemsSold || 0;
        currentSummary.yesterdayRetailItemsSold = previousSummary.retailItemsSold || 0;
    }

    return {
        summary: currentSummary,
        comparison: {
            revenueDelta: orderTypeFilter === 'dose_cut'
                ? ((currentSummary.dosePackageRevenue || 0) - (previousSummary.dosePackageRevenue || 0))
                : (currentSummary.revenue - previousSummary.revenue),
            profitDelta: orderTypeFilter === 'dose_cut'
                ? ((currentSummary.doseProfit || 0) - (previousSummary.doseProfit || 0))
                : (currentSummary.grossProfit - previousSummary.grossProfit),
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
        doseIngredientPerformance: rangeDoseIngredients,
        platformsPerformance: [...platformsSummary.values()].sort((a, b) => b.revenue - a.revenue),
        internalIssuesList: internalIssuesList.sort((a, b) => b.date.localeCompare(a.date) || b.totalCost - a.totalCost),
        internalIssuesSummary: {
            totalCost: internalIssuesSummary.totalCost,
            totalItems: internalIssuesSummary.totalItems,
            byReason: [...internalIssuesSummary.byReason.entries()].map(([k, v]) => ({ label: k, value: v })).sort((a, b) => b.value - a.value),
            byTarget: [...internalIssuesSummary.byTarget.entries()].map(([k, v]) => ({ label: k, value: v })).sort((a, b) => b.value - a.value)
        }
    };
}

async function fetchInternalMovements(range) {
    if (!supabaseClient) return [];
    const { data: documents, error: documentError } = await supabaseClient
        .from('inventory_documents')
        .select(`
            id,
            confirmed_at,
            status,
            note,
            inventory_document_items(
                product_id,
                quantity_base,
                cost_price,
                reason,
                note,
                products(name, product_code)
            )
        `)
        .eq('document_type', 'internal_use')
        .neq('status', 'cancelled')
        .gte('confirmed_at', range.fromIso)
        .lte('confirmed_at', range.toIso);

    if (!documentError) {
        return (documents || []).flatMap(doc => (doc.inventory_document_items || [])
            .filter(item => Number(item.quantity_base || 0) < 0)
            .map(item => ({
                product_id: item.product_id,
                quantity_base: item.quantity_base,
                cost_price: item.cost_price,
                created_at: doc.confirmed_at,
                reason: item.reason,
                note: [doc.note, item.note].filter(Boolean).join(' '),
                products: item.products
            })));
    }

    console.warn('Không tải được phiếu xuất nội bộ, thử fallback movements:', documentError.message);
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

export async function fetchDashboardAnalytics(orderTypeFilter = 'all', dateFrom = null, dateTo = null) {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');
    const range = buildDateRange(dateFrom, dateTo);

    // Tải song song các dữ liệu ban đầu
    const [orders, shiftData, internalMovements, catalogProducts, productLastSold] = await Promise.all([
        fetchOrders(range, orderTypeFilter),
        fetchShifts(range),
        fetchInternalMovements(range),
        fetchCatalogProductsWithStock(),
        fetchRecentCompletedSalesLookback()
    ]);

    // Tải items của các đơn hàng
    const items = await fetchOrderItems(orders.map(order => order.id));

    // Tải song song metadata chi phí và số lượng tồn kho của các sản phẩm bán ra
    const soldProductIds = [
        ...items.map(item => item.product_id).filter(Boolean),
        ...internalMovements.map(movement => movement.product_id).filter(Boolean)
    ];
    const [lookups, stockByProduct] = await Promise.all([
        fetchCostLookups(items),
        fetchStockByProduct(soldProductIds)
    ]);

    const analytics = buildAnalyticsSummary(orders, items, lookups, stockByProduct, range, orderTypeFilter, shiftData, internalMovements);
    analytics.businessInsights = buildBusinessInsights(
        analytics.productPerformance,
        catalogProducts,
        productLastSold,
        lookups.isDoseProductMap,
        orderTypeFilter
    );
    const orderById = new Map((orders || []).map(o => [o.id, o]));
    analytics.doseInsights = buildDoseInsights(analytics.summary, internalMovements, catalogProducts, orderById);
    return { range, ...analytics };
}



