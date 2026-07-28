import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer';
import {
    createE2EAuthSession,
    SUPABASE_AUTH_STORAGE_KEY
} from './e2eAuthFixture.js';

const PORT = 3000;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function waitForServer(process, timeoutMs = 10000) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
        if (process.exitCode !== null) {
            throw new Error(`Web server dừng sớm với mã ${process.exitCode}.`);
        }
        try {
            const response = await fetch(`${BASE_URL}/pages/login.html`);
            if (response.ok) return;
        } catch {
            // Server is still starting.
        }
        await delay(150);
    }
    throw new Error('Web server không sẵn sàng sau 10 giây.');
}

const serverProcess = spawn(process.execPath, ['serve.js'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true
});
let browser;

try {
    await waitForServer(serverProcess);
    browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    const loginResponse = await page.goto(`${BASE_URL}/pages/login.html`, {
        waitUntil: 'domcontentloaded'
    });
    assert.equal(loginResponse?.status(), 200, 'Trang đăng nhập phải trả HTTP 200.');
    await page.evaluate((authStorageKey, authSession) => {
        localStorage.setItem('pos_user', JSON.stringify({
            id: 'e2e-admin',
            username: 'admin',
            name: 'Admin E2E',
            role: 'admin',
            authenticatedSession: true
        }));
        localStorage.setItem(authStorageKey, JSON.stringify(authSession));
        localStorage.setItem('has_seen_shift_popup', 'true');
    }, SUPABASE_AUTH_STORAGE_KEY, createE2EAuthSession());

    const posResponse = await page.goto(`${BASE_URL}/pages/pos.html`, {
        waitUntil: 'domcontentloaded'
    });
    assert.equal(posResponse?.status(), 200, 'Trang POS phải trả HTTP 200.');

    await page.waitForSelector('#posSearchInput', { visible: true });
    await page.waitForSelector('#amountReceived');
    await page.waitForSelector('[onclick="window.processPayment()"]', {
        visible: true
    });
    await page.waitForSelector('#posActiveShiftContainer', {
        visible: true,
        timeout: 2000
    });

    await page.type('#posSearchInput', 'Hapacol 650');
    assert.equal(
        await page.$eval('#posSearchInput', input => input.value),
        'Hapacol 650'
    );

    await page.$eval('#posSearchInput', input => {
        input.value = 'Khẩu trang lẻ';
        input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.click('[onclick^="window.openCustomItemModal"]');
    await page.waitForSelector('#customItemModal:not(.hidden)');
    assert.equal(
        await page.$eval('#customItemName', input => input.value),
        'Khẩu trang lẻ',
        'Tên đang tìm phải được chuyển vào form hàng ngoài danh mục.'
    );
    const maliciousItemName = '<img src=x onerror="document.body.dataset.posXss=1">';
    await page.evaluate(itemName => {
        document.getElementById('customItemName').value = itemName;
        document.getElementById('customItemPrice').value = '1000';
        window.submitCustomItem();
    }, maliciousItemName);
    await page.waitForFunction(
        () => document.getElementById('customItemModal')?.classList.contains('hidden')
    );
    assert.equal(
        await page.$eval('body', body => body.dataset.posXss),
        undefined,
        'Tên hàng ngoài danh mục không được thực thi HTML/JavaScript trong giỏ.'
    );
    assert.match(
        await page.$eval('#cartBody', element => element.textContent),
        /<img src=x onerror=/,
        'Tên hàng phải được hiển thị như văn bản thuần.'
    );

    await page.evaluate(() => {
        window.processPayment = () => {
            document.body.dataset.e2ePaymentInvoked = 'true';
        };
    });
    await page.click('[onclick="window.processPayment()"]');
    assert.equal(
        await page.$eval('body', body => body.dataset.e2ePaymentInvoked),
        'true',
        'Nút thanh toán phải gọi đúng handler.'
    );

    await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 1 });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#posSearchInput', { visible: true });
    const mobileLayout = await page.evaluate(() => {
        const paymentButton = document.querySelector('[onclick="window.processPayment()"]');
        paymentButton?.scrollIntoView({ block: 'center' });
        const rect = paymentButton?.getBoundingClientRect();
        return {
            viewportWidth: window.innerWidth,
            documentWidth: document.documentElement.scrollWidth,
            paymentLeft: rect?.left ?? -1,
            paymentRight: rect?.right ?? -1,
            paymentWidth: rect?.width ?? 0
        };
    });
    assert.ok(
        mobileLayout.documentWidth <= mobileLayout.viewportWidth + 1,
        `POS mobile bị tràn ngang: ${mobileLayout.documentWidth}px > ${mobileLayout.viewportWidth}px.`
    );
    assert.ok(
        mobileLayout.paymentWidth > 0
            && mobileLayout.paymentLeft >= 0
            && mobileLayout.paymentRight <= mobileLayout.viewportWidth + 1,
        'Nút thanh toán phải nằm trọn trong màn hình mobile.'
    );

    assert.deepEqual(pageErrors, [], `Trang POS có lỗi JavaScript: ${pageErrors.join(' | ')}`);
    console.log('E2E Retail Flow: PASS');
} catch (error) {
    console.error('E2E Retail Flow: FAIL', error);
    process.exitCode = 1;
} finally {
    if (browser) await browser.close();
    if (serverProcess.exitCode === null) serverProcess.kill();
}
