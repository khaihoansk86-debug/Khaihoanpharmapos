import os

path = r'd:\Khaihoanpharmapos\supabase\migrations\045_create_daily_inventory_tasks.sql'
with open(path, 'r', encoding='utf-8') as f:
    sql = f.read()

sql = sql.replace('CREATE POLICY "Allow full access to authenticated users for daily tasks"', 'DROP POLICY IF EXISTS "Allow full access to authenticated users for daily tasks" ON public.bot_daily_inventory_tasks;\nCREATE POLICY "Allow full access to authenticated users for daily tasks"')

with open(path, 'w', encoding='utf-8') as f:
    f.write(sql)
print('Fixed policy existence error')
