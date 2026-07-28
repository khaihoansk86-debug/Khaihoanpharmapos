/**
 * Internal issue inventory trails are persisted in base-unit quantities.
 * POS cart costPrice, however, belongs to the selected selling unit.
 *
 * Keep the selected quantity/conversion for stock allocation and normalize only
 * the fallback cost used when a batch has no recorded cost.
 */
export function normalizeInternalIssueCheckoutItems(orderData = {}, cartItems = []) {
    if (orderData.isInternal !== true || !Array.isArray(cartItems)) return cartItems;

    return cartItems.map(item => {
        if (!item) return item;

        const conversionRate = Number(item.conversionRate || 1) || 1;
        const selectedUnitCost = Number(item.costPrice || 0);
        if (conversionRate <= 1 || !Number.isFinite(selectedUnitCost) || selectedUnitCost <= 0) {
            return item;
        }

        return {
            ...item,
            costPrice: selectedUnitCost / conversionRate
        };
    });
}
