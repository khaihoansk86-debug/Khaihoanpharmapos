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

export function createReloadSafeDraft({ tabs = [], currentTabId = null } = {}) {
    const safeTabs = (Array.isArray(tabs) ? tabs : []).map(tab => ({
        ...cloneSerializable({
            ...tab,
            qrRealtimeSubscription: null
        }),
        qrRealtimeSubscription: null
    }));

    return {
        version: 1,
        savedAt: new Date().toISOString(),
        tabs: safeTabs,
        currentTabId
    };
}

export function restoreReloadSafeDraft(serializedDraft) {
    const draft = typeof serializedDraft === 'string'
        ? JSON.parse(serializedDraft)
        : serializedDraft;

    if (!draft || !Array.isArray(draft.tabs) || draft.tabs.length === 0) return null;
    const tabs = draft.tabs.filter(tab => tab && tab.id && Array.isArray(tab.cart));
    if (tabs.length === 0) return null;
    const activeTab = tabs.find(tab => tab.id === draft.currentTabId) || tabs[0];

    return {
        tabs,
        currentTabId: activeTab.id,
        activeTab
    };
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
    return message.includes('failed to fetch')
        || message.includes('networkerror')
        || message.includes('network error')
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
