const EPSILON = 0.000001;

function toBatchSnapshot(batch = {}) {
    return {
        batchId: batch.id || batch.batchId || null,
        batchNumber: batch.batch_number || batch.batchNumber || batch.batch_no || '---',
        expiryDate: batch.expiry_date || batch.expiryDate || null,
        availableQuantity: Math.max(
            0,
            Number(batch.stock_quantity ?? batch.remainingQty ?? batch.availableQuantity ?? 0)
        ),
        costPrice: Math.max(0, Number(batch.cost_price ?? batch.costPrice ?? 0))
    };
}

function compareExpiry(left, right) {
    const leftTime = left.expiryDate ? new Date(left.expiryDate).getTime() : Number.POSITIVE_INFINITY;
    const rightTime = right.expiryDate ? new Date(right.expiryDate).getTime() : Number.POSITIVE_INFINITY;
    if (leftTime !== rightTime) return leftTime - rightTime;
    return String(left.batchNumber).localeCompare(String(right.batchNumber), 'vi');
}

export function planFefoBatchAllocations({
    requiredQuantity,
    batches = [],
    preferredBatchId = null
} = {}) {
    let remainingQuantity = Math.abs(Number(requiredQuantity || 0));
    if (remainingQuantity <= EPSILON) return [];

    const snapshotsById = new Map();
    (Array.isArray(batches) ? batches : [])
        .map(toBatchSnapshot)
        .filter(batch => batch.batchId && batch.availableQuantity > EPSILON)
        .forEach(batch => {
            if (!snapshotsById.has(String(batch.batchId))) {
                snapshotsById.set(String(batch.batchId), batch);
            }
        });
    const snapshots = [...snapshotsById.values()].sort(compareExpiry);

    const preferred = preferredBatchId
        ? snapshots.find(batch => String(batch.batchId) === String(preferredBatchId))
        : null;
    const candidates = preferred
        ? [preferred, ...snapshots.filter(batch => batch !== preferred)]
        : snapshots;
    const availableQuantity = candidates.reduce(
        (total, batch) => total + batch.availableQuantity,
        0
    );

    if (availableQuantity + EPSILON < remainingQuantity) {
        throw new Error(
            `Không đủ tồn kho: cần ${remainingQuantity}, tổng các lô còn ${availableQuantity}.`
        );
    }

    const allocations = [];
    for (const batch of candidates) {
        if (remainingQuantity <= EPSILON) break;
        const quantity = Math.min(remainingQuantity, batch.availableQuantity);
        if (quantity <= EPSILON) continue;
        allocations.push({
            batchId: batch.batchId,
            batchNumber: batch.batchNumber,
            expiryDate: batch.expiryDate,
            quantity,
            costPrice: batch.costPrice
        });
        remainingQuantity -= quantity;
    }

    return allocations;
}

export function sliceBatchAllocationsForReturn({
    sourceAllocations = [],
    sourceSaleQuantity,
    returnQuantity,
    alreadyReturnedQuantity = 0
} = {}) {
    const sourceQuantity = Math.abs(Number(sourceSaleQuantity || 0));
    const requestedQuantity = Math.abs(Number(returnQuantity || 0));
    const returnedQuantity = Math.abs(Number(alreadyReturnedQuantity || 0));
    if (sourceQuantity <= EPSILON || requestedQuantity <= EPSILON) return [];
    if (returnedQuantity + requestedQuantity > sourceQuantity + EPSILON) {
        throw new Error('Số lượng trả vượt quá số lượng đã bán.');
    }

    const snapshots = (Array.isArray(sourceAllocations) ? sourceAllocations : [])
        .map(allocation => ({
            batch_id: allocation.batch_id || allocation.batchId || null,
            quantity_base: Math.abs(Number(
                allocation.quantity_base ?? allocation.stock_quantity ?? allocation.quantity ?? 0
            )),
            cost_price: Math.max(0, Number(
                allocation.cost_price ?? allocation.costPrice ?? 0
            ))
        }))
        .filter(allocation => allocation.batch_id && allocation.quantity_base > EPSILON);
    const totalBaseQuantity = snapshots.reduce(
        (total, allocation) => total + allocation.quantity_base,
        0
    );
    const baseQuantityPerSaleUnit = totalBaseQuantity / sourceQuantity;
    let quantityToSkip = baseQuantityPerSaleUnit * returnedQuantity;
    let remainingQuantity = baseQuantityPerSaleUnit * requestedQuantity;
    const result = [];

    for (const allocation of snapshots) {
        let availableQuantity = allocation.quantity_base;
        if (quantityToSkip > EPSILON) {
            const skippedQuantity = Math.min(quantityToSkip, availableQuantity);
            quantityToSkip -= skippedQuantity;
            availableQuantity -= skippedQuantity;
        }
        if (availableQuantity <= EPSILON || remainingQuantity <= EPSILON) continue;

        const quantity = Math.min(remainingQuantity, availableQuantity);
        result.push({
            batch_id: allocation.batch_id,
            quantity_base: -quantity,
            cost_price: allocation.cost_price
        });
        remainingQuantity -= quantity;
    }

    if (remainingQuantity > EPSILON) {
        throw new Error('Không đủ snapshot lô để hoàn trả đúng tồn kho.');
    }
    return result;
}

export function getBatchAllocationInventoryDeltas({
    allocations = [],
    mode = 'cancel'
} = {}) {
    return (Array.isArray(allocations) ? allocations : [])
        .map(allocation => {
            const quantityBase = Number(
                allocation.quantity_base ?? allocation.stock_quantity ?? allocation.quantity ?? 0
            );
            return {
                batchId: allocation.batch_id || allocation.batchId || null,
                quantity: mode === 'return' ? Math.abs(quantityBase) : quantityBase
            };
        })
        .filter(delta => delta.batchId && Math.abs(delta.quantity) > EPSILON);
}
