import re

file_path = 'd:/Khaihoanpharmapos/js/features/reports/reportService.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix chunk size from 100 to 40
content = content.replace('function chunk(array, size = 100) {', 'function chunk(array, size = 40) {')
content = content.replace('const chunks = chunk(orderIds, 100);', 'const chunks = chunk(orderIds, 40);')
content = content.replace('const productChunks = chunk(productIds, 100);', 'const productChunks = chunk(productIds, 40);')
content = content.replace('const batchChunks = chunk(batchIds, 100);', 'const batchChunks = chunk(batchIds, 40);')
content = content.replace('const comboUnitChunks = chunk(comboComponentIds, 100);', 'const comboUnitChunks = chunk(comboComponentIds, 40);')
content = content.replace('const chunks = chunk(ids, 100);', 'const chunks = chunk(ids, 40);')


# Fix fetchOrders to fetch all using while loop
fetch_orders_original = '''async function fetchOrders(range, orderTypeFilter = 'all') {
    let query = supabaseClient
        .from('orders')
        .select('id, order_code, customer_name, customer_phone, subtotal, discount, total, status, created_at, order_type, ecommerce_platform')
        .gte('created_at', range.fromIso)
        .lte('created_at', range.toIso);

    if (orderTypeFilter === 'ecommerce') {
        query = query.eq('order_type', 'ecommerce');
    } else if (orderTypeFilter === 'retail') {
        query = query.eq('order_type', 'retail');
    } else if (orderTypeFilter === 'internal') {
        query = query.eq('order_type', 'internal');
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
}'''

fetch_orders_replacement = '''async function fetchOrders(range, orderTypeFilter = 'all') {
    let allOrders = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
        let query = supabaseClient
            .from('orders')
            .select('id, order_code, customer_name, customer_phone, subtotal, discount, total, status, created_at, order_type, ecommerce_platform')
            .gte('created_at', range.fromIso)
            .lte('created_at', range.toIso);

        if (orderTypeFilter === 'ecommerce') {
            query = query.eq('order_type', 'ecommerce');
        } else if (orderTypeFilter === 'retail') {
            query = query.eq('order_type', 'retail');
        } else if (orderTypeFilter === 'internal') {
            query = query.eq('order_type', 'internal');
        }

        const { data, error } = await query.order('created_at', { ascending: true })
                                           .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;
        if (data && data.length > 0) {
            allOrders = allOrders.concat(data);
            if (data.length < pageSize) {
                hasMore = false;
            } else {
                page++;
            }
        } else {
            hasMore = false;
        }
    }
    return allOrders;
}'''

content = content.replace(fetch_orders_original, fetch_orders_replacement)

# Fix fetchShifts
fetch_shifts_original = '''async function fetchShifts(range) {
    const { data, error } = await supabaseClient
        .from('employee_shifts')
        .select('*')
        .gte('opened_at', range.fromIso)
        .lte('opened_at', range.toIso);

    if (error) throw error;
    return data || [];
}'''

fetch_shifts_replacement = '''async function fetchShifts(range) {
    let allShifts = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabaseClient
            .from('employee_shifts')
            .select('*')
            .gte('opened_at', range.fromIso)
            .lte('opened_at', range.toIso)
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;
        if (data && data.length > 0) {
            allShifts = allShifts.concat(data);
            if (data.length < pageSize) {
                hasMore = false;
            } else {
                page++;
            }
        } else {
            hasMore = false;
        }
    }
    return allShifts;
}'''

content = content.replace(fetch_shifts_original, fetch_shifts_replacement)


# Fix fetchInternalMovements
fetch_internal_original = '''async function fetchInternalMovements(range) {
    if (!supabaseClient) return [];
    const { data: documents, error: documentError } = await supabaseClient
        .from('inventory_documents')
        .select(
            id,
            confirmed_at,
            status,
            note,
            inventory_document_items(
                product_id,
                quantity_base,
                cost_price,
                reason,
                note,
                products(name, product_code)
            )
        )
        .eq('document_type', 'internal_use')
        .neq('status', 'cancelled')
        .gte('confirmed_at', range.fromIso)
        .lte('confirmed_at', range.toIso);'''

fetch_internal_replacement = '''async function fetchInternalMovements(range) {
    if (!supabaseClient) return [];
    let documents = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;
    let documentError = null;

    while (hasMore) {
        const { data, error } = await supabaseClient
            .from('inventory_documents')
            .select(
                id,
                confirmed_at,
                status,
                note,
                inventory_document_items(
                    product_id,
                    quantity_base,
                    cost_price,
                    reason,
                    note,
                    products(name, product_code)
                )
            )
            .eq('document_type', 'internal_use')
            .neq('status', 'cancelled')
            .gte('confirmed_at', range.fromIso)
            .lte('confirmed_at', range.toIso)
            .range(page * pageSize, (page + 1) * pageSize - 1);
            
        if (error) { documentError = error; break; }
        if (data && data.length > 0) {
            documents = documents.concat(data);
            if (data.length < pageSize) hasMore = false;
            else page++;
        } else {
            hasMore = false;
        }
    }'''

content = content.replace(fetch_internal_original, fetch_internal_replacement)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched reportService.js successfully!")
