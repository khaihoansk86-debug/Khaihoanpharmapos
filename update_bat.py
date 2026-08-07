import os
import subprocess

desktop = r'C:\Users\Admin\Desktop'
bat_file = os.path.join(desktop, 'Dang Nhap Zalo Bot.bat')

content = """@echo off
echo ==============================================
echo KHOI DONG TRINH DUYET CHUAN CUA BOT ZALO...
echo ==============================================
cd /d "D:\\Khaihoanpharmapos"
node login_zalo.js
pause
"""

with open(bat_file, 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated bat file')
