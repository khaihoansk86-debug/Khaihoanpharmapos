content = """@echo off
title Chrome Zalo Bot (Port 9222)
echo ========================================================
echo   KHOI DONG CHROME ZALO BOT (PORT 9222)...
echo ========================================================
echo.

start "" "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=9222 --user-data-dir="d:\\Khaihoanpharmapos\\zalo-chrome-profile" "https://chat.zalo.me/"

echo Chrome da duoc khoi dong thanh cong!
"""

with open(r'd:\Khaihoanpharmapos\Mo_Chrome_Zalo_Bot.bat', 'w', encoding='ascii') as f:
    f.write(content)

with open(r'C:\Users\Admin\Desktop\Mo_Chrome_Zalo_Bot.bat', 'w', encoding='ascii') as f:
    f.write(content)

print('Updated bat files cleanly!')
