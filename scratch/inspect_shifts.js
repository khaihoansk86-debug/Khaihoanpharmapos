const SUPABASE_URL = 'https://iejgtdcdzababydaqjef.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AjGRJy05OUTeqEJxvhy8eg_Rck3CpU1';

async function run() {
    console.log("=== DIAGNOSTIC SHIFTS ===");
    try {
        const url = `${SUPABASE_URL}/rest/v1/employee_shifts?select=*&shift_date=gte.2026-06-01&shift_date=lte.2026-06-07`;
        const res = await fetch(url, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const shifts = await res.json();
        
        console.log(`Fetched ${shifts.length} shifts:`);
        shifts.forEach(s => {
            console.log(`- ID: ${s.id}, Date: ${s.shift_date}, Name: "${s.shift_name}", Start: "${s.start_time}", End: "${s.end_time}", Status: "${s.status}", EmpID: "${s.employee_id}"`);
        });
    } catch (e) {
        console.error("Error:", e);
    }
}

run();
