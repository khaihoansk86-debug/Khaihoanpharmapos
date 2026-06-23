// js/features/pos/orderService.js
import { supabaseClient } from '../../core/supabase.js';
import { saveInventoryDocument } from '../inventory/inventoryService.js';
import { logActivity } from '../logs/auditService.js';
import { reversePaymentFromShiftForOrder } from './shiftSyncService.js';
import {
    buildInventoryIssueLine,
    buildPOSInventoryIssueNote,
    getBaseCostPrice,
    getOrderItemStockRestoreQuantity,
    getStockQuantityToDeduct,
    isDoseIngredientIssueItem,
    POS_INVENTORY_REF_PREFIX
} from './inventoryIssueRules.js';

function formatDateLocal(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

function generateOrderCode() {
    const now = new Date();
    const dateStr = formatDateLocal(now);
    const timeStr = now.getTime().toString().slice(-4);
    return `HD${dateStr}${timeStr}`;
}

function generateReturnOrderCode() {
    const now = new Date();
    const dateStr = formatDateLocal(now);
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
function isValidUUID(uuid) {
    if (!uuid || typeof uuid !== 'string') return false;
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
}

function getProductId(item) {
    if (!item) return null;
    const pid = item.productId || item.id;
    return isValidUUID(pid) ? pid : null;
}

function parseDescription(item) {
    try {
        return item.description ? JSON.parse(item.description) : null;
    } catch (e) {
        return null;
    }
}

function isDoseCategoryItem(item) {
    const categoryName = String(item.categoryName || '').toLowerCase();
    return item.categoryId === 'f59542da-6c03-46df-b056-7c26229ab118'
        || categoryName.includes('cắt liều')
        || categoryName.includes('thuốc liều')
        || categoryName.includes('cat lieu')
        || categoryName.includes('thuoc lieu');
}

function isDosePackageLine(item) {
    const desc = parseDescription(item);
    const code = item.code || item.product_code || '';
    if (desc?.is_dose_retail === true) return true;
    if (item.isIngredient === true || item.channelPriceType === 'dose_ingredient') return false;
    return code.startsWith('DOSE-') || isDoseCategoryItem(item);
}

function shouldSkipStockForItem(item, orderData = {}) {
    if (orderData.isInternal || orderData.isEcommerce) return false;
    return isDosePackageLine(item);
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

async function assertSufficientStock(cartItems, options = {}) {
    if (options.isOfflineSync) return; // Bỏ qua kiểm tra tồn kho nghiêm ngặt khi đồng bộ đơn hàng offline để tránh chặn việc đồng bộ
    const requiredByProduct = new Map();
    const orderData = options.orderData || {};

    cartItems.forEach(item => {
        const productId = getProductId(item);
        if (!productId) return;

        // Only dose package lines are stockless; dose ingredients must deduct stock.
        if (shouldSkipStockForItem(item, orderData)) return;

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

async function deductStockForItem(item, options = {}) {
    const productId = getProductId(item);
    if (!productId) return;

    // Only dose package lines are stockless; dose ingredients must deduct stock.
    if (shouldSkipStockForItem(item, options.orderData || {})) return;

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
            await deductStockForItem(childItem, options);
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

        if (error || !batch) {
            if (options.isOfflineSync) {
                console.warn(`Không tìm thấy lô hàng đã chọn cho ${item.name} khi đồng bộ offline. Chuyển xuống FEFO.`);
                item.batchId = null; // Chuyển xuống FEFO
            } else {
                throw new Error(`Không tìm thấy lô hàng đã chọn cho ${item.name}.`);
            }
        } else {
            const currentStock = Number(batch.stock_quantity || 0);
            if (currentStock < remainingQty) {
                if (options.isOfflineSync) {
                    console.warn(`Đồng bộ offline: Lô ${batch.batch_number} của ${item.name} không đủ tồn kho (cần ${remainingQty}, còn ${currentStock}). Trừ về tối thiểu 0.`);
                } else {
                    throw new Error(`Lô ${batch.batch_number} của ${item.name} không đủ tồn kho (cần ${remainingQty}, còn ${currentStock}).`);
                }
            }

            const { error: updateErr } = await supabaseClient
                .from('product_batches')
                .update({ stock_quantity: Math.max(0, currentStock - remainingQty) })
                .eq('id', batch.id);

            if (updateErr) throw updateErr;
            return;
        }
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

    if (remainingQty > 0 && !options.isOfflineSync) {
        throw new Error(`Không thể trừ đủ tồn kho cho ${item.name}.`);
    }
}

async function filterExistingProductsAndBatches(cartItems) {
    const productIds = [...new Set(cartItems.map(item => getProductId(item)).filter(isValidUUID))];
    const batchIds = [...new Set(cartItems.map(item => item.batchId).filter(isValidUUID))];

    let existingProductIds = new Set();
    let existingBatchIds = new Set();

    if (productIds.length > 0) {
        try {
            const { data: products } = await supabaseClient
                .from('products')
                .select('id')
                .in('id', productIds);
            if (products) {
                existingProductIds = new Set(products.map(p => p.id));
            }
        } catch (e) {
            console.warn("Lỗi kiểm tra product existence:", e);
        }
    }

    if (batchIds.length > 0) {
        try {
            const { data: batches } = await supabaseClient
                .from('product_batches')
                .select('id')
                .in('id', batchIds);
            if (batches) {
                existingBatchIds = new Set(batches.map(b => b.id));
            }
        } catch (e) {
            console.warn("Lỗi kiểm tra batch existence:", e);
        }
    }

    return { existingProductIds, existingBatchIds };
}

async function createInventoryIssueTrail({ items = [], order, orderData = {}, reason = 'sample', label = 'Xuất kho POS', required = false }) {
    const issueItems = items.filter(item => getProductId(item) && Math.abs(getStockQuantityToDeduct(item)) > 0);
    if (issueItems.length === 0) {
        if (required) throw new Error('Không có dòng nguyên liệu hợp lệ để tạo phiếu xuất kho.');
        return null;
    }

    const note = buildPOSInventoryIssueNote({
        orderId: order?.id,
        orderCode: order?.order_code,
        label,
        note: orderData.note
    });

    try {
        const movementPayloads = issueItems.map(item => ({
            product_id: getProductId(item),
            batch_id: item.batchId || null,
            movement_type: 'internal_use',
            quantity_base: -Math.abs(getStockQuantityToDeduct(item)),
            cost_price: getBaseCostPrice(item),
            reason,
            note
        }));

        const { error: moveErr } = await supabaseClient
            .from('inventory_movements')
            .insert(movementPayloads);

        if (moveErr) {
            console.warn('Lỗi ghi nhận inventory_movements từ POS:', moveErr.message);
            if (required) throw moveErr;
        }

        const lines = issueItems.map(item => buildInventoryIssueLine(item, reason));
        const documentId = await saveInventoryDocument({
            documentType: 'internal_use',
            note,
            lines,
            throwOnError: required
        });
        if (required && !documentId) throw new Error('Không tạo được phiếu xuất kho cho đơn POS.');
        return documentId;
    } catch (docErr) {
        console.warn('Không tự động tạo được phiếu xuất kho từ POS:', docErr.message);
        if (required) throw docErr;
        return null;
    }
}

async function cancelLinkedInventoryDocuments(order, reason = '') {
    if (!order?.id || !supabaseClient) return;
    const ref = `${POS_INVENTORY_REF_PREFIX}${order.id}]`;
    const { data: docs, error } = await supabaseClient
        .from('inventory_documents')
        .select('id, note, status')
        .eq('document_type', 'internal_use')
        .ilike('note', `%${ref}%`);

    if (error) {
        console.warn('Không tìm được phiếu xuất liên kết POS để hủy:', error.message);
        return;
    }

    for (const doc of docs || []) {
        if (doc.status === 'cancelled') continue;
        const cancelNote = `${doc.note || ''} [HỦY THEO HĐ: ${order.order_code || order.id}${reason ? ` - ${reason}` : ''}]`;
        const { error: updateErr } = await supabaseClient
            .from('inventory_documents')
            .update({ status: 'cancelled', note: cancelNote })
            .eq('id', doc.id);
        if (updateErr) console.warn('Không hủy được phiếu xuất liên kết POS:', updateErr.message);
    }
}

/**
 * Lưu hóa đơn + chi tiết + trừ tồn kho — tất cả trong 1 lần gọi
 */
export async function createOrder(orderData, cartItems, options = {}) {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');
    if (!cartItems || cartItems.length === 0) throw new Error('Giỏ hàng trống.');
    const payableItems = cartItems.filter(item => Number(item.quantity || 0) > 0);
    if (payableItems.length === 0) throw new Error('Giỏ hàng không có sản phẩm cần thanh toán.');

    const stockOptions = { ...options, orderData };
    await assertSufficientStock(cartItems, stockOptions);

    const isInternal = orderData.isInternal === true;
    const isEcommerce = orderData.isEcommerce === true;
    const isStockExport = isInternal || isEcommerce;
    const customer = isInternal ? null : await ensureCustomerForOrder(orderData);
    const orderCode = orderData.orderCode || generateOrderCode();

    const subtotalValue = isInternal ? -Math.abs(orderData.subtotal || 0) : (orderData.subtotal || 0);
    const discountValue = isStockExport ? 0 : (orderData.discount || 0);
    const totalValue = isInternal ? -Math.abs(orderData.total || 0) : (orderData.total || 0);
    const amountReceivedValue = isStockExport ? 0 : (orderData.amountReceived || 0);
    const changeAmountValue = isStockExport ? 0 : (orderData.changeAmount || 0);

    let order, orderErr;
    const orderPayload = {
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
        order_type:      isEcommerce ? 'ecommerce' : (isInternal ? 'internal' : 'retail'),
        ecommerce_platform: orderData.ecommercePlatform || null,
        payment_method:  orderData.paymentMethod || 'cash'
    };

    const insertResult = await supabaseClient
        .from('orders')
        .insert([orderPayload])
        .select()
        .single();
    order = insertResult.data;
    orderErr = insertResult.error;

    if (orderErr && (orderErr.message?.includes('customer_id') || orderErr.message?.includes('schema cache'))) {
        const fallbackPayload = { ...orderPayload };
        delete fallbackPayload.customer_id;
        const fallbackResult = await supabaseClient
            .from('orders')
            .insert([fallbackPayload])
            .select()
            .single();
        order = fallbackResult.data;
        orderErr = fallbackResult.error;
    }

    if (orderErr && (orderErr.code === '23505' || orderErr.message?.includes('23505') || orderErr.message?.toLowerCase().includes('duplicate key'))) {
        console.warn(`Đơn hàng ${orderCode} đã tồn tại trên server. Đang xác minh tính toàn vẹn...`);
        const { data: existingOrder } = await supabaseClient
            .from('orders')
            .select('id')
            .eq('order_code', orderCode)
            .maybeSingle();
            
        if (existingOrder) {
            const { data: dbItems } = await supabaseClient
                .from('order_items')
                .select('id')
                .eq('order_id', existingOrder.id);
            
            if (dbItems && dbItems.length > 0) {
                console.log(`Đơn hàng ${orderCode} đã tồn tại và có đầy đủ ${dbItems.length} mặt hàng. Bỏ qua ghi đè.`);
                return existingOrder;
            } else {
                console.warn(`Đơn hàng ${orderCode} bị thiếu items trên server. Xóa bản ghi rỗng để tạo lại...`);
                await supabaseClient.from('orders').delete().eq('id', existingOrder.id);
                const retryResult = await supabaseClient
                    .from('orders')
                    .insert([orderPayload])
                    .select()
                    .single();
                order = retryResult.data;
                orderErr = retryResult.error;
            }
        }
    }

    if (orderErr) throw orderErr;

        // Trong chế độ Bán cắt liều, KHÔNG lọc bỏ các dòng thành phần (isIngredient = true) khỏi order_items
    // để ghi nhận giá vốn phục vụ thống kê, so sánh định lượng.
    // Các dòng thành phần này sẽ có giá bán (unit_price) = 0 và doanh thu (total_price) = 0.
    const filteredItems = payableItems;
    const { existingProductIds, existingBatchIds } = await filterExistingProductsAndBatches(filteredItems);

    const itemsToInsert = filteredItems.map(item => {
        const isIng = orderData.isDoseCut && item.isIngredient;
        const price = isIng ? 0 : item.price;
        const pid = getProductId(item);
        const bid = isValidUUID(item.batchId) ? item.batchId : null;
        return {
            order_id:     order.id,
            product_id:   existingProductIds.has(pid) ? pid : null,
            batch_id:     existingBatchIds.has(bid) ? bid : null,
            product_name: item.name,
            product_code: item.code,
            unit_name:    item.unit,
            unit_price:   isInternal ? -Math.abs(price) : price,
            quantity:     Math.abs(item.quantity), // Must be positive to comply with check constraint "order_items_quantity_check"
            total_price:  isInternal ? -Math.abs(price * item.quantity) : (price * item.quantity)
        };
    });

    const { data: insertedItems, error: itemsErr } = await supabaseClient
        .from('order_items')
        .insert(itemsToInsert)
        .select();

    if (itemsErr) throw itemsErr;

    for (const item of cartItems) {
        await deductStockForItem(item, stockOptions);
    }

    if (isInternal) {
        await createInventoryIssueTrail({
            items: filteredItems,
            order,
            orderData,
            reason: orderData.internalReason || 'sample',
            label: 'Xuất nội bộ POS'
        });
        try {
            await logActivity('internal_use', {
                order_code: orderCode,
                reason: orderData.internalReason || 'sample',
                note: orderData.note || 'Dùng nội bộ',
                items: filteredItems.map(item => ({
                    product_id: getProductId(item),
                    product_name: item.name,
                    product_code: item.code,
                    batch_number: (item.batchNo && item.batchNo !== 'Chưa chọn lô') ? item.batchNo : (item.batchNumber || null),
                    quantity: Math.abs(getStockQuantityToDeduct(item)),
                    base_unit: item.unit,
                    reason: orderData.internalReason || 'sample'
                }))
            });
        } catch (logErr) {
            console.warn('Lỗi ghi log xuất hủy/dùng nội bộ từ POS:', logErr);
        }
    } else if (orderData.isDoseCut) {
        const doseIngredientItems = filteredItems.filter(item => !shouldSkipStockForItem(item, orderData));
        await createInventoryIssueTrail({
            items: doseIngredientItems.length > 0 ? doseIngredientItems : filteredItems.filter(isDoseIngredientIssueItem),
            order,
            orderData,
            reason: 'dose_cutting',
            label: 'Xuất thuốc liều',
            required: doseIngredientItems.length > 0
        });
    } else {
        await updateCustomerMetrics(customer, orderData);
    }

    // Tự động quét và dọn dẹp hàng bán một lần nếu đã bán hết
    const productIdsToCheck = [...new Set(payableItems.map(item => getProductId(item)).filter(Boolean))];
    await cleanOneTimeProducts(productIdsToCheck);
    
    return order;
}
export async function createReturnOrder(sourceOrder, orderData, cartItems, options = {}) {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');

    const returnItems = (cartItems || []).filter(item => item.originalQuantity !== undefined && Number(item.quantity || 0) > 0);
    const newItems = (cartItems || []).filter(item => item.originalQuantity === undefined && Number(item.quantity || 0) > 0);
    
    if (returnItems.length === 0 && newItems.length === 0) throw new Error('Chưa chọn sản phẩm nào.');

    const returnSubtotal = returnItems.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)), 0);
    const newSubtotal = newItems.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)), 0);
    
    const finalSubtotal = newSubtotal - returnSubtotal;
    const finalTotal = finalSubtotal - Number(orderData.discount || 0);

    const orderCode = orderData.orderCode || generateReturnOrderCode();
    const noteParts = [
        `Trả hàng từ hóa đơn ${sourceOrder?.order_code || ''}`.trim(),
        orderData.note || null
    ].filter(Boolean);

        let order, orderErr;
    const orderPayload = {
        order_code:      orderCode,
        customer_name:   orderData.customerName || sourceOrder?.customer_name || 'Khách lẻ',
        customer_phone:  orderData.customerPhone || sourceOrder?.customer_phone || null,
        subtotal:        finalSubtotal,
        discount:        Number(orderData.discount || 0),
        total:           finalTotal,
        amount_received: Number(orderData.amountReceived || 0),
        change_amount:   Math.max(0, Number(orderData.amountReceived || 0) - finalTotal),
        note:            noteParts.join(' - '),
        status:          'completed',
        payment_method:  orderData.paymentMethod || 'cash'
    };

    const insertResult = await supabaseClient
        .from('orders')
        .insert([orderPayload])
        .select()
        .single();
    order = insertResult.data;
    orderErr = insertResult.error;

    if (orderErr && (orderErr.code === '23505' || orderErr.message?.includes('23505') || orderErr.message?.toLowerCase().includes('duplicate key'))) {
        console.warn(`Đơn trả hàng ${orderCode} đã tồn tại trên server. Đang xác minh tính toàn vẹn...`);
        const { data: existingOrder } = await supabaseClient
            .from('orders')
            .select('id')
            .eq('order_code', orderCode)
            .maybeSingle();

        if (existingOrder) {
            const { data: dbItems } = await supabaseClient
                .from('order_items')
                .select('id')
                .eq('order_id', existingOrder.id);

            if (dbItems && dbItems.length > 0) {
                console.log(`Đơn trả hàng ${orderCode} đã tồn tại và có đầy đủ ${dbItems.length} mặt hàng. Bỏ qua ghi đè.`);
                return existingOrder;
            } else {
                console.warn(`Đơn trả hàng ${orderCode} bị thiếu items trên server. Xóa bản ghi rỗng để tạo lại...`);
                await supabaseClient.from('orders').delete().eq('id', existingOrder.id);
                const retryResult = await supabaseClient
                    .from('orders')
                    .insert([orderPayload])
                    .select()
                    .single();
                order = retryResult.data;
                orderErr = retryResult.error;
            }
        }
    }

    if (orderErr) throw orderErr;

    const { existingProductIds, existingBatchIds } = await filterExistingProductsAndBatches(cartItems);

    const itemsToInsert = [
        ...returnItems.map(item => {
            const pid = getProductId(item);
            const bid = isValidUUID(item.batchId) ? item.batchId : null;
            return {
                order_id:     order.id,
                product_id:   existingProductIds.has(pid) ? pid : null,
                batch_id:     existingBatchIds.has(bid) ? bid : null,
                product_name: item.name,
                product_code: item.code,
                unit_name:    item.unit,
                unit_price:   item.price,
                quantity:     -Math.abs(Number(item.quantity || 0)),
                total_price:  -(Number(item.price || 0) * Math.abs(Number(item.quantity || 0)))
            };
        }),
        ...newItems.map(item => {
            const pid = getProductId(item);
            const bid = isValidUUID(item.batchId) ? item.batchId : null;
            return {
                order_id:     order.id,
                product_id:   existingProductIds.has(pid) ? pid : null,
                batch_id:     existingBatchIds.has(bid) ? bid : null,
                product_name: item.name,
                product_code: item.code,
                unit_name:    item.unit,
                unit_price:   item.price,
                quantity:     item.quantity,
                total_price:  item.price * item.quantity
            };
        })
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

    // Ghi log hoạt động trả hàng
    try {
        await logActivity('return', {
            order_code: orderCode,
            source_order_code: sourceOrder?.order_code || 'N/A',
            customer_name: orderPayload.customer_name,
            customer_phone: orderPayload.customer_phone,
            total_amount: finalTotal,
            returned_items: returnItems.map(item => ({
                product_id: item.id || item.productId,
                product_name: item.name,
                product_code: item.code,
                quantity: Number(item.quantity || 0),
                unit: item.unit,
                price: Number(item.price || 0)
            }))
        });
    } catch (logErr) {
        console.warn('Lỗi ghi log trả hàng:', logErr);
    }

    return order;
}

export async function fetchOrders({ dateFrom, dateTo, search, limit = 50, orderType = 'retail' } = {}) {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');
    let query = supabaseClient.from('orders').select('*').order('created_at', { ascending: false }).limit(limit);
    if (orderType === 'ecommerce') {
        query = query.eq('order_type', 'ecommerce');
    } else if (orderType === 'retail') {
        query = query.or('order_type.eq.retail,order_type.is.null');
    } else if (orderType === 'internal') {
        query = query.eq('order_type', 'internal');
    }
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
            let conversionRate = 1;
            if (item.product_id && item.unit_name) {
                const { data: unit } = await supabaseClient
                    .from('product_units')
                    .select('conversion_rate')
                    .eq('product_id', item.product_id)
                    .eq('unit_name', item.unit_name)
                    .maybeSingle();
                conversionRate = Number(unit?.conversion_rate || 1) || 1;
            }
            await supabaseClient
                .from('product_batches')
                .update({ stock_quantity: Number(batch.stock_quantity || 0) + getOrderItemStockRestoreQuantity(item, conversionRate) })
                .eq('id', item.batch_id);
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

export async function replaceOrder(orderId, orderData, cartItems, options = {}) {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');
    const order = await fetchOrderDetail(orderId);
    await restoreStockForItems(order.items);
    await supabaseClient.from('order_items').delete().eq('order_id', orderId);

        const payableItems = (cartItems || []).filter(item => Number(item.quantity || 0) > 0);
    if (payableItems.length > 0) {
        const { existingProductIds, existingBatchIds } = await filterExistingProductsAndBatches(payableItems);
        const itemsToInsert = payableItems.map(item => {
            const pid = getProductId(item);
            const bid = isValidUUID(item.batchId) ? item.batchId : null;
            return {
                order_id:     orderId,
                product_id:   existingProductIds.has(pid) ? pid : null,
                batch_id:     existingBatchIds.has(bid) ? bid : null,
                product_name: item.name,
                product_code: item.code,
                unit_name:    item.unit,
                unit_price:   item.price,
                quantity:     item.quantity,
                total_price:  item.price * item.quantity
            };
        });
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
        status: 'completed',
        payment_method: orderData.paymentMethod || 'cash'
    }).eq('id', orderId).select().single();

    if (error) throw error;
    return data;
}

export async function cancelOrder(orderId, reason = '') {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');
    const order = await fetchOrderDetail(orderId);
    if (order.status === 'cancelled') {
        await cancelLinkedInventoryDocuments(order, reason);
        return order;
    }

    const { data, error } = await supabaseClient.from('orders').update({ status: 'cancelled', note: reason }).eq('id', orderId).select().single();
    if (error) throw error;
    await reversePaymentFromShiftForOrder(order);
    await restoreStockForItems(order.items);
    await cancelLinkedInventoryDocuments(order, reason);
    return data;
}

export async function cleanOneTimeProducts(productIds) {
    if (!supabaseClient || !productIds || productIds.length === 0) return;
    try {
        const { data: products, error } = await supabaseClient
            .from('products')
            .select('id, description')
            .in('id', productIds);
        
        if (error || !products) return;

        const oneTimeProductIds = [];
        products.forEach(p => {
            if (p.description) {
                try {
                    const descObj = JSON.parse(p.description);
                    if (descObj && descObj.is_one_time === true) {
                        oneTimeProductIds.push(p.id);
                    }
                } catch (e) {}
            }
        });

        if (oneTimeProductIds.length === 0) return;

        const { data: batches, error: batchErr } = await supabaseClient
            .from('product_batches')
            .select('product_id, stock_quantity')
            .in('product_id', oneTimeProductIds);
        
        if (batchErr || !batches) return;

        const stockMap = new Map();
        oneTimeProductIds.forEach(id => stockMap.set(id, 0));
        batches.forEach(b => {
            const current = stockMap.get(b.product_id) || 0;
            stockMap.set(b.product_id, current + Number(b.stock_quantity || 0));
        });

        const idsToDelete = [];
        for (const [id, stock] of stockMap.entries()) {
            if (stock <= 0) {
                idsToDelete.push(id);
            }
        }

        if (idsToDelete.length > 0) {
            console.log("SW: Tự động dọn dẹp hàng bán một lần đã hết tồn:", idsToDelete);
            await supabaseClient.from('product_batches').delete().in('product_id', idsToDelete);
            await supabaseClient.from('product_units').delete().in('product_id', idsToDelete);
            await supabaseClient.from('products').delete().in('id', idsToDelete);
        }
    } catch (e) {
        console.warn("Lỗi dọn dẹp hàng bán một lần:", e);
    }
}
