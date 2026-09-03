/**
 * Shared unit-of-measure catalog for every POS workflow.
 *
 * The database keeps the unit name as a snapshot on each product/order.  This
 * module only standardises the value at the application boundary and stores
 * user-added choices locally so every screen on the same till offers the same
 * list after a reload.
 */

export const DEFAULT_UNIT_NAMES = Object.freeze([
    'Vi\u00ean',
    'V\u1ec9',
    'H\u1ed9p',
    'L\u1ecd'
]);

export const UNIT_CATALOG_STORAGE_KEY = 'khaihoan_unit_catalog_v1';

function cleanText(value) {
    return String(value ?? '').trim().replace(/\s+/g, ' ');
}

/** Accent-insensitive identity used for comparisons and de-duplication. */
export function unitIdentity(value) {
    return cleanText(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .toLocaleLowerCase('vi-VN');
}

const STANDARD_BY_IDENTITY = new Map([
    ['vien', DEFAULT_UNIT_NAMES[0]],
    // Both spellings have existed in old imports.  They must render and save
    // as the same canonical value from now on.
    ['vi', DEFAULT_UNIT_NAMES[1]],
    ['hop', DEFAULT_UNIT_NAMES[2]],
    ['lo', DEFAULT_UNIT_NAMES[3]]
]);

function titleCaseUnit(value) {
    const text = cleanText(value);
    return text
        ? text.charAt(0).toLocaleUpperCase('vi-VN') + text.slice(1).toLocaleLowerCase('vi-VN')
        : '';
}

/**
 * Return the canonical display/storage spelling for a unit.
 * Unknown units remain valid and are simply title-cased (for example `Ống`).
 */
export function normalizeUnitName(value, fallback = '') {
    const text = cleanText(value);
    if (!text) return cleanText(fallback);
    const identity = unitIdentity(text);
    return STANDARD_BY_IDENTITY.get(identity) || titleCaseUnit(text);
}

export function isDefaultUnit(value) {
    const identity = unitIdentity(value);
    return DEFAULT_UNIT_NAMES.some(name => unitIdentity(name) === identity);
}

function readCustomUnits() {
    try {
        if (typeof localStorage === 'undefined') return [];
        const raw = localStorage.getItem(UNIT_CATALOG_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(parsed)) return [];
        const seen = new Set();
        return parsed
            .map(value => normalizeUnitName(value))
            .filter(value => {
                const key = unitIdentity(value);
                if (!key || isDefaultUnit(value) || seen.has(key)) return false;
                seen.add(key);
                return true;
            });
    } catch {
        return [];
    }
}

function writeCustomUnits(units) {
    try {
        if (typeof localStorage === 'undefined') return;
        localStorage.setItem(UNIT_CATALOG_STORAGE_KEY, JSON.stringify(units));
    } catch {
        // Storage can be disabled in private mode.  The current input still
        // works; persistence is best-effort only.
    }
}

/** List defaults, remembered custom units, and currently-used legacy names. */
export function getUnitOptions(currentUnits = []) {
    const options = [];
    const seen = new Set();
    [...DEFAULT_UNIT_NAMES, ...readCustomUnits(), ...(currentUnits || [])]
        .map(value => typeof value === 'object' && value !== null ? value.unit_name : value)
        .map(value => normalizeUnitName(value))
        .filter(Boolean)
        .forEach(value => {
            const key = unitIdentity(value);
            if (seen.has(key)) return;
            seen.add(key);
            options.push(value);
        });
    return options;
}

/** Remember a unit and return its canonical value. */
export function rememberUnit(value) {
    const canonical = normalizeUnitName(value);
    if (!canonical || isDefaultUnit(canonical)) return canonical;

    const customUnits = readCustomUnits();
    const key = unitIdentity(canonical);
    const existing = customUnits.find(item => unitIdentity(item) === key);
    if (existing) return existing;
    if (!existing) {
        customUnits.push(canonical);
        writeCustomUnits(customUnits);
    }
    return canonical;
}

export function addCustomUnit(value) {
    const canonical = normalizeUnitName(value);
    if (!canonical) throw new Error('Tên đơn vị không được để trống.');
    return rememberUnit(canonical);
}

/** Pick the next standard unit when the user presses “Thêm ĐVT quy đổi”. */
export function getNextSuggestedUnit(currentUnits = []) {
    const used = new Set((currentUnits || []).map(unitIdentity).filter(Boolean));
    return DEFAULT_UNIT_NAMES.find(name => !used.has(unitIdentity(name))) || '';
}

export function normalizeUnitRecord(unit = {}) {
    const normalizedName = normalizeUnitName(unit.unit_name, 'Đơn vị');
    return { ...unit, unit_name: normalizedName };
}

export function normalizeProductUnits(units = []) {
    const result = [];
    const seen = new Set();
    (units || []).forEach(unit => {
        if (!cleanText(unit?.unit_name)) return;
        const normalized = normalizeUnitRecord(unit);
        const key = unitIdentity(normalized.unit_name);
        if (!key) return;
        // Prefer the explicit base-unit row when old data contains both “vĩ”
        // and “vỉ”; this avoids duplicate buttons without changing rates.
        const existingIndex = result.findIndex(item => unitIdentity(item.unit_name) === key);
        if (existingIndex >= 0) {
            if (normalized.is_base_unit && !result[existingIndex].is_base_unit) {
                result[existingIndex] = normalized;
            }
            return;
        }
        seen.add(key);
        result.push(normalized);
    });
    return result;
}

function findTargetInput(button) {
    const explicitId = button?.dataset?.unitTarget;
    if (explicitId && explicitId !== 'closest') {
        const target = document.getElementById(explicitId);
        if (target) return target;
    }
    return button?.closest('.unit-row, [data-unit-scope]')?.querySelector('.unit-name, .quick-unit, .quick-large-unit, #customItemUnit')
        || null;
}

function refreshDatalist() {
    if (typeof document === 'undefined') return;
    const datalist = document.getElementById('unitCatalogOptions');
    if (!datalist) return;
    datalist.innerHTML = getUnitOptions()
        .map(value => `<option value="${String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')}"></option>`)
        .join('');
}

/** Add datalist support and “+” buttons without coupling pages together. */
export function setupUnitCatalogUI(root = typeof document === 'undefined' ? null : document) {
    if (!root || typeof document === 'undefined') return;
    let datalist = document.getElementById('unitCatalogOptions');
    if (!datalist) {
        datalist = document.createElement('datalist');
        datalist.id = 'unitCatalogOptions';
        document.body.appendChild(datalist);
    }
    refreshDatalist();

    root.querySelectorAll?.('input.unit-name, #customItemUnit, input.quick-unit, input.quick-large-unit, input[id^="inline_base_unit_"], input[id^="inline_inner_unit_"]').forEach(input => {
        input.setAttribute('list', 'unitCatalogOptions');
        if (input.dataset.unitCatalogBound === 'true') return;
        input.dataset.unitCatalogBound = 'true';
        input.addEventListener('blur', () => {
            const canonical = normalizeUnitName(input.value);
            if (canonical) input.value = rememberUnit(canonical);
            refreshDatalist();
        }, { once: false });
    });

    if (document.body.dataset.unitCatalogBound === 'true') return;
    document.body.dataset.unitCatalogBound = 'true';
    document.addEventListener('click', event => {
        const button = event.target.closest?.('[data-add-unit-catalog]');
        if (!button) return;
        event.preventDefault();
        const target = findTargetInput(button);
        const value = window.prompt('Nhập tên đơn vị mới (ví dụ: Ống, Tuýp):', target?.value || '');
        if (value === null) return;
        try {
            const canonical = addCustomUnit(value);
            if (target) target.value = canonical;
            refreshDatalist();
            target?.dispatchEvent(new Event('input', { bubbles: true }));
        } catch (error) {
            window.alert(error.message);
        }
    });
}

export function renderUnitDatalistOptions() {
    refreshDatalist();
    return getUnitOptions();
}
