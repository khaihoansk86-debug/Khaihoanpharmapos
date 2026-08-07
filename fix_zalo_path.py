import os

filepath = r'd:\Khaihoanpharmapos\bot-assistant\services\zaloService.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("userDataDir: './zalo-session',", "userDataDir: 'D:\\\\Khaihoanpharmapos\\\\bot-assistant\\\\zalo-session',")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed userDataDir path')
