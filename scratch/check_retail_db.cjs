const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://iejgtdcdzababydaqjef.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AjGRJy05OUTeqEJxvhy8eg_Rck3CpU1';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    const { data: products } = await supabase.from('products').select('id, name, description');
    
    let doseRetailCount = 0;
    let doseCutCount = 0;
    const doseRetailNames = [];
    products.forEach(p => {
        try {
            if(p.description) {
                const desc = JSON.parse(p.description);
                if(desc.is_dose_retail) {
                    doseRetailCount++;
                    doseRetailNames.push(p.name);
                }
                if(desc.is_dose_cut) doseCutCount++;
            }
        } catch(e) {}
    });
    
    console.log("Total is_dose_retail products:", doseRetailCount);
    console.log("Names:", doseRetailNames);
    console.log("Total is_dose_cut products:", doseCutCount);
}
run();
