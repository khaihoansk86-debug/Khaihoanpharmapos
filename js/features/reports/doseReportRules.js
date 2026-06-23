export function isDoseReportLine(item = {}, lookups = {}) {
    const productId = item.product_id;
    const productCode = String(item.product_code || item.code || '');

    return lookups.isDoseProductMap?.get(productId) === true
        || lookups.isDoseRetailMap?.get(productId) === true
        || productCode.startsWith('DOSE-');
}

export function isDosePackageSaleLine(item = {}, lookups = {}, isDoseOrderItem = false, revenue = 0) {
    const productId = item.product_id;
    const productCode = String(item.product_code || item.code || '');
    const isDoseRetailPackage = lookups.isDoseRetailMap?.get(productId) === true
        || productCode.startsWith('DOSE-');

    return isDoseRetailPackage;
}

export function getDoseProductPerformanceValues({ revenue = 0, cost = 0, profit = 0, isDosePackageSale = false } = {}) {
    if (isDosePackageSale) {
        return {
            cost: 0,
            profit: Number(revenue || 0)
        };
    }

    return {
        cost: Number(cost || 0),
        profit: Number(profit || 0)
    };
}

export function shouldCountMissingCostForReportLine({ costSource = '', isDosePackageSale = false } = {}) {
    return costSource === 'missing' && isDosePackageSale !== true;
}
