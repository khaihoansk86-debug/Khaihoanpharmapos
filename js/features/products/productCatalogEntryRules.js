import { normalizeUnitName } from '../../core/unitCatalog.js';

function cleanText(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
}

function normalizeIdentity(value) {
    return cleanText(value).toLocaleUpperCase('vi-VN');
}

function toCodeSegment(value) {
    return cleanText(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/Đ/g, 'D')
        .replace(/đ/g, 'D')
        .toLocaleUpperCase('vi-VN')
        .replace(/[^A-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

const VARIANT_PACKAGING_PRESETS = Object.freeze({
    box_10x5: Object.freeze({
        id: 'box_10x5',
        label: '10 vỉ × 5 viên',
        mode: 'with_inner',
        baseUnitName: 'Viên',
        innerUnitName: 'Vỉ',
        innerCount: 10,
        basePerInner: 5,
        basePerPackage: null
    }),
    box_10x10: Object.freeze({
        id: 'box_10x10',
        label: '10 vỉ × 10 viên',
        mode: 'with_inner',
        baseUnitName: 'Viên',
        innerUnitName: 'Vỉ',
        innerCount: 10,
        basePerInner: 10,
        basePerPackage: null
    }),
    box_15x12: Object.freeze({
        id: 'box_15x12',
        label: '15 vỉ × 12 viên',
        mode: 'with_inner',
        baseUnitName: 'Viên',
        innerUnitName: 'Vỉ',
        innerCount: 15,
        basePerInner: 12,
        basePerPackage: null
    }),
    box_24_sachets: Object.freeze({
        id: 'box_24_sachets',
        label: 'Hộp 24 gói',
        mode: 'direct',
        baseUnitName: 'Gói',
        innerUnitName: '',
        innerCount: null,
        basePerInner: null,
        basePerPackage: 24
    })
});

export function listVariantPackagingPresets() {
    return Object.values(VARIANT_PACKAGING_PRESETS).map(preset => ({ ...preset }));
}

export function getVariantPackagingPreset(presetId) {
    const preset = VARIANT_PACKAGING_PRESETS[cleanText(presetId)];
    if (!preset) throw new Error('Mẫu quy cách không hợp lệ.');
    return { ...preset };
}

export function buildVariantDraftReview({
    concentration,
    dosageForm,
    classificationLabel,
    productCode,
    barcode,
    packagingPlan,
    baseCost,
    baseRetail
} = {}) {
    const cost = Number(baseCost || 0);
    const retail = Number(baseRetail || 0);
    const warnings = [];

    const hasStructuredClassification = Boolean(cleanText(classificationLabel));
    if (!hasStructuredClassification && !cleanText(concentration)) {
        warnings.push({
            key: 'missing-concentration',
            severity: 'danger',
            label: 'Chưa nhập hàm lượng.'
        });
    }
    if (!hasStructuredClassification && !cleanText(dosageForm)) {
        warnings.push({
            key: 'missing-dosage-form',
            severity: 'danger',
            label: 'Chưa nhập dạng bào chế.'
        });
    }
    if (!cleanText(productCode)) {
        warnings.push({
            key: 'auto-code',
            severity: 'info',
            label: 'Mã SKU sẽ được tạo tự động.'
        });
    }
    if (!cleanText(barcode)) {
        warnings.push({
            key: 'missing-barcode',
            severity: 'warning',
            label: 'Chưa có barcode để quét nhanh tại POS.'
        });
    }
    if (cost <= 0) {
        warnings.push({
            key: 'missing-cost',
            severity: 'warning',
            label: 'Giá vốn đang bằng 0.'
        });
    }
    if (retail <= 0) {
        warnings.push({
            key: 'missing-retail',
            severity: 'warning',
            label: 'Giá bán đang bằng 0.'
        });
    } else if (cost > 0 && retail < cost) {
        warnings.push({
            key: 'retail-below-cost',
            severity: 'danger',
            label: 'Giá bán thấp hơn giá vốn.'
        });
    }

    const packagingSpec = cleanText(packagingPlan?.packagingSpec);
    const identityLabel = [
        cleanText(classificationLabel) || [
            cleanText(concentration) || 'Chưa có hàm lượng',
            cleanText(dosageForm) || 'Chưa có dạng bào chế'
        ].join(' • '),
        packagingSpec || 'Chưa có quy cách'
    ].join(' • ');
    const unitPrices = (packagingPlan?.units || []).map(unit => ({
        unitName: cleanText(unit.unit_name),
        conversionRate: Number(unit.conversion_rate || 1),
        costPrice: cost * Number(unit.conversion_rate || 1),
        retailPrice: retail * Number(unit.conversion_rate || 1)
    }));

    return {
        identityLabel,
        equation: cleanText(packagingPlan?.equation),
        unitPrices,
        warnings,
        isReady: !warnings.some(warning => warning.severity === 'danger')
    };
}

export function buildVariantIdentitySuggestion({
    parentCode,
    parentName,
    concentration,
    dosageForm,
    classificationLabel,
    packagingPlan,
    existingProducts = []
} = {}) {
    const parentSegment = (
        toCodeSegment(parentCode).replace(/^PARENT-?/, '')
        || toCodeSegment(parentName)
        || 'SKU'
    );
    const classificationSegment = toCodeSegment(
        concentration || classificationLabel
    );
    const baseUnitSegment = toCodeSegment(packagingPlan?.baseUnitName);
    const quantitySegment = Number(packagingPlan?.totalBase || 0) > 0
        ? `${Number(packagingPlan.totalBase)}${baseUnitSegment}`
        : '';
    const baseCode = [
        parentSegment,
        classificationSegment,
        quantitySegment
    ].filter(Boolean).join('-').slice(0, 60) || 'SKU';
    const usedCodes = new Set((existingProducts || []).map(product =>
        normalizeIdentity(product?.product_code)
    ).filter(Boolean));

    let suggestedCode = baseCode;
    let suffix = 2;
    while (usedCodes.has(normalizeIdentity(suggestedCode))) {
        suggestedCode = `${baseCode}-${suffix}`;
        suffix += 1;
    }

    const suggestedLabel = [
        cleanText(classificationLabel) || [
            cleanText(concentration),
            cleanText(dosageForm)
        ].filter(Boolean).join(' • '),
        cleanText(packagingPlan?.packagingSpec)
    ].filter(Boolean).join(' • ');

    return {
        suggestedCode,
        suggestedLabel: suggestedLabel || cleanText(parentName) || 'SKU mới'
    };
}

export function buildVariantContinuationSeed({
    concentration,
    dosageForm,
    variantValues,
    packagingMode,
    baseUnitName,
    innerUnitName,
    baseCost,
    baseRetail
} = {}) {
    const safeNumber = value => {
        const number = Number(value);
        return Number.isFinite(number) && number >= 0 ? number : 0;
    };

    const seed = {
        concentration: cleanText(concentration),
        dosageForm: cleanText(dosageForm),
        packagingMode: packagingMode === 'direct' ? 'direct' : 'with_inner',
        baseUnitName: cleanText(baseUnitName),
        innerUnitName: cleanText(innerUnitName),
        baseCost: safeNumber(baseCost),
        baseRetail: safeNumber(baseRetail)
    };
    if (variantValues && typeof variantValues === 'object' && !Array.isArray(variantValues)) {
        seed.variantValues = Object.fromEntries(
            Object.entries(variantValues)
                .map(([key, value]) => [cleanText(key), cleanText(value)])
                .filter(([key, value]) => key && value)
        );
    }
    return seed;
}

function normalizeDraftNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}

function normalizeVariantDraft(draft = {}) {
    const batches = (draft.batches || []).map(batch => ({
        batchId: cleanText(batch?.batchId),
        batchNumber: cleanText(batch?.batchNumber),
        expiryDate: cleanText(batch?.expiryDate),
        quantity: normalizeDraftNumber(batch?.quantity)
    })).filter(batch =>
        batch.batchId
        || batch.batchNumber
        || batch.expiryDate
        || batch.quantity !== 0
    );

    const variantValues = Object.fromEntries(
        Object.entries(draft.variantValues || {})
            .map(([key, value]) => [cleanText(key), cleanText(value)])
            .filter(([key, value]) => key && value)
            .sort(([left], [right]) => left.localeCompare(right))
    );

    return {
        name: cleanText(draft.name),
        productCode: cleanText(draft.productCode),
        barcode: cleanText(draft.barcode),
        concentration: cleanText(draft.concentration),
        dosageForm: cleanText(draft.dosageForm),
        variantValues,
        managePackaging: draft.managePackaging !== false,
        packagingMode: draft.packagingMode === 'direct' ? 'direct' : 'with_inner',
        baseUnitName: cleanText(draft.baseUnitName),
        innerUnitName: cleanText(draft.innerUnitName),
        innerCount: normalizeDraftNumber(draft.innerCount),
        basePerInner: normalizeDraftNumber(draft.basePerInner),
        basePerPackage: normalizeDraftNumber(draft.basePerPackage),
        baseCost: normalizeDraftNumber(draft.baseCost),
        baseRetail: normalizeDraftNumber(draft.baseRetail),
        batches
    };
}

export function hasVariantDraftChanged(initialDraft = {}, currentDraft = {}) {
    return JSON.stringify(normalizeVariantDraft(initialDraft))
        !== JSON.stringify(normalizeVariantDraft(currentDraft));
}

function normalizeProductFormDraft(fields = []) {
    return (fields || []).map((field, index) => ({
        key: cleanText(field?.key) || `control-${index}`,
        type: cleanText(field?.type),
        value: cleanText(field?.value),
        checked: Boolean(field?.checked)
    }));
}

export function hasProductFormDraftChanged(initialFields = [], currentFields = []) {
    return JSON.stringify(normalizeProductFormDraft(initialFields))
        !== JSON.stringify(normalizeProductFormDraft(currentFields));
}

export function validateProductCatalogEntry({
    name,
    productCode,
    categoryId,
    usesPhysicalUnits = false,
    baseUnitName,
    baseRetail,
    usesBatches = false,
    tracksBatches = false,
    batches = []
} = {}) {
    const issues = [];
    if (!cleanText(name)) issues.push({
        key: 'missing-name',
        field: 'add_name',
        message: 'Vui lòng nhập tên hàng hóa.'
    });
    if (!cleanText(productCode)) issues.push({
        key: 'missing-code',
        field: 'add_code',
        message: 'Vui lòng nhập mã hàng hóa.'
    });
    if (!cleanText(categoryId)) issues.push({
        key: 'missing-category',
        field: 'add_category',
        message: 'Vui lòng chọn nhóm hàng.'
    });

    if (usesPhysicalUnits) {
        if (!cleanText(baseUnitName)) issues.push({
            key: 'missing-base-unit',
            field: 'base_unit_name',
            message: 'Vui lòng nhập đơn vị tồn nhỏ nhất.'
        });
        const retailText = cleanText(baseRetail);
        const retailNumber = Number(retailText);
        if (!retailText || !Number.isFinite(retailNumber) || retailNumber < 0) {
            issues.push({
                key: 'invalid-base-retail',
                field: 'base_unit_retail',
                message: 'Vui lòng nhập giá bán hợp lệ cho đơn vị cơ sở.'
            });
        }
    }

    if (usesBatches && tracksBatches) {
        (batches || []).forEach((batch, rowIndex) => {
            if (!cleanText(batch?.expiryDate)) issues.push({
                key: `missing-batch-expiry-${rowIndex}`,
                field: 'batch_expiry',
                rowIndex,
                message: `Vui lòng nhập hạn sử dụng cho lô ${rowIndex + 1}.`
            });
        });
    }

    return issues;
}

export function buildCatalogEntryPlan({ hasVariants = false } = {}) {
    if (hasVariants) {
        return {
            kind: 'product_group',
            isDirectSale: false,
            usesPhysicalUnits: false,
            usesBatches: false,
            submitLabel: 'Lưu nhóm & tiếp tục tạo SKU',
            helperText: 'Nhóm sản phẩm chỉ dùng để gom các mã hàng con, không bán và không nhập kho trực tiếp.'
        };
    }

    return {
        kind: 'physical_sku',
        isDirectSale: true,
        usesPhysicalUnits: true,
        usesBatches: true,
        submitLabel: 'Lưu hàng hóa',
        helperText: 'Mã hàng này có đơn vị, giá, lô và tồn kho riêng.'
    };
}

export function buildTechnicalParentUnit() {
    return [{
        unit_name: 'Nhóm',
        retail_price: 0,
        cost_price: 0,
        conversion_rate: 1,
        is_base_unit: true
    }];
}

export function findCatalogIdentityConflict({
    productCode,
    barcode,
    existingProducts = [],
    excludeProductId = null
} = {}) {
    const normalizedCode = normalizeIdentity(productCode);
    const normalizedBarcode = normalizeIdentity(barcode);

    for (const product of existingProducts || []) {
        if (!product || String(product.id || '') === String(excludeProductId || '')) continue;
        if (normalizedCode && normalizeIdentity(product.product_code) === normalizedCode) {
            return {
                field: 'product_code',
                message: `Mã SKU ${cleanText(productCode)} đã thuộc về "${cleanText(product.name)}".`
            };
        }
        if (normalizedBarcode && normalizeIdentity(product.barcode) === normalizedBarcode) {
            return {
                field: 'barcode',
                message: `Barcode ${cleanText(barcode)} đã thuộc về "${cleanText(product.name)}" (${cleanText(product.product_code)}).`
            };
        }
    }

    return null;
}

export function resolveCatalogIdentityPersistenceIssue(error, {
    productCode,
    barcode
} = {}) {
    const errorText = [
        error?.message,
        error?.details,
        error?.hint,
        error?.constraint
    ].filter(Boolean).join(' ').toLocaleLowerCase('vi-VN');
    const isDuplicate = String(error?.code || '') === '23505'
        || /duplicate key|unique constraint|already exists|đã tồn tại/.test(errorText);
    if (!isDuplicate) return null;

    if (/barcode|mã vạch/.test(errorText) && cleanText(barcode)) {
        return {
            key: 'identity-barcode-conflict',
            field: 'add_barcode',
            rejectedValue: cleanText(barcode),
            message: `Barcode ${cleanText(barcode)} đã được sử dụng. Vui lòng nhập barcode khác hoặc để trống.`
        };
    }
    if (/product_code|mã hàng|mã sku|\bsku\b/.test(errorText) && cleanText(productCode)) {
        return {
            key: 'identity-product-code-conflict',
            field: 'add_code',
            rejectedValue: cleanText(productCode),
            message: `Mã SKU ${cleanText(productCode)} đã được sử dụng. Vui lòng chọn mã khác.`
        };
    }

    return null;
}

export function buildExistingVariantIdentityUpdate({
    parentName,
    variantLabel,
    productCode,
    barcode,
    concentration,
    dosageForm,
    variantValues
} = {}) {
    const cleanLabel = cleanText(variantLabel);
    const cleanCode = cleanText(productCode);
    if (!cleanLabel) throw new Error('Vui lòng nhập tên biến thể / SKU.');
    if (!cleanCode) throw new Error('Vui lòng nhập mã SKU.');

    const cleanParentName = cleanText(parentName);
    const update = {
        name: cleanParentName
            ? `${cleanParentName} - ${cleanLabel}`
            : cleanLabel,
        variant_label: cleanLabel,
        product_code: cleanCode,
        barcode: cleanText(barcode) || null,
        concentration: cleanText(concentration) || null,
        dosage_form: cleanText(dosageForm) || null
    };
    if (variantValues && typeof variantValues === 'object' && !Array.isArray(variantValues)) {
        update.variant_values = Object.fromEntries(
            Object.entries(variantValues)
                .map(([key, value]) => [cleanText(key), cleanText(value)])
                .filter(([key, value]) => key && value)
        );
    }
    return update;
}

export function deriveVariantEditorLabel({
    variantLabel,
    productName,
    parentName
} = {}) {
    const explicitLabel = cleanText(variantLabel);
    if (explicitLabel) return explicitLabel;

    const fullName = cleanText(productName);
    const cleanParentName = cleanText(parentName);
    if (!fullName || !cleanParentName) return fullName;

    const prefix = `${cleanParentName} - `;
    return fullName.toLocaleLowerCase('vi-VN').startsWith(
        prefix.toLocaleLowerCase('vi-VN')
    )
        ? cleanText(fullName.slice(prefix.length))
        : fullName;
}

export function buildVariantPackagingRequest({
    mode = 'with_inner',
    baseUnitName,
    innerUnitName = 'Vỉ',
    innerCount,
    basePerInner,
    basePerPackage
} = {}) {
    if (mode === 'direct') {
        return {
            baseUnitName: normalizeUnitName(baseUnitName, 'Viên'),
            packageUnitName: 'Hộp',
            innerUnitName: '',
            basePerPackage
        };
    }

    return {
        baseUnitName: normalizeUnitName(baseUnitName, 'Viên'),
        packageUnitName: 'Hộp',
        innerUnitName: normalizeUnitName(innerUnitName, 'Vỉ'),
        innerCount,
        basePerInner
    };
}
