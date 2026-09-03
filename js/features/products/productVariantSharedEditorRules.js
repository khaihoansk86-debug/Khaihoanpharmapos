import {
    normalizeProductUnits,
    normalizeUnitName,
    unitIdentity
} from '../../core/unitCatalog.js';
import { assertSafeVariantBatchRemoval } from './productVariantBatchRules.js';
import { assertSafeVariantBaseUnitChange } from './productVariantPackagingRules.js';

function cleanText(value) {
    return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function optionalNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

function variantLabelFromSharedName({ variant = {}, parent = {}, productData = {} } = {}) {
    const editedName = cleanText(productData.name);
    const parentName = cleanText(parent.name);
    if (editedName && parentName) {
        const escapedParentName = parentName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const withoutParent = editedName.replace(
            new RegExp(`^${escapedParentName}\\s*(?:[-–—:|]\\s*)?`, 'i'),
            ''
        ).trim();
        if (withoutParent && withoutParent !== editedName) return withoutParent;
    }

    const valuesLabel = Object.values(variant.variant_values || {})
        .map(cleanText)
        .filter(Boolean)
        .join(' ');
    return valuesLabel || cleanText(variant.variant_label) || editedName;
}

function mergeEditableVariantValues(variant = {}, parent = {}, productData = {}) {
    const values = { ...(variant.variant_values || {}) };
    const definitionKeys = new Set((parent.variant_definitions || [])
        .map(definition => cleanText(definition?.key))
        .filter(Boolean));

    ['concentration', 'dosage_form'].forEach(key => {
        if (!definitionKeys.has(key) || !Object.hasOwn(productData, key)) return;
        const value = cleanText(productData[key]);
        if (value) values[key] = value;
        else delete values[key];
    });
    return values;
}

function normalizeSharedUnits(units = [], existingUnits = []) {
    const existingByName = new Map((existingUnits || []).map(unit => [
        unitIdentity(unit?.unit_name),
        unit
    ]));
    return normalizeProductUnits(units).map(unit => {
        const existing = existingByName.get(unitIdentity(unit.unit_name));
        const unitId = unit.id || existing?.id;
        return {
            ...(unitId ? { id: unitId } : {}),
            unit_name: normalizeUnitName(unit.unit_name, 'Đơn vị'),
            conversion_rate: Number(unit.conversion_rate || 0),
            cost_price: Number(unit.cost_price || 0),
            retail_price: Number(unit.retail_price || 0),
            is_base_unit: unit.is_base_unit === true
        };
    });
}

function normalizeSharedBatches(batches = []) {
    return (Array.isArray(batches) ? batches : []).map(batch => ({
        ...(batch.id ? { id: batch.id } : {}),
        batch_number: cleanText(batch.batch_number) || 'Mặc định',
        expiry_date: batch.expiry_date || null,
        stock_quantity: Number(batch.stock_quantity || 0),
        cost_price: Number(batch.cost_price || 0),
        is_tracked: batch.is_tracked !== false
    }));
}

/**
 * Build the complete atomic payload used when a child SKU is edited through
 * the shared product form. Clinical identity that is not represented by that
 * form remains intact, while every rendered unit and batch is sent as one
 * snapshot so the RPC never observes a half-written SKU.
 */
export function buildSharedVariantSavePayload({
    variant,
    parent,
    productData = {},
    units = [],
    batches = [],
    minStockQuantity = null,
    maxStockQuantity = null
} = {}) {
    if (!variant?.id || !variant?.parent_id) {
        throw new Error('Thiếu thông tin SKU con cần cập nhật.');
    }

    const normalizedUnits = normalizeSharedUnits(units, variant.product_units || []);
    if (normalizedUnits.length === 0) {
        throw new Error('SKU phải có ít nhất một đơn vị tính.');
    }
    const baseUnits = normalizedUnits.filter(unit =>
        unit.is_base_unit && unit.conversion_rate === 1
    );
    if (baseUnits.length !== 1) {
        throw new Error('SKU phải có đúng một đơn vị tồn cơ sở với tỷ lệ quy đổi bằng 1.');
    }

    const normalizedBatches = normalizeSharedBatches(batches);
    const currentStock = (variant.product_batches || []).reduce(
        (sum, batch) => sum + Number(batch.stock_quantity || 0),
        0
    );
    assertSafeVariantBaseUnitChange({
        existingUnits: variant.product_units || [],
        nextUnits: normalizedUnits,
        stockQuantity: currentStock
    });
    assertSafeVariantBatchRemoval({
        existingBatches: variant.product_batches || [],
        nextBatches: normalizedBatches
    });

    const baseUnit = baseUnits[0];
    return {
        product_id: variant.id,
        parent_id: variant.parent_id,
        variant_label: variantLabelFromSharedName({ variant, parent, productData }),
        variant_values: mergeEditableVariantValues(variant, parent, productData),
        product_code: cleanText(productData.product_code || variant.product_code),
        barcode: cleanText(productData.barcode) || null,
        concentration: cleanText(productData.concentration) || null,
        dosage_form: cleanText(productData.dosage_form) || null,
        packaging_spec: cleanText(productData.packaging_spec) || null,
        category_id: productData.category_id ?? variant.category_id ?? null,
        is_active: productData.is_active !== false,
        is_ecommerce: productData.is_ecommerce === true,
        ecommerce_platforms: Array.isArray(productData.ecommerce_platforms)
            ? productData.ecommerce_platforms
            : [],
        registration_no: cleanText(productData.registration_no) || null,
        active_ingredient: cleanText(productData.active_ingredient) || null,
        route_of_admin: cleanText(productData.route_of_admin) || null,
        manufacturer: cleanText(productData.manufacturer) || null,
        description: productData.description ?? null,
        shared_editor: true,
        manage_packaging: true,
        base_unit_name: baseUnit.unit_name,
        base_cost: baseUnit.cost_price,
        base_retail: baseUnit.retail_price,
        units: normalizedUnits,
        manage_batches: true,
        batches: normalizedBatches,
        min_stock_quantity: optionalNumber(minStockQuantity),
        max_stock_quantity: optionalNumber(maxStockQuantity)
    };
}
