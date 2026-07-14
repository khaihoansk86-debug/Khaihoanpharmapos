const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://iejgtdcdzababydaqjef.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AjGRJy05OUTeqEJxvhy8eg_Rck3CpU1';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    const today = new Date().toISOString().split('T')[0];
    const { data: orders } = await supabase.from('orders').select('id, order_type').gte('created_at', today + 'T00:00:00');
    const orderIds = orders.map(o => o.id);
    const { data: items } = await supabase.from('order_items').select('product_name, quantity, product_id, line_type').in('order_id', orderIds);
    
    let doseRetailCount = 0;
    let doseIngredientCount = 0;
    items.forEach(item => {
        if (item.product_name && item.product_name.includes('Thuốc liều')) {
            doseRetailCount += Number(item.quantity);
        } else {
            // maybe dose ingredient?
        }
    });
    
    console.log("Total quantity of 'Thuốc liều' sold today:", doseRetailCount);
    
    // Also, how many raw ingredients were there?
    console.log("Total items row count:", items.length);
}
run();
