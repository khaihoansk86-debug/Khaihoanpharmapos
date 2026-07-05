export const POS_INVENTORY_REF_PREFIX = '[POS_ORDER:';

export function getStockQuantityToDeduct(item = {}) {
    return Number(item.quantity || 0) * (Number(item.conversionRate || 1) || 1);
}

export function getSelectedBatchCostPrice(item = {}) {
    const selectedBatch = (item.batches || []).find(batch => String(batch.id) === String(item.batchId));
    return Number(selectedBatch?.cost_price ?? selectedBatch?.costPrice ?? 0);
}

export function getBaseCostPrice(item = {}) {
    const selectedBatchCost = getSelectedBatchCostPrice(item);
    if (selectedBatchCost > 0) return selectedBatchCost;
    const conversionRate = Number(item.conversionRate || 1) || 1;
    return Number(item.costPrice || 0) / conversionRate;
}

export function buildPOSInventoryIssueNote({ orderId, orderCode, label, note } = {}) {
    const ref = `${POS_INVENTORY_REF_PREFIX}${orderId || ''}]`;
    const code = orderCode ? `[${orderCode}]` : '';
    const text = String(note || '').trim();
    return [ref, code, label || 'Xuất kho POS', text].filter(Boolean).join(' ');
}

export function isDoseIngredientIssueItem(item = {}) {
    return item.isIngredient === true || item.channelPriceType === 'dose_ingredient';
}

export function buildInventoryIssueLine(item = {}, reason = 'sample') {
    return {
        productId: item.productId || item.id || null,
        batchId: item.batchId || null,
        batchNumber: (item.batchNo && item.batchNo !== 'Chưa chọn lô') ? item.batchNo : (item.batchNumber || null),
        expiryDate: item.expiryDate || null,
        productName: item.name || item.product_name || 'Sản phẩm',
        productCode: item.code || item.product_code || null,
        quantity: Math.abs(getStockQuantityToDeduct(item)),
        costPrice: getBaseCostPrice(item),
        reason
    };
}

export function getOrderItemStockRestoreQuantity(item = {}, conversionRate = 1) {
    return Number(item.quantity || 0) * (Number(conversionRate || 1) || 1);
}
