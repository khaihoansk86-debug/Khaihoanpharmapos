const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://iejgtdcdzababydaqjef.supabase.co', 'sb_publishable_AjGRJy05OUTeqEJxvhy8eg_Rck3CpU1');

async function fix() {
  const { data: p } = await supabase.from('products').select('id').eq('product_code', 'RECOV-57').single();
  if (p) {
    await supabase.from('product_units').update({ cost_price: 1315000 }).eq('product_id', p.id);
    console.log('Updated cost price to 1315000');
  }
}
fix();
