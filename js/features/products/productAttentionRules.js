const DAY_MS = 86400000;

function startOfDay(value) {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
}

function getDaysLeft(expiryDate, now) {
    if (!expiryDate) return null;
    const expiry = new Date(`${expiryDate}T00:00:00`);
    if (!Number.isFinite(expiry.getTime())) return null;
    return Math.ceil((expiry - startOfDay(now)) / DAY_MS);
}

export function buildProductAttentionTasks(
    products = [],
    lifecycleCandidates = [],
    now = new Date(),
    nearExpiryDays = 90
) {
    const expired = [];
    const nearExpiry = [];

    products.forEach(product => {
        if (!product?.id || product.is_active === false) return;

        const expiryBatches = (product.product_batches || [])
            .filter(batch => Number(batch.stock_quantity || 0) > 0)
            .map(batch => ({ batch, daysLeft: getDaysLeft(batch.expiry_date, now) }))
            .filter(item => item.daysLeft != null && item.daysLeft <= nearExpiryDays)
            .sort((a, b) => a.daysLeft - b.daysLeft);

        const expiredBatches = expiryBatches.filter(item => item.daysLeft < 0);
        const nearBatches = expiryBatches.filter(item => item.daysLeft >= 0);

        if (expiredBatches.length) {
            expired.push({
                product,
                batches: expiredBatches,
                urgency: Math.abs(expiredBatches[0].daysLeft)
            });
        }
        if (nearBatches.length) {
            nearExpiry.push({
                product,
                batches: nearBatches,
                urgency: nearBatches[0].daysLeft
            });
        }
    });

    return {
        expired: expired.sort((a, b) => b.urgency - a.urgency),
        nearExpiry: nearExpiry.sort((a, b) => a.urgency - b.urgency),
        cleanup: [...lifecycleCandidates]
    };
}
