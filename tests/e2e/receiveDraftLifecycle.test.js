import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer';
import { createE2EAuthSession, SUPABASE_AUTH_STORAGE_KEY } from './e2eAuthFixture.js';

const PORT = 3000;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const SUPABASE_HOST = 'iejgtdcdzababydaqjef.supabase.co';
const DRAFT_KEY = 'khaihoan_receive_draft';
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const cors = {
    'access-control-allow-origin': BASE_URL,
    'access-control-allow-headers': 'authorization, apikey, accept-profile, content-profile, content-type, prefer, x-client-info, x-supabase-api-version',
    'access-control-allow-methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'content-profile': 'public'
};
const product = {
    id: 'prod-receive-draft-e2e', name: 'Hapacol draft E2E', product_code: 'E2E-DRAFT',
    is_active: true, is_tracked: true, description: '{}',
    product_categories: { id: 'cat-receive-draft-e2e', name: 'Thuốc' },
    product_units: [{ id: 'unit-receive-draft-e2e', unit_name: 'Hộp', is_base_unit: true, conversion_rate: 1, cost_price: 1000, retail_price: 1500 }],
    product_batches: []
};
const supplier = { id: 'supplier-receive-draft-e2e', name: 'NCC draft E2E', contact_info: '0900000000', is_active: true };

function reply(request, status, body = '') {
    request.respond({ status, contentType: 'application/json', headers: cors, body: typeof body === 'string' ? body : JSON.stringify(body) });
}

async function waitForServer(process) {
    const started = Date.now();
    while (Date.now() - started < 10000) {
        if (process.exitCode !== null) throw new Error(`serve.js exited ${process.exitCode}`);
        try { if ((await fetch(`${BASE_URL}/pages/login.html`)).ok) return; } catch {}
        await delay(100);
    }
    throw new Error('serve.js did not start');
}

const server = spawn(process.execPath, ['serve.js'], { stdio: 'ignore', windowsHide: true });
let browser;

try {
    await waitForServer(server);
    browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', request => {
        const url = new URL(request.url());
        if (url.hostname !== SUPABASE_HOST) { request.continue(); return; }
        if (request.method() === 'OPTIONS') { reply(request, 204); return; }
        if (url.pathname.endsWith('/rpc/get_current_employee_profile')) {
            reply(request, 200, [{ id: 'e2e-admin', name: 'Admin E2E', username: 'admin', role: 'admin', status: 'active', permissions: [] }]);
            return;
        }
        if (url.pathname === '/rest/v1/suppliers') { reply(request, 200, [supplier]); return; }
        if (url.pathname === '/rest/v1/categories') { reply(request, 200, [{ id: 'cat-receive-draft-e2e', name: 'Thuốc' }]); return; }
        if (url.pathname === '/rest/v1/products') { reply(request, 200, [product]); return; }
        if (request.method() === 'GET') { reply(request, 200, []); return; }
        reply(request, 204);
    });

    await page.goto(`${BASE_URL}/pages/login.html`, { waitUntil: 'domcontentloaded' });
    await page.evaluate((key, session) => {
        localStorage.setItem('pos_user', JSON.stringify({ id: 'e2e-admin', username: 'admin', name: 'Admin E2E', role: 'admin', authenticatedSession: true }));
        localStorage.setItem(key, JSON.stringify(session));
    }, SUPABASE_AUTH_STORAGE_KEY, createE2EAuthSession());

    const draftLine = {
        id: 'draft-line-1', productId: product.id, productName: product.name,
        productCode: product.product_code, unitId: product.product_units[0].id,
        unitName: 'Hộp', baseUnitName: 'Hộp', batchNumber: 'DRAFT-LOT', expiryDate: '2028-12-31',
        quantity: 1, quantityBase: 1, costPrice: 1000, costPriceBase: 1000,
        subtotal: 1000, reason: 'purchase', productType: { key: 'retail', label: 'Hàng hóa bán lẻ', badgeClass: '' }
    };

    // A malformed local draft must be removed instead of surviving every reload.
    await page.evaluate(key => localStorage.setItem(key, '{not-json'), DRAFT_KEY);
    await page.goto(`${BASE_URL}/pages/receive.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#receiveSupplierSelect', { visible: true });
    await delay(500);
    assert.equal(await page.evaluate(key => localStorage.getItem(key), DRAFT_KEY), null);

    // Cancelling a valid draft removes it and opens a clean document with a new code.
    const oldCode = 'PN-OLD-DRAFT';
    await page.goto(`${BASE_URL}/pages/login.html`, { waitUntil: 'domcontentloaded' });
    await page.evaluate((key, draft, line) => localStorage.setItem(key, JSON.stringify({
        timestamp: Date.now(), documentCode: draft, supplierId: 'supplier-receive-draft-e2e',
        note: 'ghi chú cũ', lines: [line]
    })), DRAFT_KEY, oldCode, draftLine);
    let restoreDialogSeen = false;
    page.once('dialog', async dialog => {
        restoreDialogSeen = true;
        assert.equal(dialog.type(), 'confirm');
        await dialog.dismiss();
    });
    await page.goto(`${BASE_URL}/pages/receive.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#receiveSupplierSelect', { visible: true });
    await delay(200);
    assert.equal(restoreDialogSeen, true);
    assert.equal(await page.evaluate(key => localStorage.getItem(key), DRAFT_KEY), null);
    assert.notEqual(await page.$eval('#receiveDocCode', input => input.value), oldCode);
    assert.equal(await page.$$eval('#receiveLinesBody tr[data-id]', rows => rows.length), 0);

    console.log('Receive draft lifecycle E2E: PASS');
} catch (error) {
    console.error('Receive draft lifecycle E2E: FAIL', error);
    process.exitCode = 1;
} finally {
    if (browser) await browser.close();
    if (server.exitCode === null) server.kill();
}
