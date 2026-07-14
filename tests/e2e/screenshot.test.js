import puppeteer from 'puppeteer';
import path from 'path';

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    console.log('Navigating...');
    await page.goto('http://localhost:3000/pages/pos.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    
    const screenshotPath = path.resolve('C:/Users/Admin/.gemini/antigravity-ide/brain/11f7a665-9a8d-4c93-8dba-2b69ef98480a/screenshot.png');
    await page.screenshot({ path: screenshotPath });
    console.log('Saved screenshot to ' + screenshotPath);
    
    // Also print out the page content body
    const bodyHTML = await page.evaluate(() => document.body.innerHTML);
    console.log('Body length:', bodyHTML.length);
    if (bodyHTML.length < 1000) {
        console.log(bodyHTML);
    }
    
    await browser.close();
})();
