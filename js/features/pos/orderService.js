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
    const itemsToInsert = cartItems.map(item => ({
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

    const { error: itemsErr } = await supabaseClient
        .from('order_items')
        .insert(itemsToInsert);

    if (itemsErr) throw itemsErr;

    // 3. Trừ tồn kho theo FEFO, tính cả quy đổi đơn vị.
    for (const item of cartItems) {
        await deductStockForItem(item);
    }

    return order;
}

/**
 * Lấy danh sách hóa đơn (có phân trang và lọc)
 */
export async function fetchOrders({ dateFrom, dateTo, search, limit = 50 } = {}) {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');

    let query = supabaseClient
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo)   query = query.lte('created_at', dateTo + 'T23:59:59');
    if (search)   query = query.or(`order_code.ilike.%${search}%,customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
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
