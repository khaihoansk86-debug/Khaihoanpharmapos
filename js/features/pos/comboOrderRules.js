import { expandComboItems, parseComboDescription } from '../products/comboRules.js';
import { sliceBatchAllocationsForReturn } from './batchAllocationRules.js';

function createRowId() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return `combo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function toValidProductId(rawId, existingProductIds) {
    if (!rawId || !(existingProductIds instanceof Set)) return null;
    return existingProductIds.has(rawId) ? rawId : null;
}

function toValidBatchId(rawId, existingBatchIds) {
    if (!rawId || !(existingBatchIds instanceof Set)) return null;
    return existingBatchIds.has(rawId) ? rawId : null;
}

export function collectComboComponentIds(items = []) {
    const ids = new Set();
    (items || []).forEach(item => {
        const comboDefinition = parseComboDescription(item?.description);
        expandComboItems(comboDefinition, Math.abs(Number(item?.quantity || 0))).forEach(component => {
            if (component.id) ids.add(component.id);
        });
    });
    return [...ids];
}

export function expandInventoryTrackedItems(items = [], componentMetaMap = new Map()) {
    return (items || []).flatMap(item => {
        const comboDefinition = parseComboDescription(item?.description);
        if (!comboDefinition) return [item];

        return expandComboItems(comboDefinition, Math.abs(Number(item.quantity || 0))).map(component => {
            const meta = componentMetaMap.get(component.id) || {};
            return {
                id: component.id,
                productId: component.id,
                code: meta.product_code || component.code || null,
                name: component.name || meta.name || item.name,
                unit: component.unit || meta.base_unit_name || item.unit,
                quantity: component.quantity,
                conversionRate: 1,
                batchId: null,
                batchNo: null,
                batchNumber: null,
                description: meta.description || null,
                categoryId: meta.category_id || null,
                categoryName: meta.category_name || null
            };
        });
    });
}

export function buildOrderItemsPayload({
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

    return (payableItems || []).flatMap(item => {
        const comboDefinition = parseComboDescription(item?.description);
        const isIngredient = orderData.isDoseCut && item.isIngredient;
        const price = isIngredient ? 0 : Number(item.price || 0);
        const quantity = Math.abs(Number(item.quantity || 0));
        const productId = toValidProductId(item.productId || item.id, existingProductIds);
        const batchId = toValidBatchId(item.batchId, existingBatchIds);

        if (!comboDefinition) {
            const currentSortIndex = sortIndex;
            sortIndex += 100;
            return [{
                id: createRowId(),
                order_id: orderId,
                product_id: productId,
                batch_id: batchId,
                product_name: item.name,
                product_code: item.code,
                unit_name: item.unit,
                unit_price: isInternal ? -Math.abs(price) : price,
                quantity,
                total_price: isInternal ? -Math.abs(price * quantity) : (price * quantity),
                line_type: 'standard',
                parent_order_item_id: null,
                sort_index: currentSortIndex
            }];
        }

        const parentRowId = createRowId();
        const parentSortIndex = sortIndex;
        sortIndex += 100;

        const parentRow = {
            id: parentRowId,
            order_id: orderId,
            product_id: productId,
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
        };

        const componentRows = expandComboItems(comboDefinition, quantity).map((component, componentIndex) => {
            const meta = componentMetaMap.get(component.id) || {};
            return {
                id: createRowId(),
                order_id: orderId,
                product_id: toValidProductId(component.id, existingProductIds),
                batch_id: null,
                product_name: component.name || meta.name || 'Thành phần combo',
                product_code: meta.product_code || null,
                unit_name: component.unit || meta.base_unit_name || item.unit,
                unit_price: 0,
                quantity: Math.abs(Number(component.quantity || 0)),
                total_price: 0,
                line_type: 'combo_component',
                parent_order_item_id: parentRowId,
                sort_index: parentSortIndex + ((componentIndex + 1) * 10)
            };
        });

        return [parentRow, ...componentRows];
    });
}

function findSourceOrderItem(returnItem = {}, sourceOrderItems = [], usedSourceIds = new Set()) {
    const sourceOrderItemId = String(returnItem.sourceOrderItemId || '').trim();
    if (sourceOrderItemId) {
        return (sourceOrderItems || []).find(item => String(item.id) === sourceOrderItemId) || null;
    }

    return (sourceOrderItems || []).find(item => {
        if (!item || item.line_type === 'combo_component' || usedSourceIds.has(item.id)) return false;
        return String(item.product_id || '') === String(returnItem.productId || returnItem.id || '')
            && String(item.unit_name || '') === String(returnItem.unit || '')
            && Number(item.unit_price || 0) === Number(returnItem.price || 0);
    }) || null;
}

function getComboComponentsForReturn(
    sourceItem,
    sourceOrderItems = [],
    comboDefinitionMap = new Map(),
    returnParentQuantity = 1,
    alreadyReturnedParentQuantity = 0
) {
    if (!sourceItem) return [];

    const sourceQuantity = Math.abs(Number(sourceItem.quantity || 0)) || 1;
    const sourceComponents = (sourceOrderItems || []).filter(item =>
        item?.line_type === 'combo_component'
        && String(item.parent_order_item_id || '') === String(sourceItem.id || '')
    );
    const comboDefinition = comboDefinitionMap.get(sourceItem.product_id);

    if (sourceComponents.length > 0) {
        const grouped = new Map();
        sourceComponents.forEach(component => {
            const key = `${component.product_id || component.product_name || ''}::${component.unit_name || ''}`;
            const existing = grouped.get(key) || {
                id: component.product_id,
                name: component.product_name,
                unit: component.unit_name,
                product_code: component.product_code,
                quantity_total: 0,
                batch_allocations: new Map()
            };
            const componentQuantity = Math.abs(Number(component.quantity || 0));
            existing.quantity_total += componentQuantity;
            if (component.batch_id) {
                const allocation = existing.batch_allocations.get(component.batch_id) || {
                    quantity: 0,
                    cost_price_snapshot: component.cost_price_snapshot ?? null
                };
                allocation.quantity += componentQuantity;
                if (allocation.cost_price_snapshot === null && component.cost_price_snapshot !== undefined) {
                    allocation.cost_price_snapshot = component.cost_price_snapshot;
                }
                existing.batch_allocations.set(component.batch_id, allocation);
            }
            grouped.set(key, existing);
        });

        return [...grouped.values()].flatMap(component => {
            // Persisted component rows are the immutable sale-time snapshot.
            // Never let a later combo recipe edit change how much stock is restored.
            const quantityPerParent = component.quantity_total / sourceQuantity;
            const requestedParentQuantity = Math.abs(Number(returnParentQuantity || 0));
            let quantityToSkip = quantityPerParent
                * Math.abs(Number(alreadyReturnedParentQuantity || 0));
            let remainingQuantity = quantityPerParent * requestedParentQuantity;
            const componentRows = [];

            for (const [batchId, allocation] of component.batch_allocations.entries()) {
                let availableQuantity = Math.abs(Number(allocation.quantity || 0));
                if (availableQuantity <= 0) continue;
                if (quantityToSkip > 0) {
                    const skippedQuantity = Math.min(quantityToSkip, availableQuantity);
                    quantityToSkip -= skippedQuantity;
                    availableQuantity -= skippedQuantity;
                }
                if (availableQuantity <= 0 || remainingQuantity <= 0) continue;

                const returnQuantity = Math.min(remainingQuantity, availableQuantity);
                componentRows.push({
                    id: component.id,
                    name: component.name,
                    unit: component.unit,
                    product_code: component.product_code,
                    batch_id: batchId,
                    cost_price_snapshot: allocation.cost_price_snapshot,
                    return_quantity: returnQuantity
                });
                remainingQuantity -= returnQuantity;
            }

            if (remainingQuantity > 0.000001) {
                throw new Error(
                    `Không đủ snapshot lô để hoàn thành phần ${component.name || component.product_code || ''}.`
                );
            }

            return componentRows;
        });
    }

    return expandComboItems(comboDefinition, Math.abs(Number(returnParentQuantity || 0))).map(component => ({
        id: component.id,
        name: component.name,
        unit: component.unit,
        product_code: null,
        batch_id: null,
        return_quantity: Math.abs(Number(component.quantity || 0))
    }));
}

export function buildReturnOrderItemsPayload({
    orderId,
    returnItems = [],
    newItems = [],
    sourceOrderItems = [],
    existingProductIds = new Set(),
    existingBatchIds = new Set(),
    componentMetaMap = new Map(),
    comboDefinitionMap = new Map()
}) {
    let sortIndex = 0;
    const usedSourceIds = new Set();
    const sourceBatchIds = (sourceOrderItems || [])
        .map(item => item?.batch_id)
        .filter(Boolean);
    const validReturnBatchIds = new Set([
        ...(existingBatchIds instanceof Set ? existingBatchIds : []),
        ...sourceBatchIds
    ]);

    const returnRows = (returnItems || []).flatMap(item => {
        const sourceItem = findSourceOrderItem(item, sourceOrderItems, usedSourceIds);
        if (sourceItem?.id) usedSourceIds.add(sourceItem.id);

        const quantity = Math.abs(Number(item.quantity || 0));
        const productId = toValidProductId(item.productId || item.id, existingProductIds);
        const batchId = toValidBatchId(item.batchId, validReturnBatchIds);
        const currentSortIndex = sortIndex;
        sortIndex += 100;

        if (sourceItem?.line_type !== 'combo_parent') {
            const sourceAllocations = Array.isArray(sourceItem?.batch_allocations)
                ? sourceItem.batch_allocations
                : [];
            const returnAllocations = sourceAllocations.length > 0
                ? sliceBatchAllocationsForReturn({
                    sourceAllocations,
                    sourceSaleQuantity: sourceItem.quantity,
                    returnQuantity: quantity,
                    alreadyReturnedQuantity: item.alreadyReturnedQuantity
                })
                : [];
            const persistedBatchId = returnAllocations.length === 1
                ? toValidBatchId(returnAllocations[0].batch_id, validReturnBatchIds)
                : batchId;
            return [{
                id: createRowId(),
                order_id: orderId,
                product_id: productId,
                batch_id: persistedBatchId,
                product_name: item.name,
                product_code: item.code,
                unit_name: item.unit,
                unit_price: Number(item.price || 0),
                quantity: -quantity,
                total_price: -(Number(item.price || 0) * quantity),
                cost_price_snapshot: sourceItem?.cost_price_snapshot ?? null,
                batch_allocations: returnAllocations,
                line_type: sourceItem?.line_type || 'standard',
                source_order_item_id: sourceItem?.id || null,
                parent_order_item_id: null,
                sort_index: currentSortIndex
            }];
        }

        const parentRowId = createRowId();
        const parentRow = {
            id: parentRowId,
            order_id: orderId,
            product_id: productId,
            batch_id: batchId,
            product_name: item.name,
            product_code: item.code,
            unit_name: item.unit,
            unit_price: Number(item.price || 0),
            quantity: -quantity,
            total_price: -(Number(item.price || 0) * quantity),
            line_type: 'combo_parent',
            source_order_item_id: sourceItem.id,
            parent_order_item_id: null,
            sort_index: currentSortIndex
        };

        const componentRows = getComboComponentsForReturn(
            sourceItem,
            sourceOrderItems,
            comboDefinitionMap,
            quantity,
            item.alreadyReturnedQuantity
        )
            .map((component, componentIndex) => {
                const meta = componentMetaMap.get(component.id) || {};
                return {
                    id: createRowId(),
                    order_id: orderId,
                    product_id: toValidProductId(component.id, existingProductIds),
                    batch_id: toValidBatchId(component.batch_id, validReturnBatchIds),
                    product_name: component.name || meta.name || 'Thành phần combo',
                    product_code: component.product_code || meta.product_code || null,
                    unit_name: component.unit || meta.base_unit_name || item.unit,
                    unit_price: 0,
                    quantity: -Math.abs(Number(component.return_quantity || 0)),
                    total_price: 0,
                    cost_price_snapshot: component.cost_price_snapshot ?? null,
                    line_type: 'combo_component',
                    parent_order_item_id: parentRowId,
                    sort_index: currentSortIndex + ((componentIndex + 1) * 10)
                };
            });

        return [parentRow, ...componentRows];
    });

    const newRows = buildOrderItemsPayload({
        orderId,
        payableItems: newItems,
        existingProductIds,
        existingBatchIds,
        componentMetaMap,
        startingSortIndex: sortIndex
    });

    return [...returnRows, ...newRows];
}

export function buildComboBatchReconciliation(orderItems = [], inventoryChanges = []) {
    const relevantChanges = (inventoryChanges || []).filter(change =>
        change?.comboParentRowId
        && change?.productId
        && change?.batchId
        && Number(change.quantity || 0) > 0
    );
    if (relevantChanges.length === 0) {
        return { updates: [], replacements: [] };
    }

    const allocationsByKey = new Map();
    relevantChanges.forEach(change => {
        const key = `${change.comboParentRowId}::${change.productId}`;
        const list = allocationsByKey.get(key) || [];
        list.push({
            batch_id: change.batchId,
            quantity: Number(change.quantity || 0)
        });
        allocationsByKey.set(key, list);
    });

    const updates = [];
    const replacements = [];

    (orderItems || [])
        .filter(item => item?.line_type === 'combo_component' && item?.parent_order_item_id && item?.product_id)
        .forEach(item => {
            const key = `${item.parent_order_item_id}::${item.product_id}`;
            const allocations = allocationsByKey.get(key) || [];
            if (allocations.length === 0) return;

            const targetQuantity = Math.abs(Number(item.quantity || 0));
            const sign = Number(item.quantity || 0) < 0 ? -1 : 1;

            if (allocations.length === 1 && Math.abs(allocations[0].quantity - targetQuantity) < 0.000001) {
                updates.push({ id: item.id, batch_id: allocations[0].batch_id });
                return;
            }

            let remaining = targetQuantity;
            const rows = [];
            allocations.forEach((allocation, index) => {
                if (remaining <= 0) return;
                const qty = Math.min(remaining, Math.abs(Number(allocation.quantity || 0)));
                if (qty <= 0) return;
                rows.push({
                    ...item,
                    id: createRowId(),
                    batch_id: allocation.batch_id,
                    quantity: sign * qty,
                    sort_index: Number(item.sort_index || 0) + index
                });
                remaining -= qty;
            });

            if (remaining > 0) {
                rows.push({
                    ...item,
                    id: createRowId(),
                    batch_id: item.batch_id || null,
                    quantity: sign * remaining,
                    sort_index: Number(item.sort_index || 0) + rows.length
                });
            }

            replacements.push({
                deleteId: item.id,
                rows
            });
        });

    return { updates, replacements };
}
