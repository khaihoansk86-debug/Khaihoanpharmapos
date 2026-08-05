export const STOCKTAKE_DRAFT_VERSION = 2;

function toNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}

export function getBatchVerificationState(batch = {}) {
    if (batch.isVerified !== true) return 'pending';
    return toNumber(batch.countedQuantity) === toNumber(batch.systemQuantity)
        ? 'matched'
        : 'discrepancy';
}

export function summarizeStocktake(groupedProducts = []) {
    const summary = {
        total: 0,
        verified: 0,
        pending: 0,
        matched: 0,
        discrepancy: 0,
        lossValue: 0,
        gainValue: 0,
        percent: 0
    };

    (Array.isArray(groupedProducts) ? groupedProducts : []).forEach(product => {
        (Array.isArray(product?.batches) ? product.batches : []).forEach(batch => {
            if (batch?.isNewBatch === true
                && !String(batch?.batchNumber || '').trim()
                && toNumber(batch?.countedQuantity) === 0) {
                return;
            }

            summary.total += 1;
            const state = getBatchVerificationState(batch);
            summary[state] += 1;
            if (state !== 'pending') summary.verified += 1;

            const deltaValue = toNumber(batch?.deltaValue);
            if (deltaValue < 0) summary.lossValue += Math.abs(deltaValue);
            if (deltaValue > 0) summary.gainValue += deltaValue;
        });
    });

    summary.percent = summary.total === 0
        ? 0
        : Math.round((summary.verified / summary.total) * 100);
    return summary;
}

export function buildStocktakeDraft({
    docCode = '',
    auditDate = '',
    reason = 'stocktake',
    note = '',
    groupedProducts = [],
    activityLogs = [],
    timestamp = Date.now()
} = {}) {
    return {
        version: STOCKTAKE_DRAFT_VERSION,
        timestamp: toNumber(timestamp, Date.now()),
        docCode: String(docCode || '').trim(),
        auditDate: String(auditDate || '').trim(),
        reason: String(reason || 'stocktake').trim() || 'stocktake',
        note: String(note || '').slice(0, 500),
        lines: (Array.isArray(groupedProducts) ? groupedProducts : []).map(product => ({
            productId: product.productId,
            batches: (Array.isArray(product?.batches) ? product.batches : []).map(batch => ({
                batchId: batch.batchId,
                batchNumber: String(batch.batchNumber || '').slice(0, 120),
                originalBatchNumber: String(batch.originalBatchNumber || '').slice(0, 120),
                expiryDate: String(batch.expiryDate || '').slice(0, 10),
                countedQuantity: Math.max(0, toNumber(batch.countedQuantity)),
                costPrice: Math.max(0, toNumber(batch.costPrice)),
                isNewBatch: batch.isNewBatch === true,
                isVerified: batch.isVerified === true
            }))
        })),
        activityLogs: (Array.isArray(activityLogs) ? activityLogs : []).slice(0, 200)
    };
}

export function chooseNewestStocktakeDraft(...drafts) {
    return drafts
        .filter(draft => draft && Array.isArray(draft.lines))
        .sort((left, right) => toNumber(right.timestamp) - toNumber(left.timestamp))[0] || null;
}

export function applyStocktakeDraft(groupedProducts = [], draft = {}) {
    const products = Array.isArray(groupedProducts) ? groupedProducts : [];
    const draftLines = Array.isArray(draft?.lines) ? draft.lines : [];

    draftLines.forEach(draftProduct => {
        const product = products.find(item => item.productId === draftProduct.productId);
        if (!product) return;

        (Array.isArray(draftProduct.batches) ? draftProduct.batches : []).forEach(draftBatch => {
            let batch = product.batches.find(item => item.batchId === draftBatch.batchId);
            if (!batch && draftBatch.isNewBatch === true) {
                batch = {
                    batchId: draftBatch.batchId,
                    batchNumber: '',
                    originalBatchNumber: '',
                    expiryDate: '',
                    systemQuantity: 0,
                    countedQuantity: 0,
                    costPrice: 0,
                    delta: 0,
                    deltaValue: 0,
                    isNewBatch: true,
                    isVerified: false
                };
                product.batches.push(batch);
            }
            if (!batch) return;

            batch.batchNumber = String(draftBatch.batchNumber || batch.batchNumber || '');
            batch.originalBatchNumber = String(
                draftBatch.originalBatchNumber ?? batch.originalBatchNumber ?? batch.batchNumber
            );
            batch.expiryDate = String(draftBatch.expiryDate || batch.expiryDate || '');
            batch.countedQuantity = Math.max(0, toNumber(
                draftBatch.countedQuantity,
                batch.systemQuantity
            ));
            batch.costPrice = Math.max(0, toNumber(draftBatch.costPrice, batch.costPrice));
            batch.isVerified = draftBatch.isVerified === true;
            batch.delta = batch.countedQuantity - toNumber(batch.systemQuantity);
            batch.deltaValue = batch.delta * toNumber(batch.costPrice);
        });
    });

    return products;
}

export function canCompleteStocktake(groupedProducts = [], allowPending = false) {
    const summary = summarizeStocktake(groupedProducts);
    return {
        allowed: summary.total > 0 && (allowPending || summary.pending === 0),
        requiresPendingConfirmation: summary.pending > 0,
        summary
    };
}
