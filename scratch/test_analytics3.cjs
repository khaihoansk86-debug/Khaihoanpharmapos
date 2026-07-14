const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://iejgtdcdzababydaqjef.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AjGRJy05OUTeqEJxvhy8eg_Rck3CpU1';
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const { buildAnalytics } = require('./js/features/reports/reportAnalyticsRules.js');

async function run() {
    const today = new Date().toISOString().split('T')[0];
    const { data: orders } = await supabaseClient.from('orders').select('*').gte('created_at', today + 'T00:00:00');
    const orderIds = orders.map(o => o.id);
    const { data: items } = await supabaseClient.from('order_items').select('*').in('order_id', orderIds);
    
    // lookups
    const { data: products } = await supabaseClient.from('products').select('*');
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
        currentKeys: [today],
        previousKeys: [],
        keys: [today]
    };
    
    const lookups = {
        isDoseProductMap,
        isDoseRetailMap
    };
    
    const result = buildAnalytics(orders, items, lookups, new Map(), range, 'all', [], []);
    console.log('summary doseItemsSold:', result.summary.doseItemsSold);
}
run();
