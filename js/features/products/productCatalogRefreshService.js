const PRODUCT_SNAPSHOT_SELECT = `
    *,
    product_categories:categories(id, name),
    product_units(*),
    product_batches(*)
`;

function requireCatalogIdentity({ id, productCode } = {}) {
    if (id) return { column: 'id', value: id };
    if (productCode) return { column: 'product_code', value: productCode };
    throw new Error('Cần id hoặc mã hàng để đọc lại dữ liệu sản phẩm.');
}

export async function fetchCatalogProductSnapshot(client, identity = {}) {
    if (!client?.from) {
        throw new Error('Chưa kết nối được cơ sở dữ liệu sản phẩm.');
    }

    const { column, value } = requireCatalogIdentity(identity);
    const { data, error } = await client
        .from('products')
        .select(PRODUCT_SNAPSHOT_SELECT)
        .eq(column, value)
        .single();

    if (error) throw error;
    if (!data) throw new Error(`Không đọc lại được sản phẩm ${value}.`);

    return {
        ...data,
        categories: data.categories || data.product_categories || null
    };
}

export async function fetchCatalogIdentityConflictSnapshot(client, {
    productCode,
    barcode,
    excludeProductId = null
} = {}) {
    if (!client?.from) {
        throw new Error('Chưa kết nối được cơ sở dữ liệu sản phẩm.');
    }

    const identities = [
        { column: 'product_code', value: String(productCode || '').trim() },
        { column: 'barcode', value: String(barcode || '').trim() }
    ].filter(identity => identity.value);

    for (const identity of identities) {
        const { data, error } = await client
            .from('products')
            .select('id, name, product_code, barcode')
            .eq(identity.column, identity.value)
            .limit(1);
        if (error) throw error;

        const conflict = (data || []).find(product =>
            String(product?.id || '') !== String(excludeProductId || '')
        );
        if (conflict) return conflict;
    }

    return null;
}

export function mergeCatalogProductSnapshot(products = [], snapshot) {
    if (!snapshot?.id) return [...(products || [])];

    let replaced = false;
    const nextProducts = (products || []).map(product => {
        if (String(product?.id || '') !== String(snapshot.id)) return product;
        replaced = true;
        return snapshot;
    });

    return replaced ? nextProducts : [...nextProducts, snapshot];
}
