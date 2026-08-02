function cleanText(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
}

function positiveInteger(value, label) {
    const number = Number(value);
    if (!Number.isInteger(number) || number <= 0) {
        throw new Error(`${label} phải là số nguyên lớn hơn 0.`);
    }
    return number;
}

function lowerUnit(value) {
    const text = cleanText(value);
    return text ? text.charAt(0).toLocaleLowerCase('vi-VN') + text.slice(1) : '';
}

function unitIdentity(value) {
    return cleanText(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/Đ/g, 'D')
        .replace(/đ/g, 'd')
        .toLocaleLowerCase('vi-VN');
}

function unitRate(unit = {}) {
    const value = Number(unit?.conversion_rate || 0);
    return Number.isFinite(value) && value > 0 ? value : 0;
}

function priceValue(value, label) {
    const number = Number(value || 0);
    if (!Number.isFinite(number) || number < 0) {
        throw new Error(`${label} phải là số lớn hơn hoặc bằng 0.`);
    }
    return number;
}

export function buildPackagingPlan({
    baseUnitName,
    packageUnitName = 'Hộp',
    innerUnitName = '',
    innerCount,
    basePerInner,
    basePerPackage
} = {}) {
    const baseUnit = cleanText(baseUnitName);
    const packageUnit = cleanText(packageUnitName) || 'Hộp';
    const innerUnit = cleanText(innerUnitName);

    if (!baseUnit) throw new Error('Vui lòng chọn đơn vị tồn kho nhỏ nhất.');
    if (baseUnit.toLocaleLowerCase('vi-VN') === packageUnit.toLocaleLowerCase('vi-VN')) {
        throw new Error('Đơn vị cơ sở và đơn vị đóng gói phải khác nhau.');
    }

    let totalBase;
    let packagingSpec;
    const units = [{
        unit_name: baseUnit,
        conversion_rate: 1,
        is_base_unit: true
    }];

    if (innerUnit) {
        if (innerUnit.toLocaleLowerCase('vi-VN') === baseUnit.toLocaleLowerCase('vi-VN')
            || innerUnit.toLocaleLowerCase('vi-VN') === packageUnit.toLocaleLowerCase('vi-VN')) {
            throw new Error('Tên đơn vị cơ sở, đơn vị trung gian và đơn vị đóng gói phải khác nhau.');
        }
        const innerPerPackage = positiveInteger(innerCount, `Số ${innerUnit} trong một ${packageUnit}`);
        const basePerInnerValue = positiveInteger(basePerInner, `Số ${baseUnit} trong một ${innerUnit}`);
        totalBase = innerPerPackage * basePerInnerValue;
        packagingSpec = `${packageUnit} ${innerPerPackage} ${lowerUnit(innerUnit)} × ${basePerInnerValue} ${lowerUnit(baseUnit)}`;
        units.push({
            unit_name: innerUnit,
            conversion_rate: basePerInnerValue,
            is_base_unit: false
        });
    } else {
        totalBase = positiveInteger(basePerPackage, `Số ${baseUnit} trong một ${packageUnit}`);
        packagingSpec = `${packageUnit} ${totalBase} ${lowerUnit(baseUnit)}`;
    }

    units.push({
        unit_name: packageUnit,
        conversion_rate: totalBase,
        is_base_unit: false
    });

    return {
        baseUnitName: baseUnit,
        packageUnitName: packageUnit,
        innerUnitName: innerUnit,
        totalBase,
        packagingSpec,
        equation: `1 ${packageUnit} = ${innerUnit ? `${positiveInteger(innerCount, 'Số đơn vị trung gian')} ${innerUnit} = ` : ''}${totalBase} ${baseUnit}`,
        units
    };
}

export function buildVariantPackagingEditorSeed(product = {}) {
    const units = [...(product.product_units || [])]
        .filter(unit => unitRate(unit) > 0)
        .sort((left, right) => unitRate(left) - unitRate(right));
    const baseUnit = units.find(unit => unit.is_base_unit)
        || units.find(unit => unitRate(unit) === 1)
        || units[0]
        || {};
    const nonBaseUnits = units.filter(unit => unit !== baseUnit);
    const packageUnit = nonBaseUnits.find(unit => unitIdentity(unit.unit_name) === 'hop')
        || nonBaseUnits[nonBaseUnits.length - 1]
        || null;
    const innerUnits = nonBaseUnits.filter(unit => unit !== packageUnit);
    const innerUnit = innerUnits[innerUnits.length - 1] || null;
    const packageRate = unitRate(packageUnit);
    const innerRate = unitRate(innerUnit);

    return {
        mode: innerUnit ? 'with_inner' : 'direct',
        baseUnitName: cleanText(baseUnit.unit_name),
        innerUnitName: innerUnit ? cleanText(innerUnit.unit_name) : '',
        innerCount: innerUnit && packageRate > 0
            ? packageRate / innerRate
            : null,
        basePerInner: innerUnit ? innerRate : null,
        basePerPackage: innerUnit ? null : (packageRate || null),
        baseCost: priceValue(baseUnit.cost_price, 'Giá vốn'),
        baseRetail: priceValue(baseUnit.retail_price, 'Giá bán')
    };
}

export function buildVariantUnitRows({
    productId,
    packagingPlan,
    baseCost,
    baseRetail,
    existingUnits = []
} = {}) {
    if (!productId) throw new Error('Thiếu mã định danh SKU.');
    if (!packagingPlan || !Array.isArray(packagingPlan.units)) {
        throw new Error('Quy cách SKU chưa hợp lệ.');
    }

    const cost = priceValue(baseCost, 'Giá vốn');
    const retail = priceValue(baseRetail, 'Giá bán');
    const existingByName = new Map();
    (existingUnits || []).forEach(unit => {
        const key = unitIdentity(unit?.unit_name);
        if (key && !existingByName.has(key)) existingByName.set(key, unit);
    });

    return packagingPlan.units.map(unit => {
        const conversionRate = unitRate(unit);
        const existing = existingByName.get(unitIdentity(unit.unit_name));
        return {
            ...(existing?.id ? { id: existing.id } : {}),
            product_id: productId,
            unit_name: cleanText(unit.unit_name),
            conversion_rate: conversionRate,
            cost_price: cost * conversionRate,
            retail_price: retail * conversionRate,
            is_base_unit: unit.is_base_unit === true
        };
    });
}

export function getObsoleteVariantUnitIds(existingUnits = [], nextUnits = []) {
    const retainedIds = new Set((nextUnits || []).map(unit => unit?.id).filter(Boolean));
    return (existingUnits || [])
        .map(unit => unit?.id)
        .filter(id => id && !retainedIds.has(id));
}

export function assertSafeVariantBaseUnitChange({
    existingUnits = [],
    nextUnits = [],
    stockQuantity = 0
} = {}) {
    if (Number(stockQuantity || 0) <= 0) return true;
    const currentBase = (existingUnits || []).find(unit => unit?.is_base_unit)
        || (existingUnits || []).find(unit => unitRate(unit) === 1);
    const nextBase = (nextUnits || []).find(unit => unit?.is_base_unit)
        || (nextUnits || []).find(unit => unitRate(unit) === 1);
    if (
        currentBase
        && nextBase
        && unitIdentity(currentBase.unit_name) !== unitIdentity(nextBase.unit_name)
    ) {
        throw new Error(
            'SKU đang còn tồn kho nên không thể đổi đơn vị tồn nhỏ nhất. '
            + 'Hãy xuất/chuyển hết tồn trước, hoặc chỉ sửa hệ số Hộp/Vỉ.'
        );
    }
    return true;
}

function structuredVariantValues(product = {}, definitions = []) {
    const values = product.variant_values || {};
    const orderedKeys = (definitions || [])
        .map(definition => cleanText(definition?.key))
        .filter(key => key && Object.hasOwn(values, key));
    const remainingKeys = Object.keys(values)
        .filter(key => !orderedKeys.includes(key))
        .sort();
    return [...orderedKeys, ...remainingKeys]
        .map(key => cleanText(values[key]))
        .filter(Boolean);
}

export function clinicalVariantKey(product = {}, definitions = []) {
    const structuredValues = structuredVariantValues(product, definitions)
        .map(cleanText)
        .filter(Boolean);
    if (structuredValues.length > 0) {
        return structuredValues
            .map(value => value.toLocaleUpperCase('vi-VN'))
            .join('::');
    }
    const concentration = cleanText(product.concentration || product.variant_label || product.name);
    const dosageForm = cleanText(product.dosage_form);
    return `${concentration.toLocaleUpperCase('vi-VN')}::${dosageForm.toLocaleUpperCase('vi-VN')}`;
}

export function clinicalVariantLabel(product = {}, definitions = []) {
    const structuredValues = structuredVariantValues(product, definitions)
        .map(cleanText)
        .filter(Boolean);
    if (structuredValues.length > 0) return structuredValues.join(' • ');
    const concentration = cleanText(product.concentration || product.variant_label || product.name) || 'Chưa rõ hàm lượng';
    const dosageForm = cleanText(product.dosage_form);
    return dosageForm ? `${concentration} • ${dosageForm}` : concentration;
}

export function groupVariantsByClinicalIdentity(variants = [], definitions = []) {
    const groups = new Map();
    variants.forEach(variant => {
        const key = clinicalVariantKey(variant, definitions);
        if (!groups.has(key)) {
            groups.set(key, {
                key,
                label: clinicalVariantLabel(variant, definitions),
                variants: []
            });
        }
        groups.get(key).variants.push(variant);
    });
    return [...groups.values()];
}

export function buildParentVariantSearchText(parent = {}, variants = []) {
    const values = [
        parent.product_code,
        parent.name,
        parent.active_ingredient,
        parent.barcode
    ];
    variants.forEach(variant => {
        values.push(
            variant.product_code,
            variant.name,
            variant.variant_label,
            variant.concentration,
            variant.dosage_form,
            ...Object.values(variant.variant_values || {}),
            variant.packaging_spec,
            variant.barcode,
            ...(variant.product_units || []).flatMap(unit => [
                unit.unit_name,
                `${unit.conversion_rate || 1} ${unit.unit_name || ''}`
            ])
        );
    });
    return cleanText(values.filter(Boolean).join(' '));
}
