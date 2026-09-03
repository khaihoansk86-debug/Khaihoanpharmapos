import { normalizeUnitName, rememberUnit } from '../../core/unitCatalog.js';

function cleanText(value) {
    return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function toFiniteNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}

function buildCustomItemPayload(item = {}) {
    const name = cleanText(item.name);
    const unitName = rememberUnit(normalizeUnitName(cleanText(item.unit), 'Viên'));
    const unitPrice = toFiniteNumber(item.price, Number.NaN);
    const costPrice = toFiniteNumber(item.cost_price ?? item.costPrice, 0);
    const stockQuantity = toFiniteNumber(item.quantity, Number.NaN);

    if (!name) throw new Error('Vui lòng nhập tên mặt hàng ngoài danh mục.');
    if (name.length > 255) throw new Error('Tên mặt hàng ngoài danh mục không được vượt quá 255 ký tự.');
    if (unitName.length > 100) throw new Error('Tên đơn vị tính không được vượt quá 100 ký tự.');
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        throw new Error('Đơn giá mặt hàng ngoài danh mục không hợp lệ.');
    }
    if (!Number.isFinite(costPrice) || costPrice < 0) {
        throw new Error('Giá vốn mặt hàng ngoài danh mục không hợp lệ.');
    }
    if (!Number.isFinite(stockQuantity) || stockQuantity <= 0) {
        throw new Error('Số lượng mặt hàng ngoài danh mục phải lớn hơn 0.');
    }

    return {
        name,
        unit_name: unitName,
        unit_price: unitPrice,
        cost_price: costPrice,
        stock_quantity: stockQuantity
    };
}

function buildMaterializedItem(item, persisted) {
    const productId = persisted?.product_id;
    const batchId = persisted?.batch_id;
    const productCode = cleanText(persisted?.product_code);
    if (!productId || !batchId || !productCode) {
        throw new Error('Cơ sở dữ liệu không trả về đủ thông tin mặt hàng ngoài danh mục.');
    }

    const originalName = cleanText(persisted?.product_name) || cleanText(item?.name);
    const displayName = originalName.startsWith('[CẦN CẬP NHẬT]')
        ? originalName
        : `[CẦN CẬP NHẬT] ${originalName}`;

    return {
        ...item,
        id: String(productId),
        productId: String(productId),
        product_code: productCode,
        code: productCode,
        batchId: String(batchId),
        isCustom: false,
        name: displayName
    };
}

export async function materializePosCustomItems(client, {
    orderCode,
    cartItems = [],
    context = {}
} = {}) {
    const items = Array.isArray(cartItems) ? cartItems : [];
    const customItems = items.filter(item => item?.isCustom === true);
    if (customItems.length === 0) return [...items];
    if (!client?.rpc) throw new Error('Chưa kết nối được cơ sở dữ liệu.');

    const stableOrderCode = cleanText(orderCode);
    if (!stableOrderCode) {
        throw new Error('Thiếu mã hóa đơn để tạo mặt hàng ngoài danh mục an toàn.');
    }

    const materialized = [];
    for (const item of items) {
        if (item?.isCustom !== true) {
            materialized.push(item);
            continue;
        }

        const cartId = cleanText(item.cartId);
        if (!cartId) {
            throw new Error('Thiếu định danh dòng hàng ngoài danh mục.');
        }
        const { data, error } = await client.rpc('materialize_pos_custom_item', {
            p_idempotency_key: `${stableOrderCode}:${cartId}`,
            p_item: buildCustomItemPayload(item),
            p_context: {
                is_ecommerce: context.isEcommerce === true,
                is_internal: context.isInternal === true,
                is_dose_cut: context.isDoseCut === true
            }
        });
        if (error) throw error;
        materialized.push(buildMaterializedItem(item, data));
    }

    return materialized;
}
