const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://iejgtdcdzababydaqjef.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AjGRJy05OUTeqEJxvhy8eg_Rck3CpU1';
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function chunk(arr, size) {
    return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
        arr.slice(i * size, i * size + size)
    );
}

async function run() {
    const fromIso = '2026-07-01T00:00:00.000Z';
    const toIso = '2026-07-31T23:59:59.999Z';

    const { data: orders } = await supabaseClient.from('orders').select('id, order_type').gte('created_at', fromIso).lt('created_at', toIso);
    if (!orders) return;
    const orderIds = orders.map(o => o.id);
    const orderChunks = chunk(orderIds, 100);
    const items = [];
    for(const ids of orderChunks) {
        const { data } = await supabaseClient.from('order_items').select('*').in('order_id', ids);
        if(data) items.push(...data);
    }
    
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
        const isDosePackage = isDoseProductMap.get(item.product_id) === true;
        const isDoseRetailPackage = isDoseRetailMap.get(item.product_id) === true;
        const isDosePackageSale = isDoseRetailPackage;
        
        if (isDosePackageSale) {
            doseItemsSold += (Number(item.quantity) || 0);
        }
    });

    console.log("doseItemsSold calculated for THIS MONTH:", doseItemsSold);
}
run();
