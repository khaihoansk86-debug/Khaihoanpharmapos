// js/features/pos/orderService.js
import { supabaseClient } from '../../core/supabase.js';
import { saveInventoryDocument } from '../inventory/inventoryService.js';

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
function getProductId(item) {
    return item.productId || item.id || null;
}

function getStockQuantityToDeduct(item) {
    return Number(item.quantity || 0) * Number(item.conversionRate || 1);
}

export async function getAvailableBatches(productId) {
    // Chế độ Offline: Lấy từ cache sản phẩm trong localStorage
    if (!navigator.onLine) {
        const cached = localStorage.getItem('cache_products_list');
        if (cached) {
            const products = JSON.parse(cached);
            const product = products.find(p => p.id === productId);
            if (product && product.product_batches) {
                return product.product_batches
                    .filter(b => Number(b.stock_quantity) > 0)
                    .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
            }
        }
    }

    if (!supabaseClient) return [];

    try {
        const { data, error } = await supabaseClient
            .from('product_batches')
            .select('id, batch_number, stock_quantity, expiry_date')
            .eq('product_id', productId)
            .gt('stock_quantity', 0)
            .order('expiry_date', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.warn("Lỗi fetch lô hàng:", err);
        return [];
    }
}

async function assertSufficientStock(cartItems) {
    const requiredByProduct = new Map();

    cartItems.forEach(item => {
        const productId = getProductId(item);
        if (!productId) return;

        // Bỏ qua Thuốc cắt liều: cho phép bán âm kho thoải mái
        if (item.categoryId === 'f59542da-6c03-46df-b056-7c26229ab118' || item.categoryName === 'Thuốc cắt liều') return;

        // Kiểm tra xem sản phẩm có phải là Combo không
        let descObj = null;
        try {
            descObj = item.description ? JSON.parse(item.description) : null;
        } catch(e) {}

        if (descObj && descObj.isCombo && descObj.items) {
            // Đây là Combo! Cộng dồn số lượng yêu cầu của các sản phẩm con trong Combo
            descObj.items.forEach(child => {
                const childProductId = child.id;
                const current = requiredByProduct.get(childProductId) || 0;
                const childDeductQty = Number(child.quantity || 1) * Number(item.quantity || 1);
                requiredByProduct.set(childProductId, current + childDeductQty);
            });
            return; // Không check tồn kho cho bản thân vỏ gói combo
        }

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

    // Bỏ qua trừ kho lô đối với Thuốc cắt liều
    if (item.categoryId === 'f59542da-6c03-46df-b056-7c26229ab118' || item.categoryName === 'Thuốc cắt liều') return;

    // Kiểm tra xem sản phẩm có phải là Combo không
    let descObj = null;
    try {
        descObj = item.description ? JSON.parse(item.description) : null;
    } catch(e) {}

    if (descObj && descObj.isCombo && descObj.items) {
        // Đây là Combo! Trừ tồn kho đệ quy cho từng sản phẩm con cấu thành combo
        for (const child of descObj.items) {
            const childItem = {
                id: child.id,
                productId: child.id,
                name: child.name,
                conversionRate: 1,
                quantity: Number(child.quantity || 1) * Number(item.quantity || 1)
            };
            await deductStockForItem(childItem);
        }
        return; // Không trừ kho bản thân vỏ gói combo
    }

    let remainingQty = getStockQuantityToDeduct(item);

    // Nếu đã chọn lô cụ thể từ POS
    if (item.batchId) {
        const { data: batch, error } = await supabaseClient
            .from('product_batches')
            .select('id, stock_quantity, batch_number')
            .eq('id', item.batchId)
            .single();

        if (error || !batch) throw new Error(`Không tìm thấy lô hàng đã chọn cho ${item.name}.`);
        
        const currentStock = Number(batch.stock_quantity || 0);
        if (currentStock < remainingQty) {
            throw new Error(`Lô ${batch.batch_number} của ${item.name} không đủ tồn kho (cần ${remainingQty}, còn ${currentStock}).`);
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
 */
export async function createOrder(orderData, cartItems) {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');
    if (!cartItems || cartItems.length === 0) throw new Error('Giỏ hàng trống.');
    const payableItems = cartItems.filter(item => Number(item.quantity || 0) > 0);
    if (payableItems.length === 0) throw new Error('Giỏ hàng không có sản phẩm cần thanh toán.');

    await assertSufficientStock(cartItems);

    const isInternal = orderData.isInternal === true;
    const customer = isInternal ? null : await ensureCustomerForOrder(orderData);
    const orderCode = generateOrderCode();

    const subtotalValue = isInternal ? -Math.abs(orderData.subtotal || 0) : (orderData.subtotal || 0);
    const discountValue = isInternal ? 0 : (orderData.discount || 0);
    const totalValue = isInternal ? -Math.abs(orderData.total || 0) : (orderData.total || 0);
    const amountReceivedValue = isInternal ? 0 : (orderData.amountReceived || 0);
    const changeAmountValue = isInternal ? 0 : (orderData.changeAmount || 0);

    let { data: order, error: orderErr } = await supabaseClient
        .from('orders')
        .insert([{
            order_code:      orderCode,
            customer_id:      customer?.id || null,
            customer_name:   orderData.customerName || 'Khách lẻ',
            customer_phone:  orderData.customerPhone || null,
            subtotal:        subtotalValue,
            discount:        discountValue,
            total:           totalValue,
            amount_received: amountReceivedValue,
            change_amount:   changeAmountValue,
            note:            orderData.note || null,
            status:          'completed',
            order_type:      orderData.isEcommerce ? 'ecommerce' : (isInternal ? 'internal' : 'retail'),
            ecommerce_platform: orderData.ecommercePlatform || null
        }])
        .select()
        .single();

    if (orderErr && (orderErr.message?.includes('customer_id') || orderErr.message?.includes('schema cache'))) {
        const { data: fallbackOrder, error: fallbackErr } = await supabaseClient
            .from('orders')
            .insert([{
                order_code:      orderCode,
                customer_name:   orderData.customerName || 'Khách lẻ',
                customer_phone:  orderData.customerPhone || null,
                subtotal:        subtotalValue,
                discount:        discountValue,
                total:           totalValue,
                amount_received: amountReceivedValue,
                change_amount:   changeAmountValue,
                note:            orderData.note || null,
                status:          'completed',
                order_type:      orderData.isEcommerce ? 'ecommerce' : (isInternal ? 'internal' : 'retail'),
                ecommerce_platform: orderData.ecommercePlatform || null
            }])
            .select()
            .single();
        order = fallbackOrder;
        orderErr = fallbackErr;
    }

    if (orderErr) throw orderErr;

    // Trong chế độ Bán cắt liều, lọc bỏ các dòng thành phần (isIngredient = true) khỏi order_items
    // để tránh bị tính tiền âm do giá bán là 0đ nhưng vẫn có giá vốn.
    const filteredItems = payableItems.filter(item => {
        if (orderData.isDoseCut && item.isIngredient) return false;
        return true;
    });

    const itemsToInsert = filteredItems.map(item => ({
        order_id:     order.id,
        product_id:   getProductId(item),
        batch_id:     item.batchId || null,
        product_name: item.name,
        product_code: item.code,
        unit_name:    item.unit,
        unit_price:   isInternal ? -Math.abs(item.price) : item.price,
        quantity:     Math.abs(item.quantity), // Must be positive to comply with check constraint "order_items_quantity_check"
        total_price:  isInternal ? -Math.abs(item.price * item.quantity) : (item.price * item.quantity)
    }));

    const { data: insertedItems, error: itemsErr } = await supabaseClient
        .from('order_items')
        .insert(itemsToInsert)
        .select();

    if (itemsErr) throw itemsErr;

    for (const item of cartItems) {
        await deductStockForItem(item);
    }

    if (isInternal) {
        try {
            // Ghi nhận biến động tồn kho chi tiết (inventory_movements)
            const movementPayloads = filteredItems.map(item => ({
                product_id: getProductId(item),
                batch_id: item.batchId || null,
                movement_type: 'internal_use',
                quantity_base: -Math.abs(Number(item.quantity || 0)),
                cost_price: Number(item.costPrice || 0),
                reason: 'sample',
                note: orderData.note || 'Dùng nội bộ'
            }));
            const { error: moveErr } = await supabaseClient
                .from('inventory_movements')
                .insert(movementPayloads);
            
            if (moveErr) {
                console.warn('Lỗi ghi nhận inventory_movements cho Xuất nội bộ:', moveErr.message);
            }

            // Tạo phiếu xuất kho (inventory_documents)
            const lines = filteredItems.map(item => ({
                productId: getProductId(item),
                batchId: item.batchId || null,
                batchNumber: (item.batchNo && item.batchNo !== 'Chưa chọn lô') ? item.batchNo : (item.batchNumber || null),
                expiryDate: item.expiryDate || null,
                quantity: item.quantity,
                costPrice: item.costPrice || 0,
                reason: 'sample'
            }));
            await saveInventoryDocument({
                documentType: 'internal_use',
                note: orderData.note || 'Dùng nội bộ',
                lines
            });
        } catch (docErr) {
            console.warn('Không tự động tạo được phiếu kho PXNB:', docErr.message);
        }
    } else {
        await updateCustomerMetrics(customer, orderData);
    }

    return order;
}
export async function createReturnOrder(sourceOrder, orderData, cartItems) {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');

    const returnItems = (cartItems || []).filter(item => item.originalQuantity !== undefined && Number(item.quantity || 0) > 0);
    const newItems = (cartItems || []).filter(item => item.originalQuantity === undefined && Number(item.quantity || 0) > 0);
    
    if (returnItems.length === 0 && newItems.length === 0) throw new Error('Chưa chọn sản phẩm nào.');

    const returnSubtotal = returnItems.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)), 0);
    const newSubtotal = newItems.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)), 0);
    
    const finalSubtotal = newSubtotal - returnSubtotal;
    const finalTotal = finalSubtotal - Number(orderData.discount || 0);

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
            subtotal:        finalSubtotal,
            discount:        Number(orderData.discount || 0),
            total:           finalTotal,
            amount_received: Number(orderData.amountReceived || 0),
            change_amount:   Math.max(0, Number(orderData.amountReceived || 0) - finalTotal),
            note:            noteParts.join(' - '),
            status:          'completed'
        }])
        .select()
        .single();

    if (orderErr) throw orderErr;

    const itemsToInsert = [
        ...returnItems.map(item => ({
            order_id:     order.id,
            product_id:   item.id || null,
            batch_id:     item.batchId || null,
            product_name: item.name,
            product_code: item.code,
            unit_name:    item.unit,
            unit_price:   item.price,
            quantity:     -Math.abs(Number(item.quantity || 0)),
            total_price:  -(Number(item.price || 0) * Math.abs(Number(item.quantity || 0)))
        })),
        ...newItems.map(item => ({
            order_id:     order.id,
            product_id:   item.id || null,
            batch_id:     item.batchId || null,
            product_name: item.name,
            product_code: item.code,
            unit_name:    item.unit,
            unit_price:   item.price,
            quantity:     item.quantity,
            total_price:  item.price * item.quantity
        }))
    ];

    const { error: itemsErr } = await supabaseClient
        .from('order_items')
        .insert(itemsToInsert);

    if (itemsErr) throw itemsErr;

    if (newItems.length > 0) {
        await deductStockAndAttachBatches(newItems);
    }

    for (const item of returnItems) {
        if (!item.id) continue;
        let batch = null;
        if (item.batchId) {
            const { data } = await supabaseClient.from('product_batches').select('id, stock_quantity').eq('id', item.batchId).single();
            batch = data;
        }
        if (!batch) {
            const { data } = await supabaseClient.from('product_batches').select('id, stock_quantity').eq('product_id', item.id).order('expiry_date', { ascending: true }).limit(1);
            if (data?.length) batch = data[0];
        }
        if (batch) {
            await supabaseClient.from('product_batches').update({ stock_quantity: Number(batch.stock_quantity || 0) + Number(item.quantity || 0) }).eq('id', batch.id);
        }
    }

    return order;
}

export async function fetchOrders({ dateFrom, dateTo, search, limit = 50 } = {}) {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');
    let query = supabaseClient.from('orders').select('*').order('created_at', { ascending: false }).limit(limit);
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59');
    if (search) {
        const s = search.trim();
        query = query.or(`order_code.ilike.%${s}%,customer_name.ilike.%${s}%,customer_phone.ilike.%${s}%`);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

export async function fetchOrderDetail(orderId) {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');
    const { data: order, error: orderErr } = await supabaseClient.from('orders').select('*').eq('id', orderId).single();
    if (orderErr) throw orderErr;
    const { data: items, error: itemsErr } = await supabaseClient.from('order_items').select('*').eq('order_id', orderId);
    if (itemsErr) throw itemsErr;
    return { ...order, items: items || [] };
}

async function restoreStockForItems(items = []) {
    for (const item of items) {
        if (!item.batch_id) continue;
        const { data: batch } = await supabaseClient.from('product_batches').select('id, stock_quantity').eq('id', item.batch_id).single();
        if (batch) {
            await supabaseClient.from('product_batches').update({ stock_quantity: (batch.stock_quantity || 0) + (item.quantity || 0) }).eq('id', item.batch_id);
        }
    }
}

async function deductStockAndAttachBatches(items = []) {
    for (const item of items) {
        if (!item.id) continue;
        const { data: batches } = await supabaseClient.from('product_batches').select('id, stock_quantity').eq('product_id', item.id).gt('stock_quantity', 0).order('expiry_date', { ascending: true }).limit(1);
        if (batches?.length) {
            const batch = batches[0];
            await supabaseClient.from('product_batches').update({ stock_quantity: Math.max(0, batch.stock_quantity - item.quantity) }).eq('id', batch.id);
        }
    }
}

export async function updateOrder(orderId, orderData) {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');
    const { data, error } = await supabaseClient.from('orders').update(orderData).eq('id', orderId).select().single();
    if (error) throw error;
    return data;
}

export async function replaceOrder(orderId, orderData, cartItems) {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');
    const order = await fetchOrderDetail(orderId);
    await restoreStockForItems(order.items);
    await supabaseClient.from('order_items').delete().eq('order_id', orderId);

    const payableItems = (cartItems || []).filter(item => Number(item.quantity || 0) > 0);
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
        await supabaseClient.from('order_items').insert(itemsToInsert);
        await deductStockAndAttachBatches(payableItems);
    }

    const { data, error } = await supabaseClient.from('orders').update({
        customer_name: orderData.customerName,
        customer_phone: orderData.customerPhone,
        subtotal: orderData.subtotal,
        discount: orderData.discount,
        total: orderData.total,
        amount_received: orderData.amountReceived,
        change_amount: orderData.changeAmount,
        note: orderData.note,
        status: 'completed'
    }).eq('id', orderId).select().single();

    if (error) throw error;
    return data;
}

export async function cancelOrder(orderId, reason = '') {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');
    const order = await fetchOrderDetail(orderId);
    const { data, error } = await supabaseClient.from('orders').update({ status: 'cancelled', note: reason }).eq('id', orderId).select().single();
    if (error) throw error;
    await restoreStockForItems(order.items);
    return data;
}
