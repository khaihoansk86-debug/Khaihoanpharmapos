import os

js_code = """
import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Assuming this is in d:/Khaihoanpharmapos/login_zalo.js
const sessionDir = path.join(__dirname, 'bot-assistant', 'zalo-session');

(async () => {
    console.log('Đang mở trình duyệt ĐĂNG NHẬP (bằng lõi của Bot)...');
    console.log('Thư mục Profile cố định: ' + sessionDir);
    
    const browser = await puppeteer.launch({
        headless: false,
        userDataDir: sessionDir,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled' // Giấu việc đang dùng Puppeteer
        ],
        ignoreDefaultArgs: ['--enable-automation']
    });
    
    const page = await browser.newPage();
    
    // Đặt UserAgent giống hệt người dùng thật
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    await page.goto('https://chat.zalo.me/', { waitUntil: 'networkidle2' });
    
    console.log('Trình duyệt đã mở!');
    console.log('BẠN HÃY QUÉT MÃ QR NGAY BÂY GIỜ.');
    console.log('Để trình duyệt mở trong 3 phút, sau khi vào chat, bạn cứ để yên, nó sẽ tự tắt và LƯU COOKIES lại.');
    
    // Đợi 3 phút (180 giây)
    await new Promise(r => setTimeout(r, 180000));
    
    console.log('Đang lưu Cookies và đóng trình duyệt...');
    await browser.close();
    process.exit(0);
})();
"""

with open(r'd:\Khaihoanpharmapos\login_zalo.js', 'w', encoding='utf-8') as f:
    f.write(js_code)

print("Created login_zalo.js")
