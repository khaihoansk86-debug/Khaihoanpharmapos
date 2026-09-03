import { normalizeUnitName, unitIdentity } from '../../core/unitCatalog.js';

const MAX_RETURN_ITEMS = 100;

function cleanText(value, maxLength) {
    const text = String(value || '').trim();
    if (text.length > maxLength) throw new Error(`Dữ liệu không được vượt quá ${maxLength} ký tự.`);
    return text;
}

export function normalizeEcommerceTrackingCode(value) {
    return String(value || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
}

export function buildEcommerceReturnPayload({
    platform,
    trackingCode,
    receivedAt,
    note,
    createdBy,
    items = []
} = {}) {
    const ecommercePlatform = cleanText(platform, 50);
    const rawTrackingCode = cleanText(trackingCode, 100);
    const normalizedTrackingCode = normalizeEcommerceTrackingCode(rawTrackingCode);

    if (!ecommercePlatform) throw new Error('Vui lòng chọn nền tảng TMĐT.');
    if (!normalizedTrackingCode) throw new Error('Vui lòng nhập mã vận đơn.');
    if (!Array.isArray(items) || items.length === 0) throw new Error('Phiếu hoàn chưa có sản phẩm.');
    if (items.length > MAX_RETURN_ITEMS) throw new Error(`Mỗi phiếu hoàn tối đa ${MAX_RETURN_ITEMS} dòng.`);

    const merged = new Map();
    items.forEach((item, index) => {
        const productId = cleanText(item?.productId, 100);
        const batchId = cleanText(item?.batchId, 100);
        const unitName = normalizeUnitName(cleanText(item?.unitName, 100), 'Đơn vị');
        const quantity = Number(item?.quantity || 0);

        if (!productId) throw new Error(`Dòng ${index + 1} chưa chọn sản phẩm.`);
        if (!batchId) throw new Error(`Dòng ${index + 1} chưa chọn lô.`);
        if (!unitName) throw new Error(`Dòng ${index + 1} chưa chọn đơn vị.`);
        if (!Number.isFinite(quantity) || quantity <= 0) {
            throw new Error(`Số lượng dòng ${index + 1} phải lớn hơn 0.`);
        }

        const key = `${productId}::${batchId}::${unitIdentity(unitName)}`;
        const current = merged.get(key) || {
            product_id: productId,
            batch_id: batchId,
            unit_name: unitName,
            quantity: 0
        };
        current.quantity += quantity;
        merged.set(key, current);
    });

    const receivedDate = receivedAt ? new Date(receivedAt) : new Date();
    if (Number.isNaN(receivedDate.getTime())) throw new Error('Ngày nhận hoàn không hợp lệ.');

    return {
        returnData: {
            ecommerce_platform: ecommercePlatform,
            tracking_code: rawTrackingCode.replace(/\s+/g, ' '),
            tracking_code_normalized: normalizedTrackingCode,
            received_at: receivedDate.toISOString(),
            note: cleanText(note, 1000),
            created_by_name: cleanText(createdBy, 100)
        },
        items: [...merged.values()]
    };
}
