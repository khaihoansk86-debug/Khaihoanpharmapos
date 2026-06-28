import { buildOverviewShiftsByDay } from './overviewShiftService.js';
import { estimateComboCost } from './comboReportRules.js';
import {
    getDoseProductPerformanceValues,
    isDosePackageSaleLine,
    isDoseReportLine,
    shouldCountMissingCostForReportLine
} from './doseReportRules.js';

const LOW_STOCK_THRESHOLD = 10;
const POS_INVENTORY_REF_PREFIX = '[POS_ORDER:';

function toNumber(value) {
    const number = Number(value || 0);
    return Number.isFinite(number) ? number : 0;
}

function dateKey(value) {
    const d = new Date(value);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
            name: item.product_name || 'Khong ro ten',
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

export function buildAnalytics(orders, items, lookups, stockByProduct, range, orderTypeFilter = 'all', shiftData = [], internalMovements = []) {
    const shiftsByDay = new Map();
    const completedOrders = orders.filter(order => order.status === 'completed');
    const completedIds = new Set(completedOrders.map(order => order.id));
    let completedItems = items.filter(item => completedIds.has(item.order_id));

    const allDoseOrderIds = new Set(
        items.filter(item => isDoseReportLine(item, lookups)).map(item => item.order_id)
    );

    if (orderTypeFilter === 'dose_cut') {
        completedItems = completedItems.filter(item => allDoseOrderIds.has(item.order_id));
        const doseOrderIds = new Set(completedItems.map(item => item.order_id));
        const filteredCompletedOrders = completedOrders.filter(order => doseOrderIds.has(order.id));
        const filteredCompletedIds = new Set(filteredCompletedOrders.map(order => order.id));
        completedIds.clear();
        filteredCompletedIds.forEach(id => completedIds.add(id));
    }

    const useAllTab = orderTypeFilter === 'all';
    if (useAllTab) {
        const retailAndDoseIds = new Set(
            completedOrders
                .filter(order => order.order_type === 'retail' || allDoseOrderIds.has(order.id))
                .map(order => order.id)
        );
        completedItems = completedItems.filter(item => retailAndDoseIds.has(item.order_id));
        completedIds.clear();
        retailAndDoseIds.forEach(id => completedIds.add(id));
    }

    const orderById = new Map(completedOrders.filter(order => completedIds.has(order.id)).map(order => [order.id, order]));
    const daySummaries = new Map(range.keys.map(key => [key, emptySummary()]));
    const dayProducts = new Map(range.keys.map(key => [key, new Map()]));
    const dayDoseIngredients = new Map(range.keys.map(key => [key, new Map()]));
    const platformsSummary = new Map();

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
            const discount = toNumber(order.discount);
            day.discounts += discount;
            day.invoices += 1;
            if (total < 0) day.returnOrders += 1;

            if (allDoseOrderIds.has(order.id)) {
                day.revenue -= discount;
                day.dosePackageRevenue -= discount;
                day.grossProfit -= discount;
            } else {
                day.retailInvoices += 1;
                day.revenue -= discount;
                day.retailRevenue -= discount;
                day.grossProfit -= discount;
                day.retailProfit -= discount;
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
        const isDosePackage = lookups.isDoseProductMap?.get(item.product_id) === true;
        const isDoseRetailPackage = lookups.isDoseRetailMap?.get(item.product_id) === true
            || (item.product_code && item.product_code.startsWith('DOSE-'));
        const isDoseOrderItem = allDoseOrderIds.has(item.order_id);
        const isDosePackageSale = isDosePackageSaleLine(item, lookups, isDoseOrderItem, revenue);
        const isEcommerceOrder = order && order.order_type === 'ecommerce';
        const isInternalOrder = order && order.order_type === 'internal';
        const isDoseIngredient = isDosePackage === true && !isDoseRetailPackage;

        if (orderTypeFilter === 'dose_cut' && !isDosePackageSale && !isDoseIngredient) return;

        if (isInternalOrder) {
        } else if (isEcommerceOrder) {
            day.ecommerceProfit += profit;
            day.ecommerceItemsSold += quantity;
            day.ecommerceCost += costMeta.cost;
        } else {
            if (isDosePackageSale) {
                day.dosePackageRevenue += revenue;
                day.revenue += revenue;
                day.grossProfit += revenue;
                day.itemsSold += quantity;
                day.doseItemsSold = (day.doseItemsSold || 0) + quantity;
            } else if (isDoseIngredient) {
                day.doseIngredientCost += costMeta.cost;
                day.doseIngredientPOSCost = (day.doseIngredientPOSCost || 0) + costMeta.cost;
                day.cost += costMeta.cost;
                day.grossProfit -= costMeta.cost;
            } else if (isDosePackage) {
                day.revenue += revenue;
                day.retailRevenue += revenue;
                if (orderTypeFilter !== 'all') day.retailProfit += revenue;
                day.grossProfit += revenue;
                day.itemsSold += quantity;
            } else {
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

        let includeInProductTable = true;
        if (orderTypeFilter === 'retail') {
            if (isDosePackage || isDoseRetailPackage || isEcommerceOrder || isInternalOrder) includeInProductTable = false;
        } else if (orderTypeFilter === 'dose_cut') {
            if (!isDosePackageSale) includeInProductTable = false;
        } else if (orderTypeFilter === 'ecommerce') {
            if (!isEcommerceOrder) includeInProductTable = false;
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
            if (shouldCountMissingCostForReportLine({ costSource: costMeta.source, isDosePackageSale })) {
                product.missingCost += 1;
            }
        }
    });

    internalMovements.forEach(movement => {
        const key = dateKey(movement.created_at);
        const day = daySummaries.get(key);
        if (!day) return;
        const isPOSLinkedMovement = String(movement.note || '').includes(POS_INVENTORY_REF_PREFIX);
        const issuedQty = -toNumber(movement.quantity_base);
        const cost = issuedQty * toNumber(movement.cost_price);
        if (!isPOSLinkedMovement) day.internalExpense += cost;

        if (movement.reason === 'dose_cutting' || movement.reason === 'cáº¯t liá»u thuá»‘c') {
            if (isPOSLinkedMovement) return;
            day.doseIngredientCost += cost;
            day.doseIngredientInternalCost = (day.doseIngredientInternalCost || 0) + cost;
            day.grossProfit -= cost;

            const ingredientMap = dayDoseIngredients.get(key);
            if (ingredientMap) {
                const movementItem = {
                    product_id: movement.product_id,
                    product_name: movement.products?.name || 'Nguyen lieu thuoc lieu',
                    product_code: movement.products?.product_code || '',
                    unit_name: '',
                    quantity: issuedQty,
                    total_price: 0
                };
                const ingredientProduct = ensureProduct(ingredientMap, movementItem);
                ingredientProduct.quantity += issuedQty;
                ingredientProduct.cost += cost;
                ingredientProduct.profit -= cost;
                if (issuedQty > 0) ingredientProduct.invoices.add(`movement-${movement.created_at}-${movement.product_id || ''}`);
                if (toNumber(movement.cost_price) <= 0 && issuedQty > 0) {
                    ingredientProduct.missingCost += 1;
                    day.missingCostItems += 1;
                }
            }
        } else {
            day.retailProfit -= cost;
            day.grossProfit -= cost;
        }
    });

    daySummaries.forEach((day, key) => {
        const dayShifts = shiftsByDay.get(key) || [];
        const shiftsTotal = dayShifts.reduce((sum, shift) => sum + toNumber(shift.revenue), 0);
        const totalRevenueForTab = orderTypeFilter === 'dose_cut'
            ? toNumber(day.dosePackageRevenue || 0)
            : (orderTypeFilter === 'ecommerce'
                ? toNumber(day.ecommerceRevenue || 0)
                : (orderTypeFilter === 'all'
                    ? toNumber(day.revenue || 0)
                    : toNumber(day.retailRevenue || 0)));
        day.unscheduledRetailRevenue = Math.max(0, totalRevenueForTab - shiftsTotal);
    });

    function aggregateSummaries(summariesByDay, keys) {
        const agg = emptySummary();
        keys.forEach(key => {
            const day = summariesByDay.get(key);
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
            agg.doseIngredientPOSCost += toNumber(day.doseIngredientPOSCost);
            agg.doseIngredientInternalCost += toNumber(day.doseIngredientInternalCost);
            agg.doseItemsSold += toNumber(day.doseItemsSold);
            if (day.customers instanceof Set) {
                day.customers.forEach(customer => agg.customers.add(customer));
            }
            agg.retailItemsSold += toNumber(day.retailItemsSold);
            agg.ecommerceInvoices += toNumber(day.ecommerceInvoices);
        });
        return finalizeSummary(agg);
    }

    const currentSummary = aggregateSummaries(daySummaries, range.currentKeys);
    const previousSummary = aggregateSummaries(daySummaries, range.previousKeys);

    const daily = range.currentKeys.map(key => {
        const day = finalizeSummary(daySummaries.get(key));
        const dayShifts = shiftsByDay.get(key) || [];
        return {
            key,
            date: key,
            revenue: orderTypeFilter === 'dose_cut'
                ? (day.dosePackageRevenue || 0)
                : (orderTypeFilter === 'all' ? (day.revenue || 0) : (day.retailRevenue || 0)),
            retailRevenue: day.retailRevenue,
            ecommerceRevenue: day.ecommerceRevenue,
            retailCost: day.retailCost,
            profit: day.grossProfit,
            invoices: day.invoices,
            itemsSold: day.itemsSold,
            cancelledOrders: day.cancelledOrders,
            returnOrders: day.returnOrders,
            shifts: dayShifts.map(shift => ({
                name: shift.name,
                start_time: shift.start_time,
                end_time: shift.end_time,
                revenue: shift.revenue
            })),
            unscheduledRetailRevenue: day.unscheduledRetailRevenue || 0,
            dosePackageRevenue: day.dosePackageRevenue,
            doseIngredientCost: day.doseIngredientCost,
            doseIngredientPOSCost: day.doseIngredientPOSCost || 0,
            doseIngredientInternalCost: day.doseIngredientInternalCost || 0,
            doseProfit: day.doseProfit,
            retailItemsSold: day.retailItemsSold
        };
    });

    const rangeProductMap = new Map();
    const rangeDoseIngredientMap = new Map();
    range.currentKeys.forEach(key => {
        const productMap = dayProducts.get(key) || new Map();
        productMap.forEach(product => {
            const existing = rangeProductMap.get(product.key) || {
                ...product,
                invoices: new Set()
            };
            existing.quantity += product.quantity;
            existing.revenue += product.revenue;
            existing.cost += product.cost;
            existing.profit += product.profit;
            existing.missingCost += product.missingCost;
            product.invoices.forEach(invoiceId => existing.invoices.add(invoiceId));
            rangeProductMap.set(product.key, existing);
        });

        const ingredientMap = dayDoseIngredients.get(key) || new Map();
        ingredientMap.forEach(product => {
            const existing = rangeDoseIngredientMap.get(product.key) || {
                ...product,
                invoices: new Set()
            };
            existing.quantity += product.quantity;
            existing.revenue += product.revenue;
            existing.cost += product.cost;
            existing.profit += product.profit;
            existing.missingCost += product.missingCost;
            product.invoices.forEach(invoiceId => existing.invoices.add(invoiceId));
            rangeDoseIngredientMap.set(product.key, existing);
        });
    });

    const rangeProducts = finalizeProducts(rangeProductMap, stockByProduct).sort((a, b) => b.quantity - a.quantity);
    const rangeDoseIngredients = finalizeProducts(rangeDoseIngredientMap, stockByProduct)
        .filter(product => Math.abs(toNumber(product.quantity)) > 0 || Math.abs(toNumber(product.cost)) > 0 || product.missingCost > 0)
        .sort((a, b) => b.cost - a.cost || b.quantity - a.quantity);

    let currentDoseItemsSold = 0;
    let previousDoseItemsSold = 0;
    completedItems.forEach(item => {
        if (item.line_type === 'combo_component') return;
        const order = orderById.get(item.order_id);
        const key = order ? dateKey(order.created_at) : dateKey(item.created_at);
        const isDosePackage = lookups.isDoseProductMap?.get(item.product_id) === true || lookups.isDoseRetailMap?.get(item.product_id) === true;
        if (isDosePackage) {
            if (range.currentKeys.includes(key)) currentDoseItemsSold += Math.abs(toNumber(item.quantity));
            else if (range.previousKeys.includes(key)) previousDoseItemsSold += Math.abs(toNumber(item.quantity));
        }
    });
    currentSummary.doseItemsSold = currentDoseItemsSold;
    currentSummary.yesterdayDoseItemsSold = previousDoseItemsSold;

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
        platformsPerformance: [...platformsSummary.values()].sort((a, b) => b.revenue - a.revenue)
    };
}
