export function parseComboDescription(description) {
    if (!description) return null;
    try {
        const parsed = typeof description === 'string' ? JSON.parse(description) : description;
        if (!parsed || parsed.isCombo !== true || !Array.isArray(parsed.items)) return null;
        return parsed;
    } catch (error) {
        return null;
    }
}

export function getProductCategoryName(product) {
    return String(product?.product_categories?.name || product?.categories?.name || '').trim();
}

export function isDoseLikeProduct(product) {
    const description = product?.description;
    try {
        const flags = typeof description === 'string' ? JSON.parse(description) : description;
        return flags?.is_dose_cut === true || flags?.is_dose_retail === true;
    } catch (error) {
        return false;
    }
}

export function isComboCatalogProduct(product) {
    const categoryName = getProductCategoryName(product).toLowerCase();
    const code = String(product?.product_code || '').toUpperCase();
    return categoryName.includes('combo') || code.startsWith('CB');
}

export function isComboSearchableProduct(product) {
    if (!product || product.is_active === false) return false;
    if (isDoseLikeProduct(product)) return false;
    if (isComboCatalogProduct(product)) return false;
    return true;
}

export function filterComboSearchProducts(products = [], rawQuery = '') {
    const query = String(rawQuery || '').trim().toLowerCase();
    if (!query) return [];

    return (products || []).filter(product => {
        if (!isComboSearchableProduct(product)) return false;
        const name = String(product?.name || '').toLowerCase();
        const code = String(product?.product_code || '').toLowerCase();
        return name.includes(query) || code.includes(query);
    });
}

export function expandComboItems(comboDefinition, parentQuantity = 1) {
    if (!comboDefinition?.items?.length) return [];
    const multiplier = Math.max(1, Number(parentQuantity || 1));
    return comboDefinition.items.map(item => ({
        id: item.id,
        name: item.name,
        unit: item.unit,
        quantity: Math.max(0, Number(item.quantity || 0)) * multiplier
    }));
}
