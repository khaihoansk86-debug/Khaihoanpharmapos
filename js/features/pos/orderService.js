// js/features/pos/orderService.js
import { supabaseClient } from '../../core/supabase.js';
import { saveInventoryDocument } from '../inventory/inventoryService.js?v=20260712a';
import { logActivity } from '../logs/auditService.js';
import { reversePaymentFromShiftForOrder } from './shiftSyncService.js?v=20260712a';
import { reconcileShiftSalesFromOrders } from './shiftRevenueReconciliationService.js?v=20260712a';
import {
    getCancelCustomerMetricDelta,
    getCreateCustomerMetricDelta,
    getReturnCustomerMetricDelta
} from './customerMetricRules.js';
import { executeOrderPersistenceWorkflow } from './orderPersistenceWorkflow.js';
import {
    buildReturnOrderItemsPayload,
    collectComboComponentIds
} from './comboOrderRules.js';
import {
    buildComboComponentRequirements,
    getComboComponentBaseQuantity
} from './comboAvailabilityRules.js';
import {
    getStockQuantityForOrderCancellation,
    getStockQuantityForReturnRestore
} from './orderInventoryReversalRules.js';
import {
    buildInventoryIssueLine,
    buildPOSInventoryIssueNote,
    getBaseCostPrice,
    getStockQuantityToDeduct,
    isDoseIngredientIssueItem,
    POS_INVENTORY_REF_PREFIX
} from './inventoryIssueRules.js';
import {
    getBatchAllocationInventoryDeltas,
    planFefoBatchAllocations
} from './batchAllocationRules.js';

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
    if (orderData.customerId) {
        const { data, error } = await supabaseClient
            .from('customers')
            .select('*')
            .eq('id', orderData.customerId)
            .maybeSingle();
        if (!error && data) return data;
        if (error) console.warn('Khong tim duoc khach hang theo customerId:', error.message);
    }

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

async function adjustCustomerMetrics(customerId, { totalDelta = 0, orderCountDelta = 0 } = {}) {
    if (!customerId) return;

    const { error: rpcError } = await supabaseClient.rpc('adjust_customer_metrics', {
        p_customer_id: customerId,
        p_total_delta: Number(totalDelta || 0),
        p_order_count_delta: Number(orderCountDelta || 0)
    });
    if (!rpcError) return;

    const { data: customer, error: fetchError } = await supabaseClient
        .from('customers')
        .select('total_spent, order_count, last_purchase_at')
        .eq('id', customerId)
        .maybeSingle();
    if (fetchError || !customer) {
        console.warn('Không cập nhật được thống kê khách hàng:', rpcError.message || fetchError?.message);
        return;
    }

    const updatePayload = {
        total_spent: Math.max(0, Number(customer.total_spent || 0) + Number(totalDelta || 0)),
        order_count: Math.max(0, Number(customer.order_count || 0) + Number(orderCountDelta || 0)),
        updated_at: new Date().toISOString()
    };
    if (Number(totalDelta || 0) > 0) updatePayload.last_purchase_at = new Date().toISOString();

    const { error: updateError } = await supabaseClient
        .from('customers')
        .update(updatePayload)
        .eq('id', customerId);
    if (updateError) console.warn('Không cập nhật được thống kê khách hàng:', updateError.message);
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

function createRowId() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return `order-item-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}


function isDosePackageLine(item) {
    const desc = parseDescription(item);
    if (desc?.is_dose_retail === true) return true;
    if (desc?.is_dose_cut === true) return false;
    return false;
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
            .select('id, batch_number, stock_quantity, expiry_date, cost_price')
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
    const productNames = new Map();
    const orderData = options.orderData || {};
    const componentMetaMap = await fetchComboComponentMetaMap(cartItems);
    const comboRequirements = buildComboComponentRequirements(cartItems, [...componentMetaMap.values()]);

    comboRequirements.forEach(requirement => {
        if (requirement.status !== 'ready' || requirement.requiredBaseQuantity === null) {
            throw new Error(`Combo chưa cấu hình đúng sản phẩm hoặc đơn vị cho ${requirement.name}.`);
        }
        requiredByProduct.set(requirement.id, requirement.requiredBaseQuantity);
        productNames.set(requirement.id, requirement.name);
    });

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
            return; // Không check tồn kho cho bản thân vỏ gói combo
        }

        const current = requiredByProduct.get(productId) || 0;
        requiredByProduct.set(productId, current + getStockQuantityToDeduct(item));
        productNames.set(productId, item.name || 'sản phẩm');
    });

    for (const [productId, requiredQty] of requiredByProduct.entries()) {
        const batches = await getAvailableBatches(productId);
        const availableQty = batches.reduce((sum, batch) => sum + Number(batch.stock_quantity || 0), 0);

        if (availableQty < requiredQty) {
            throw new Error(`Không đủ tồn kho cho ${productNames.get(productId) || 'sản phẩm'}: cần ${requiredQty}, còn ${availableQty}.`);
        }
    }
}

async function rollbackInventoryChanges(changes = []) {
    const quantityByBatch = new Map();
    changes.forEach(change => {
        if (!change?.batchId || Number(change.quantity || 0) <= 0) return;
        quantityByBatch.set(
            change.batchId,
            Number(quantityByBatch.get(change.batchId) || 0) + Number(change.quantity || 0)
        );
    });

    for (const [batchId, quantity] of quantityByBatch.entries()) {
        const { data: batch, error: fetchError } = await supabaseClient
            .from('product_batches')
            .select('stock_quantity')
            .eq('id', batchId)
            .single();
        if (fetchError) throw fetchError;
        const { error: updateError } = await supabaseClient
            .from('product_batches')
            .update({ stock_quantity: Number(batch.stock_quantity || 0) + quantity })
            .eq('id', batchId);
        if (updateError) throw updateError;
    }
}

async function rollbackMixedInventoryChanges(changes = []) {
    for (const change of changes) {
        if (!change?.batchId || Number(change.quantity || 0) <= 0) continue;
        const { data: batch, error: fetchError } = await supabaseClient
            .from('product_batches')
            .select('stock_quantity')
            .eq('id', change.batchId)
            .single();
        if (fetchError) throw fetchError;

        const delta = change.direction === 'restore'
            ? -Math.abs(Number(change.quantity || 0))
            : Math.abs(Number(change.quantity || 0));

        const { error: updateError } = await supabaseClient
            .from('product_batches')
            .update({ stock_quantity: Math.max(0, Number(batch.stock_quantity || 0) + delta) })
            .eq('id', change.batchId);
        if (updateError) throw updateError;
    }
}

async function filterExistingProductsAndBatches(cartItems, options = {}) {
    const productIds = [...new Set([
        ...(cartItems || []).map(item => getProductId(item)).filter(isValidUUID),
        ...((options.extraProductIds || []).filter(isValidUUID))
    ])];
    const batchIds = [...new Set([
        ...(cartItems || []).map(item => item.batchId).filter(isValidUUID),
        ...((options.extraBatchIds || []).filter(isValidUUID))
    ])];

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

async function fetchComboComponentMetaMap(cartItems = []) {
    const componentIds = collectComboComponentIds(cartItems).filter(isValidUUID);
    const componentMetaMap = new Map();
    if (componentIds.length === 0) return componentMetaMap;

    const { data, error } = await supabaseClient
        .from('products')
        .select(`
            id,
            name,
            product_code,
            category_id,
            description,
            categories(name),
            product_units(unit_name, conversion_rate, is_base_unit)
        `)
        .in('id', componentIds);

    if (error) throw error;

    (data || []).forEach(product => {
        const baseUnit = product.product_units?.find(unit => unit.is_base_unit) || product.product_units?.[0] || {};
        componentMetaMap.set(product.id, {
            id: product.id,
            name: product.name,
            product_code: product.product_code,
            category_id: product.category_id,
            category_name: product.categories?.name || '',
            description: product.description || null,
            base_unit_name: baseUnit.unit_name || null,
            product_units: product.product_units || []
        });
    });

    return componentMetaMap;
}

async function fetchComboDefinitionMapByProductIds(productIds = []) {
    const comboDefinitionMap = new Map();
    const uniqueIds = [...new Set((productIds || []).filter(isValidUUID))];
    if (uniqueIds.length === 0) return comboDefinitionMap;

    const { data, error } = await supabaseClient
        .from('products')
        .select('id, description')
        .in('id', uniqueIds);

    if (error) throw error;

    (data || []).forEach(product => {
        const definition = parseDescription(product);
        if (definition?.isCombo === true && Array.isArray(definition.items)) {
            comboDefinitionMap.set(product.id, definition);
        }
    });

    return comboDefinitionMap;
}

async function buildBatchPoolForProductIds(productIds = []) {
    const pool = new Map();
    const ids = [...new Set((productIds || []).filter(isValidUUID))];
    if (ids.length === 0) return pool;

    const { data, error } = await supabaseClient
        .from('product_batches')
        .select('id, product_id, batch_number, expiry_date, stock_quantity, cost_price')
        .in('product_id', ids)
        .gt('stock_quantity', 0)
        .order('expiry_date', { ascending: true });

    if (error) throw error;

    (data || []).forEach(batch => {
        const list = pool.get(batch.product_id) || [];
        list.push({
            batchId: batch.id,
            batchNumber: batch.batch_number || '---',
            expiryDate: batch.expiry_date || null,
            remainingQty: Number(batch.stock_quantity || 0),
            costPrice: Number(batch.cost_price || 0)
        });
        pool.set(batch.product_id, list);
    });

    return pool;
}

function reserveBatchAllocations({ productId, quantity, batchPool, preferredBatchId = null, itemName = 'sản phẩm' }) {
    const requiredQuantity = Math.abs(Number(quantity || 0));
    if (!productId || requiredQuantity <= 0) return [];
    const productBatches = batchPool.get(productId) || [];
    try {
        const allocations = planFefoBatchAllocations({
            requiredQuantity,
            preferredBatchId,
            batches: productBatches.map(batch => ({
                id: batch.batchId,
                batch_number: batch.batchNumber,
                expiry_date: batch.expiryDate,
                stock_quantity: batch.remainingQty,
                cost_price: batch.costPrice
            }))
        });
        allocations.forEach(allocation => {
            const source = productBatches.find(
                batch => String(batch.batchId) === String(allocation.batchId)
            );
            if (source) source.remainingQty -= allocation.quantity;
        });
        return allocations;
    } catch (error) {
        throw new Error(`${itemName}: ${error.message || error}`);
    }
}

async function planPositiveOrderItems({
    orderId,
    payableItems = [],
    orderData = {},
    existingProductIds = new Set(),
    existingBatchIds = new Set(),
    componentMetaMap = new Map(),
    startingSortIndex = 0
}) {
    const isInternal = orderData.isInternal === true;
    let sortIndex = Number(startingSortIndex || 0);
    const itemsToInsert = [];
    const inventoryChanges = [];
    const inventoryTrackedItems = [];

    const allTrackedProductIds = new Set();
    (payableItems || []).forEach(item => {
        const productId = getProductId(item);
        if (productId && !shouldSkipStockForItem(item, orderData)) {
            const comboDefinition = parseDescription(item);
            if (comboDefinition?.isCombo === true && Array.isArray(comboDefinition.items)) {
                comboDefinition.items.forEach(component => {
                    if (isValidUUID(component.id)) allTrackedProductIds.add(component.id);
                });
            } else {
                allTrackedProductIds.add(productId);
            }
        }
    });

    const batchPool = await buildBatchPoolForProductIds([...allTrackedProductIds]);

    for (const item of payableItems || []) {
        const comboDefinition = parseDescription(item);
        const isIngredient = orderData.isDoseCut && item.isIngredient;
        const price = isIngredient ? 0 : Number(item.price || 0);
        const quantity = Math.abs(Number(item.quantity || 0));
        const productId = getProductId(item);
        const batchId = isValidUUID(item.batchId) && existingBatchIds.has(item.batchId) ? item.batchId : null;

        if (!(comboDefinition?.isCombo === true && Array.isArray(comboDefinition.items))) {
            const currentSortIndex = sortIndex;
            sortIndex += 100;

            let persistedBatchId = batchId;
            let batchAllocations = [];
            let costPriceSnapshot = null;
            if (!shouldSkipStockForItem(item, orderData)) {
                const allocations = reserveBatchAllocations({
                    productId,
                    quantity: getStockQuantityToDeduct(item),
                    batchPool,
                    preferredBatchId: batchId,
                    itemName: item.name
                });
                persistedBatchId = allocations.length === 1 ? allocations[0].batchId : null;
                batchAllocations = allocations.map(allocation => ({
                    batch_id: allocation.batchId,
                    batch_number: allocation.batchNumber,
                    expiry_date: allocation.expiryDate,
                    quantity_base: allocation.quantity,
                    cost_price: allocation.costPrice
                }));
                const totalCost = allocations.reduce(
                    (sum, allocation) => sum
                        + (Number(allocation.quantity || 0) * Number(allocation.costPrice || 0)),
                    0
                );
                costPriceSnapshot = quantity > 0 ? totalCost / quantity : null;
                allocations.forEach(allocation => {
                    inventoryChanges.push({
                        batchId: allocation.batchId,
                        quantity: allocation.quantity
                    });
                    inventoryTrackedItems.push({
                        ...item,
                        quantity: allocation.quantity,
                        conversionRate: 1,
                        batchId: allocation.batchId,
                        batchNo: allocation.batchNumber,
                        batchNumber: allocation.batchNumber,
                        expiryDate: allocation.expiryDate
                    });
                });
            }

            itemsToInsert.push({
                id: createRowId(),
                order_id: orderId,
                product_id: existingProductIds.has(productId) ? productId : null,
                batch_id: persistedBatchId,
                product_name: item.name,
                product_code: item.code,
                unit_name: item.unit,
                unit_price: isInternal ? -Math.abs(price) : price,
                quantity,
                total_price: isInternal ? -Math.abs(price * quantity) : (price * quantity),
                cost_price_snapshot: costPriceSnapshot,
                batch_allocations: batchAllocations,
                line_type: 'standard',
                parent_order_item_id: null,
                sort_index: currentSortIndex
            });
            if (shouldSkipStockForItem(item, orderData)) inventoryTrackedItems.push(item);
            continue;
        }

        const parentRowId = createRowId();
        const parentSortIndex = sortIndex;
        sortIndex += 100;

        itemsToInsert.push({
            id: parentRowId,
            order_id: orderId,
            product_id: existingProductIds.has(productId) ? productId : null,
            batch_id: batchId,
            product_name: item.name,
            product_code: item.code,
            unit_name: item.unit,
            unit_price: isInternal ? -Math.abs(price) : price,
            quantity,
            total_price: isInternal ? -Math.abs(price * quantity) : (price * quantity),
            line_type: 'combo_parent',
            parent_order_item_id: null,
            sort_index: parentSortIndex
        });

        let componentSortIndex = parentSortIndex + 10;
        for (const component of comboDefinition.items || []) {
            const meta = componentMetaMap.get(component.id) || {};
            const expandedQuantity = getComboComponentBaseQuantity(component, meta, quantity);
            if (!expandedQuantity) {
                throw new Error(`Combo chưa cấu hình đúng đơn vị cho ${component.name || meta.name || item.name}.`);
            }
            const allocations = reserveBatchAllocations({
                productId: component.id,
                quantity: expandedQuantity,
                batchPool,
                itemName: component.name || meta.name || item.name
            });

            allocations.forEach(allocation => {
                itemsToInsert.push({
                    id: createRowId(),
                    order_id: orderId,
                    product_id: existingProductIds.has(component.id) ? component.id : null,
                    batch_id: allocation.batchId,
                    product_name: component.name || meta.name || 'Thành phần combo',
                    product_code: meta.product_code || component.code || null,
                    unit_name: meta.base_unit_name || component.unit || item.unit,
                    unit_price: 0,
                    quantity: allocation.quantity,
                    total_price: 0,
                    line_type: 'combo_component',
                    parent_order_item_id: parentRowId,
                    sort_index: componentSortIndex
                });
                componentSortIndex += 1;
                inventoryChanges.push({
                    batchId: allocation.batchId,
                    quantity: allocation.quantity
                });
                inventoryTrackedItems.push({
                    id: component.id,
                    productId: component.id,
                    code: meta.product_code || component.code || null,
                    name: component.name || meta.name || item.name,
                    unit: meta.base_unit_name || component.unit || item.unit,
                    quantity: allocation.quantity,
                    conversionRate: 1,
                    batchId: allocation.batchId,
                    batchNo: allocation.batchNumber,
                    batchNumber: allocation.batchNumber,
                    expiryDate: allocation.expiryDate,
                    description: meta.description || null,
                    categoryId: meta.category_id || null,
                    categoryName: meta.category_name || null
                });
            });
        }
    }

    return { itemsToInsert, inventoryChanges, inventoryTrackedItems };
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
    const customer = await ensureCustomerForOrder(orderData);
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
        status:          'draft',
        order_type:      isEcommerce ? 'ecommerce' : (isInternal ? 'internal' : 'retail'),
        ecommerce_platform: orderData.ecommercePlatform || null,
        payment_method:  orderData.paymentMethod || 'cash',
        seller_employee_id: orderData.sellerEmployeeId || null
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
    const componentMetaMap = await fetchComboComponentMetaMap(filteredItems);
    const allExistingProductIds = new Set([...existingProductIds, ...componentMetaMap.keys()]);
    
    let itemsToInsert, plannedInventoryChanges, inventoryTrackedItems;
    try {
        const planResult = await planPositiveOrderItems({
            orderId: order.id,
            payableItems: filteredItems,
            orderData,
            existingProductIds: allExistingProductIds,
            existingBatchIds,
            componentMetaMap
        });
        itemsToInsert = planResult.itemsToInsert;
        plannedInventoryChanges = planResult.inventoryChanges;
        inventoryTrackedItems = planResult.inventoryTrackedItems;
    } catch (err) {
        if (order && order.id) await supabaseClient.from('orders').delete().eq('id', order.id);
        throw err;
    }

    await executeOrderPersistenceWorkflow({
        insertItems: async () => {
            const { error: itemsErr } = await supabaseClient
                .from('order_items')
                .insert(itemsToInsert);
            if (itemsErr) throw itemsErr;
        },
        deductInventory: async () => {
            for (const change of plannedInventoryChanges) {
                const { data: batch, error: fetchError } = await supabaseClient
                    .from('product_batches')
                    .select('stock_quantity')
                    .eq('id', change.batchId)
                    .single();
                if (fetchError) throw fetchError;
                const { error: updateError } = await supabaseClient
                    .from('product_batches')
                    .update({ stock_quantity: Math.max(0, Number(batch.stock_quantity || 0) - Number(change.quantity || 0)) })
                    .eq('id', change.batchId);
                if (updateError) throw updateError;
            }
            return plannedInventoryChanges;
        },
        afterInventory: async () => {
            if (isInternal) {
                await createInventoryIssueTrail({
                    items: inventoryTrackedItems,
                    order,
                    orderData,
                    reason: orderData.internalReason || 'sample',
                    label: 'Xuất nội bộ POS',
                    required: true
                });
                try {
                    await logActivity('internal_use', {
                        order_code: orderCode,
                        reason: orderData.internalReason || 'sample',
                        note: orderData.note || 'Dùng nội bộ',
                        items: inventoryTrackedItems.map(item => ({
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
            }

            if (!isInternal && customer?.id) {
                await adjustCustomerMetrics(customer.id, getCreateCustomerMetricDelta(totalValue));
            }
        },
        rollbackInventory: rollbackInventoryChanges,
        deleteItems: async () => {
            await supabaseClient.from('order_items').delete().eq('order_id', order.id);
        },
        deleteOrder: async () => {
            await supabaseClient.from('orders').delete().eq('id', order.id);
        },
        finalizeOrder: async () => {
            const finalStatus = orderData.status || 'completed';
            await supabaseClient.from('orders').update({ status: finalStatus }).eq('id', order.id);
        }
    });

    // Tự động quét và dọn dẹp hàng bán một lần nếu đã bán hết
    const productIdsToCheck = [...new Set(inventoryTrackedItems.map(item => getProductId(item)).filter(Boolean))];
    await cleanOneTimeProducts(productIdsToCheck);
    
    return order;
}
export async function createReturnOrder(sourceOrder, orderData, cartItems, options = {}) {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');
    let sourceCustomerId = sourceOrder?.customer_id || null;
    if (!sourceCustomerId && sourceOrder?.order_code) {
        const { data: sourceOrderData } = await supabaseClient
            .from('orders')
            .select('customer_id')
            .eq('order_code', sourceOrder.order_code)
            .maybeSingle();
        sourceCustomerId = sourceOrderData?.customer_id || null;
    }

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
        customer_id:     sourceCustomerId,
        customer_name:   orderData.customerName || sourceOrder?.customer_name || 'Khách lẻ',
        customer_phone:  orderData.customerPhone || sourceOrder?.customer_phone || null,
        subtotal:        finalSubtotal,
        discount:        Number(orderData.discount || 0),
        total:           finalTotal,
        amount_received: Number(orderData.amountReceived || 0),
        change_amount:   Math.max(0, Number(orderData.amountReceived || 0) - finalTotal),
        note:            noteParts.join(' - '),
        status:          'draft',
        order_type:      'retail',
        payment_method:  orderData.paymentMethod || 'cash',
        seller_employee_id: orderData.sellerEmployeeId || null
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

    const returnSourceItems = (sourceOrder?.items || []).filter(item =>
        (returnItems || []).some(returnItem => String(returnItem.sourceOrderItemId || '') === String(item.id || ''))
    );
    const returnComboProductIds = [...new Set((returnSourceItems || [])
        .filter(item => item.line_type === 'combo_parent')
        .map(item => item.product_id)
        .filter(isValidUUID))];
    const comboDefinitionMap = await fetchComboDefinitionMapByProductIds(returnComboProductIds);
    const componentMetaMap = await fetchComboComponentMetaMap(newItems);

    const extraProductIds = new Set(componentMetaMap.keys());
    const extraBatchIds = new Set();
    returnSourceItems.forEach(item => {
        if (item.line_type === 'combo_component' && isValidUUID(item.product_id)) extraProductIds.add(item.product_id);
        if (item.line_type === 'combo_component' && isValidUUID(item.batch_id)) extraBatchIds.add(item.batch_id);
    });
    comboDefinitionMap.forEach(definition => {
        (definition.items || []).forEach(component => {
            if (isValidUUID(component.id)) extraProductIds.add(component.id);
        });
    });

    const { existingProductIds, existingBatchIds } = await filterExistingProductsAndBatches(cartItems, {
        extraProductIds: [...extraProductIds],
        extraBatchIds: [...extraBatchIds]
    });
    const allExistingProductIds = new Set([...existingProductIds, ...componentMetaMap.keys()]);
    
    let plannedNewItemsToInsert, plannedNewInventoryChanges;
    try {
        const planResult = await planPositiveOrderItems({
            orderId: order.id,
            payableItems: newItems,
            orderData,
            existingProductIds: allExistingProductIds,
            existingBatchIds,
            componentMetaMap,
            startingSortIndex: returnItems.length * 100
        });
        plannedNewItemsToInsert = planResult.itemsToInsert;
        plannedNewInventoryChanges = planResult.inventoryChanges;
    } catch (err) {
        if (order && order.id) await supabaseClient.from('orders').delete().eq('id', order.id);
        throw err;
    }

    const returnOnlyItemsToInsert = buildReturnOrderItemsPayload({
        orderId: order.id,
        returnItems,
        newItems: [],
        sourceOrderItems: sourceOrder?.items || [],
        existingProductIds: allExistingProductIds,
        existingBatchIds,
        componentMetaMap,
        comboDefinitionMap
    });
    const itemsToInsert = [...returnOnlyItemsToInsert, ...plannedNewItemsToInsert];

    await executeOrderPersistenceWorkflow({
        insertItems: async () => {
            const { error: itemsErr } = await supabaseClient
                .from('order_items')
                .insert(itemsToInsert);
            if (itemsErr) throw itemsErr;
        },
        deductInventory: async () => {
            const inventoryChanges = [];
            try {
                for (const change of plannedNewInventoryChanges) {
                    const { data: batch, error: fetchError } = await supabaseClient
                        .from('product_batches')
                        .select('stock_quantity')
                        .eq('id', change.batchId)
                        .single();
                    if (fetchError) throw fetchError;
                    const { error: updateError } = await supabaseClient
                        .from('product_batches')
                        .update({ stock_quantity: Math.max(0, Number(batch.stock_quantity || 0) - Number(change.quantity || 0)) })
                        .eq('id', change.batchId);
                    if (updateError) throw updateError;
                    inventoryChanges.push({
                        ...change,
                        direction: 'deduct'
                    });
                }
                const restored = await restoreStockForItems(
                    returnOnlyItemsToInsert.filter(item => Number(item.quantity || 0) < 0),
                    { fallbackToProductBatch: true }
                );
                inventoryChanges.push(...restored);
            } catch (error) {
                error.inventoryChanges = [
                    ...inventoryChanges,
                    ...(Array.isArray(error.inventoryChanges) ? error.inventoryChanges : [])
                ];
                throw error;
            }
            return inventoryChanges;
        },
        afterInventory: async () => {
            if (sourceCustomerId) {
                await adjustCustomerMetrics(sourceCustomerId, getReturnCustomerMetricDelta(finalTotal));
            }
        },
        rollbackInventory: rollbackMixedInventoryChanges,
        deleteItems: async () => {
            await supabaseClient.from('order_items').delete().eq('order_id', order.id);
        },
        deleteOrder: async () => {
            await supabaseClient.from('orders').delete().eq('id', order.id);
        },
        finalizeOrder: async () => {
            const finalStatus = orderData.status || 'completed';
            await supabaseClient.from('orders').update({ status: finalStatus }).eq('id', order.id);
        }
    });

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
    const { data: items, error: itemsErr } = await supabaseClient.from('order_items').select('*').eq('order_id', orderId).order('sort_index', { ascending: true }).order('created_at', { ascending: true });
    if (itemsErr) throw itemsErr;
    return { ...order, items: items || [] };
}

async function restoreStockForItems(items = [], options = {}) {
    const inventoryChanges = [];
    const mode = options.mode === 'cancel' ? 'cancel' : 'return';
    for (const item of items) {
        const allocationDeltas = getBatchAllocationInventoryDeltas({
            allocations: item.batch_allocations,
            mode
        });
        if (allocationDeltas.length > 0) {
            for (const delta of allocationDeltas) {
                const { data: batch, error: batchError } = await supabaseClient
                    .from('product_batches')
                    .select('id, stock_quantity')
                    .eq('id', delta.batchId)
                    .maybeSingle();
                if (batchError) throw batchError;
                if (!batch) {
                    throw new Error(
                        `Không tìm thấy lô gốc để hoàn kho cho ${item.product_name || item.name || 'sản phẩm'}.`
                    );
                }

                const nextStockQuantity = Number(batch.stock_quantity || 0) + delta.quantity;
                if (nextStockQuantity < 0) {
                    throw new Error(
                        `Không đủ tồn kho để hủy đơn trả cho ${item.product_name || item.name || 'sản phẩm'}.`
                    );
                }
                const { error: updateError } = await supabaseClient
                    .from('product_batches')
                    .update({ stock_quantity: nextStockQuantity })
                    .eq('id', batch.id);
                if (updateError) throw updateError;
                inventoryChanges.push({
                    batchId: batch.id,
                    quantity: Math.abs(delta.quantity),
                    direction: delta.quantity >= 0 ? 'restore' : 'deduct'
                });
            }
            continue;
        }

        const shouldFallbackByProduct = options.fallbackToProductBatch === true
            || (options.fallbackToProductBatchForComboComponents === true && item.line_type === 'combo_component');

        let batch = null;
        if (item.batch_id) {
            const { data } = await supabaseClient
                .from('product_batches')
                .select('id, stock_quantity')
                .eq('id', item.batch_id)
                .maybeSingle();
            batch = data || null;
        }
        if (!batch && shouldFallbackByProduct && item.product_id) {
            const { data } = await supabaseClient
                .from('product_batches')
                .select('id, stock_quantity')
                .eq('product_id', item.product_id)
                .order('expiry_date', { ascending: true })
                .limit(1);
            batch = data?.[0] || null;
        }
        if (!batch) continue;

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

        const restoredQuantity = mode === 'cancel'
            ? getStockQuantityForOrderCancellation(item, conversionRate)
            : getStockQuantityForReturnRestore(item, conversionRate);
        const nextStockQuantity = Number(batch.stock_quantity || 0) + restoredQuantity;
        if (nextStockQuantity < 0) {
            throw new Error(`Không đủ tồn kho để hủy đơn cho ${item.product_name || item.name || 'sản phẩm'}.`);
        }

        await supabaseClient
            .from('product_batches')
            .update({ stock_quantity: nextStockQuantity })
            .eq('id', batch.id);
        inventoryChanges.push({
            batchId: batch.id,
            quantity: restoredQuantity,
            direction: 'restore'
        });
    }

    return inventoryChanges;
}

export async function updateOrder(orderId, orderData) {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');
    const { data, error } = await supabaseClient.from('orders').update(orderData).eq('id', orderId).select().single();
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
    await reconcileShiftSalesFromOrders({ referenceDate: order.created_at || new Date() });
    await restoreStockForItems(order.items, {
        fallbackToProductBatchForComboComponents: true,
        mode: 'cancel'
    });
    await cancelLinkedInventoryDocuments(order, reason);
    if (order.customer_id) {
        await adjustCustomerMetrics(order.customer_id, getCancelCustomerMetricDelta(order));
    }
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
