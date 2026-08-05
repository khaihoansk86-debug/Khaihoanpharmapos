function hasMeaningfulNewBatch(batch) {
    if (batch?.isNewBatch !== true) return true;
    return String(batch?.batchNumber || '').trim() !== ''
        && Number(batch?.countedQuantity || 0) > 0;
}

export function buildStocktakeCompletionLines(groupedProducts = []) {
    if (!Array.isArray(groupedProducts)) return [];

    return groupedProducts.flatMap(product => (
        Array.isArray(product?.batches) ? product.batches : []
    )
        .filter(hasMeaningfulNewBatch)
        .map(batch => ({
            productId: product.productId,
            productName: product.productName,
            productCode: product.productCode,
            batchId: batch.batchId,
            batchNumber: batch.batchNumber,
            originalBatchNumber: batch.originalBatchNumber,
            isNewBatch: batch.isNewBatch === true,
            isRenamed: batch.batchNumber !== batch.originalBatchNumber,
            expiryDate: batch.expiryDate,
            costPrice: batch.costPrice,
            systemQuantity: batch.systemQuantity,
            countedQuantity: batch.countedQuantity,
            delta: batch.delta,
            deltaValue: batch.deltaValue,
            baseUnit: product.baseUnit
        })));
}
