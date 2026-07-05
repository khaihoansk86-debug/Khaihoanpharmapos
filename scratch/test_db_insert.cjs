const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL      = 'https://iejgtdcdzababydaqjef.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AjGRJy05OUTeqEJxvhy8eg_Rck3CpU1';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
    const {data: docs} = await supabase.from('inventory_documents')
        .select('id, document_code, note, status, inventory_document_items(*)')
        .eq('document_type', 'internal_use')
        .eq('status', 'completed')
        .limit(1);
    
    if (docs && docs.length > 0) {
        console.log('Found doc:', docs[0].document_code, docs[0].note);
        
        const doc = docs[0];
        const rows = (doc.inventory_document_items || [])
            .filter(item => item.product_id && item.batch_id)
            .map(item => ({
                product_id: item.product_id,
                batch_id: item.batch_id,
                movement_type: 'internal_use',
                quantity_base: Math.abs(Number(item.quantity_base || 0)),
                cost_price: Number(item.cost_price || 0),
                reason: item.reason || 'cancel_issue',
                note: '[TESTING CANCEL] test'
            }));
            
        console.log('Inserting movements:', rows);
        const { error } = await supabase.from('inventory_movements').insert(rows);
        if (error) {
            console.error('Insert error:', error);
        } else {
            console.log('Insert success');
        }
    } else {
        console.log('No docs found');
    }
}
test();
