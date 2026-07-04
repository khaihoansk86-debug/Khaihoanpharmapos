/**
 * ==========================================
 * LÕI NGHIỆP VỤ - CORE LOGIC CONTRACT
 * ==========================================
 * Các hàm trong tệp này thuộc Core Logic của hệ thống PharmaPOS.
 * KHÔNG ĐƯỢC PHÉP CHỈNH SỬA HÀNH VI TÍNH TOÁN HIỆN TẠI (định dạng, tổng, tồn kho, v.v)
 * trừ khi có yêu cầu rõ ràng từ người dùng để thay đổi Core Logic.
 * Thay vào đó, hãy mở rộng thông qua các helper/adapter bên ngoài.
 * Đọc thêm: docs/core-logic-contract.md
 * ==========================================
 */
export const ORDER_TYPES = Object.freeze({
    SALE: 'sale',
    DOSE_CUT: 'dose_cut',
    INTERNAL: 'internal',
    ECOMMERCE: 'ecommerce',
    RETURN: 'return',
});

export function getOrderTypeFromFlags(flags = {}) {
    if (flags.isReturn) return ORDER_TYPES.RETURN;
    if (flags.isDoseCut) return ORDER_TYPES.DOSE_CUT;
    if (flags.isInternal) return ORDER_TYPES.INTERNAL;
    if (flags.isEcommerce) return ORDER_TYPES.ECOMMERCE;
    return ORDER_TYPES.SALE;
}

export function createOrderContext({
    type,
    isReturn = false,
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
        isDoseCut,
        isInternal,
        isEcommerce
    });

    return Object.freeze({
        type: normalizedType,
        isReturn: normalizedType === ORDER_TYPES.RETURN || isReturn,
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
        shouldMarkEditOrReturnComplete: type === ORDER_TYPES.RETURN
    });
}

