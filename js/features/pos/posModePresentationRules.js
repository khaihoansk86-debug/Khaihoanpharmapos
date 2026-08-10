const POS_MODE_PRESENTATIONS = Object.freeze({
    return: Object.freeze({
        key: 'return',
        modeLabel: 'Đổi / Trả hàng',
        checkoutHint: 'Đổi / Trả hàng (F10)',
        checkoutLabel: 'ĐỔI / TRẢ HÀNG',
        checkoutIcon: 'fa-right-left'
    }),
    normal: Object.freeze({
        key: 'normal',
        modeLabel: 'Bán thông thường',
        checkoutHint: 'Bán thông thường (F10)',
        checkoutLabel: 'BÁN THÔNG THƯỜNG',
        checkoutIcon: 'fa-cart-shopping'
    }),
    dose: Object.freeze({
        key: 'dose',
        modeLabel: 'Xuất thuốc liều',
        checkoutHint: 'Xuất thuốc liều (F10)',
        checkoutLabel: 'XUẤT THUỐC LIỀU',
        checkoutIcon: 'fa-mortar-pestle'
    }),
    internal: Object.freeze({
        key: 'internal',
        modeLabel: 'Xuất nội bộ',
        checkoutHint: 'Xuất nội bộ (F10)',
        checkoutLabel: 'XUẤT NỘI BỘ',
        checkoutIcon: 'fa-people-carry-box'
    }),
    ecommerce: Object.freeze({
        key: 'ecommerce',
        modeLabel: 'Xuất TMĐT',
        checkoutHint: 'Xuất TMĐT (F10)',
        checkoutLabel: 'XUẤT TMĐT',
        checkoutIcon: 'fa-globe'
    })
});

export function getPOSModePresentation(flags = {}) {
    if (flags.isReturn === true || flags.type === 'return') return POS_MODE_PRESENTATIONS.return;
    if (flags.isInternal === true) return POS_MODE_PRESENTATIONS.internal;
    if (flags.isEcommerce === true) return POS_MODE_PRESENTATIONS.ecommerce;
    if (flags.isDoseCut === true) return POS_MODE_PRESENTATIONS.dose;
    return POS_MODE_PRESENTATIONS.normal;
}

export function summarizePOSDraft(draft = {}) {
    const tabs = Array.isArray(draft.tabs) ? draft.tabs : [];
    const activeTab = tabs.find(tab => tab?.id === draft.currentTabId) || tabs[0] || {};
    const itemCount = tabs.reduce((total, tab) => (
        total + (Array.isArray(tab?.cart) ? tab.cart.length : 0)
    ), 0);

    return {
        tabCount: tabs.length,
        itemCount,
        activeModeLabel: getPOSModePresentation(activeTab).modeLabel,
        savedAt: draft.savedAt || null,
        hasData: itemCount > 0
    };
}

const TAB_PRESENTATIONS = Object.freeze({
    return: Object.freeze({ prefix: 'Đổi / Trả', icon: 'fa-right-left', tone: 'rose' }),
    normal: Object.freeze({ prefix: 'Bán thường', icon: 'fa-cart-shopping', tone: 'blue' }),
    dose: Object.freeze({ prefix: 'Thuốc liều', icon: 'fa-mortar-pestle', tone: 'violet' }),
    internal: Object.freeze({ prefix: 'Nội bộ', icon: 'fa-people-carry-box', tone: 'amber' }),
    ecommerce: Object.freeze({ prefix: 'TMĐT', icon: 'fa-globe', tone: 'pink' })
});

export function getPOSTabPresentation(flags = {}, sequence = 1) {
    const mode = getPOSModePresentation(flags).key;
    const presentation = TAB_PRESENTATIONS[mode];
    return {
        ...presentation,
        key: mode,
        label: `${presentation.prefix} ${Number(sequence) || 1}`
    };
}
