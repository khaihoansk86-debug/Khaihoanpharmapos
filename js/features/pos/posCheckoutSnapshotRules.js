function cloneCart(cartItems = []) {
    return Object.freeze((cartItems || []).map(item => Object.freeze({ ...item })));
}

/**
 * Capture the active POS tab exactly once when checkout starts.
 * Async checkout work must use this snapshot instead of mutable window flags.
 */
export function createCheckoutSnapshot({
    tab = null,
    cartItems = [],
    fallbackModes = {},
    paymentMethod = 'cash',
    ecommercePlatform = null
} = {}) {
    const isReturn = tab?.type === 'return' || fallbackModes.isReturn === true;
    const isDoseCut = tab?.isDoseCut === true
        || (tab?.isDoseCut == null && fallbackModes.isDoseCut === true);
    const isInternal = tab?.isInternal === true
        || (tab?.isInternal == null && fallbackModes.isInternal === true);
    const isEcommerce = tab?.isEcommerce === true
        || (tab?.isEcommerce == null && fallbackModes.isEcommerce === true);

    return Object.freeze({
        tabId: tab?.id || null,
        isReturn,
        isDoseCut,
        isInternal,
        isEcommerce,
        paymentMethod: paymentMethod === 'bank_transfer' ? 'bank_transfer' : 'cash',
        ecommercePlatform: isEcommerce ? (ecommercePlatform || 'Shopee') : null,
        cartItems: cloneCart(cartItems)
    });
}

export function getCheckoutStorageType(snapshot = {}) {
    if (snapshot.isReturn) return 'return';
    if (snapshot.isDoseCut) return 'dose_cut';
    if (snapshot.isInternal) return 'internal';
    if (snapshot.isEcommerce) return 'ecommerce';
    return 'sale';
}
