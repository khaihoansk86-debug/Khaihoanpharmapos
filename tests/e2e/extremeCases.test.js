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
const OFFLINE_ORDERS_KEY = 'pos_offline_orders';
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
let page;

try {
    await waitForServer(serverProcess);
    browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    const loginResponse = await page.goto(`${BASE_URL}/pages/login.html`, {
        waitUntil: 'domcontentloaded'
    });
    assert.equal(loginResponse?.status(), 200, 'Trang đăng nhập phải trả HTTP 200.');

    await page.evaluate((offlineOrdersKey, authStorageKey, authSession) => {
        localStorage.setItem('pos_user', JSON.stringify({
            id: 'e2e-admin',
            username: 'admin',
            name: 'Admin E2E',
            role: 'admin',
            authenticatedSession: true
        }));
        localStorage.setItem(authStorageKey, JSON.stringify(authSession));
        localStorage.setItem('has_seen_shift_popup', 'true');
        localStorage.removeItem(offlineOrdersKey);
    }, OFFLINE_ORDERS_KEY, SUPABASE_AUTH_STORAGE_KEY, createE2EAuthSession());
    await mockE2EEmployeeProfile(page);

    const posResponse = await page.goto(`${BASE_URL}/pages/pos.html`, {
        waitUntil: 'domcontentloaded'
    });
    assert.equal(posResponse?.status(), 200, 'Trang POS phải trả HTTP 200.');
    await page.waitForSelector('#posSearchInput', { visible: true });
    await page.waitForFunction(() => window.POS_READY === true);
    await page.waitForFunction(() => typeof window.updateOfflineUI === 'function');

    const rulesResult = await page.evaluate(async offlineOrdersKey => {
        const {
            completeOfflineCheckout,
            isRecoverableNetworkError,
            upsertOfflineOrder
        } = await import('/js/features/pos/checkoutResilienceRules.js');

        const firstOrder = {
            id: 'OFF-FIRST',
            type: 'sale',
            orderData: { orderCode: 'E2E-OFFLINE-001' },
            cartItems: [{ id: 'product-1', quantity: 1 }],
            timestamp: '2026-07-27T00:00:00.000Z'
        };
        const retriedOrder = {
            ...firstOrder,
            id: 'OFF-RETRY',
            cartItems: [{ id: 'product-1', quantity: 2 }],
            timestamp: '2026-07-27T00:01:00.000Z'
        };
        const deduplicated = upsertOfflineOrder(
            upsertOfflineOrder([], firstOrder),
            retriedOrder
        );

        await completeOfflineCheckout({
            save: async () => {
                localStorage.setItem(offlineOrdersKey, JSON.stringify(deduplicated));
                window.updateOfflineUI();
            }
        });

        let storageFailureMessage = '';
        try {
            await completeOfflineCheckout({
                save: async () => {
                    throw new Error('QuotaExceededError');
                }
            });
        } catch (error) {
            storageFailureMessage = error.message;
        }

        return {
            fetchFailureIsRecoverable: isRecoverableNetworkError(new Error('Failed to fetch')),
            stockFailureIsRecoverable: isRecoverableNetworkError(new Error('Không đủ tồn kho')),
            deduplicatedLength: deduplicated.length,
            retainedId: deduplicated[0]?.id,
            retainedTimestamp: deduplicated[0]?.timestamp,
            updatedQuantity: deduplicated[0]?.cartItems?.[0]?.quantity,
            storageFailureMessage
        };
    }, OFFLINE_ORDERS_KEY);

    assert.equal(rulesResult.fetchFailureIsRecoverable, true);
    assert.equal(rulesResult.stockFailureIsRecoverable, false);
    assert.equal(rulesResult.deduplicatedLength, 1, 'Thử lại cùng mã đơn không được tạo bản offline trùng.');
    assert.equal(rulesResult.retainedId, 'OFF-FIRST');
    assert.equal(rulesResult.retainedTimestamp, '2026-07-27T00:00:00.000Z');
    assert.equal(rulesResult.updatedQuantity, 2, 'Bản thử lại phải cập nhật nội dung mới nhất.');
    assert.equal(
        rulesResult.storageFailureMessage,
        'QuotaExceededError',
        'Lỗi đầy bộ nhớ phải truyền ra để POS cảnh báo người dùng.'
    );

    await page.waitForSelector('#offlineSyncBanner', { visible: true });
    assert.equal(
        await page.$eval('#offlineSyncBanner .bg-white', element => element.textContent.trim()),
        '1',
        'Banner phải hiển thị đúng số đơn đang chờ đồng bộ.'
    );

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#offlineSyncBanner', { visible: true });
    const persistedOrders = await page.evaluate(
        offlineOrdersKey => JSON.parse(localStorage.getItem(offlineOrdersKey) || '[]'),
        OFFLINE_ORDERS_KEY
    );
    assert.equal(persistedOrders.length, 1, 'Đơn offline phải còn nguyên sau khi tải lại POS.');
    assert.equal(persistedOrders[0].orderData.orderCode, 'E2E-OFFLINE-001');
    assert.equal(persistedOrders[0].cartItems[0].quantity, 2);

    await page.evaluate(offlineOrdersKey => {
        localStorage.setItem(offlineOrdersKey, '{broken-json');
    }, OFFLINE_ORDERS_KEY);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#posSearchInput', { visible: true });
    await page.waitForFunction(() => typeof window.updateOfflineUI === 'function');
    await page.evaluate(() => window.updateOfflineUI());
    await page.waitForSelector('#offlineSyncBanner');
    assert.equal(
        await page.$eval('#offlineSyncBanner', element => element.style.display),
        'none',
        'Cache offline bị hỏng phải được bỏ qua để POS vẫn hoạt động.'
    );

    assert.deepEqual(pageErrors, [], `Trang POS có lỗi JavaScript: ${pageErrors.join(' | ')}`);
    console.log('E2E Extreme Offline Recovery: PASS');
} catch (error) {
    console.error(`E2E Extreme Offline Recovery: FAIL at ${page?.url?.() || 'unknown URL'}`, error);
    process.exitCode = 1;
} finally {
    if (browser) await browser.close();
    if (serverProcess.exitCode === null) serverProcess.kill();
}
