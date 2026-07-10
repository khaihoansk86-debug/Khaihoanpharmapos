const { createClient } = require('d:/Khaihoanpharmapos/node_modules/@supabase/supabase-js');
const supabase = createClient('https://iejgtdcdzababydaqjef.supabase.co', 'sb_publishable_AjGRJy05OUTeqEJxvhy8eg_Rck3CpU1');
async function run() {
    const todayStr = new Date().toISOString().split('T')[0];
    const { data: orders, error } = await supabase.from('orders')
        .select('id, order_type, total, status, created_at, order_items(product_name, quantity, total_price, product_code)')
        .gte('created_at', todayStr + 'T00:00:00')
        .eq('status', 'completed');
    if (error) return console.error(error);

    let retailItems = [];
    let doseItems = [];
    
    orders.forEach(o => {
        o.order_items.forEach(i => {
            const entry = { order: o.id.slice(0, 8), type: o.order_type, name: i.product_name, qty: i.quantity, total: i.total_price };
            if (o.order_type === 'retail') retailItems.push(entry);
            else doseItems.push(entry);
        });
    });

    console.log('--- RETAIL ITEMS ---');
    retailItems.forEach(i => console.log(i.order + ' | ' + i.name + ' | SL: ' + i.qty + ' | TT: ' + i.total));
    
    console.log('\n--- DOSE CUT ITEMS ---');
    doseItems.forEach(i => console.log(i.order + ' | ' + i.name + ' | SL: ' + i.qty + ' | TT: ' + i.total));
}
run();
