function normalizeSourceText(value) {
    return String(value ?? '').trim().toLocaleLowerCase('vi-VN');
}

function isReturnableSourceItem(item = {}) {
    return Boolean(item?.id)
        && item?.line_type !== 'combo_component'
        && Number(item?.quantity || 0) > 0;
}

function findReconciledSourceItem(returnItem = {}, sourceItems = [], usedSourceIds = new Set()) {
    const sourceItemId = String(returnItem.sourceOrderItemId || '').trim();
    const exact = (sourceItems || []).find(source =>
        isReturnableSourceItem(source)
        && !usedSourceIds.has(String(source.id))
        && String(source.id) === sourceItemId
    );
    if (exact) return exact;

    const productId = String(returnItem.productId || returnItem.product_id || returnItem.id || '');
    const productCode = normalizeSourceText(returnItem.code || returnItem.productCode || returnItem.product_code);
    const productName = normalizeSourceText(returnItem.name || returnItem.productName || returnItem.product_name);
    const unit = normalizeSourceText(returnItem.unit || returnItem.unitName || returnItem.unit_name);
    const price = Number(returnItem.price ?? returnItem.unit_price);

    const candidates = (sourceItems || [])
        .filter(source => isReturnableSourceItem(source) && !usedSourceIds.has(String(source.id)))
        .map(source => {
            const sourceProductId = String(source.product_id || '');
            const sourceCode = normalizeSourceText(source.product_code);
            const sourceName = normalizeSourceText(source.product_name || source.name);
            const sourceUnit = normalizeSourceText(source.unit_name);
            const sourcePrice = Number(source.unit_price);
            let score = 0;
            if (productId && sourceProductId && productId === sourceProductId) score += 100;
            if (productCode && sourceCode && productCode === sourceCode) score += 40;
            if (productName && sourceName && productName === sourceName) score += 20;
            if (unit && sourceUnit && unit === sourceUnit) score += 20;
            if (Number.isFinite(price) && Number.isFinite(sourcePrice) && price === sourcePrice) score += 20;
            return { source, score };
        })
        .filter(candidate => candidate.score > 0)
        .sort((left, right) => right.score - left.score);

    return candidates[0]?.source || null;
}

/**
 * Drafts can contain a client row id from before the source invoice was
 * refreshed. Only server snapshot ids are allowed to reach the FK/trigger.
 */
export function reconcileReturnSourceIds(cartItems = [], sourceItems = []) {
    const used = new Set();
    return (cartItems || []).map(item => {
        if (item?.originalQuantity === undefined || Number(item?.quantity || 0) <= 0) return item;
        const source = findReconciledSourceItem(item, sourceItems, used);
        if (!source) return { ...item, sourceOrderItemId: null };
        used.add(String(source.id));
        return { ...item, sourceOrderItemId: source.id };
    });
}
