const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeComboInput(input = {}) {
    const name = String(input.name || '').trim();
    const code = String(input.code || '').trim().toUpperCase();
    const categoryId = String(input.categoryId || '').trim();
    const price = Number(input.price || 0);
    const items = (Array.isArray(input.items) ? input.items : []).map(item => ({
        id: String(item?.id || '').trim(),
        name: String(item?.name || '').trim(),
        unit: String(item?.unit || '').trim(),
        quantity: Number(item?.quantity || 0)
    }));

    const invalid = !name
        || name.length > 255
        || !code
        || code.length > 64
        || !UUID_PATTERN.test(categoryId)
        || !Number.isFinite(price)
        || price < 0
        || items.length < 1
        || items.length > 100
        || items.some(item =>
            !UUID_PATTERN.test(item.id)
            || !item.name
            || !item.unit
            || !Number.isFinite(item.quantity)
            || item.quantity <= 0
        );
    if (invalid) throw new Error('Thông tin combo không hợp lệ.');

    return {
        id: input.id || null,
        name,
        code,
        categoryId,
        price,
        description: {
            isCombo: true,
            items
        }
    };
}

function toMigrationError(error) {
    const message = String(error?.message || '');
    if (error?.code === 'PGRST202' || message.includes('save_combo_catalog_atomic')) {
        return new Error('Chưa áp dụng migration lưu combo nguyên tử.');
    }
    return error;
}

export async function saveComboCatalogAtomic(input = {}, client) {
    if (!client) throw new Error('Supabase chưa được kết nối.');
    const normalized = normalizeComboInput(input);
    const { data, error } = await client.rpc('save_combo_catalog_atomic', {
        p_combo_id: normalized.id,
        p_name: normalized.name,
        p_code: normalized.code,
        p_category_id: normalized.categoryId,
        p_price: normalized.price,
        p_description: normalized.description
    });
    if (error) throw toMigrationError(error);
    return data;
}

export async function archiveComboCatalogAtomic(comboId, client) {
    if (!client) throw new Error('Supabase chưa được kết nối.');
    if (!UUID_PATTERN.test(String(comboId || ''))) {
        throw new Error('Mã combo không hợp lệ.');
    }
    const { data, error } = await client.rpc('archive_combo_catalog_atomic', {
        p_combo_id: comboId
    });
    if (error) throw toMigrationError(error);
    return data === true;
}
