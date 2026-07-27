function numberValue(value) {
    const number = Number(value || 0);
    return Number.isFinite(number) ? number : 0;
}

function unitKey(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLocaleLowerCase('vi-VN');
}

export function displayUnitName(value) {
    const key = unitKey(value);
    if (key === 'vien') return 'Viên';
    if (key === 'vi' || key === 'vĩ') return 'Vỉ';
    if (key === 'goi') return 'Gói';
    if (key === 'hop') return 'Hộp';
    if (key === 'chai') return 'Chai';
    const text = String(value || '').trim();
    return text ? text.charAt(0).toLocaleUpperCase('vi-VN') + text.slice(1) : 'Đơn vị';
}

export function getProductBaseUnit(product = {}) {
    return (product.product_units || []).find(unit => unit.is_base_unit)
        || (product.product_units || []).find(unit => numberValue(unit.conversion_rate) === 1)
        || product.product_units?.[0]
        || {};
}

export function getProductStock(product = {}) {
    return (product.product_batches || []).reduce(
        (sum, batch) => sum + numberValue(batch.stock_quantity),
        0
    );
}

export function buildParentProductSummary(parent = {}, variants = []) {
    const stockByUnitMap = new Map();
    const priceByUnitMap = new Map();
    let inStockSkuCount = 0;
    let zeroCostBatchCount = 0;
    let missingPackagingCount = 0;

    variants.forEach(variant => {
        const baseUnit = getProductBaseUnit(variant);
        const unitName = displayUnitName(baseUnit.unit_name);
        const stock = getProductStock(variant);
        if (stock > 0) inStockSkuCount += 1;
        stockByUnitMap.set(unitName, (stockByUnitMap.get(unitName) || 0) + stock);

        const retailPrice = numberValue(baseUnit.retail_price);
        if (retailPrice > 0) {
            if (!priceByUnitMap.has(unitName)) priceByUnitMap.set(unitName, []);
            priceByUnitMap.get(unitName).push(retailPrice);
        }

        if (!String(variant.packaging_spec || '').trim()) missingPackagingCount += 1;
        zeroCostBatchCount += (variant.product_batches || []).filter(
            batch => numberValue(batch.stock_quantity) > 0 && numberValue(batch.cost_price) <= 0
        ).length;
    });

    const parentStock = getProductStock(parent);
    const stockByUnit = [...stockByUnitMap.entries()].map(([unitName, quantity]) => ({
        unitName,
        quantity
    }));
    const priceByUnit = [...priceByUnitMap.entries()].map(([unitName, prices]) => ({
        unitName,
        min: Math.min(...prices),
        max: Math.max(...prices)
    }));

    const warnings = [];
    if (zeroCostBatchCount > 0) warnings.push({
        key: 'missing-cost',
        label: `${zeroCostBatchCount} lô có tồn thiếu giá vốn`,
        severity: 'danger'
    });
    if (missingPackagingCount > 0) warnings.push({
        key: 'missing-packaging',
        label: `${missingPackagingCount} SKU thiếu quy cách`,
        severity: 'warning'
    });
    if (parentStock > 0) warnings.push({
        key: 'parent-stock',
        label: `Parent còn ${parentStock.toLocaleString('vi-VN')} tồn cũ`,
        severity: 'warning'
    });

    return {
        skuCount: variants.length,
        inStockSkuCount,
        stockByUnit,
        priceByUnit,
        zeroCostBatchCount,
        missingPackagingCount,
        parentStock,
        warnings
    };
}

export function buildStockBreakdown(product = {}) {
    const stock = getProductStock(product);
    const baseUnit = getProductBaseUnit(product);
    const baseUnitName = displayUnitName(baseUnit.unit_name);
    const units = [...(product.product_units || [])]
        .filter(unit => numberValue(unit.conversion_rate) > 0)
        .sort((left, right) => numberValue(right.conversion_rate) - numberValue(left.conversion_rate));

    let remaining = stock;
    const parts = [];
    units.forEach(unit => {
        const rate = numberValue(unit.conversion_rate);
        if (rate <= 0) return;
        if (rate === 1) {
            if (remaining > 0 || parts.length === 0) {
                parts.push(`${Number(remaining.toFixed(3)).toLocaleString('vi-VN')} ${displayUnitName(unit.unit_name)}`);
            }
            remaining = 0;
            return;
        }
        const count = Math.floor((remaining + 1e-9) / rate);
        if (count > 0) {
            parts.push(`${count.toLocaleString('vi-VN')} ${displayUnitName(unit.unit_name)}`);
            remaining -= count * rate;
        }
    });

    return {
        stock,
        baseUnitName,
        totalLabel: `${stock.toLocaleString('vi-VN')} ${baseUnitName}`,
        breakdownLabel: parts.join(' + ')
    };
}

export function sortClinicalVariantGroups(groups = []) {
    const strengthNumber = value => {
        const match = String(value || '').match(/(\d+(?:[.,]\d+)?)/);
        return match ? Number(match[1].replace(',', '.')) : Number.POSITIVE_INFINITY;
    };
    return [...groups].sort((left, right) =>
        strengthNumber(left.label) - strengthNumber(right.label)
        || String(left.label).localeCompare(String(right.label), 'vi')
    );
}
