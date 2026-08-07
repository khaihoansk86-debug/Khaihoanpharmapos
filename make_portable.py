import os

filepath = r'd:\Khaihoanpharmapos\bot-assistant\services\zaloService.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

if 'import path from' not in content:
    content = content.replace("import puppeteer from 'puppeteer';", "import puppeteer from 'puppeteer';\nimport path from 'path';\nimport { fileURLToPath } from 'url';")

new_path_logic = '''
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const sessionDir = path.join(__dirname, '..', 'zalo-session');
'''

if 'const sessionDir' not in content:
    content = content.replace("export async function initBrowser() {", "export async function initBrowser() {" + new_path_logic)
    content = content.replace("userDataDir: 'D:\\\\Khaihoanpharmapos\\\\bot-assistant\\\\zalo-session',", "userDataDir: sessionDir,")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated zaloService.js for portability')
