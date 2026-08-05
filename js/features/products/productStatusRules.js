export function applyProductBusinessStatus(products = [], productId, isActive) {
    const normalizedId = String(productId ?? '');
    return (Array.isArray(products) ? products : []).map(product => {
        if (String(product?.id ?? '') !== normalizedId) return product;
        return {
            ...product,
            is_active: isActive === true
        };
    });
}

export function filterProductBusinessStatus(products = [], status = 'active') {
    const catalog = Array.isArray(products) ? products : [];
    if (status === 'active') return catalog.filter(product => product?.is_active !== false);
    if (status === 'inactive') return catalog.filter(product => product?.is_active === false);
    return catalog;
}
