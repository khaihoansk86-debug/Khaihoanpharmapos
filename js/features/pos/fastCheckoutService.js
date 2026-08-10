import {
    buildAtomicCheckoutPayload,
    canUseAtomicCheckout
} from './fastCheckoutRules.js';
import {
    buildAtomicComboCheckoutPayload,
    canUseAtomicComboCheckout
} from './comboAtomicCheckoutRules.js';
import { normalizeLegacyCheckoutCartItems } from './comboCheckoutAdapter.js';
import { normalizeInternalIssueCheckoutItems } from './internalIssueCheckoutAdapter.js';

function isMissingRpc(error, rpcName) {
    const message = String(error?.message || '').toLowerCase();
    return error?.code === 'PGRST202'
        || (message.includes(rpcName) && message.includes('not find'));
}

function isIncompleteOrderConflict(error) {
    const message = String(error?.message || '').toLowerCase();
    return message.includes('order_incomplete_requires_review')
        || message.includes('incomplete_requires_review');
}

export async function createOrderWithAtomicFastPath(orderData, cartItems, options = {}) {
    const client = options.client;
    const fallback = options.fallback;
    if (typeof fallback !== 'function') throw new Error('Thiếu luồng lưu hóa đơn dự phòng.');

    const useComboAtomic = canUseAtomicComboCheckout({ orderData, cartItems });
    const useStandardAtomic = canUseAtomicCheckout({ orderData, cartItems });
    const fallbackItems = normalizeInternalIssueCheckoutItems(
        orderData,
        normalizeLegacyCheckoutCartItems(cartItems)
    );
    if (!client || (!useComboAtomic && !useStandardAtomic)) {
        return fallback(orderData, fallbackItems);
    }

    const rpcName = useComboAtomic
        ? 'create_pos_combo_order_atomic'
        : 'create_pos_order_atomic';
    const payload = useComboAtomic
        ? buildAtomicComboCheckoutPayload({ orderData, cartItems })
        : buildAtomicCheckoutPayload({ orderData, cartItems });
    const { data, error } = await client.rpc(rpcName, payload);
    if (!error) return data;
    // Recover a draft left by an interrupted attempt through the legacy
    // workflow, which reconciles an empty idempotency record safely.
    if (isMissingRpc(error, rpcName) || isIncompleteOrderConflict(error)) {
        return fallback(orderData, fallbackItems);
    }
    throw error;
}
