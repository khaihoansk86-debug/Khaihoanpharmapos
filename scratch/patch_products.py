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

# Standardize whitespace in target regex
target_regex = re.compile(r'try\s*\{\s*const\s*\{\s*data:\s*products,\s*error\s*\}\s*=\s*await\s*supabaseClient\s*\.from\(\'products\'\)\s*\.select\([^]+\);\s*if\s*\(error\)\s*throw\s*error;')

replace = '''try {
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
                    if (data.length < pageSize) hasMore = false;
                    else page++;
                } else {
                    hasMore = false;
                }
            }'''

content = target_regex.sub(replace, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched products pagination")
