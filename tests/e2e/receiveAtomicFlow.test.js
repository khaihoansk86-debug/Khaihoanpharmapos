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
    id: 'prod-receive-e2e', name: 'Hapacol atomic E2E', product_code: 'E2E-ATOMIC',
    is_active: true, is_tracked: true, description: '{}',
    product_categories: { id: 'cat-receive-e2e', name: 'Thuốc' },
    product_units: [{ id: 'unit-receive-e2e', unit_name: 'Hộp', is_base_unit: true, conversion_rate: 1, cost_price: 1000, retail_price: 1500 }],
    product_batches: []
};
const supplier = { id: 'supplier-receive-e2e', name: 'NCC atomic E2E', contact_info: '0900000000', is_active: true };

function reply(request, status, body = '') {
    request.respond({ status, contentType: 'application/json', headers: cors, body: typeof body === 'string' ? body : JSON.stringify(body) });
}

async function waitForServer(proc) {
    const started = Date.now();
    while (Date.now() - started < 10000) {
        if (proc.exitCode !== null) throw new Error(`serve.js exited ${proc.exitCode}`);
        try { if ((await fetch(`${BASE_URL}/pages/login.html`)).ok) return; } catch {}
        await delay(100);
    }
    throw new Error('serve.js did not start');
}

const server = spawn(process.execPath, ['serve.js'], { stdio: 'ignore', windowsHide: true });
let browser;
const state = { mode: 'success', rpcPayloads: [], dialogs: [] };

try {
    await waitForServer(server);
    browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    page.on('dialog', async dialog => {
        state.dialogs.push(dialog.message());
        await dialog.accept();
    });
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
        if (url.pathname === '/rest/v1/categories') { reply(request, 200, [{ id: 'cat-receive-e2e', name: 'Thuốc' }]); return; }
        if (url.pathname === '/rest/v1/products') {
            if (request.method() === 'PATCH') { reply(request, 204); return; }
            reply(request, 200, [product]); return;
        }
        if (url.pathname.endsWith('/rpc/create_purchase_document_atomic')) {
            state.rpcPayloads.push(JSON.parse(request.postData() || '{}'));
            if (state.mode === 'failure') {
                reply(request, 503, { message: 'simulated network failure' });
                return;
            }
            reply(request, 200, {
                document_id: 'doc-receive-e2e',
                document_code: 'PN-E2E-ATOMIC',
                line_count: 1,
                total_amount: 2000,
                paid_amount: 1000,
                debt_amount: 1000,
                idempotent: state.mode === 'idempotent'
            });
            return;
        }
        if (request.method() === 'GET') { reply(request, 200, []); return; }
        reply(request, 204);
    });

    await page.goto(`${BASE_URL}/pages/login.html`, { waitUntil: 'domcontentloaded' });
    await page.evaluate((key, session) => {
        localStorage.setItem('pos_user', JSON.stringify({ id: 'e2e-admin', username: 'admin', name: 'Admin E2E', role: 'admin', authenticatedSession: true }));
        localStorage.setItem(key, JSON.stringify(session));
    }, SUPABASE_AUTH_STORAGE_KEY, createE2EAuthSession());

    async function openReceive(query = '?productId=prod-receive-e2e&costPrice=1000') {
        await page.goto(`${BASE_URL}/pages/receive.html${query}`, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => Boolean(document.querySelector('#receiveSupplierSelect option[value="supplier-receive-e2e"]')));
        await page.waitForSelector('#receiveLinesBody tr[data-id]', { visible: true });
    }

    async function prepareLine() {
        await page.select('#receiveSupplierSelect', supplier.id);
        await page.evaluate(() => document.getElementById('receiveSupplierSelect').dispatchEvent(new Event('change')));
        await page.$eval('.line-batch', el => { el.value = 'E2E-LOT'; el.dispatchEvent(new Event('input', { bubbles: true })); });
        await page.$eval('.line-expiry', el => { el.value = '2028-12-31'; el.dispatchEvent(new Event('input', { bubbles: true })); });
        await page.$eval('.line-qty', el => { el.value = '2'; el.dispatchEvent(new Event('input', { bubbles: true })); });
        await page.$eval('.line-cost', el => { el.value = '1000'; el.dispatchEvent(new Event('input', { bubbles: true })); });
        await page.$eval('#receivePaidInput', el => { el.value = '1000'; el.dispatchEvent(new Event('input', { bubbles: true })); });
        await delay(1100);
    }

    await openReceive();
    await prepareLine();
    state.dialogs.length = 0;
    await page.click('#submitReceiveDocBtn');
    await delay(400);
    assert.equal(state.rpcPayloads.length, 1);
    assert.equal(state.rpcPayloads[0].p_document_code.startsWith('PN-'), true);
    assert.equal(state.rpcPayloads[0].p_total_amount, 2000);
    assert.equal(state.rpcPayloads[0].p_paid_amount, 1000);
    assert.equal(state.rpcPayloads[0].p_debt_amount, 1000);
    assert.match(state.dialogs.at(-1), /thành công/i);

    state.mode = 'failure';
    state.dialogs.length = 0;
    await openReceive();
    await prepareLine();
    await page.click('#submitReceiveDocBtn');
    await delay(300);
    assert.match(state.dialogs.at(-1), /thất bại/i);
    assert.ok(await page.evaluate(key => localStorage.getItem(key), DRAFT_KEY), 'RPC failure must retain draft');

    // pagehide/beforeunload flushes a change made less than one second before F5.
    await page.$eval('#receiveNoteInput', el => { el.value = 'ghi chú trước F5'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(key => JSON.parse(localStorage.getItem(key) || '{}').note === 'ghi chú trước F5', {}, DRAFT_KEY);

    state.mode = 'idempotent';
    state.dialogs.length = 0;
    await page.click('#submitReceiveDocBtn');
    await delay(300);
    assert.match(state.dialogs.at(-1), /ghi trÆ°á»›c|ghi trước/i);

    console.log('Receive atomic UI E2E: PASS');
} catch (error) {
    console.error('Receive atomic UI E2E: FAIL', error);
    process.exitCode = 1;
} finally {
    if (browser) await browser.close();
    if (server.exitCode === null) server.kill();
}
