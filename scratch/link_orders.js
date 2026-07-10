
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://iejgtdcdzababydaqjef.supabase.co', 'sb_publishable_AjGRJy05OUTeqEJxvhy8eg_Rck3CpU1', { auth: { persistSession: false } });
async function run() {
  const { data: orders, error } = await supabase.from('orders').select('id, note').eq('order_type', 'internal').is('customer_id', null);
  if (error) { console.error(error); return; }
  
  const { data: customers } = await supabase.from('customers').select('id, full_name').eq('customer_group', 'internal');
  
  for (const order of orders) {
    if (!order.note) continue;
    const match = order.note.match(/\[ISSUE_TARGET_NAME:([^\]]+)\]/);
    if (match) {
      let targetName = match[1].trim();
      if (targetName.includes(' - ')) targetName = targetName.split(' - ')[1].trim();
      
      const customer = customers.find(c => c.full_name.toLowerCase() === targetName.toLowerCase() || c.full_name.toLowerCase().includes(targetName.toLowerCase()));
      if (customer) {
        console.log('Updating order', order.id, 'to customer', customer.id);
        await supabase.from('orders').update({ customer_id: customer.id }).eq('id', order.id);
      }
    }
  }
  console.log('Done.');
}
run();

