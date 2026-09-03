/**
 * Pure rules for optional stock limits and POS-history suggestions.
 *
 * Limits are stored in the product's base (smallest stock) unit. A null
 * value means that side of the limit is intentionally not configured.
 */
export const STOCK_LIMIT_RULE_DEFAULTS = Object.freeze({
    minimumHistoryDays: 30,
    minimumSalesDays: 10,
    minimumPositiveSaleLines: 10,
    minimumCoverageDays: 7,
    maximumCoverageDays: 30
});

function toFiniteNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

/** Convert a blank input to null without turning it into zero. */
export function parseOptionalStockLimit(value) {
    const number = toFiniteNumber(value);
    return number === null ? null : number;
}

export function validateStockLimits({ min = null, max = null } = {}) {
    const minValue = parseOptionalStockLimit(min);
    const maxValue = parseOptionalStockLimit(max);
    const issues = [];

    if (min !== null && min !== undefined && min !== '' && minValue === null) {
        issues.push({ key: 'invalid-min-stock', field: 'add_min_stock', message: 'Tồn tối thiểu phải là một số không âm.' });
    } else if (minValue !== null && minValue < 0) {
        issues.push({ key: 'negative-min-stock', field: 'add_min_stock', message: 'Tồn tối thiểu không được nhỏ hơn 0.' });
    }

    if (max !== null && max !== undefined && max !== '' && maxValue === null) {
        issues.push({ key: 'invalid-max-stock', field: 'add_max_stock', message: 'Tồn tối đa phải là một số không âm.' });
    } else if (maxValue !== null && maxValue < 0) {
        issues.push({ key: 'negative-max-stock', field: 'add_max_stock', message: 'Tồn tối đa không được nhỏ hơn 0.' });
    }

    if (
        minValue !== null
        && maxValue !== null
        && minValue >= 0
        && maxValue >= 0
        && maxValue < minValue
    ) {
        issues.push({ key: 'max-before-min-stock', field: 'add_max_stock', message: 'Tồn tối đa phải lớn hơn hoặc bằng tồn tối thiểu.' });
    }

    return issues;
}

function toDateKey(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10);
}

function dayDistanceInclusive(startKey, endKey) {
    const start = new Date(`${startKey}T00:00:00Z`);
    const end = new Date(`${endKey}T00:00:00Z`);
    return Math.floor((end - start) / 86400000) + 1;
}

function normalizeHistoryRow(row = {}) {
    const order = row.orders || row.order || {};
    const status = row.status || order.status;
    const orderType = row.order_type || order.order_type;
    const createdAt = row.created_at || order.created_at;
    const quantity = Number(row.quantity);
    // order_items.quantity is expressed in the selling unit.  Limits are
    // stored in the SKU's base/smallest stock unit, so normalize every line
    // before calculating demand.  Missing/invalid conversion rates are kept
    // backwards-compatible as a 1:1 base-unit line.
    const conversionRate = Number(row.conversion_rate ?? row.conversionRate ?? 1);
    return {
        status: String(status || '').toLowerCase(),
        orderType: String(orderType || '').toLowerCase(),
        createdAt,
        dateKey: toDateKey(createdAt),
        quantity: Number.isFinite(quantity) && Number.isFinite(conversionRate) && conversionRate > 0
            ? quantity * conversionRate
            : 0
    };
}

function inDemandScope(row) {
    return row.status === 'completed'
        && (row.orderType === 'retail' || row.orderType === 'ecommerce')
        && row.dateKey;
}

/**
 * Build a conservative suggestion from completed retail/ecommerce demand.
 * Cancelled, draft, internal and malformed rows never contribute.
 */
export function buildStockLimitSuggestion(historyRows = [], options = {}) {
    const rules = { ...STOCK_LIMIT_RULE_DEFAULTS, ...options.rules };
    const asOfDateKey = toDateKey(options.asOfDate ?? options.now);
    const rows = (historyRows || [])
        .map(normalizeHistoryRow)
        .filter(row => inDemandScope(row) && (!asOfDateKey || row.dateKey <= asOfDateKey));
    const positiveRows = rows.filter(row => row.quantity > 0);
    const salesDays = new Set(positiveRows.map(row => row.dateKey));
    const firstDate = positiveRows.map(row => row.dateKey).sort()[0] || null;
    const lastDate = positiveRows.map(row => row.dateKey).sort().at(-1) || null;
    const observationEndDate = lastDate && asOfDateKey && asOfDateKey > lastDate
        ? asOfDateKey
        : lastDate;
    const historyDays = firstDate && observationEndDate
        ? dayDistanceInclusive(firstDate, observationEndDate)
        : 0;
    const metrics = {
        historyDays,
        salesDays: salesDays.size,
        positiveSaleLines: positiveRows.length,
        totalNetQuantity: 0,
        averageDailyDemand: 0,
        firstSaleDate: firstDate,
        lastSaleDate: lastDate,
        observationEndDate,
        demandSources: ['retail', 'ecommerce']
    };

    const reason = () => {
        if (!rows.length) return 'Chưa có đơn POS hoàn thành phù hợp.';
        if (historyDays < rules.minimumHistoryDays) return `Lịch sử mới có ${historyDays}/${rules.minimumHistoryDays} ngày.`;
        if (salesDays.size < rules.minimumSalesDays) return `Mới có ${salesDays.size}/${rules.minimumSalesDays} ngày có bán.`;
        if (positiveRows.length < rules.minimumPositiveSaleLines) return `Mới có ${positiveRows.length}/${rules.minimumPositiveSaleLines} dòng bán.`;
        return 'Nhu cầu ròng bằng 0 sau khi trừ hàng trả.';
    };

    if (
        !firstDate
        || historyDays < rules.minimumHistoryDays
        || salesDays.size < rules.minimumSalesDays
        || positiveRows.length < rules.minimumPositiveSaleLines
    ) {
        return { eligible: false, reason: reason(), metrics };
    }

    const dailyTotals = new Map();
    rows.forEach(row => {
        dailyTotals.set(row.dateKey, (dailyTotals.get(row.dateKey) || 0) + row.quantity);
    });
    // Returns may be recorded on a later day than the sale. Sum the net
    // period demand first so those returns reduce the suggestion regardless
    // of their posting date; clamping each day separately would overstate it.
    const totalNetQuantity = [...dailyTotals.values()]
        .reduce((sum, quantity) => sum + quantity, 0);
    const averageDailyDemand = totalNetQuantity / historyDays;
    metrics.totalNetQuantity = totalNetQuantity;
    metrics.averageDailyDemand = averageDailyDemand;

    if (!(averageDailyDemand > 0)) {
        return { eligible: false, reason: reason(), metrics };
    }

    const minStockQuantity = Math.max(
        1,
        Math.ceil(averageDailyDemand * rules.minimumCoverageDays)
    );
    const maxStockQuantity = Math.max(
        minStockQuantity,
        Math.ceil(averageDailyDemand * rules.maximumCoverageDays)
    );

    return {
        eligible: true,
        minStockQuantity,
        maxStockQuantity,
        metrics,
        reason: `Dựa trên ${metrics.salesDays} ngày bán trong ${metrics.historyDays} ngày quan sát.`
    };
}

export function classifyStockAgainstLimits(stockQuantity, { min = null, max = null } = {}) {
    const stock = Number(stockQuantity || 0);
    const minValue = parseOptionalStockLimit(min);
    const maxValue = parseOptionalStockLimit(max);
    if (stock <= 0) return 'out-of-stock';
    if (minValue !== null && stock < minValue) return 'below-minimum';
    if (maxValue !== null && stock > maxValue) return 'above-maximum';
    if (minValue !== null || maxValue !== null) return 'within-limits';
    return 'unconfigured';
}
