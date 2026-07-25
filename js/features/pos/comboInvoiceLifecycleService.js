import { supabaseClient } from '../../core/supabase.js';
import {
    cancelOrder,
    createReturnOrder,
    fetchOrderDetail
} from './orderService.js';
import {
    assertComboOrderReversible,
    assertReturnQuantitiesWithinSource
} from './comboInvoiceLifecycleRules.js';

export async function cancelOrderWithComboIntegrity(orderId, reason = '') {
    const order = await fetchOrderDetail(orderId);
    if (order?.status !== 'cancelled') {
        assertComboOrderReversible(order);
    }
    return cancelOrder(orderId, reason);
}

export async function fetchReturnedQuantitiesBySourceItem(
    sourceItemIds = [],
    client = supabaseClient
) {
    const ids = [...new Set((sourceItemIds || []).map(String).filter(Boolean))];
    const returnedBySourceId = new Map();
    if (ids.length === 0) return returnedBySourceId;
    if (!client) throw new Error('Supabase chưa được kết nối.');

    const { data, error } = await client
        .from('order_items')
        .select('source_order_item_id, quantity, orders!inner(status)')
        .in('source_order_item_id', ids)
        .lt('quantity', 0);
    if (error) {
        if (String(error.message || '').includes('source_order_item_id')) {
            throw new Error('Chưa áp dụng migration chống trả hàng vượt số lượng.');
        }
        throw error;
    }

    (data || []).forEach(row => {
        const orderStatus = Array.isArray(row.orders) ? row.orders[0]?.status : row.orders?.status;
        if (orderStatus === 'cancelled') return;
        const key = String(row.source_order_item_id || '');
        returnedBySourceId.set(
            key,
            Number(returnedBySourceId.get(key) || 0) + Math.abs(Number(row.quantity || 0))
        );
    });
    return returnedBySourceId;
}

export async function createReturnOrderWithComboIntegrity(
    sourceOrder,
    orderData,
    cartItems,
    options = {}
) {
    assertComboOrderReversible(sourceOrder);
    const sourceItemIds = (cartItems || [])
        .filter(item => item?.originalQuantity !== undefined && Number(item?.quantity || 0) > 0)
        .map(item => item.sourceOrderItemId)
        .filter(Boolean);
    const returnedBySourceId = await fetchReturnedQuantitiesBySourceItem(
        sourceItemIds,
        options.client || supabaseClient
    );
    assertReturnQuantitiesWithinSource({
        sourceOrder,
        cartItems,
        returnedBySourceId
    });
    const returnItemsWithHistory = (cartItems || []).map(item => ({
        ...item,
        alreadyReturnedQuantity: item?.sourceOrderItemId
            ? Number(returnedBySourceId.get(String(item.sourceOrderItemId)) || 0)
            : 0
    }));
    return createReturnOrder(sourceOrder, orderData, returnItemsWithHistory, options);
}
