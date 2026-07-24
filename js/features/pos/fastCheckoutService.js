import {
    buildAtomicCheckoutPayload,
    canUseAtomicCheckout
} from './fastCheckoutRules.js';

function isMissingRpc(error) {
    const message = String(error?.message || '').toLowerCase();
    return error?.code === 'PGRST202'
        || (message.includes('create_pos_order_atomic') && message.includes('not find'));
}

export async function createOrderWithAtomicFastPath(orderData, cartItems, options = {}) {
    const client = options.client;
    const fallback = options.fallback;
    if (typeof fallback !== 'function') throw new Error('Thiếu luồng lưu hóa đơn dự phòng.');

    if (!client || !canUseAtomicCheckout({ orderData, cartItems })) {
        return fallback(orderData, cartItems);
    }

    const payload = buildAtomicCheckoutPayload({ orderData, cartItems });
    const { data, error } = await client.rpc('create_pos_order_atomic', payload);
    if (!error) return data;
    if (isMissingRpc(error)) return fallback(orderData, cartItems);
    throw error;
}
