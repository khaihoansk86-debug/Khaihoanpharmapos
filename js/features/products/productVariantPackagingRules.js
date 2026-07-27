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

export function clinicalVariantKey(product = {}) {
    const concentration = cleanText(product.concentration || product.variant_label || product.name);
    const dosageForm = cleanText(product.dosage_form);
    return `${concentration.toLocaleUpperCase('vi-VN')}::${dosageForm.toLocaleUpperCase('vi-VN')}`;
}

export function clinicalVariantLabel(product = {}) {
    const concentration = cleanText(product.concentration || product.variant_label || product.name) || 'Chưa rõ hàm lượng';
    const dosageForm = cleanText(product.dosage_form);
    return dosageForm ? `${concentration} • ${dosageForm}` : concentration;
}

export function groupVariantsByClinicalIdentity(variants = []) {
    const groups = new Map();
    variants.forEach(variant => {
        const key = clinicalVariantKey(variant);
        if (!groups.has(key)) {
            groups.set(key, {
                key,
                label: clinicalVariantLabel(variant),
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
