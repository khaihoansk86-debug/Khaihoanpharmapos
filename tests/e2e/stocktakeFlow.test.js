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
        if (process.exitCode !== null) throw new Error(`Web server stopped with code ${process.exitCode}.`);
        try {
            const response = await fetch(`${BASE_URL}/pages/stocktake.html`);
            if (response.ok) return;
        } catch {
            // Server is still starting.
        }
        await delay(150);
    }
    throw new Error('Stocktake E2E server did not start in time.');
}

const products = [
    {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Hapacol 650',
        product_code: 'HAPA650',
        description: '{}',
        product_categories: { id: 'c1', name: 'Thuốc' },
        product_units: [{ unit_name: 'Hộp', is_base_unit: true }],
        product_batches: [{
            id: '21111111-1111-4111-8111-111111111111',
            batch_number: 'L01', expiry_date: '2027-12-31', stock_quantity: 10, cost_price: 1000
        }]
    },
    {
        id: '12222222-2222-4222-8222-222222222222',
        name: 'Khẩu trang <img src=x onerror="document.body.dataset.stocktakeXss=1">',
        product_code: 'MASK01',
        description: JSON.stringify({ is_ecommerce: true }),
        product_categories: { id: 'c2', name: 'Dụng cụ' },
        product_units: [{ unit_name: 'Hộp', is_base_unit: true }],
        product_batches: [{
            id: '22222222-2222-4222-8222-222222222222',
            batch_number: 'M01', expiry_date: '2028-01-31', stock_quantity: 5, cost_price: 2000
        }]
    },
    {
        id: '13333333-3333-4333-8333-333333333333',
        name: 'Sản phẩm hết tồn không được hiện',
        product_code: 'ZERO01',
        description: '{}',
        product_categories: { id: 'c3', name: 'Khác' },
        product_units: [{ unit_name: 'Cái', is_base_unit: true }],
        product_batches: [{
            id: '23333333-3333-4333-8333-333333333333',
            batch_number: 'Z01', expiry_date: '2028-01-31', stock_quantity: 0, cost_price: 1
        }]
    }
];

const corsHeaders = {
    'access-control-allow-origin': BASE_URL,
    'access-control-allow-headers': 'authorization, apikey, content-profile, content-type, prefer, x-client-info, x-supabase-api-version',
    'access-control-allow-methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'content-profile': 'public'
};

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

    await page.setRequestInterception(true);
    page.on('request', request => {
        const url = request.url();
        if (request.method() === 'OPTIONS' && url.includes('supabase.co')) {
            request.respond({ status: 204, headers: corsHeaders });
            return;
        }
        if (url.includes('/rest/v1/rpc/get_current_employee_profile')) {
            request.respond({
                status: 200,
                contentType: 'application/json',
                headers: corsHeaders,
                body: JSON.stringify([{ id: 'e2e-admin', name: 'Admin E2E', username: 'admin', role: 'admin', status: 'active', permissions: [] }])
            });
            return;
        }
        if (url.includes('/rest/v1/rpc/apply_stocktake_document_atomic')) {
            request.respond({
                status: 500,
                contentType: 'application/json',
                headers: corsHeaders,
                body: JSON.stringify({ message: 'simulated stocktake failure' })
            });
            return;
        }
        if (url.includes('/rest/v1/products?')) {
            request.respond({ status: 200, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify(products) });
            return;
        }
        if (url.includes('/rest/v1/stocktake_drafts')) {
            const body = request.method() === 'GET' ? '[]' : '';
            request.respond({ status: request.method() === 'DELETE' ? 204 : 200, contentType: 'application/json', headers: corsHeaders, body });
            return;
        }
        request.continue();
    });

    await page.goto(`${BASE_URL}/pages/login.html`, { waitUntil: 'domcontentloaded' });
    await page.evaluate((authStorageKey, authSession, cachedProducts) => {
        localStorage.setItem('pos_user', JSON.stringify({
            id: 'e2e-admin', username: 'admin', name: 'Admin E2E', role: 'admin', authenticatedSession: true
        }));
        localStorage.setItem(authStorageKey, JSON.stringify(authSession));
        localStorage.setItem('cache_products_list', JSON.stringify(cachedProducts));
        localStorage.setItem('cache_products_list_time', Date.now());
        localStorage.removeItem('khaihoan_stocktake_draft');
    }, SUPABASE_AUTH_STORAGE_KEY, createE2EAuthSession(), products);

    await page.goto(`${BASE_URL}/pages/stocktake.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.audit-row-input', { visible: true });
    await page.waitForFunction(() => document.body.dataset.stocktakeReady === 'true');
    assert.equal(await page.$$eval('.audit-row-input', inputs => inputs.length), 2, 'Only positive-stock batches should be displayed.');
    assert.equal(await page.$eval('#logProgressText', element => element.textContent.trim()), '0 / 2 lô đã kiểm');
    assert.deepEqual(await page.$$eval('.audit-row-input', inputs => inputs.map(input => input.value)), ['', '']);
    assert.equal(await page.$eval('body', body => body.dataset.stocktakeXss), undefined, 'Product names must not execute HTML.');

    const firstInput = (await page.$$('.audit-row-input'))[0];
    await firstInput.type('10');
    await firstInput.press('Enter');
    await page.waitForFunction(() => document.getElementById('logProgressText')?.textContent.includes('1 / 2'));
    assert.match(await page.$eval('.batch-status', element => element.textContent), /Đã khớp/);

    await delay(1800);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#restoreDraftModal:not(.hidden)', { visible: true });
    await page.click('#restoreDraftBtn');
    await page.waitForSelector('.audit-row-input', { visible: true });
    await page.waitForFunction(() => document.body.dataset.stocktakeReady === 'true');
    assert.equal(await page.$eval('.audit-row-input', input => input.value), '10', 'Reload must restore the counted quantity.');
    assert.equal(await page.$eval('#logProgressText', element => element.textContent.trim()), '1 / 2 lô đã kiểm');

    const restoredInputs = await page.$$('.audit-row-input');
    await restoredInputs[1].type('3');
    await restoredInputs[1].press('Enter');
    await page.waitForFunction(() => document.getElementById('logProgressText')?.textContent.includes('2 / 2'));
    assert.equal(await page.$eval('#discrepancyCount', element => element.textContent), '1');
    assert.match(await page.$eval('#totalLossVal', element => element.textContent), /4[.\s]?000/);

    await page.click('#submitAuditDocBtn');
    await page.waitForSelector('#completeAuditModal:not(.hidden)', { visible: true });
    assert.equal(await page.$eval('#pendingAuditWarning', element => element.classList.contains('hidden')), true);
    assert.equal(await page.$eval('#confirmCompleteAuditBtn', button => button.disabled), false);
    await page.click('#confirmCompleteAuditBtn');
    await page.waitForFunction(() => document.getElementById('completeAuditError')?.textContent.includes('Nháp vẫn được giữ an toàn'));
    assert.ok(
        await page.evaluate(() => Boolean(localStorage.getItem('khaihoan_stocktake_draft'))),
        'A failed atomic submit must retain the local draft.'
    );
    await page.click('#cancelCompleteAuditBtn');

    await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 1 });
    const mobile = await page.evaluate(() => ({
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        finishHeight: document.getElementById('submitAuditDocBtn').getBoundingClientRect().height,
        saveHeight: document.getElementById('saveAndExitBtn').getBoundingClientRect().height,
        undersizedControls: Array.from(document.querySelectorAll('main button, main a, main input, main select, footer button'))
            .filter(element => element.getClientRects().length && element.type !== 'checkbox')
            .map(element => ({ id: element.id || element.dataset.action || element.tagName, height: element.getBoundingClientRect().height }))
            .filter(item => item.height < 44)
    }));
    assert.ok(mobile.documentWidth <= mobile.viewportWidth + 1, `Stocktake mobile overflow: ${mobile.documentWidth} > ${mobile.viewportWidth}`);
    assert.ok(mobile.finishHeight >= 44 && mobile.saveHeight >= 44, 'Primary mobile controls must be at least 44px high.');
    assert.deepEqual(mobile.undersizedControls, [], `Undersized touch controls: ${JSON.stringify(mobile.undersizedControls)}`);
    await page.click('#openLogDrawerBtn');
    await page.waitForFunction(() => {
        const drawer = document.getElementById('activityLogDrawer');
        const closeButton = document.getElementById('closeLogDrawerBtn');
        const rect = drawer?.getBoundingClientRect();
        return drawer && !drawer.classList.contains('translate-x-full')
            && rect.left >= 0 && rect.right <= window.innerWidth + 1
            && closeButton?.offsetParent !== null;
    });
    await page.click('#closeLogDrawerBtn');

    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.setViewport({ width: 812, height: 375, deviceScaleFactor: 1 });
    const landscape = await page.evaluate(() => {
        document.documentElement.classList.add('dark');
        document.documentElement.style.fontSize = '20px';
        return {
            viewportWidth: window.innerWidth,
            documentWidth: document.documentElement.scrollWidth,
            finishVisible: document.getElementById('submitAuditDocBtn').getClientRects().length > 0,
            reducedMotionDuration: getComputedStyle(document.getElementById('activityLogDrawer')).transitionDuration
        };
    });
    assert.ok(landscape.documentWidth <= landscape.viewportWidth + 1, 'Landscape layout must not overflow horizontally.');
    assert.equal(landscape.finishVisible, true, 'Finish action must remain visible in landscape.');
    assert.match(landscape.reducedMotionDuration, /1e-05s|0\.00001s|0s/, 'Reduced-motion preference must disable long transitions.');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#restoreDraftModal:not(.hidden)', { visible: true });
    await page.click('#discardDraftBtn');
    await page.waitForFunction(() => document.getElementById('restoreDraftModal').classList.contains('hidden'));
    await page.waitForFunction(() => document.body.dataset.stocktakeReady === 'true');
    await page.click('#submitAuditDocBtn');
    await page.waitForSelector('#completeAuditModal:not(.hidden)', { visible: true });
    assert.equal(await page.$eval('#pendingAuditWarning', element => element.classList.contains('hidden')), false);
    assert.equal(await page.$eval('#confirmCompleteAuditBtn', button => button.disabled), true);
    await page.click('#allowPendingAudit');
    assert.equal(await page.$eval('#confirmCompleteAuditBtn', button => button.disabled), false);

    assert.deepEqual(pageErrors, [], `Stocktake page errors: ${pageErrors.join(' | ')}`);
    console.log('Stocktake user workflow E2E: PASS');
} catch (error) {
    console.error('Stocktake user workflow E2E: FAIL', error);
    process.exitCode = 1;
} finally {
    if (browser) await browser.close();
    if (serverProcess.exitCode === null) serverProcess.kill();
}
