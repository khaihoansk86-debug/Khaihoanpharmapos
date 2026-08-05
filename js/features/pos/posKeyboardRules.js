export const POS_BLOCKING_MODAL_IDS = Object.freeze([
    'posDraftRecoveryModal',
    'posActionModal',
    'quickCustomerModal',
    'customItemModal',
    'variantSelectionModal',
    'qrPaymentModal'
]);

export function isPOSShortcutBlocked(documentRef) {
    if (!documentRef || typeof documentRef.getElementById !== 'function') return false;
    return POS_BLOCKING_MODAL_IDS.some(id => {
        const modal = documentRef.getElementById(id);
        return modal && !modal.classList.contains('hidden');
    });
}
