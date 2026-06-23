export const ORDER_TYPES = Object.freeze({
    SALE: 'sale',
    DOSE_CUT: 'dose_cut',
    INTERNAL: 'internal',
    ECOMMERCE: 'ecommerce',
    RETURN: 'return',
    EDIT: 'edit'
});

export function getOrderTypeFromFlags(flags = {}) {
    if (flags.isReturn) return ORDER_TYPES.RETURN;
    if (flags.isEdit) return ORDER_TYPES.EDIT;
    if (flags.isDoseCut) return ORDER_TYPES.DOSE_CUT;
    if (flags.isInternal) return ORDER_TYPES.INTERNAL;
    if (flags.isEcommerce) return ORDER_TYPES.ECOMMERCE;
    return ORDER_TYPES.SALE;
}

export function createOrderContext({
    type,
    isReturn = false,
    isEdit = false,
    isDoseCut = false,
    isInternal = false,
    isEcommerce = false,
    paymentMethod = 'cash',
    orderPayload = null,
    cartItems = [],
    sourceId = null,
    returnOrder = null
} = {}) {
    const normalizedType = type || getOrderTypeFromFlags({
        isReturn,
        isEdit,
        isDoseCut,
        isInternal,
        isEcommerce
    });

    return Object.freeze({
        type: normalizedType,
        isReturn: normalizedType === ORDER_TYPES.RETURN || isReturn,
        isEdit: normalizedType === ORDER_TYPES.EDIT || isEdit,
        isDoseCut: normalizedType === ORDER_TYPES.DOSE_CUT || isDoseCut,
        isInternal: normalizedType === ORDER_TYPES.INTERNAL || isInternal,
        isEcommerce: normalizedType === ORDER_TYPES.ECOMMERCE || isEcommerce,
        paymentMethod,
        orderPayload,
        cartItems,
        sourceId,
        returnOrder
    });
}

export function getOrderRules(context = {}) {
    const type = context.type || getOrderTypeFromFlags(context);
    const isStockExport = type === ORDER_TYPES.INTERNAL || type === ORDER_TYPES.ECOMMERCE;

    return Object.freeze({
        isStockExport,
        shouldRequirePayment: type !== ORDER_TYPES.RETURN && !isStockExport,
        shouldDefaultAmountReceived: !isStockExport,
        shouldSyncShift: type === ORDER_TYPES.SALE || type === ORDER_TYPES.DOSE_CUT,
        shouldShowInternalSuccess: type === ORDER_TYPES.INTERNAL,
        shouldMarkEditOrReturnComplete: type === ORDER_TYPES.EDIT || type === ORDER_TYPES.RETURN
    });
}
