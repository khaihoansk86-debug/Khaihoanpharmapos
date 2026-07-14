import os
import re

file_path = r'd:\Khaihoanpharmapos\js\features\receive\receiveController.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target1 = '''async function loadSuppliers() {
    if (!supabaseClient) return;
    try {
        const { data, error } = await supabaseClient
            .from('suppliers')
            .select('*')
            .eq('is_active', true)
            .order('name');
        if (error) throw error;
        
        state.suppliers = data || [];'''

replace1 = '''async function loadSuppliers() {
    if (!supabaseClient) return;
    try {
        let allSuppliers = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data, error } = await supabaseClient
                .from('suppliers')
                .select('*')
                .eq('is_active', true)
                .order('name')
                .range(page * pageSize, (page + 1) * pageSize - 1);
            if (error) throw error;
            if (data && data.length > 0) {
                allSuppliers = allSuppliers.concat(data);
                if (data.length < pageSize) hasMore = false;
                else page++;
            } else {
                hasMore = false;
            }
        }
        
        state.suppliers = allSuppliers || [];'''

if target1 in content:
    content = content.replace(target1, replace1)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched receiveController")


file_path2 = r'd:\Khaihoanpharmapos\js\features\suppliers\supplierService.js'
if os.path.exists(file_path2):
    with open(file_path2, 'r', encoding='utf-8') as f2:
        content2 = f2.read()

    target2 = '''export async function fetchSuppliers() {
    ensureClient();
    const { data, error } = await supabaseClient
        .from(TABLE)
        .select('*')
        .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
}'''

    replace2 = '''export async function fetchSuppliers() {
    ensureClient();
    let allSuppliers = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabaseClient
            .from(TABLE)
            .select('*')
            .order('name', { ascending: true })
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;
        if (data && data.length > 0) {
            allSuppliers = allSuppliers.concat(data);
            if (data.length < pageSize) hasMore = false;
            else page++;
        } else {
            hasMore = false;
        }
    }
    return allSuppliers;
}'''

    if target2 in content2:
        content2 = content2.replace(target2, replace2)
        with open(file_path2, 'w', encoding='utf-8') as f2:
            f2.write(content2)
        print("Patched supplierService")
