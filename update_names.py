import os

sql_path = r'd:\Khaihoanpharmapos\supabase\migrations\045_create_daily_inventory_tasks.sql'

with open(sql_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace table names
content = content.replace('public.daily_inventory_tasks', 'public.bot_daily_inventory_tasks')

# Add comments
comment = """
-- CHÚ THÍCH QUAN TRỌNG:
-- Bảng này thuộc về [Nghiệp vụ Zalo Bot Assistant], độc lập với luồng Core POS.
-- Dùng để lưu vết các mặt hàng đã được bốc ra giao cho nhân viên kiểm tra trong chu kỳ 20 ngày.
COMMENT ON TABLE public.bot_daily_inventory_tasks IS 'Bảng dành riêng cho Zalo Bot: Lưu vết chia danh sách kiểm kho hằng ngày (chu kỳ 20 ngày). Không trộn lẫn với nghiệp vụ POS lõi.';
"""
# Insert comment after table creation
if 'COMMENT ON TABLE' not in content:
    content = content.replace('UNIQUE(cycle_id, product_id)\n);', 'UNIQUE(cycle_id, product_id)\n);\n' + comment)

# Rename functions to have bot_ prefix
content = content.replace('FUNCTION public.generate_daily_inventory_tasks', 'FUNCTION public.bot_generate_daily_inventory_tasks')
content = content.replace('FUNCTION public.get_daily_inventory_tasks', 'FUNCTION public.bot_get_daily_inventory_tasks')

with open(sql_path, 'w', encoding='utf-8') as f:
    f.write(content)

# Now update dbService.js
db_path = r'd:\Khaihoanpharmapos\bot-assistant\services\dbService.js'
with open(db_path, 'r', encoding='utf-8') as f:
    db_content = f.read()

db_content = db_content.replace("'generate_daily_inventory_tasks'", "'bot_generate_daily_inventory_tasks'")
db_content = db_content.replace("'get_daily_inventory_tasks'", "'bot_get_daily_inventory_tasks'")

with open(db_path, 'w', encoding='utf-8') as f:
    f.write(db_content)

print("Updated migration and dbService.js successfully")
