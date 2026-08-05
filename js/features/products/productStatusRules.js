export function applyProductBusinessStatus(products = [], productId, isActive) {
    const normalizedId = String(productId ?? '');
    return (Array.isArray(products) ? products : []).map(product => {
        if (String(product?.id ?? '') !== normalizedId) return product;
        return {
            ...product,
            is_active: isActive === true
        };
    });
}

export function filterProductBusinessStatus(products = [], status = 'active') {
    const catalog = Array.isArray(products) ? products : [];
    if (status === 'active') return catalog.filter(product => product?.is_active !== false);
    if (status === 'inactive') return catalog.filter(product => product?.is_active === false);
    return catalog;
}

function getProductStatusFlags(product) {
    try {
        const description = typeof product?.description === 'string'
            ? JSON.parse(product.description)
            : product?.description;
        return description && typeof description === 'object' ? description : {};
    } catch {
        return {};
    }
}

export function filterProductStatusView(products = [], status = 'active') {
    const catalog = Array.isArray(products) ? products : [];
    if (status === 'inactive') {
        return catalog.filter(product => product?.is_active === false);
    }

    const activeCatalog = catalog.filter(product => product?.is_active !== false);
    if (status === 'dose_cut') {
        return activeCatalog.filter(product => getProductStatusFlags(product).is_dose_cut === true);
    }
    if (status === 'dose_retail') {
        return activeCatalog.filter(product => getProductStatusFlags(product).is_dose_retail === true);
    }
    if (status === 'active') {
        return activeCatalog.filter(product => {
            const flags = getProductStatusFlags(product);
            return flags.is_dose_cut !== true && flags.is_dose_retail !== true;
        });
    }
    return catalog;
}

export function canCreateProductInStatusView(statusView = 'active') {
    return statusView !== 'inactive';
}

export function getProductEmptyState({ statusView = 'active', hasSearchTerm = false } = {}) {
    if (statusView === 'inactive') {
        return {
            icon: 'fa-box-archive',
            title: hasSearchTerm
                ? 'Không có hàng ngừng kinh doanh phù hợp.'
                : 'Chưa có hàng ngừng kinh doanh.',
            description: 'Hàng chỉ xuất hiện tại đây sau khi được chuyển từ tab Đang kinh doanh.',
            allowCreate: false
        };
    }

    if (hasSearchTerm) {
        return {
            icon: 'fa-magnifying-glass',
            title: 'Không tìm thấy sản phẩm phù hợp.',
            description: 'Hãy kiểm tra lại từ khóa hoặc xóa từ khóa để xem toàn bộ danh sách trong tab này.',
            allowCreate: false
        };
    }

    return {
        icon: 'fa-box-open',
        title: 'Chưa có sản phẩm nào trong kho.',
        description: '',
        allowCreate: statusView === 'active'
    };
}
