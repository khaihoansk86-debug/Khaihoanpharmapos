import { parseComboDescription } from '../products/comboRules.js';
import { unitIdentity } from '../../core/unitCatalog.js';

function normalizeUnitName(value) {
    return unitIdentity(value);
}

function findComponentUnit(component = {}, componentProduct = {}) {
    const requestedUnit = normalizeUnitName(component.unit);
    const units = Array.isArray(componentProduct.product_units)
        ? componentProduct.product_units
        : [];
    if (!requestedUnit) {
        return units.find(unit => unit.is_base_unit) || units[0] || null;
    }
    return units.find(unit => normalizeUnitName(unit.unit_name) === requestedUnit) || null;
}

export function getComboComponentBaseQuantity(component = {}, componentProduct = {}, parentQuantity = 1) {
    const unit = findComponentUnit(component, componentProduct);
    if (!unit) return null;
    const componentQuantity = Math.max(0, Number(component.quantity || 0));
    const multiplier = Math.max(0, Number(parentQuantity || 0));
    const conversionRate = Math.max(0, Number(unit.conversion_rate || 0));
    if (componentQuantity <= 0 || multiplier <= 0 || conversionRate <= 0) return null;
    return componentQuantity * multiplier * conversionRate;
}

export function getAllowedComboQuantity(requestedQuantity, comboAvailability = {}) {
    const requested = Math.max(0, Number(requestedQuantity || 0));
    if (!comboAvailability?.isCombo) return requested;
    const available = Math.max(0, Number(comboAvailability.availableQuantity || 0));
    return Math.min(requested, available);
}

export function buildComboComponentRequirements(cartItems = [], products = []) {
    const productMap = new Map((products || []).map(product => [String(product.id), product]));
    const requirements = new Map();

    (cartItems || []).forEach(item => {
        const definition = parseComboDescription(item?.description);
        if (!definition) return;

        const parentQuantity = Math.abs(Number(item?.quantity || 0));
        definition.items.forEach(component => {
            const product = productMap.get(String(component.id));
            const requiredBaseQuantity = product
                ? getComboComponentBaseQuantity(component, product, parentQuantity)
                : null;
            const existing = requirements.get(component.id);
            const status = !product
                ? 'missing_product'
                : (requiredBaseQuantity ? 'ready' : 'missing_unit');

            if (!existing) {
                requirements.set(component.id, {
                    id: component.id,
                    name: component.name || product?.name || 'Thành phần combo',
                    unit: component.unit || null,
                    requiredBaseQuantity,
                    status
                });
                return;
            }

            existing.requiredBaseQuantity = existing.requiredBaseQuantity !== null
                && requiredBaseQuantity !== null
                ? existing.requiredBaseQuantity + requiredBaseQuantity
                : null;
            if (existing.status === 'ready' && status !== 'ready') existing.status = status;
        });
    });

    return requirements;
}

export function calculateComboAvailability(comboProduct = {}, products = []) {
    const definition = parseComboDescription(comboProduct.description);
    if (!definition) {
        return {
            isCombo: false,
            availableQuantity: null,
            bottleneck: null,
            components: []
        };
    }

    const productMap = new Map((products || []).map(product => [String(product.id), product]));
    const components = definition.items.map(component => {
        const product = productMap.get(String(component.id));
        if (!product) {
            return {
                id: component.id,
                name: component.name || 'Thành phần combo',
                unit: component.unit || null,
                requiredBaseQuantity: null,
                availableBaseQuantity: 0,
                availableComboQuantity: 0,
                status: 'missing_product'
            };
        }

        const requiredBaseQuantity = getComboComponentBaseQuantity(component, product, 1);
        const availableBaseQuantity = (product.product_batches || []).reduce(
            (sum, batch) => sum + Math.max(0, Number(batch.stock_quantity || 0)),
            0
        );
        if (!requiredBaseQuantity) {
            return {
                id: component.id,
                name: component.name || product.name || 'Thành phần combo',
                unit: component.unit || null,
                requiredBaseQuantity: null,
                availableBaseQuantity,
                availableComboQuantity: 0,
                status: 'missing_unit'
            };
        }

        return {
            id: component.id,
            name: component.name || product.name || 'Thành phần combo',
            unit: component.unit || null,
            requiredBaseQuantity,
            availableBaseQuantity,
            availableComboQuantity: Math.floor(availableBaseQuantity / requiredBaseQuantity),
            status: availableBaseQuantity >= requiredBaseQuantity ? 'available' : 'out_of_stock'
        };
    });

    const bottleneck = components.reduce((current, component) => {
        if (!current) return component;
        return component.availableComboQuantity < current.availableComboQuantity
            ? component
            : current;
    }, null);

    return {
        isCombo: true,
        availableQuantity: bottleneck?.availableComboQuantity || 0,
        bottleneck,
        components
    };
}
