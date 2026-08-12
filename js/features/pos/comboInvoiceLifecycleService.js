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

function reconcileReturnSourceIds(cartItems = [], sourceItems = []) {
    const used = new Set();
    return (cartItems || []).map(item => {
        if (item?.originalQuantity === undefined || Number(item?.quantity || 0) <= 0) return item;
        const exact = (sourceItems || []).find(source => String(source.id) === String(item.sourceOrderItemId || ''));
        const fallback = exact || (sourceItems || []).find(source => {
            if (!source?.id || used.has(String(source.id)) || source.line_type === 'combo_component') return false;
            return String(source.product_id || '') === String(item.productId || item.id || '')
                && String(source.unit_name || '') === String(item.unit || '')
                && Number(source.unit_price || 0) === Number(item.price || 0);
        });
        if (!fallback) return item;
        used.add(String(fallback.id));
        return { ...item, sourceOrderItemId: fallback.id };
    });
}

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
    const client = options.client || supabaseClient;
    let resolvedSourceOrder = sourceOrder;
    if (!Array.isArray(resolvedSourceOrder?.items)) {
        if (resolvedSourceOrder?.id) {
            resolvedSourceOrder = await fetchOrderDetail(resolvedSourceOrder.id);
        } else if (resolvedSourceOrder?.order_code) {
            const { data: sourceHeader, error: sourceHeaderError } = await client
                .from('orders')
                .select('id')
                .eq('order_code', resolvedSourceOrder.order_code)
                .maybeSingle();
            if (sourceHeaderError) throw sourceHeaderError;
            if (!sourceHeader?.id) {
                throw new Error(`Không tìm thấy hóa đơn gốc ${resolvedSourceOrder.order_code}.`);
            }
            resolvedSourceOrder = await fetchOrderDetail(sourceHeader.id);
        }
    }

    assertComboOrderReversible(resolvedSourceOrder);
    const reconciledCartItems = reconcileReturnSourceIds(cartItems, resolvedSourceOrder.items || []);
    const sourceItemIds = (reconciledCartItems || [])
        .filter(item => item?.originalQuantity !== undefined && Number(item?.quantity || 0) > 0)
        .map(item => item.sourceOrderItemId)
        .filter(Boolean);
    const returnedBySourceId = await fetchReturnedQuantitiesBySourceItem(
        sourceItemIds,
        client
    );
    assertReturnQuantitiesWithinSource({
        sourceOrder: resolvedSourceOrder,
        cartItems: reconciledCartItems,
        returnedBySourceId
    });
    const returnItemsWithHistory = (reconciledCartItems || []).map(item => ({
        ...item,
        alreadyReturnedQuantity: item?.sourceOrderItemId
            ? Number(returnedBySourceId.get(String(item.sourceOrderItemId)) || 0)
            : 0
    }));
    return createReturnOrder(resolvedSourceOrder, orderData, returnItemsWithHistory, options);
}
