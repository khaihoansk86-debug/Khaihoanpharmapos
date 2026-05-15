// js/features/pos/orderService.js
import { supabaseClient } from '../../core/supabase.js';

function generateOrderCode() {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.getTime().toString().slice(-4);
    return `HD${dateStr}${timeStr}`;
}

function normalizePhone(phone) {
    return String(phone || '').replace(/\s+/g, '').trim();
}

function buildCustomerCode() {
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `KH${date}${random}`;
}

async function ensureCustomerForOrder(orderData) {
    const phone = normalizePhone(orderData.customerPhone);
    const name = String(orderData.customerName || '').trim();
    if (!phone) return null;

    const { data: existing, error: findError } = await supabaseClient
        .from('customers')
        .select('*')
        .eq('phone', phone)
        .maybeSingle();

    if (findError) {
        console.warn('Không tìm được khách hàng:', findError.message);
        return null;
    }

    if (existing) {
        if (name && name !== existing.full_name && name !== 'Khách lẻ') {
            await supabaseClient
                .from('customers')
                .update({ full_name: name, updated_at: new Date().toISOString() })
                .eq('id', existing.id);
        }
        return existing;
    }

    const { data: created, error: createError } = await supabaseClient
        .from('customers')
        .insert([{
            customer_code: buildCustomerCode(),
            full_name: name || 'Khách lẻ',
            phone,
            customer_group: 'retail',
            is_active: true
        }])
        .select()
        .single();

    if (createError) {
        console.warn('Không tạo được khách hàng từ POS:', createError.message);
        return null;
    }
    return created;
}

async function updateCustomerMetrics(customer, orderData) {
    if (!customer?.id) return;
    const totalSpent = Number(customer.total_spent || 0) + Number(orderData.total || 0);
    const orderCount = Number(customer.order_count || 0) + 1;
    const { error } = await supabaseClient
        .from('customers')
        .update({
            total_spent: totalSpent,
            order_count: orderCount,
            last_purchase_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('id', customer.id);

    if (error) console.warn('Không cập nhật được thống kê khách hàng:', error.message);
}

export async function createOrder(orderData, cartItems) {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');
    if (!cartItems || cartItems.length === 0) throw new Error('Giỏ hàng trống.');

    const customer = await ensureCustomerForOrder(orderData);
    const orderCode = generateOrderCode();
    const orderPayload = {
        order_code:      orderCode,
        customer_id:      customer?.id || null,
        customer_name:   orderData.customerName || 'Khách lẻ',
        customer_phone:  orderData.customerPhone || null,
        subtotal:        orderData.subtotal || 0,
        discount:        orderData.discount || 0,
        total:           orderData.total || 0,
        amount_received: orderData.amountReceived || 0,
        change_amount:   orderData.changeAmount || 0,
        note:            orderData.note || null,
        status:          'completed'
    };

    let { data: order, error: orderErr } = await supabaseClient
        .from('orders')
        .insert([orderPayload])
        .select()
        .single();

    if (orderErr && (orderErr.message?.includes('customer_id') || orderErr.message?.includes('schema cache'))) {
        const { customer_id, ...fallbackPayload } = orderPayload;
        const fallback = await supabaseClient
            .from('orders')
            .insert([fallbackPayload])
            .select()
            .single();
        order = fallback.data;
        orderErr = fallback.error;
    }

    if (orderErr) throw orderErr;

    const itemsToInsert = cartItems.map(item => ({
        order_id:     order.id,
        product_id:   item.id || null,
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

    for (const item of cartItems) {
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
        const newStock = Math.max(0, Number(batch.stock_quantity || 0) - Number(item.quantity || 0));
        await supabaseClient
            .from('product_batches')
            .update({ stock_quantity: newStock })
            .eq('id', batch.id);
    }

    await updateCustomerMetrics(customer, orderData);
    return order;
}

export async function fetchOrders({ dateFrom, dateTo, search, limit = 50 } = {}) {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');

    let query = supabaseClient
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', `${dateTo}T23:59:59`);
    if (search) query = query.or(`order_code.ilike.%${search}%,customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

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
