const SUPABASE_URL = 'https://iejgtdcdzababydaqjef.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AjGRJy05OUTeqEJxvhy8eg_Rck3CpU1';

async function run() {
    console.log("=== DIAGNOSTIC START ===");
    try {
        const url = `${SUPABASE_URL}/rest/v1/orders?select=id,order_code,order_type,total,created_at&created_at=gte.2026-05-25T00:00:00Z&created_at=lte.2026-06-03T23:59:59Z&order=created_at.desc`;
        const res = await fetch(url, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const orders = await res.json();
        
        console.log(`Fetched ${orders.length} orders:`);
        orders.forEach(o => {
            console.log(`- Code: ${o.order_code}, Type: ${o.order_type}, Total: ${o.total}, Created: ${o.created_at}`);
        });
    } catch (e) {
        console.error("Error:", e);
    }
}

run();
