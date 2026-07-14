import os
import re

file_path = r'd:\Khaihoanpharmapos\js\features\employees\employeeService.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = '''export async function getEmployees() {
    if (await canUseEmployeesTable()) {
        const { data, error } = await supabaseClient
            .from('employees')
            .select('*')
            .order('name', { ascending: true });
        if (error) throw error;
        return data || [];
    }'''

replace = '''export async function getEmployees() {
    if (await canUseEmployeesTable()) {
        let allEmployees = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;
        while (hasMore) {
            const { data, error } = await supabaseClient
                .from('employees')
                .select('*')
                .order('name', { ascending: true })
                .range(page * pageSize, (page + 1) * pageSize - 1);
            if (error) throw error;
            if (data && data.length > 0) {
                allEmployees = allEmployees.concat(data);
                if (data.length < pageSize) hasMore = false;
                else page++;
            } else {
                hasMore = false;
            }
        }
        return allEmployees;
    }'''

if target in content:
    content = content.replace(target, replace)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched getEmployees")

