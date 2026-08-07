import os

path = r'd:\Khaihoanpharmapos\debug_zalo_selectors.js'
js = """
import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sessionDir = path.join(__dirname, 'bot-assistant', 'zalo-session');

(async () => {
    console.log('Opening browser for debugging...');
    const browser = await puppeteer.launch({
        headless: false, // Must be false for Zalo
        userDataDir: sessionDir,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('https://chat.zalo.me/', { waitUntil: 'networkidle2' });
    
    console.log('Waiting 15s for full load...');
    await new Promise(r => setTimeout(r, 15000));
    
    console.log('Dumping HTML...');
    const html = await page.content();
    fs.writeFileSync('d:/Khaihoanpharmapos/zalo_html.txt', html);
    
    console.log('Taking screenshot...');
    await page.screenshot({ path: 'd:/Khaihoanpharmapos/zalo_debug_in.png' });
    
    await browser.close();
    console.log('Done debugging!');
})();
"""
with open(path, 'w', encoding='utf-8') as f:
    f.write(js)
print('Created debug_zalo_selectors.js')
