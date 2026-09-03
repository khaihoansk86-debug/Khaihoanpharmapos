import { normalizeUnitName } from '../../core/unitCatalog.js';

const COMBO_COMPONENT_LINE_TYPE = 'combo_component';

function toFiniteNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}

/**
 * Builds customer-facing item snapshots without changing order quantities.
 * Combo components are inventory details, so only their parent sale line is shown.
 */
export function getCustomerHistoryDisplayItems(orderItems = []) {
    if (!Array.isArray(orderItems)) return [];

    return orderItems
        .map((item, originalIndex) => ({ item, originalIndex }))
        .filter(({ item }) => item && item.line_type !== COMBO_COMPONENT_LINE_TYPE)
        .sort((left, right) => {
            const leftIndex = toFiniteNumber(left.item.sort_index);
            const rightIndex = toFiniteNumber(right.item.sort_index);
            return leftIndex - rightIndex || left.originalIndex - right.originalIndex;
        })
        .map(({ item }) => {
            const quantity = toFiniteNumber(item.quantity);
            return {
                name: String(item.product_name || '').trim() || 'Mặt hàng chưa có tên',
                code: String(item.product_code || '').trim(),
                unit: String(item.unit_name || '').trim()
                    ? normalizeUnitName(item.unit_name, 'Đơn vị')
                    : '',
                quantity,
                isReturn: quantity < 0
            };
        });
}
