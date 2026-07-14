const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://iejgtdcdzababydaqjef.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AjGRJy05OUTeqEJxvhy8eg_Rck3CpU1';
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today.getTime() + 86400000);
    const fromIso = today.toISOString();
    const toIso = tomorrow.toISOString();

    const { data: orders } = await supabaseClient.from('orders').select('id, order_type').gte('created_at', fromIso).lt('created_at', toIso);
    if (!orders) return;
    const orderIds = orders.map(o => o.id);
    const { data: items } = await supabaseClient.from('order_items').select('*').in('order_id', orderIds);
    
    // Simulate reportAnalyticsRules logic
    // we need isDosePackageSaleLine
    const { data: products } = await supabaseClient.from('products').select('id, description');
    const isDoseRetailMap = new Map();
    const isDoseProductMap = new Map();
    products.forEach(p => {
        let isRetail = false;
        let isDose = false;
        try {
            if(p.description) {
                const desc = JSON.parse(p.description);
                if(desc.is_dose_retail) isRetail = true;
                if(desc.is_dose_cut) isDose = true;
            }
        } catch(e) {}
        isDoseRetailMap.set(p.id, isRetail);
        isDoseProductMap.set(p.id, isDose);
    });

    let doseItemsSold = 0;
    
    items.forEach(item => {
        // from reportAnalyticsRules.js:
        const isDosePackage = isDoseProductMap.get(item.product_id) === true;
        const isDoseRetailPackage = isDoseRetailMap.get(item.product_id) === true;
        // isDosePackageSaleLine from doseReportRules.js
        const isDosePackageSale = isDoseRetailPackage;
        
        if (isDosePackageSale) {
            doseItemsSold += (Number(item.quantity) || 0);
        }
    });

    console.log("doseItemsSold calculated via patched logic:", doseItemsSold);
}
run();
