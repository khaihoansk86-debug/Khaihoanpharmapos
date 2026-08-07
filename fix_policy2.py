import os

path = r'd:\Khaihoanpharmapos\supabase\migrations\045_create_daily_inventory_tasks.sql'
with open(path, 'r', encoding='utf-8') as f:
    sql = f.read()

sql = sql.replace('CREATE POLICY "Allow anon select daily tasks"', 'DROP POLICY IF EXISTS "Allow anon select daily tasks" ON public.bot_daily_inventory_tasks;\nCREATE POLICY "Allow anon select daily tasks"')

with open(path, 'w', encoding='utf-8') as f:
    f.write(sql)
print('Fixed second policy existence error')
