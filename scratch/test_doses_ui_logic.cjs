const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://iejgtdcdzababydaqjef.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AjGRJy05OUTeqEJxvhy8eg_Rck3CpU1';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    // 1. Fetch products
    const { data: products } = await supabase.from('products').select('*');
    const isDoseProductMap = new Map();
    const isDoseRetailMap = new Map();
    products.forEach(p => {
        let isDose = false;
        let isRetail = false;
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

    // 2. Fetch orders today
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    const { data: orders } = await supabase.from('orders').select('*').gte('created_at', startOfDay.toISOString());
    const orderIds = orders.map(o => o.id);
    console.log('Orders found:', orderIds.length);

    // 3. Fetch order items
    let allItems = [];
    for(let i=0; i<orderIds.length; i+=100) {
        const chunk = orderIds.slice(i, i+100);
        const { data } = await supabase.from('order_items').select('*').in('order_id', chunk);
        if(data) allItems.push(...data);
    }

    // 4. Calculate doseItemsSold (like reportService.js)
    let currentDoseItemsSold = 0;
    allItems.forEach(item => {
        if (item.line_type === 'combo_component') return;
        const isDosePackage = isDoseProductMap.get(item.product_id) === true || isDoseRetailMap.get(item.product_id) === true;
        if (isDosePackage) {
            currentDoseItemsSold += Math.abs(Number(item.quantity) || 0);
            console.log('Added', item.quantity, 'for product', item.product_id);
        }
    });
    console.log('Total Dose Items via reportService logic:', currentDoseItemsSold);
    
    // 5. Calculate doseItemsSold (like reportAnalyticsRules.js)
    let doseItemsSold2 = 0;
    allItems.forEach(item => {
        const isDosePackage = isDoseProductMap.get(item.product_id) === true || isDoseRetailMap.get(item.product_id) === true;
        if (isDosePackage) {
            let quantity = Math.abs(Number(item.quantity) || 0);
            if (item.unit_ratio && item.unit_ratio > 1) {
                quantity = quantity * Number(item.unit_ratio);
            }
            doseItemsSold2 += quantity;
        }
    });
    console.log('Total Dose Items via reportAnalyticsRules logic:', doseItemsSold2);
}
run();
