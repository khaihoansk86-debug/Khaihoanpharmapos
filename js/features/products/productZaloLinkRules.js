// Navigation only: reuse the existing product focus UI after authorized catalog loading.
export function consumeZaloSkuLink(products, location, history, focusProduct) {
    const url = new URL(location.href);
    const id = url.searchParams.get('zaloSku');
    if (!id || !/^[0-9a-f-]{36}$/i.test(id) || !products.some(p => p.id === id) || typeof focusProduct !== 'function') return false;
    focusProduct(id);
    url.searchParams.delete('zaloSku');
    history.replaceState(null, '', url.pathname + url.search + url.hash);
    return true;
}
