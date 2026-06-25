export const QUICK_SALE_KEYS = Object.freeze(['F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F9']);

export function normalizeQuickSaleKey(value) {
    const key = String(value || '').trim().toUpperCase();
    return QUICK_SALE_KEYS.includes(key) ? key : '';
}

export function assignQuickSaleShortcut(bindings = {}, targetId, key) {
    const normalizedKey = normalizeQuickSaleKey(key);
    const next = {};

    Object.entries(bindings || {}).forEach(([existingKey, existingTarget]) => {
        if (existingTarget !== targetId && existingKey !== normalizedKey) {
            next[existingKey] = existingTarget;
        }
    });

    if (normalizedKey && targetId) next[normalizedKey] = targetId;
    return next;
}

export function findQuickSaleKey(bindings = {}, targetId) {
    return Object.entries(bindings || {}).find(([, value]) => value === targetId)?.[0] || '';
}
