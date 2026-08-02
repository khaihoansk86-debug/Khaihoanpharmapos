function stockQuantity(batch = {}) {
    const quantity = Number(batch.stock_quantity ?? batch.quantity ?? 0);
    return Number.isFinite(quantity) ? quantity : 0;
}

export function findRemovedPositiveStockBatches(existingBatches = [], nextBatches = []) {
    const retainedIds = new Set(
        (Array.isArray(nextBatches) ? nextBatches : [])
            .map(batch => String(batch?.id || '').trim())
            .filter(Boolean)
    );

    return (Array.isArray(existingBatches) ? existingBatches : []).filter(batch => {
        const id = String(batch?.id || '').trim();
        return id && stockQuantity(batch) > 0 && !retainedIds.has(id);
    });
}

export function assertSafeVariantBatchRemoval({
    existingBatches = [],
    nextBatches = []
} = {}) {
    const unsafeBatches = findRemovedPositiveStockBatches(existingBatches, nextBatches);
    if (unsafeBatches.length === 0) return true;

    const batch = unsafeBatches[0];
    const batchName = String(batch.batch_number || batch.batch_name || 'Không tên').trim();
    throw new Error(
        `Lô "${batchName}" vẫn còn tồn kho (${stockQuantity(batch)}). `
        + 'Vui lòng xuất hoặc điều chỉnh tồn về 0 trước khi xóa lô.'
    );
}
