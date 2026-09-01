function cleanText(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
}

export async function saveProductVariantAtomic(client, payload = {}) {
    if (!client?.rpc) {
        throw new Error('Chưa kết nối được cơ sở dữ liệu sản phẩm.');
    }
    if (!cleanText(payload.variant_label)) {
        throw new Error('Vui lòng nhập tên biến thể / SKU.');
    }
    if (!cleanText(payload.product_code)) {
        throw new Error('Vui lòng nhập mã SKU.');
    }
    if (!payload.product_id && !payload.parent_id) {
        throw new Error('Thiếu nhóm sản phẩm cha của SKU mới.');
    }

    const { data, error } = await client.rpc('save_product_variant_with_limits_atomic', {
        p_payload: payload
    });
    if (error) throw error;

    const productId = data?.product_id || data?.id || data;
    if (!productId) {
        throw new Error('Cơ sở dữ liệu không trả về mã SKU vừa lưu.');
    }
    return String(productId);
}
