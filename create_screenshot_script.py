import os

path = r'd:\Khaihoanpharmapos\take_screenshot.js'
js = """
import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sessionDir = path.join(__dirname, 'bot-assistant', 'zalo-session');

(async () => {
    console.log('Opening browser...');
    const browser = await puppeteer.launch({
        headless: false,
        userDataDir: sessionDir,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('https://chat.zalo.me/', { waitUntil: 'networkidle2' });
    console.log('Waiting 10s for full load...');
    await new Promise(r => setTimeout(r, 10000));
    console.log('Taking screenshot...');
    await page.screenshot({ path: 'd:/Khaihoanpharmapos/zalo_debug.png' });
    await browser.close();
    console.log('Done!');
})();
"""
with open(path, 'w', encoding='utf-8') as f:
    f.write(js)
print('Created take_screenshot.js')
