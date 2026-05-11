// js/features/pos/orderService.js
import { supabaseClient } from '../../core/supabase.js';

/**
 * Tạo mã hóa đơn theo định dạng HD + YYYYMMDD + số thứ tự 3 chữ số
 */
function generateOrderCode() {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.getTime().toString().slice(-4);
    return `HD${dateStr}${timeStr}`;
}

function generateReturnOrderCode() {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.getTime().toString().slice(-4);
    return `TH${dateStr}${timeStr}`;
}

function getProductId(item) {
    return item.productId || item.id || null;
}

function getStockQuantityToDeduct(item) {
    return Number(item.quantity || 0) * Number(item.conversionRate || 1);
}

async function getAvailableBatches(productId) {
    const { data, error } = await supabaseClient
        .from('product_batches')
        .select('id, stock_quantity, expiry_date')
        .eq('product_id', productId)
        .gt('stock_quantity', 0)
        .order('expiry_date', { ascending: true });

    if (error) throw error;
    return data || [];
}

async function assertSufficientStock(cartItems) {
    const requiredByProduct = new Map();

    cartItems.forEach(item => {
        const productId = getProductId(item);
        if (!productId) return;

        const current = requiredByProduct.get(productId) || 0;
        requiredByProduct.set(productId, current + getStockQuantityToDeduct(item));
    });

    for (const [productId, requiredQty] of requiredByProduct.entries()) {
        const batches = await getAvailableBatches(productId);
        const availableQty = batches.reduce((sum, batch) => sum + Number(batch.stock_quantity || 0), 0);

        if (availableQty < requiredQty) {
            const item = cartItems.find(cartItem => getProductId(cartItem) === productId);
            throw new Error(`Không đủ tồn kho cho ${item?.name || 'sản phẩm'}: cần ${requiredQty}, còn ${availableQty}.`);
        }
    }
}

async function deductStockForItem(item) {
    const productId = getProductId(item);
    if (!productId) return;

    let remainingQty = getStockQuantityToDeduct(item);

    // Nếu đã chọn lô cụ thể từ POS
    if (item.batchId) {
        const { data: batch, error } = await supabaseClient
            .from('product_batches')
            .select('id, stock_quantity, batch_no')
            .eq('id', item.batchId)
            .single();

        if (error || !batch) throw new Error(`Không tìm thấy lô hàng đã chọn cho ${item.name}.`);
        
        const currentStock = Number(batch.stock_quantity || 0);
        if (currentStock < remainingQty) {
            throw new Error(`Lô ${batch.batch_no} của ${item.name} không đủ tồn kho (cần ${remainingQty}, còn ${currentStock}).`);
        }

        const { error: updateErr } = await supabaseClient
            .from('product_batches')
            .update({ stock_quantity: currentStock - remainingQty })
            .eq('id', batch.id);

        if (updateErr) throw updateErr;
        return;
    }

    // Nếu không chọn lô cụ thể -> dùng FEFO
    const batches = await getAvailableBatches(productId);

    for (const batch of batches) {
        if (remainingQty <= 0) break;

        const currentStock = Number(batch.stock_quantity || 0);
        const deductedQty = Math.min(currentStock, remainingQty);
        const newStock = currentStock - deductedQty;

        const { error } = await supabaseClient
            .from('product_batches')
            .update({ stock_quantity: newStock })
            .eq('id', batch.id);

        if (error) throw error;
        remainingQty -= deductedQty;
    }

    if (remainingQty > 0) {
        throw new Error(`Không thể trừ đủ tồn kho cho ${item.name}.`);
    }
}

/**
 * Lưu hóa đơn + chi tiết + trừ tồn kho — tất cả trong 1 lần gọi
 * @param {Object} orderData - Thông tin hóa đơn
 * @param {Array}  cartItems - Danh sách sản phẩm trong giỏ hàng
 * @returns {Object} - Hóa đơn vừa tạo
 */
export async function createOrder(orderData, cartItems) {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');
    if (!cartItems || cartItems.length === 0) throw new Error('Giỏ hàng trống.');
    const payableItems = cartItems.filter(item => Number(item.quantity || 0) > 0);
    if (payableItems.length === 0) throw new Error('Giỏ hàng không có sản phẩm cần thanh toán.');

    await assertSufficientStock(cartItems);

    // 1. Tạo bản ghi hóa đơn (orders)
    const orderCode = generateOrderCode();
    const { data: order, error: orderErr } = await supabaseClient
        .from('orders')
        .insert([{
            order_code:      orderCode,
            customer_name:   orderData.customerName || 'Khách lẻ',
            customer_phone:  orderData.customerPhone || null,
            subtotal:        orderData.subtotal || 0,
            discount:        orderData.discount || 0,
            total:           orderData.total || 0,
            amount_received: orderData.amountReceived || 0,
            change_amount:   orderData.changeAmount || 0,
            note:            orderData.note || null,
            status:          'completed'
        }])
        .select()
        .single();

    if (orderErr) throw orderErr;

    // 2. Tạo chi tiết hóa đơn (order_items)
    const itemsToInsert = payableItems.map(item => ({
        order_id:     order.id,
        product_id:   getProductId(item),
        batch_id:     item.batchId || null,
        product_name: item.name,
        product_code: item.code,
        unit_name:    item.unit,
        unit_price:   item.price,
        quantity:     item.quantity,
        total_price:  item.price * item.quantity
    }));

    const { data: insertedItems, error: itemsErr } = await supabaseClient
        .from('order_items')
        .insert(itemsToInsert)
        .select();

    if (itemsErr) throw itemsErr;

    // 3. Trừ tồn kho theo FEFO, tính cả quy đổi đơn vị.
    for (const item of cartItems) {
        await deductStockForItem(item);
    }

    return order;
}

export async function createReturnOrder(sourceOrder, orderData, cartItems) {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');

    const returnItems = (cartItems || []).filter(item => Number(item.quantity || 0) > 0);
    if (returnItems.length === 0) throw new Error('Chưa chọn sản phẩm cần trả.');

    const subtotal = returnItems.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)), 0);
    const orderCode = generateReturnOrderCode();
    const noteParts = [
        `Trả hàng từ hóa đơn ${sourceOrder?.order_code || ''}`.trim(),
        orderData.note || null
    ].filter(Boolean);

    const { data: order, error: orderErr } = await supabaseClient
        .from('orders')
        .insert([{
            order_code:      orderCode,
            customer_name:   orderData.customerName || sourceOrder?.customer_name || 'Khách lẻ',
            customer_phone:  orderData.customerPhone || sourceOrder?.customer_phone || null,
            subtotal:        -subtotal,
            discount:        0,
            total:           -subtotal,
            amount_received: 0,
            change_amount:   0,
            note:            noteParts.join(' - '),
            status:          'completed'
        }])
        .select()
        .single();

    if (orderErr) throw orderErr;

    const itemsToInsert = returnItems.map(item => ({
        order_id:     order.id,
        product_id:   item.id || null,
        batch_id:     item.batchId || null,
        product_name: item.name,
        product_code: item.code,
        unit_name:    item.unit,
        unit_price:   item.price,
        quantity:     -Math.abs(Number(item.quantity || 0)),
        total_price:  -(Number(item.price || 0) * Math.abs(Number(item.quantity || 0)))
    }));

    const { error: itemsErr } = await supabaseClient
        .from('order_items')
        .insert(itemsToInsert);

    if (itemsErr) throw itemsErr;

    for (const item of returnItems) {
        if (!item.id) continue;

        let batch = null;
        if (item.batchId) {
            const { data, error } = await supabaseClient
                .from('product_batches')
                .select('id, stock_quantity')
                .eq('id', item.batchId)
                .single();
            if (!error) batch = data;
        }

        if (!batch) {
            const { data, error } = await supabaseClient
                .from('product_batches')
                .select('id, stock_quantity')
                .eq('product_id', item.id)
                .order('expiry_date', { ascending: true })
                .limit(1);
            if (!error && data?.length) batch = data[0];
        }

        if (!batch) continue;

        await supabaseClient
            .from('product_batches')
            .update({ stock_quantity: Number(batch.stock_quantity || 0) + Number(item.quantity || 0) })
            .eq('id', batch.id);
    }

    return order;
}

/**
 * Lấy danh sách hóa đơn (có phân trang và lọc)
 */
export async function fetchOrders({ dateFrom, dateTo, search, limit = 50 } = {}) {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');

    const applyDateFilters = (query) => {
        if (dateFrom) query = query.gte('created_at', dateFrom);
        if (dateTo)   query = query.lte('created_at', dateTo + 'T23:59:59');
        return query;
    };

    if (!search) {
        const query = applyDateFilters(
            supabaseClient
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit)
        );

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    }

    const normalizedSearch = search.replace(/[%_,]/g, '').trim();

    const orderQuery = applyDateFilters(
        supabaseClient
            .from('orders')
            .select('*')
            .or(`order_code.ilike.%${normalizedSearch}%,customer_name.ilike.%${normalizedSearch}%,customer_phone.ilike.%${normalizedSearch}%`)
            .order('created_at', { ascending: false })
            .limit(limit)
    );

    const { data: orderMatches, error: orderErr } = await orderQuery;
    if (orderErr) throw orderErr;

    const { data: itemMatches, error: itemErr } = await supabaseClient
        .from('order_items')
        .select('order_id')
        .or(`product_name.ilike.%${normalizedSearch}%,product_code.ilike.%${normalizedSearch}%`)
        .limit(1000);

    if (itemErr) throw itemErr;

    const itemOrderIds = [...new Set((itemMatches || []).map(item => item.order_id).filter(Boolean))];
    let productOrderMatches = [];

    if (itemOrderIds.length > 0) {
        const productOrderQuery = applyDateFilters(
            supabaseClient
                .from('orders')
                .select('*')
                .in('id', itemOrderIds)
                .order('created_at', { ascending: false })
                .limit(limit)
        );

        const { data, error } = await productOrderQuery;
        if (error) throw error;
        productOrderMatches = data || [];
    }

    const merged = new Map();
    [...(orderMatches || []), ...productOrderMatches].forEach(order => merged.set(order.id, order));

    return [...merged.values()]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, limit);
}

/**
 * Lấy chi tiết 1 hóa đơn kèm danh sách sản phẩm
 */
export async function fetchOrderDetail(orderId) {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');

    const { data: order, error: orderErr } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

    if (orderErr) throw orderErr;

    const { data: items, error: itemsErr } = await supabaseClient
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

    if (itemsErr) throw itemsErr;

    return { ...order, items: items || [] };
}

async function restoreStockForItems(items = []) {
    for (const item of items) {
        if (!item.batch_id) continue;

        const { data: batch, error: batchErr } = await supabaseClient
            .from('product_batches')
            .select('id, stock_quantity')
            .eq('id', item.batch_id)
            .single();

        if (batchErr || !batch) continue;

        await supabaseClient
            .from('product_batches')
            .update({ stock_quantity: (batch.stock_quantity || 0) + (item.quantity || 0) })
            .eq('id', item.batch_id);
    }
}

async function deductStockAndAttachBatches(items = [], insertedItems = []) {
    for (const [index, item] of items.entries()) {
        if (!item.id) continue;

        const { data: batches, error: batchErr } = await supabaseClient
            .from('product_batches')
            .select('id, stock_quantity')
            .eq('product_id', item.id)
            .gt('stock_quantity', 0)
            .order('expiry_date', { ascending: true })
            .limit(1);

        if (batchErr || !batches || batches.length === 0) continue;

        const batch = batches[0];
        await supabaseClient
            .from('product_batches')
            .update({ stock_quantity: Math.max(0, batch.stock_quantity - item.quantity) })
            .eq('id', batch.id);

        const insertedItem = insertedItems?.[index];
        if (insertedItem?.id) {
            await supabaseClient
                .from('order_items')
                .update({ batch_id: batch.id })
                .eq('id', insertedItem.id);
        }
    }
}

/**
 * Cập nhật thông tin hóa đơn không thay đổi chi tiết hàng hóa.
 */
export async function updateOrder(orderId, orderData) {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');

    const subtotal = Number(orderData.subtotal || 0);
    const discount = Math.max(0, Number(orderData.discount || 0));
    const total = Math.max(0, subtotal - discount);
    const amountReceived = Math.max(0, Number(orderData.amountReceived || 0));

    const { data, error } = await supabaseClient
        .from('orders')
        .update({
            customer_name: orderData.customerName || 'Khách lẻ',
            customer_phone: orderData.customerPhone || null,
            discount,
            total,
            amount_received: amountReceived,
            change_amount: Math.max(0, amountReceived - total),
            note: orderData.note || null
        })
        .eq('id', orderId)
        .neq('status', 'cancelled')
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Thay thế toàn bộ chi tiết hóa đơn từ màn POS chỉnh sửa.
 */
export async function replaceOrder(orderId, orderData, cartItems) {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');

    const order = await fetchOrderDetail(orderId);
    if (order.status === 'cancelled') throw new Error('Không thể chỉnh sửa hóa đơn đã hủy.');

    const payableItems = (cartItems || []).filter(item => Number(item.quantity || 0) > 0);
    const subtotal = payableItems.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)), 0);
    const discount = Math.max(0, Number(orderData.discount || 0));
    const total = Math.max(0, subtotal - discount);
    const amountReceived = Math.max(0, Number(orderData.amountReceived || 0));

    if (discount > subtotal) throw new Error('Giảm giá không được lớn hơn tiền hàng.');
    if (amountReceived < total) throw new Error('Tiền khách đưa chưa đủ so với tổng thanh toán.');

    await restoreStockForItems(order.items);

    const { error: deleteErr } = await supabaseClient
        .from('order_items')
        .delete()
        .eq('order_id', orderId);

    if (deleteErr) throw deleteErr;

    let insertedItems = [];
    if (payableItems.length > 0) {
        const itemsToInsert = payableItems.map(item => ({
            order_id:     orderId,
            product_id:   item.id || null,
            batch_id:     item.batchId || null,
            product_name: item.name,
            product_code: item.code,
            unit_name:    item.unit,
            unit_price:   item.price,
            quantity:     item.quantity,
            total_price:  item.price * item.quantity
        }));

        const { data, error: itemsErr } = await supabaseClient
            .from('order_items')
            .insert(itemsToInsert)
            .select();

        if (itemsErr) throw itemsErr;
        insertedItems = data || [];

        await deductStockAndAttachBatches(payableItems, insertedItems);
    }

    const { data, error } = await supabaseClient
        .from('orders')
        .update({
            customer_name: orderData.customerName || 'Khách lẻ',
            customer_phone: orderData.customerPhone || null,
            subtotal,
            discount,
            total,
            amount_received: amountReceived,
            change_amount: Math.max(0, amountReceived - total),
            note: orderData.note || null,
            status: 'completed'
        })
        .eq('id', orderId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Hủy hóa đơn và hoàn tồn kho cho các dòng hàng có batch_id.
 */
export async function cancelOrder(orderId, reason = '') {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');

    const order = await fetchOrderDetail(orderId);
    if (order.status === 'cancelled') throw new Error('Hóa đơn này đã được hủy trước đó.');

    const cancelNote = reason
        ? `${order.note ? `${order.note}\n` : ''}Lý do hủy: ${reason}`
        : order.note;

    const { data, error } = await supabaseClient
        .from('orders')
        .update({
            status: 'cancelled',
            note: cancelNote || null
        })
        .eq('id', orderId)
        .select()
        .single();

    if (error) throw error;

    await restoreStockForItems(order.items);

    return data;
}
