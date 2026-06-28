import { getOrderItemStockRestoreQuantity } from './inventoryIssueRules.js';

export function getStockQuantityForReturnRestore(item = {}, conversionRate = 1) {
    return Math.abs(getOrderItemStockRestoreQuantity(item, conversionRate));
}

export function getStockQuantityForOrderCancellation(item = {}, conversionRate = 1) {
    return Number(getOrderItemStockRestoreQuantity(item, conversionRate));
}
