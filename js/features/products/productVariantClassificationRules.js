const MAX_VARIANT_AXES = 2;

const PRESETS = Object.freeze([
    Object.freeze({ key: 'concentration', label: 'Hàm lượng' }),
    Object.freeze({ key: 'dosage_form', label: 'Dạng bào chế' }),
    Object.freeze({ key: 'scent', label: 'Hương / Mùi' }),
    Object.freeze({ key: 'color', label: 'Màu sắc' }),
    Object.freeze({ key: 'volume', label: 'Dung tích' }),
    Object.freeze({ key: 'size', label: 'Kích thước' }),
    Object.freeze({ key: 'type', label: 'Loại' })
]);

function cleanText(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
}

function normalizeKey(value) {
    return cleanText(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/Đ/g, 'D')
        .replace(/đ/g, 'd')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

export function listVariantClassificationPresets() {
    return PRESETS.map(preset => ({ ...preset }));
}

export function normalizeVariantDefinitions(definitions = []) {
    const result = [];
    const usedKeys = new Set();

    for (const definition of Array.isArray(definitions) ? definitions : []) {
        if (result.length >= MAX_VARIANT_AXES) break;
        const label = cleanText(definition?.label);
        const rawKey = normalizeKey(definition?.key);
        const key = rawKey || normalizeKey(label);
        if (!key || !label || usedKeys.has(key)) continue;
        usedKeys.add(key);
        result.push({ key, label });
    }

    return result;
}

export function buildVariantDefinitionsFromAxes(axes = []) {
    return normalizeVariantDefinitions((axes || []).map((axis, index) => {
        const presetKey = cleanText(axis?.presetKey);
        const preset = PRESETS.find(item => item.key === presetKey);
        if (preset) return preset;

        const label = cleanText(axis?.customLabel);
        return label
            ? {
                key: normalizeKey(axis?.customKey) || `custom_${index + 1}`,
                label
            }
            : null;
    }).filter(Boolean));
}

export function validateVariantAxes(axes = []) {
    const issues = [];
    const usedKeys = new Set();

    (Array.isArray(axes) ? axes : []).forEach((axis, index) => {
        const presetKey = cleanText(axis?.presetKey);
        if (!presetKey) return;

        const field = cleanText(axis?.field) || (index === 0 ? 'primary' : 'secondary');
        const customLabel = cleanText(axis?.customLabel);
        if (presetKey === 'custom' && !customLabel) {
            issues.push({
                key: `missing-custom-variant-axis-${field}`,
                field: `add_variant_axis_${field}_custom`,
                message: field === 'primary'
                    ? 'Vui lòng nhập tên cho phân loại chính.'
                    : 'Vui lòng nhập tên cho phân loại phụ.'
            });
            return;
        }

        const key = presetKey === 'custom'
            ? normalizeKey(axis?.customKey) || normalizeKey(customLabel)
            : normalizeKey(presetKey);
        if (!key) return;
        if (usedKeys.has(key)) {
            issues.push({
                key: 'duplicate-variant-axis',
                field: `add_variant_axis_${field}`,
                message: 'Phân loại chính và phân loại phụ phải khác nhau.'
            });
            return;
        }
        usedKeys.add(key);
    });

    return issues;
}

export function inferLegacyVariantDefinitions(variants = []) {
    const hasConcentration = (variants || []).some(variant =>
        cleanText(variant?.concentration)
    );
    const hasDosageForm = (variants || []).some(variant =>
        cleanText(variant?.dosage_form)
    );
    const definitions = [];
    if (hasConcentration) {
        definitions.push({ key: 'concentration', label: 'Hàm lượng' });
    }
    if (hasDosageForm) {
        definitions.push({ key: 'dosage_form', label: 'Dạng bào chế' });
    }
    return normalizeVariantDefinitions(definitions);
}

export function resolveVariantDefinitions(parent = {}, variants = []) {
    const configured = normalizeVariantDefinitions(parent?.variant_definitions);
    if (configured.length > 0) return configured;

    const inferred = inferLegacyVariantDefinitions(variants);
    if (inferred.length > 0) return inferred;

    return [
        { key: 'concentration', label: 'Hàm lượng' },
        { key: 'dosage_form', label: 'Dạng bào chế' }
    ];
}

export function normalizeVariantValues(definitions = [], values = {}, legacy = {}) {
    const normalized = {};
    normalizeVariantDefinitions(definitions).forEach(definition => {
        const fallback = definition.key === 'concentration'
            ? legacy?.concentration
            : definition.key === 'dosage_form'
                ? legacy?.dosage_form
                : null;
        const value = cleanText(values?.[definition.key] ?? fallback);
        if (value) normalized[definition.key] = value;
    });
    return normalized;
}

export function validateVariantValues(definitions = [], values = {}) {
    return normalizeVariantDefinitions(definitions)
        .filter(definition => !cleanText(values?.[definition.key]))
        .map(definition => ({
            key: definition.key,
            label: definition.label,
            message: `Vui lòng nhập ${definition.label.toLocaleLowerCase('vi-VN')}.`
        }));
}

export function buildVariantClassificationPayload({
    definitions = [],
    values = {},
    concentration = null,
    dosageForm = null
} = {}) {
    const normalizedDefinitions = normalizeVariantDefinitions(definitions);
    const variantValues = normalizeVariantValues(normalizedDefinitions, values, {
        concentration,
        dosage_form: dosageForm
    });

    return {
        variant_values: variantValues,
        concentration: cleanText(
            variantValues.concentration ?? concentration
        ) || null,
        dosage_form: cleanText(
            variantValues.dosage_form ?? dosageForm
        ) || null
    };
}

export function buildVariantClassificationLabel(definitions = [], values = {}) {
    return normalizeVariantDefinitions(definitions)
        .map(definition => cleanText(values?.[definition.key]))
        .filter(Boolean)
        .join(' • ');
}
