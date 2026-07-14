import os
import re

file_path = r'd:\Khaihoanpharmapos\js\features\products\productService.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = '''        try {
            const { data: products, error } = await supabaseClient
                .from('products')
                .select(
                    *,
                    product_categories:categories(id, name),
                    product_units(*),
                    product_batches(*)
                );

            if (error) throw error;'''

replace = '''        try {
            let products = [];
            let page = 0;
            const pageSize = 1000;
            let hasMore = true;

            while (hasMore) {
                const { data, error } = await supabaseClient
                    .from('products')
                    .select(
                        *,
                        product_categories:categories(id, name),
                        product_units(*),
                        product_batches(*)
                    )
                    .range(page * pageSize, (page + 1) * pageSize - 1);

                if (error) throw error;

                if (data && data.length > 0) {
                    products = products.concat(data);
                    if (data.length < pageSize) {
                        hasMore = false;
                    } else {
                        page++;
                    }
                } else {
                    hasMore = false;
                }
            }'''

if target in content:
    content = content.replace(target, replace)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched products pagination")

# Now patch customerService.js
file_path2 = r'd:\Khaihoanpharmapos\js\features\customers\customerService.js'
with open(file_path2, 'r', encoding='utf-8') as f2:
    content2 = f2.read()

target2 = '''export async function fetchCustomers() {
    ensureClient();
    const { data, error } = await supabaseClient
        .from('view_customers_list')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}'''

replace2 = '''export async function fetchCustomers() {
    ensureClient();
    let allData = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabaseClient
            .from('view_customers_list')
            .select('*')
            .order('created_at', { ascending: false })
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;
        if (data && data.length > 0) {
            allData = allData.concat(data);
            if (data.length < pageSize) hasMore = false;
            else page++;
        } else {
            hasMore = false;
        }
    }
    return allData;
}'''

if target2 in content2:
    content2 = content2.replace(target2, replace2)
    with open(file_path2, 'w', encoding='utf-8') as f2:
        f2.write(content2)
    print("Patched customers pagination")

