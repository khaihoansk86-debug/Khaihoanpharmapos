const DAY_MS = 86400000;

function daysBetween(now, value) {
    if (!value) return null;
    const time = new Date(value).getTime();
    if (!Number.isFinite(time)) return null;
    return Math.max(0, Math.floor((now.getTime() - time) / DAY_MS));
}

function getCatalogStart(product = {}) {
    if (product.created_at) return product.created_at;
    return (product.product_batches || [])
        .map(batch => batch.created_at)
        .filter(Boolean)
        .sort()[0] || null;
}

function isTemporaryProduct(product = {}) {
    try {
        return JSON.parse(product.description || '{}')?.is_one_time === true;
    } catch {
        return false;
    }
}

export function buildProductLifecycleCandidates(products = [], saleRows = [], now = new Date()) {
    const salesByProduct = new Map();

    saleRows.forEach(row => {
        if (!row?.product_id || Number(row.quantity || 0) <= 0) return;
        const soldAt = row.sold_at || row.created_at;
        if (!soldAt) return;
        const daysAgo = daysBetween(now, soldAt);
        if (daysAgo == null) return;

        const stats = salesByProduct.get(row.product_id) || {
            lastSoldAt: null,
            sales90: 0,
            sales180: 0,
            sales365: 0
        };
        if (!stats.lastSoldAt || new Date(soldAt) > new Date(stats.lastSoldAt)) stats.lastSoldAt = soldAt;
        if (daysAgo <= 90) stats.sales90 += 1;
        if (daysAgo <= 180) stats.sales180 += 1;
        if (daysAgo <= 365) stats.sales365 += 1;
        salesByProduct.set(row.product_id, stats);
    });

    return products
        .filter(product => product?.id && product.is_active !== false && !isTemporaryProduct(product))
        .map(product => {
            const stats = salesByProduct.get(product.id) || {
                lastSoldAt: null,
                sales90: 0,
                sales180: 0,
                sales365: 0
            };
            const catalogAgeDays = daysBetween(now, getCatalogStart(product));
            const daysSinceLastSold = daysBetween(now, stats.lastSoldAt);
            const stock = (product.product_batches || [])
                .reduce((sum, batch) => sum + Number(batch.stock_quantity || 0), 0);

            let severity = null;
            let reason = '';

            if (catalogAgeDays != null && catalogAgeDays >= 180 && stats.sales365 === 0) {
                severity = stock <= 0 ? 'likely_discontinued' : 'review';
                reason = stock <= 0
                    ? 'Không bán trong 365 ngày và không còn tồn kho'
                    : `Không bán trong 365 ngày nhưng vẫn còn tồn ${stock}`;
            } else if (daysSinceLastSold != null && daysSinceLastSold >= 180 && stats.sales180 === 0 && stats.sales365 <= 2) {
                severity = 'review';
                reason = `Lần cuối bán cách đây ${daysSinceLastSold} ngày; chỉ ${stats.sales365} lượt trong 365 ngày`;
            }

            if (!severity) return null;
            return {
                product,
                severity,
                reason,
                stock,
                catalogAgeDays,
                daysSinceLastSold,
                ...stats
            };
        })
        .filter(Boolean)
        .sort((a, b) => {
            if (a.severity !== b.severity) return a.severity === 'likely_discontinued' ? -1 : 1;
            return (b.daysSinceLastSold || b.catalogAgeDays || 0) - (a.daysSinceLastSold || a.catalogAgeDays || 0);
        });
}
