const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://iejgtdcdzababydaqjef.supabase.co', 'sb_publishable_AjGRJy05OUTeqEJxvhy8eg_Rck3CpU1');

async function fix() {
  const { data: p, error: pe } = await supabase.from('products').select('id').eq('product_code', 'RECOV-57').maybeSingle();
  let productId = p?.id;
  if (!productId) {
    console.error('Product not found!');
    return;
  }
  
  const { error: oi } = await supabase.from('order_items').insert([{
    order_id: '69b10c3b-0e22-4dfb-8c49-e3bf568ccf3e',
    product_id: productId,
    product_name: 'Khôi phục TMĐT 5/7',
    product_code: 'RECOV-57',
    unit_name: 'Gói',
    unit_price: 1315000,
    quantity: 1,
    total_price: 1315000,
    line_type: 'standard'
  }]);
  
  if (oi) { console.error("Error creating order_item:", oi); return; }
  console.log('Fixed order!');
}
fix();
