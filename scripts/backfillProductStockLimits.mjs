import { createClient } from '@supabase/supabase-js';
import { buildStockLimitSuggestion } from '../js/features/products/productStockLimitRules.js';
import { unitIdentity } from '../js/core/unitCatalog.js';

const PAGE_SIZE = 1000;
const WRITE_MODE = process.argv.includes('--write');
const OVERWRITE = process.argv.includes('--overwrite');

function requireEnvironment(name) {
    const value = String(process.env[name] || '').trim();
    if (!value) throw new Error(`Thiếu biến môi trường ${name}.`);
    return value;
}

async function fetchAll(buildQuery) {
    const rows = [];
    for (let page = 0; ; page += 1) {
        const { data, error } = await buildQuery()
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
        if (error) throw error;
        rows.push(...(data || []));
        if (!data || data.length < PAGE_SIZE) return rows;
    }
}

function categoryName(product) {
    return String(product.product_categories?.name || '').trim();
}

function isPhysicalActiveSku(product) {
    const code = String(product.product_code || '').toUpperCase();
    return product.is_active !== false
        && product.is_direct_sale !== false
        && !code.startsWith('PARENT_')
        && !code.startsWith('CB')
        && !categoryName(product).toLocaleLowerCase('vi-VN').includes('combo');
}

function buildUnitMaps(units) {
    const maps = new Map();
    const conflicts = new Map();
    for (const unit of units) {
        const productId = String(unit.product_id || '');
        const key = unitIdentity(unit.unit_name);
        const rate = Number(unit.conversion_rate);
        if (!productId || !key || !Number.isFinite(rate) || rate <= 0) continue;
        if (!maps.has(productId)) maps.set(productId, new Map());
        const unitMap = maps.get(productId);
        if (unitMap.has(key) && unitMap.get(key) !== rate) {
            if (!conflicts.has(productId)) conflicts.set(productId, []);
            conflicts.get(productId).push({ unit: unit.unit_name, rates: [unitMap.get(key), rate] });
            continue;
        }
        unitMap.set(key, rate);
    }
    return { maps, conflicts };
}

function groupHistory(orderItems, unitMaps) {
    const historyByProduct = new Map();
    const unknownUnitsByProduct = new Map();
    for (const item of orderItems) {
        const productId = String(item.product_id || '');
        if (!productId) continue;
        const order = item.orders || {};
        const status = String(order.status || '').toLowerCase();
        const orderType = String(order.order_type || '').toLowerCase();
        if (status !== 'completed' || !['retail', 'ecommerce'].includes(orderType)) continue;

        const unitKey = unitIdentity(item.unit_name);
        const unitMap = unitMaps.get(productId) || new Map();
        const conversionRate = unitMap.get(unitKey);
        if (!unitKey || !Number.isFinite(conversionRate)) {
            if (!unknownUnitsByProduct.has(productId)) unknownUnitsByProduct.set(productId, new Set());
            unknownUnitsByProduct.get(productId).add(String(item.unit_name || '(trống)'));
            continue;
        }

        if (!historyByProduct.has(productId)) historyByProduct.set(productId, []);
        historyByProduct.get(productId).push({
            quantity: item.quantity,
            unit_name: item.unit_name,
            conversion_rate: conversionRate,
            ...order
        });
    }
    return { historyByProduct, unknownUnitsByProduct };
}

function summarize(products, historyByProduct, unknownUnitsByProduct, conflicts, asOfDate) {
    const rows = products.map(product => {
        const id = String(product.id);
        const unknownUnits = [...(unknownUnitsByProduct.get(id) || [])];
        const unitConflicts = conflicts.get(id) || [];
        const suggestion = buildStockLimitSuggestion(historyByProduct.get(id) || [], { asOfDate });
        const dataSafe = unknownUnits.length === 0 && unitConflicts.length === 0;
        const eligible = dataSafe && suggestion.eligible;
        return {
            id,
            code: product.product_code,
            name: product.name,
            category: categoryName(product),
            currentMin: product.min_stock_quantity,
            currentMax: product.max_stock_quantity,
            eligible,
            reason: !dataSafe
                ? `Đơn vị lịch sử không ánh xạ an toàn: ${unknownUnits.join(', ') || 'trùng hệ số quy đổi'}`
                : suggestion.reason,
            unknownUnits,
            unitConflicts,
            min: eligible ? suggestion.minStockQuantity : null,
            max: eligible ? suggestion.maxStockQuantity : null,
            metrics: suggestion.metrics
        };
    });

    const eligible = rows.filter(row => row.eligible);
    const reasonCounts = rows.filter(row => !row.eligible).reduce((counts, row) => {
        counts[row.reason] = (counts[row.reason] || 0) + 1;
        return counts;
    }, {});
    return {
        rows,
        report: {
            physicalActiveSkus: products.length,
            eligible: eligible.length,
            ineligible: rows.length - eligible.length,
            currentlyConfigured: rows.filter(row => row.currentMin !== null || row.currentMax !== null).length,
            unknownUnitSkus: rows.filter(row => row.unknownUnits.length).length,
            conflictingUnitSkus: rows.filter(row => row.unitConflicts.length).length,
            minRange: eligible.length ? [Math.min(...eligible.map(row => row.min)), Math.max(...eligible.map(row => row.min))] : null,
            maxRange: eligible.length ? [Math.min(...eligible.map(row => row.max)), Math.max(...eligible.map(row => row.max))] : null,
            reasons: Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]).slice(0, 20),
            highestLimits: [...eligible]
                .sort((a, b) => b.max - a.max)
                .slice(0, 20)
                .map(({ code, name, min, max, metrics }) => ({ code, name, min, max, metrics })),
            unknownUnitSamples: rows
                .filter(row => row.unknownUnits.length)
                .slice(0, 30)
                .map(({ code, name, unknownUnits }) => ({ code, name, unknownUnits }))
        }
    };
}

async function writeSuggestions(client, rows) {
    const targets = rows.filter(row => row.eligible && (
        OVERWRITE || (row.currentMin === null && row.currentMax === null)
    ));
    let updated = 0;
    for (const row of targets) {
        const { data, error } = await client
            .from('products')
            .update({ min_stock_quantity: row.min, max_stock_quantity: row.max })
            .eq('id', row.id)
            .select('id, min_stock_quantity, max_stock_quantity')
            .single();
        if (error) throw new Error(`${row.code}: ${error.message}`);
        if (Number(data?.min_stock_quantity) !== row.min || Number(data?.max_stock_quantity) !== row.max) {
            throw new Error(`${row.code}: giá trị đọc lại không khớp sau cập nhật.`);
        }
        updated += 1;
    }
    return { targets: targets.length, updated };
}

async function main() {
    const client = createClient(
        requireEnvironment('SUPABASE_URL'),
        requireEnvironment('SUPABASE_KEY'),
        { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const [allProducts, units, orderItems] = await Promise.all([
        fetchAll(() => client.from('products').select(`
            id, name, product_code, description, is_active, is_direct_sale, parent_id,
            min_stock_quantity, max_stock_quantity,
            product_categories:categories(name)
        `).order('id', { ascending: true })),
        fetchAll(() => client.from('product_units')
            .select('id, product_id, unit_name, conversion_rate, is_base_unit')
            .order('id', { ascending: true })),
        fetchAll(() => client.from('order_items')
            .select('id, product_id, quantity, unit_name, orders(status, order_type, created_at)')
            .order('id', { ascending: true }))
    ]);

    const products = allProducts.filter(isPhysicalActiveSku);
    const { maps, conflicts } = buildUnitMaps(units);
    const { historyByProduct, unknownUnitsByProduct } = groupHistory(orderItems, maps);
    const analysisDates = orderItems
        .map(item => item.orders)
        .filter(order => String(order?.status || '').toLowerCase() === 'completed')
        .filter(order => ['retail', 'ecommerce'].includes(String(order?.order_type || '').toLowerCase()))
        .map(order => order.created_at)
        .filter(Boolean)
        .sort();
    const asOfDate = analysisDates.at(-1) || new Date().toISOString();
    const { rows, report } = summarize(products, historyByProduct, unknownUnitsByProduct, conflicts, asOfDate);
    const result = {
        mode: WRITE_MODE ? 'write' : 'preview',
        generatedAt: new Date().toISOString(),
        analysisAsOf: asOfDate,
        totals: {
            allProducts: allProducts.length,
            productUnits: units.length,
            orderItems: orderItems.length
        },
        ...report
    };

    if (WRITE_MODE) result.write = await writeSuggestions(client, rows);
    console.log(JSON.stringify(result, null, 2));
}

main().catch(error => {
    console.error(JSON.stringify({ error: error.message }, null, 2));
    process.exitCode = 1;
});
