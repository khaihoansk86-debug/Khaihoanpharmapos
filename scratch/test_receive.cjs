
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log('BROWSER LOG:', msg.text());
    }
  });
  
  page.on('pageerror', err => {
    console.log('PAGE UNCAUGHT ERROR:', err.toString());
  });

  page.on('requestfailed', request => {
    console.log('REQUEST FAILED:', request.url(), request.failure().errorText);
  });
  
  try {
    await page.goto('file:///' + process.cwd().replace(/\\/g, '/') + '/pages/receive.html', { waitUntil: 'networkidle0' });
    console.log('Page loaded successfully');
  } catch(e) {
    console.log(e);
  }
  
  await browser.close();
})();

