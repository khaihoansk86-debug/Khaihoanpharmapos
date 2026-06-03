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
    
    const keys = [];
    const current = new Date(from);
    let limit = 0;
    while (current <= to && limit < 366) {
        keys.push(dateKey(current));
        current.setTime(current.getTime() + DAY_MS);
        limit++;
    }
    
    return {
        todayKey: dateKey(today),
        yesterdayKey: dateKey(yesterday),
        dateFrom: dateKey(from),
        dateTo: dateKey(to),
        fromIso: from.toISOString(),
        toIso: to.toISOString(),
        keys
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
    const isDoseProductMap = new Map();

    for (const ids of chunk(productIds, 80)) {
        try {
            const { data: products, error: prodErr } = await supabaseClient
                .from('products')
                .select('id, description, category_id, categories(name)')
                .in('id', ids);
            if (!prodErr && products) {
                products.forEach(p => {
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
            }
        } catch (e) {
            console.warn('Lỗi tải metadata sản phẩm trong fetchCostLookups:', e);
        }

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

    return { unitCosts, batchCosts, isDoseProductMap };
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

function finalizeSummary(summary) {
    const uniqueCustomers = summary.customers instanceof Set
        ? summary.customers.size
        : toNumber(summary.uniqueCustomers);
    return {
        ...summary,
        averageOrder: summary.invoices ? summary.revenue / summary.invoices : 0,
        uniqueCustomers,
        doseProfit: (summary.dosePackageRevenue || 0) - (summary.doseIngredientCost || 0),
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
    const completedItems = items.filter(item => completedIds.has(item.order_id));
    const orderById = new Map(completedOrders.map(order => [order.id, order]));
    const daySummaries = new Map(range.keys.map(key => [key, emptySummary()]));
    const dayProducts = new Map(range.keys.map(key => [key, new Map()]));
    const platformsSummary = new Map();

    orders.forEach(order => {
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
            day.retailInvoices += 1;
            day.invoices += 1;
            day.discounts += toNumber(order.discount);
            day.revenue -= toNumber(order.discount);
            day.retailRevenue -= toNumber(order.discount);
            day.grossProfit -= toNumber(order.discount);
            day.retailProfit -= toNumber(order.discount);
            if (total < 0) day.returnOrders += 1;

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
            if (orderTypeFilter === 'all' || orderTypeFilter === 'retail') {
                day.cost += cost;
                day.grossProfit -= cost;
            }
        } else {
            // Lý do khác: Hao hụt, dùng nội bộ, hỏng vỡ...
            // Tính vào phần âm doanh thu offline (bán lẻ)
            if (orderTypeFilter === 'all' || orderTypeFilter === 'retail') {
                day.retailCost += cost;
                day.retailProfit -= cost;
                day.cost += cost;
                day.grossProfit -= cost;
            }
        }
    });

    const daily = range.keys.map(key => {
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

    const todaySummary = finalizeSummary(daySummaries.get(range.todayKey));
    const yesterdaySummary = finalizeSummary(daySummaries.get(range.yesterdayKey) || emptySummary());
    const todayProducts = finalizeProducts(dayProducts.get(range.todayKey) || new Map(), stockByProduct)
        .sort((a, b) => b.quantity - a.quantity);

    // Gắn thông tin hôm qua để frontend so sánh
    todaySummary.yesterdayRetailRevenue = yesterdaySummary.retailRevenue || 0;
    todaySummary.yesterdayEcommerceRevenue = yesterdaySummary.ecommerceRevenue || 0;
    todaySummary.yesterdayEcommerceCost = yesterdaySummary.ecommerceCost || 0;
    todaySummary.yesterdayInternalExpense = yesterdaySummary.internalExpense || 0;
    todaySummary.yesterdayRetailProfit = yesterdaySummary.retailProfit || 0;
    todaySummary.yesterdayEcommerceItemsSold = yesterdaySummary.ecommerceItemsSold || 0;

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
        productPerformance: todayProducts,
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
    const orders = await fetchOrders(range, orderTypeFilter);
    const items = await fetchOrderItems(orders.map(order => order.id));
    const lookups = await fetchCostLookups(items);
    const soldProductIds = items.map(item => item.product_id).filter(Boolean);
    const stockByProduct = await fetchStockByProduct(soldProductIds);
    const shiftData = await fetchShifts(range);
    const internalMovements = await fetchInternalMovements(range);
    return { range, ...buildAnalytics(orders, items, lookups, stockByProduct, range, orderTypeFilter, shiftData, internalMovements) };
}
