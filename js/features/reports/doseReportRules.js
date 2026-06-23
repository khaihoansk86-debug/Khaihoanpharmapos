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
    const isDoseProduct = lookups.isDoseProductMap?.get(productId) === true;
    const isDoseRetailPackage = lookups.isDoseRetailMap?.get(productId) === true
        || productCode.startsWith('DOSE-');

    return isDoseRetailPackage || (isDoseOrderItem && isDoseProduct && Number(revenue || 0) > 0);
}
