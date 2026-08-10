function cloneSerializable(value) {
    return JSON.parse(JSON.stringify(value));
}

export function startPostCheckoutTasks(tasks = [], options = {}) {
    const completion = Promise.resolve().then(async () => {
        const failedTasks = [];

        for (const task of tasks) {
            if (!task || typeof task.run !== 'function') continue;
            try {
                await task.run();
            } catch (error) {
                const name = task.name || 'unknown';
                failedTasks.push(name);
                options.onTaskError?.({ name, error });
            }
        }

        return {
            ok: failedTasks.length === 0,
            failedTasks
        };
    });

    return { completion };
}

export const POS_DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function createReloadSafeDraft({
    tabs = [],
    currentTabId = null,
    ownerEmployeeId = null,
    deviceKey = null,
    now = new Date()
} = {}) {
    const safeTabs = (Array.isArray(tabs) ? tabs : []).map(tab => ({
        ...cloneSerializable({
            ...tab,
            qrRealtimeSubscription: null
        }),
        qrRealtimeSubscription: null
    }));

    return {
        version: 2,
        savedAt: new Date(now).toISOString(),
        ownerEmployeeId: ownerEmployeeId == null ? null : String(ownerEmployeeId),
        deviceKey: deviceKey == null ? null : String(deviceKey),
        tabs: safeTabs,
        currentTabId
    };
}

export function restoreReloadSafeDraft(serializedDraft, options = null) {
    let draft = serializedDraft;
    if (typeof serializedDraft === 'string') {
        try {
            draft = JSON.parse(serializedDraft);
        } catch {
            return null;
        }
    }

    if (!draft || !Array.isArray(draft.tabs) || draft.tabs.length === 0) return null;

    if (options) {
        const employeeId = options.employeeId == null ? null : String(options.employeeId);
        const deviceKey = options.deviceKey == null ? null : String(options.deviceKey);
        if (!draft.ownerEmployeeId || !draft.deviceKey) return null;
        if (employeeId && String(draft.ownerEmployeeId) !== employeeId) return null;
        if (deviceKey && String(draft.deviceKey) !== deviceKey) return null;

        const savedAtMs = Date.parse(draft.savedAt || '');
        const nowMs = new Date(options.now || new Date()).getTime();
        const maxAgeMs = Number(options.maxAgeMs ?? POS_DRAFT_MAX_AGE_MS);
        if (!Number.isFinite(savedAtMs) || !Number.isFinite(nowMs)) return null;
        if (Number.isFinite(maxAgeMs) && (nowMs - savedAtMs < 0 || nowMs - savedAtMs > maxAgeMs)) return null;
    }
    const tabs = draft.tabs.filter(tab => tab && tab.id && Array.isArray(tab.cart));
    if (tabs.length === 0) return null;
    const activeTab = tabs.find(tab => tab.id === draft.currentTabId) || tabs[0];

    return {
        version: draft.version || 1,
        savedAt: draft.savedAt || null,
        ownerEmployeeId: draft.ownerEmployeeId || null,
        deviceKey: draft.deviceKey || null,
        tabs,
        currentTabId: activeTab.id,
        activeTab
    };
}

export function parseOfflineOrders(serializedOrders) {
    if (!serializedOrders) return [];
    try {
        const orders = typeof serializedOrders === 'string'
            ? JSON.parse(serializedOrders)
            : serializedOrders;
        return Array.isArray(orders)
            ? orders.filter(order => order && typeof order === 'object')
            : [];
    } catch {
        return [];
    }
}

export function upsertOfflineOrder(orders = [], candidate) {
    const current = Array.isArray(orders) ? [...orders] : [];
    if (!candidate) return current;
    const orderCode = candidate.orderData?.orderCode || candidate.orderData?.order_code;
    if (!orderCode) return [...current, candidate];

    const existingIndex = current.findIndex(order => {
        const existingCode = order.orderData?.orderCode || order.orderData?.order_code;
        return existingCode === orderCode;
    });
    if (existingIndex < 0) return [...current, candidate];

    current[existingIndex] = {
        ...candidate,
        id: current[existingIndex].id,
        timestamp: current[existingIndex].timestamp
    };
    return current;
}

export function isRecoverableNetworkError(error) {
    const message = String(error?.message || error || '').toLowerCase();
    const code = String(error?.code || error?.name || '').toLowerCase();
    if (error?.status === 0 || error?.statusCode === 0) return true;
    if (['err_network', 'fetch_error', 'econnreset', 'econnrefused', 'enotfound', 'etimedout'].includes(code)) return true;
    return message.includes('failed to fetch')
        || message.includes('fetch failed')
        || message.includes('networkerror')
        || message.includes('network error')
        || message.includes('network request failed')
        || message.includes('load failed')
        || message.includes('connection');
}

export function createCartFingerprint(cartItems = []) {
    return JSON.stringify((cartItems || []).map(item => ({
        productId: item.id || item.productId || null,
        batchId: item.batchId || null,
        quantity: Number(item.quantity || 0),
        price: Number(item.price || 0),
        unit: item.unit || null
    })));
}

export function getReusableOrderCode(pendingCheckout, cartItems = []) {
    if (!pendingCheckout?.orderCode || !pendingCheckout?.cartFingerprint) return null;
    return pendingCheckout.cartFingerprint === createCartFingerprint(cartItems)
        ? pendingCheckout.orderCode
        : null;
}

export async function completeOfflineCheckout({ save, onSaved } = {}) {
    if (typeof save !== 'function') throw new Error('Thiếu thao tác lưu đơn offline.');
    await save();
    await onSaved?.();
    return true;
}
