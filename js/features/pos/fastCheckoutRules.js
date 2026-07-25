import { planFefoBatchAllocations } from './batchAllocationRules.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidAtomicId(value) {
    return UUID_PATTERN.test(String(value || ''));
}

function hasSpecialProductFlow(item = {}) {
    try {
        const description = JSON.parse(item.description || 'null');
        return description?.isCombo === true
            || description?.is_dose_retail === true
            || description?.is_dose_cut === true;
    } catch {
        return false;
    }
}

export function canUseAtomicCheckout({ orderData = {}, cartItems = [] } = {}) {
    if (orderData.isInternal || orderData.isDoseCut || orderData.isReturn) return false;
    if (orderData.customerPhone && !orderData.customerId) return false;
    if (!Array.isArray(cartItems) || cartItems.length === 0 || cartItems.length > 100) return false;

    return cartItems.every(item => {
        const productId = item.productId || item.id;
        const batchId = item.batchId;
        return isValidAtomicId(productId)
            && isValidAtomicId(batchId)
            && Number(item.quantity || 0) > 0
            && Number(item.price || 0) >= 0
            && item.isCustom !== true
            && !hasSpecialProductFlow(item);
    });
}

export function buildAtomicOrderPayload(orderData = {}) {
    const orderCode = String(orderData.orderCode || '').trim();
    if (!orderCode || orderCode.length > 64) throw new Error('Mã hóa đơn không hợp lệ.');

    return {
        order_code: orderCode,
        customer_id: orderData.customerId || null,
        customer_name: String(orderData.customerName || 'Khách lẻ').slice(0, 255),
        customer_phone: orderData.customerPhone || null,
        subtotal: Number(orderData.subtotal || 0),
        discount: orderData.isEcommerce ? 0 : Number(orderData.discount || 0),
        total: Number(orderData.total || 0),
        amount_received: orderData.isEcommerce ? 0 : Number(orderData.amountReceived || 0),
        change_amount: orderData.isEcommerce ? 0 : Number(orderData.changeAmount || 0),
        note: orderData.note || null,
        order_type: orderData.isEcommerce ? 'ecommerce' : 'retail',
        ecommerce_platform: orderData.ecommercePlatform || null,
        payment_method: orderData.paymentMethod || 'cash',
        seller_employee_id: orderData.sellerEmployeeId || null
    };
}

export function buildAtomicCheckoutPayload({ orderData = {}, cartItems = [] } = {}) {
    if (!canUseAtomicCheckout({ orderData, cartItems })) {
        throw new Error('Đơn hàng không phù hợp với luồng thanh toán nguyên tử.');
    }
    const orderPayload = buildAtomicOrderPayload(orderData);

    return {
        p_idempotency_key: orderPayload.order_code,
        p_order: orderPayload,
        p_items: cartItems.map((item, index) => {
            const stockQuantity = Number(item.quantity || 0)
                * (Number(item.conversionRate || 1) || 1);
            const batches = Array.isArray(item.batches) ? item.batches : [];
            const allocations = batches.length > 0
                ? planFefoBatchAllocations({
                    requiredQuantity: stockQuantity,
                    batches,
                    preferredBatchId: item.batchId || null
                })
                : [{
                    batchId: item.batchId || null,
                    quantity: stockQuantity
                }];

            return {
                product_id: item.productId || item.id,
                preferred_batch_id: item.batchId || null,
                product_name: String(item.name || '').slice(0, 255),
                product_code: item.code || item.product_code || null,
                unit_name: item.unit || null,
                unit_price: Number(item.price || 0),
                quantity: Number(item.quantity || 0),
                stock_quantity: stockQuantity,
                batch_allocations: allocations.map(allocation => ({
                    batch_id: allocation.batchId,
                    stock_quantity: Number(allocation.quantity || 0)
                })),
                total_price: Number(item.price || 0) * Number(item.quantity || 0),
                sort_index: index * 100
            };
        })
    };
}
