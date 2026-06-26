import { expandComboItems, parseComboDescription } from '../products/comboRules.js';

function safeNumber(value) {
    const number = Number(value || 0);
    return Number.isFinite(number) ? number : 0;
}

export function collectComboComponentIds(products = []) {
    const ids = new Set();
    (products || []).forEach(product => {
        const definition = parseComboDescription(product?.description);
        definition?.items?.forEach(item => {
            if (item?.id) ids.add(item.id);
        });
    });
    return [...ids];
}

export function buildComboDefinitionMap(products = []) {
    const comboDefinitionMap = new Map();
    (products || []).forEach(product => {
        const definition = parseComboDescription(product?.description);
        if (definition && product?.id) {
            comboDefinitionMap.set(product.id, definition);
        }
    });
    return comboDefinitionMap;
}

export function estimateComboCost({ item, comboDefinitionMap, unitCosts, sign = 1, visited = new Set() }) {
    const productId = item?.product_id;
    if (!productId) return null;
    if (visited.has(productId)) {
        return { cost: 0, source: 'missing' };
    }

    const comboDefinition = comboDefinitionMap.get(productId);
    if (!comboDefinition) return null;

    const nextVisited = new Set(visited);
    nextVisited.add(productId);

    let totalCost = 0;
    let hasMissingCost = false;
    const quantity = Math.abs(safeNumber(item?.quantity || 0));
    const expandedItems = expandComboItems(comboDefinition, quantity);

    expandedItems.forEach(component => {
        const nestedCost = estimateComboCost({
            item: { product_id: component.id, quantity: component.quantity },
            comboDefinitionMap,
            unitCosts,
            sign: 1,
            visited: nextVisited
        });

        if (nestedCost) {
            totalCost += nestedCost.cost;
            hasMissingCost = hasMissingCost || nestedCost.source === 'missing';
            return;
        }

        const unitKey = `${component.id}::${component.unit || ''}`;
        const unit = unitCosts.get(unitKey) || unitCosts.get(`${component.id}::__base__`);
        const unitCost = safeNumber(unit?.cost_price);
        if (unitCost > 0) {
            totalCost += unitCost * safeNumber(component.quantity);
        } else {
            hasMissingCost = true;
        }
    });

    return {
        cost: sign * totalCost,
        source: hasMissingCost ? 'missing' : 'combo'
    };
}
