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

function getProductStatusFlags(product) {
    try {
        const description = typeof product?.description === 'string'
            ? JSON.parse(product.description)
            : product?.description;
        return description && typeof description === 'object' ? description : {};
    } catch {
        return {};
    }
}

export function filterProductStatusView(products = [], status = 'active') {
    const catalog = Array.isArray(products) ? products : [];
    if (status === 'inactive') {
        return catalog.filter(product => product?.is_active === false);
    }

    const activeCatalog = catalog.filter(product => product?.is_active !== false);
    if (status === 'dose_cut') {
        return activeCatalog.filter(product => getProductStatusFlags(product).is_dose_cut === true);
    }
    if (status === 'dose_retail') {
        return activeCatalog.filter(product => getProductStatusFlags(product).is_dose_retail === true);
    }
    if (status === 'active') {
        return activeCatalog.filter(product => {
            const flags = getProductStatusFlags(product);
            return flags.is_dose_cut !== true && flags.is_dose_retail !== true;
        });
    }
    return catalog;
}
