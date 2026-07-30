function toAmount(value) {
    const amount = Number(value || 0);
    return Number.isFinite(amount) ? amount : 0;
}

/**
 * The POS ecommerce flow records cost in orders.total. Keep the legacy
 * revenue field aligned for Telegram clients that still read that key, while
 * presenting a single cost basis and no artificial profit.
 */
export function buildTelegramEcommerceCostView(report = {}) {
    const recordedCost = toAmount(report.revenue);
    const topProducts = Array.isArray(report.top_products)
        ? report.top_products.map(product => {
            const productCost = toAmount(product?.revenue);
            return {
                ...product,
                revenue: productCost,
                cost: productCost
            };
        })
        : [];

    return {
        ...report,
        metric_basis: 'recorded_cost',
        revenue: recordedCost,
        cost: recordedCost,
        profit: 0,
        top_products: topProducts
    };
}
