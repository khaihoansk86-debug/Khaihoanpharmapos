import os
import re

file_path = r'd:\Khaihoanpharmapos\js\features\pos\invoicesController.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Fetching orders for invoices overview
target_orders = '''        const { data: orders, error } = await supabaseClient
            .from('orders')
            .select('id, total, amount_received, payment_method, created_at, order_type, status')
            .gte('created_at', from)
            .lte('created_at', to);'''

replace_orders = '''        let orders = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;
        let error = null;

        while (hasMore) {
            const { data, error: err } = await supabaseClient
                .from('orders')
                .select('id, total, amount_received, payment_method, created_at, order_type, status')
                .gte('created_at', from)
                .lte('created_at', to)
                .range(page * pageSize, (page + 1) * pageSize - 1);
            
            if (err) { error = err; break; }
            if (data && data.length > 0) {
                orders = orders.concat(data);
                if (data.length < pageSize) hasMore = false;
                else page++;
            } else {
                hasMore = false;
            }
        }'''

if target_orders in content:
    content = content.replace(target_orders, replace_orders)
    print("Patched orders in invoicesController")

# Fix 2: Fetching cashbook stats
target_cashbook = '''    // Fetch all matching transactions to calculate correct stats (without pagination range limit)
    let statsQuery = supabaseClient
        .from('cashbook_transactions')
        .select('transaction_type, amount, is_debt_payment, is_internal_transfer')
        .order('transaction_date', { ascending: false });

    // Apply exact same filters as above
    if (tab === 'income') statsQuery = statsQuery.eq('transaction_type', 'income').eq('is_internal_transfer', false);
    else if (tab === 'expense') statsQuery = statsQuery.eq('transaction_type', 'expense').eq('is_internal_transfer', false);

    if (fromDate) statsQuery = statsQuery.gte('transaction_date', fromDate + 'T00:00:00Z');
    if (toDate) statsQuery = statsQuery.lte('transaction_date', toDate + 'T23:59:59Z');
    if (searchTerm) {
        statsQuery = statsQuery.or(\	ransaction_code.ilike.%\\$\\{searchTerm\\}%,note.ilike.%\\$\\{searchTerm\\}%\);
    }

    const { data: statsData, error: statsError } = await statsQuery;'''

replace_cashbook = '''    // Fetch all matching transactions to calculate correct stats (without pagination range limit)
    let statsData = [];
    let statsError = null;
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
        let statsQuery = supabaseClient
            .from('cashbook_transactions')
            .select('transaction_type, amount, is_debt_payment, is_internal_transfer')
            .order('transaction_date', { ascending: false });

        // Apply exact same filters as above
        if (tab === 'income') statsQuery = statsQuery.eq('transaction_type', 'income').eq('is_internal_transfer', false);
        else if (tab === 'expense') statsQuery = statsQuery.eq('transaction_type', 'expense').eq('is_internal_transfer', false);

        if (fromDate) statsQuery = statsQuery.gte('transaction_date', fromDate + 'T00:00:00Z');
        if (toDate) statsQuery = statsQuery.lte('transaction_date', toDate + 'T23:59:59Z');
        if (searchTerm) {
            statsQuery = statsQuery.or(\	ransaction_code.ilike.%\\$\\{searchTerm\\}%,note.ilike.%\\$\\{searchTerm\\}%\);
        }
        
        statsQuery = statsQuery.range(page * pageSize, (page + 1) * pageSize - 1);

        const { data, error } = await statsQuery;
        if (error) { statsError = error; break; }
        if (data && data.length > 0) {
            statsData = statsData.concat(data);
            if (data.length < pageSize) hasMore = false;
            else page++;
        } else {
            hasMore = false;
        }
    }'''

if target_cashbook in content:
    content = content.replace(target_cashbook, replace_cashbook)
    print("Patched cashbook stats in invoicesController")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
