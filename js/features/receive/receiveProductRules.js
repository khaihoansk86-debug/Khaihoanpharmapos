function cleanText(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
}

export function normalizeReceiveSearchText(value) {
    return cleanText(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLocaleLowerCase('vi-VN');
}

function parseDescriptionFlags(product = {}) {
    if (!product.description) return {};
    try {
        const parsed = JSON.parse(product.description);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
        return {};
    }
}

function categoryName(product = {}) {
    return cleanText(product.product_categories?.name || product.categories?.name);
}

function positiveNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function getStructuredVariantIdentity(product = {}, parent = null) {
    const values = product?.variant_values;
    if (!values || typeof values !== 'object' || Array.isArray(values)) {
        return { label: '', searchParts: [] };
    }

    const definitions = Array.isArray(parent?.variant_definitions)
        ? parent.variant_definitions
        : [];
    const orderedEntries = definitions
        .map(definition => ({
            key: cleanText(definition?.key),
            label: cleanText(definition?.label),
            value: cleanText(values?.[definition?.key])
        }))
        .filter(entry => entry.key && entry.value);
    const entries = orderedEntries.length > 0
        ? orderedEntries
        : Object.entries(values)
            .map(([key, value]) => ({
                key: cleanText(key),
                label: cleanText(key),
                value: cleanText(value)
            }))
            .filter(entry => entry.key && entry.value);

    return {
        label: entries.map(entry => entry.value).join(' • '),
        searchParts: entries.flatMap(entry => [
            entry.key,
            entry.label,
            entry.value
        ])
    };
}

export function getReceiveBaseUnit(product = {}) {
    const units = product.product_units || [];
    return units.find(unit => unit.is_base_unit)
        || units.find(unit => positiveNumber(unit.conversion_rate) === 1)
        || units[0]
        || {};
}

export function getReceiveStock(product = {}) {
    return (product.product_batches || []).reduce(
        (sum, batch) => sum + positiveNumber(batch.stock_quantity),
        0
    );
}

export function isReceivablePhysicalSku(product = {}, parentProductIds = new Set()) {
    const code = cleanText(product.product_code).toLocaleUpperCase('vi-VN');
    const flags = parseDescriptionFlags(product);
    const isParent = parentProductIds.has(product.id)
        || product.is_direct_sale === false
        || code.startsWith('PARENT_');
    const isCombo = normalizeReceiveSearchText(categoryName(product)).includes('combo');
    const isVirtualDose = flags.is_dose_retail === true;

    return Boolean(product.id)
        && product.is_active !== false
        && !isParent
        && !isCombo
        && !isVirtualDose;
}

export function buildReceiveProductMeta(product = {}, parent = null) {
    const baseUnit = getReceiveBaseUnit(product);
    const baseUnitName = cleanText(baseUnit.unit_name) || 'ĐVT';
    const structuredIdentity = getStructuredVariantIdentity(product, parent);
    const concentration = cleanText(product.concentration || product.variant_label);
    const dosageForm = cleanText(product.dosage_form);
    const clinicalLabel = structuredIdentity.label
        || [concentration, dosageForm].filter(Boolean).join(' • ');
    const packagingLabel = cleanText(product.packaging_spec) || 'Chưa có quy cách đóng gói';
    const stockQuantity = getReceiveStock(product);
    const validUnits = (product.product_units || [])
        .filter(unit => positiveNumber(unit.conversion_rate) > 0)
        .sort((left, right) =>
            positiveNumber(right.conversion_rate) - positiveNumber(left.conversion_rate)
            || cleanText(left.unit_name).localeCompare(cleanText(right.unit_name), 'vi')
        );

    const searchText = [
        parent?.name,
        parent?.product_code,
        product.name,
        product.product_code,
        product.barcode,
        product.variant_label,
        product.concentration,
        product.dosage_form,
        ...structuredIdentity.searchParts,
        product.packaging_spec,
        product.active_ingredient,
        product.manufacturer,
        categoryName(product),
        ...validUnits.flatMap(unit => [
            unit.unit_name,
            `${unit.conversion_rate} ${unit.unit_name}`
        ])
    ].filter(Boolean).join(' ');

    return {
        parentName: cleanText(parent?.name),
        clinicalLabel,
        packagingLabel,
        barcode: cleanText(product.barcode),
        baseUnitName,
        stockQuantity,
        stockLabel: `${stockQuantity.toLocaleString('vi-VN')} ${baseUnitName}`,
        units: validUnits,
        hasUnits: validUnits.length > 0,
        searchKey: normalizeReceiveSearchText(searchText)
    };
}

export function buildReceiveProductCatalog(products = []) {
    const productById = new Map((products || []).map(product => [product.id, product]));
    const parentProductIds = new Set(
        (products || []).map(product => product.parent_id).filter(Boolean)
    );

    return (products || [])
        .filter(product => isReceivablePhysicalSku(product, parentProductIds))
        .map(product => ({
            ...product,
            _receiveMeta: buildReceiveProductMeta(
                product,
                product.parent_id ? productById.get(product.parent_id) : null
            )
        }));
}

function receiveSearchScore(product = {}, normalizedQuery = '') {
    const code = normalizeReceiveSearchText(product.product_code);
    const barcode = normalizeReceiveSearchText(product.barcode);
    const name = normalizeReceiveSearchText(product.name);
    if (barcode && barcode === normalizedQuery) return 0;
    if (code && code === normalizedQuery) return 1;
    if (code.startsWith(normalizedQuery)) return 2;
    if (name.startsWith(normalizedQuery)) return 3;
    return 4;
}

export function searchReceiveProducts(catalog = [], query = '', limit = 12) {
    const normalizedQuery = normalizeReceiveSearchText(query);
    if (!normalizedQuery) return [];
    const queryTokens = normalizedQuery.split(' ').filter(Boolean);

    return (catalog || [])
        .filter(product => {
            const searchKey = product._receiveMeta?.searchKey || '';
            return searchKey.includes(normalizedQuery)
                || queryTokens.every(token => searchKey.includes(token));
        })
        .sort((left, right) =>
            receiveSearchScore(left, normalizedQuery) - receiveSearchScore(right, normalizedQuery)
            || String(left.name || '').localeCompare(String(right.name || ''), 'vi')
            || String(left._receiveMeta?.packagingLabel || '').localeCompare(
                String(right._receiveMeta?.packagingLabel || ''),
                'vi'
            )
        )
        .slice(0, limit);
}

export function buildReceiveConversionSummary({
    quantity,
    unitName,
    conversionRate,
    baseUnitName,
    costPrice
} = {}) {
    const safeQuantity = positiveNumber(quantity);
    const safeRate = positiveNumber(conversionRate, 1) || 1;
    const safeCost = positiveNumber(costPrice);
    const safeUnitName = cleanText(unitName) || 'ĐVT';
    const safeBaseUnitName = cleanText(baseUnitName) || safeUnitName;
    const quantityBase = safeQuantity * safeRate;
    const costPriceBase = safeCost / safeRate;

    return {
        quantityBase,
        costPriceBase,
        equationLabel: safeRate === 1
            ? `1 ${safeUnitName} = 1 ${safeBaseUnitName}`
            : `1 ${safeUnitName} = ${safeRate.toLocaleString('vi-VN')} ${safeBaseUnitName}`,
        receiveLabel: `Cộng ${quantityBase.toLocaleString('vi-VN')} ${safeBaseUnitName} vào kho`,
        costBaseLabel: `${costPriceBase.toLocaleString('vi-VN', {
            maximumFractionDigits: 2
        })}đ/${safeBaseUnitName}`
    };
}
