with open('scratch/test_today.cjs', 'w', encoding='utf-8') as f:
    f.write('''const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://iejgtdcdzababydaqjef.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AjGRJy05OUTeqEJxvhy8eg_Rck3CpU1';
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const { buildAnalytics } = require('./js/features/reports/reportAnalyticsRules.js');

const DAY_MS = 24 * 60 * 60 * 1000;
function dateKey(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return \\-\-\\;
}

function chunk(arr, size) {
    return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
        arr.slice(i * size, i * size + size)
    );
}

function toNumber(val) {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
}

async function run() {
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today.getTime() + DAY_MS);
    
    // mimic what reportService.js does
    const fromIso = today.toISOString();
    const toIso = tomorrow.toISOString();
    const todayStr = dateKey(today);

    console.log("Fetching orders from", fromIso, "to", toIso);
    const { data: orders } = await supabaseClient.from('orders').select('*').gte('created_at', fromIso).lt('created_at', toIso);
    if (!orders || !orders.length) return console.log("No orders");
    const orderIds = orders.map(o => o.id);
    const { data: items } = await supabaseClient.from('order_items').select('*').in('order_id', orderIds);
    
    const productIds = [...new Set(items.map(i => i.product_id).filter(Boolean))];
    const chunks = chunk(productIds, 100);
    const productPromises = chunks.map(ids => supabaseClient.from('products').select('*').in('id', ids));
    const productResults = await Promise.all(productPromises);
    const products = productResults.flatMap(r => r.data || []);
    
    const isDoseProductMap = new Map();
    const isDoseRetailMap = new Map();
    products.forEach(p => {
        let isDose = false, isRetail = false;
        try {
            if(p.description) {
                const desc = JSON.parse(p.description);
                if(desc.is_dose_cut) isDose = true;
                if(desc.is_dose_retail) isRetail = true;
            }
        } catch(e) {}
        isDoseProductMap.set(p.id, isDose);
        isDoseRetailMap.set(p.id, isRetail);
    });
    
    const range = {
        currentKeys: [todayStr],
        previousKeys: [],
        keys: [todayStr]
    };
    
    const lookups = {
        isDoseProductMap,
        isDoseRetailMap
    };
    
    const result = buildAnalytics(orders, items, lookups, new Map(), range, 'all', [], []);
    console.log('summary doseItemsSold:', result.summary.doseItemsSold);
    console.log('orders count:', orders.length);
    console.log('items count:', items.length);
}
run();
''')
