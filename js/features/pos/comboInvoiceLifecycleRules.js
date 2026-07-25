function getItemLabel(item = {}) {
    return item.product_name || item.name || item.product_code || 'thành phần combo';
}

export function getComboReversalIntegrityIssues(items = []) {
    const sourceItems = Array.isArray(items) ? items : [];
    const comboParents = sourceItems.filter(item => item?.line_type === 'combo_parent');
    if (comboParents.length === 0) return [];

    const componentsByParent = new Map();
    sourceItems
        .filter(item => item?.line_type === 'combo_component' && item?.parent_order_item_id)
        .forEach(item => {
            const key = String(item.parent_order_item_id);
            const components = componentsByParent.get(key) || [];
            components.push(item);
            componentsByParent.set(key, components);
        });

    const issues = [];
    comboParents.forEach(parent => {
        const components = componentsByParent.get(String(parent.id)) || [];
        if (components.length === 0) {
            issues.push({
                type: 'missing_components',
                parentId: parent.id || null,
                message: `Combo ${getItemLabel(parent)} không có snapshot thành phần lúc bán.`
            });
            return;
        }

        components.forEach(component => {
            if (!component.product_id) {
                issues.push({
                    type: 'missing_product',
                    parentId: parent.id || null,
                    componentId: component.id || null,
                    message: `Thành phần ${getItemLabel(component)} không xác định được sản phẩm gốc.`
                });
            }
            if (!component.batch_id) {
                issues.push({
                    type: 'missing_batch',
                    parentId: parent.id || null,
                    componentId: component.id || null,
                    message: `Thành phần ${getItemLabel(component)} không xác định được lô gốc.`
                });
            }
        });
    });

    return issues;
}

export function assertComboOrderReversible(order = {}) {
    const issues = getComboReversalIntegrityIssues(order.items);
    if (issues.length === 0) return order;

    const details = issues.map(issue => issue.message).join(' ');
    throw new Error(
        `Không thể hủy hóa đơn combo vì dữ liệu tồn kho lịch sử chưa đầy đủ. ${details} `
        + 'Vui lòng đối chiếu lô trước khi hủy để tránh hoàn sai tồn kho.'
    );
}

export function getRemainingReturnQuantity(sourceQuantity = 0, returnedQuantity = 0) {
    return Math.max(
        0,
        Math.abs(Number(sourceQuantity || 0)) - Math.abs(Number(returnedQuantity || 0))
    );
}

export function assertReturnQuantitiesWithinSource({
    sourceOrder = {},
    cartItems = [],
    returnedBySourceId = new Map()
} = {}) {
    const sourceItemsById = new Map(
        (sourceOrder.items || []).map(item => [String(item.id || ''), item])
    );

    (cartItems || [])
        .filter(item => item?.originalQuantity !== undefined && Number(item?.quantity || 0) > 0)
        .forEach(item => {
            const sourceItemId = String(item.sourceOrderItemId || '');
            const sourceItem = sourceItemsById.get(sourceItemId);
            if (!sourceItem) {
                throw new Error('Không xác định được dòng hàng gốc cần trả.');
            }

            const alreadyReturned = Number(returnedBySourceId.get(sourceItemId) || 0);
            const remaining = getRemainingReturnQuantity(sourceItem.quantity, alreadyReturned);
            const requested = Math.abs(Number(item.quantity || 0));
            if (requested > remaining) {
                throw new Error(
                    `${getItemLabel(sourceItem)} chỉ còn được trả ${remaining}; `
                    + `đã trả ${alreadyReturned} trên tổng số ${Math.abs(Number(sourceItem.quantity || 0))}.`
                );
            }
        });

    return true;
}
