import {
    buildAtomicOrderPayload,
    isValidAtomicId
} from './fastCheckoutRules.js';
import { planFefoBatchAllocations } from './batchAllocationRules.js';

function parseDescription(item) {
    if (item?.description && typeof item.description === 'object') return item.description;
    try {
        return JSON.parse(item?.description || 'null');
    } catch {
        return null;
    }
}

function isComboItem(item) {
    const description = parseDescription(item);
    return description?.isCombo === true
        && Array.isArray(description.items)
        && description.items.length > 0;
}

function isUnsupportedDoseItem(item) {
    const description = parseDescription(item);
    return description?.is_dose_retail === true || description?.is_dose_cut === true;
}

export function canUseAtomicComboCheckout({ orderData = {}, cartItems = [] } = {}) {
    if (orderData.isInternal || orderData.isDoseCut || orderData.isReturn) return false;
    if (orderData.customerPhone && !orderData.customerId) return false;
    if (!Array.isArray(cartItems) || cartItems.length === 0 || cartItems.length > 100) return false;

    let hasCombo = false;
    const allSupported = cartItems.every(item => {
        const productId = item.productId || item.id;
        const combo = isComboItem(item);
        hasCombo = hasCombo || combo;

        if (!isValidAtomicId(productId)
            || Number(item.quantity || 0) <= 0
            || Number(item.price || 0) < 0
            || item.isCustom === true
            || isUnsupportedDoseItem(item)) {
            return false;
        }

        return combo || isValidAtomicId(item.batchId);
    });

    return allSupported && hasCombo;
}

export function buildAtomicComboCheckoutPayload({ orderData = {}, cartItems = [] } = {}) {
    if (!canUseAtomicComboCheckout({ orderData, cartItems })) {
        throw new Error('Đơn combo không phù hợp với luồng thanh toán nguyên tử.');
    }

    const orderPayload = buildAtomicOrderPayload(orderData);
    return {
        p_idempotency_key: orderPayload.order_code,
        p_order: orderPayload,
        p_items: cartItems.map((item, index) => {
            const combo = isComboItem(item);
            const quantity = Number(item.quantity || 0);
            const unitPrice = Number(item.price || 0);
            const stockQuantity = combo
                ? null
                : quantity * (Number(item.conversionRate || 1) || 1);
            const batches = Array.isArray(item.batches) ? item.batches : [];
            const allocations = combo
                ? []
                : (batches.length > 0
                    ? planFefoBatchAllocations({
                        requiredQuantity: stockQuantity,
                        batches,
                        preferredBatchId: item.batchId || null
                    })
                    : [{
                        batchId: item.batchId || null,
                        quantity: stockQuantity
                    }]);
            return {
                line_kind: combo ? 'combo' : 'standard',
                product_id: item.productId || item.id,
                preferred_batch_id: combo ? null : (item.batchId || null),
                product_name: String(item.name || '').slice(0, 255),
                product_code: item.code || item.product_code || null,
                unit_name: item.unit || (combo ? 'Combo' : null),
                unit_price: unitPrice,
                quantity,
                stock_quantity: stockQuantity,
                batch_allocations: combo
                    ? undefined
                    : allocations.map(allocation => ({
                        batch_id: allocation.batchId,
                        stock_quantity: Number(allocation.quantity || 0)
                    })),
                total_price: unitPrice * quantity,
                sort_index: index * 10000
            };
        })
    };
}
