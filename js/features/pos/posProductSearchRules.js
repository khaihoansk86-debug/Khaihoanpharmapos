/**
 * Rules for deciding which catalog products are selectable in each POS mode.
 *
 * Product type flags are stored in `products.description` for backwards
 * compatibility.  `is_dose_cut` is the physical ingredient catalog used by
 * the "Xuất thuốc liều" workflow; `is_dose_retail` is a separate retail
 * package catalog and must not leak into that workflow.
 */

export function getProductDescriptionFlags(product = {}) {
    const rawDescription = product?.description;
    if (!rawDescription) return {};
    if (typeof rawDescription === 'object') {
        return rawDescription && !Array.isArray(rawDescription) ? rawDescription : {};
    }

    try {
        const parsed = JSON.parse(rawDescription);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
        return {};
    }
}

export function isDoseCutCatalogProduct(product = {}) {
    const flags = getProductDescriptionFlags(product);
    return flags.is_dose_cut === true && flags.is_dose_retail !== true;
}

export function isProductAllowedInPOSMode(product = {}, {
    isDoseCutMode = false,
    isEcommerceMode = false,
    isInternalMode = false,
    internalReason = null
} = {}) {
    if (!product || product.is_active === false) return false;

    if (isDoseCutMode) {
        return isDoseCutCatalogProduct(product);
    }

    const isDoseCuttingInternalExport = isInternalMode && internalReason === 'dose_cutting';
    if (isEcommerceMode) {
        return product.is_ecommerce === true && !isDoseCutCatalogProduct(product);
    }

    // Keep the existing normal/internal behavior: physical dose ingredients
    // are hidden unless the internal workflow explicitly exports for cutting.
    if (!isDoseCuttingInternalExport && isDoseCutCatalogProduct(product)) return false;
    return true;
}
