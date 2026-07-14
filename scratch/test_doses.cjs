const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://iejgtdcdzababydaqjef.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AjGRJy05OUTeqEJxvhy8eg_Rck3CpU1';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    const today = new Date().toISOString().split('T')[0];
    const { data: orders } = await supabase.from('orders').select('id, created_at, status').gte('created_at', today + 'T00:00:00').neq('status', 'cancelled');
    if (!orders || orders.length === 0) { console.log('No orders today'); return; }
    const orderIds = orders.map(o => o.id);
    
    // fetch all items for these orders
    let allItems = [];
    for(let i=0; i<orderIds.length; i+=100) {
        const chunk = orderIds.slice(i, i+100);
        const { data } = await supabase.from('order_items').select('product_id, quantity, line_type, unit_ratio, products(name, description)').in('order_id', chunk);
        if(data) allItems.push(...data);
    }
    
    let doseItemsSold = 0;
    let counts = {};

    allItems.forEach(item => {
        let isDose = false;
        try {
            if(item.products && item.products.description) {
                const desc = JSON.parse(item.products.description);
                isDose = desc.is_dose_cut === true || desc.is_dose_retail === true;
            }
        } catch(e){}
        
        if (isDose && item.line_type !== 'combo_component') {
            let quantity = Math.abs(Number(item.quantity) || 0);
            if (item.unit_ratio && item.unit_ratio > 1) {
                quantity = quantity * Number(item.unit_ratio);
            }
            doseItemsSold += quantity;
            const name = item.products.name;
            counts[name] = (counts[name] || 0) + quantity;
        }
    });

    console.log('Total Dose Items:', doseItemsSold);
    console.log(counts);
}
run();
