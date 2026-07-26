import { parseComboDescription } from '../products/comboRules.js';

export function isComboCheckoutItem(item = {}) {
    return item?.comboAvailability?.isCombo === true
        || Boolean(parseComboDescription(item?.description));
}

export function normalizeLegacyCheckoutCartItems(cartItems = []) {
    return (cartItems || []).map(item => {
        if (!item) return item;
        const description = typeof item.description === 'object' && item.description !== null
            ? item.description
            : (() => {
                try {
                    return JSON.parse(item.description || 'null');
                } catch {
                    return null;
                }
            })();
        const normalizedDescription = typeof item.description === 'object' && item.description !== null
            ? JSON.stringify(item.description)
            : item.description;
        const isStocklessDosePackage = description?.is_dose_retail === true;

        if (normalizedDescription === item.description && !isStocklessDosePackage) return item;
        return {
            ...item,
            description: normalizedDescription,
            ...(isStocklessDosePackage
                ? {
                    batchId: null,
                    batchNo: null,
                    batchNumber: null,
                    expiryDate: null
                }
                : {})
        };
    });
}
