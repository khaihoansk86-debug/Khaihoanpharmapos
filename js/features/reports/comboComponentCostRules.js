function toFiniteNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}
function resolveComponentUnitCost(item, lookups) {
    const snapshotCost = toFiniteNumber(item.cost_price_snapshot);
    if (snapshotCost > 0) {
        return { unitCost: snapshotCost, source: 'combo_snapshot' };
    }

    const batchCost = item.batch_id ? toFiniteNumber(lookups.batchCosts?.get(item.batch_id)) : 0;
    if (batchCost > 0) {
        return { unitCost: batchCost, source: 'combo_batch' };
    }

    const unit = lookups.unitCosts?.get(`${item.product_id}::${item.unit_name || ''}`)
        || lookups.unitCosts?.get(`${item.product_id}::__base__`);
    const unitCost = toFiniteNumber(unit?.cost_price);
    if (unitCost > 0) {
        return { unitCost, source: 'combo_unit_fallback' };
    }

    return { unitCost: 0, source: 'missing' };
}

/**
 * Builds historical combo costs from the component rows persisted with each
 * invoice. Quantities on these rows are already expressed in base units, so
 * no current recipe or conversion setting is needed.
 */
export function buildComboComponentCostMap(items = [], lookups = {}) {
    const costsByParentId = new Map();

    items.forEach(item => {
        if (item?.line_type !== 'combo_component' || !item.parent_order_item_id) return;

        const quantity = toFiniteNumber(item.quantity);
        const resolved = resolveComponentUnitCost(item, lookups);
        const current = costsByParentId.get(item.parent_order_item_id) || {
            cost: 0,
            source: 'combo_snapshot'
        };

        current.cost += quantity * resolved.unitCost;
        if (resolved.source === 'missing') {
            current.source = 'missing';
        } else if (current.source !== 'missing' && resolved.source !== 'combo_snapshot') {
            current.source = resolved.source;
        }
        costsByParentId.set(item.parent_order_item_id, current);
    });

    return costsByParentId;
}
