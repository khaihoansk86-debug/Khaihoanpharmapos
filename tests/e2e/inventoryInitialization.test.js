import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer';
import {
    createE2EAuthSession,
    mockE2EEmployeeProfile,
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
    const productRequests = [];
    page.on('request', request => {
        if (request.url().includes('/rest/v1/products?')) {
            productRequests.push(request.url());
        }
    });

    await page.goto(`${BASE_URL}/pages/login.html`, {
        waitUntil: 'domcontentloaded'
    });
    await page.evaluate((authStorageKey, authSession) => {
        localStorage.setItem('pos_user', JSON.stringify({
            id: 'e2e-admin',
            username: 'admin',
            name: 'Admin E2E',
            role: 'admin',
            authenticatedSession: true
        }));
        localStorage.setItem(authStorageKey, JSON.stringify(authSession));
    }, SUPABASE_AUTH_STORAGE_KEY, createE2EAuthSession());
    await mockE2EEmployeeProfile(page);

    await page.goto(`${BASE_URL}/pages/inventory.html`, {
        waitUntil: 'domcontentloaded'
    });
    await page.waitForSelector('#app-header header', { visible: true });
    await delay(2000);

    assert.equal(
        productRequests.length,
        2,
        `Trang tồn kho chỉ được khởi tạo một lần, nhưng đã gửi ${productRequests.length} yêu cầu tải sản phẩm thay vì 2 yêu cầu hợp lệ cho bảng tồn và form xuất nội bộ.`
    );
    console.log('Inventory initialization E2E: PASS');
} catch (error) {
    console.error('Inventory initialization E2E: FAIL', error);
    process.exitCode = 1;
} finally {
    if (browser) await browser.close();
    if (serverProcess.exitCode === null) serverProcess.kill();
}
