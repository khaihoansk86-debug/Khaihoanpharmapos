import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer';

const BASE_URL = 'http://127.0.0.1:3000';

function startServer() {
    const server = spawn(process.execPath, ['serve.js'], {
        cwd: process.cwd(),
        stdio: ['ignore', 'pipe', 'pipe']
    });

    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new Error('Server did not start in time.'));
        }, 5000);

        server.once('error', error => {
            clearTimeout(timeoutId);
            reject(error);
        });
        server.stdout.on('data', chunk => {
            if (chunk.toString().includes('Server running')) {
                clearTimeout(timeoutId);
                resolve(server);
            }
        });
        server.stderr.on('data', chunk => {
            const message = chunk.toString();
            if (message.includes('EADDRINUSE')) {
                clearTimeout(timeoutId);
                fetch(`${BASE_URL}/pages/overview.html`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Port 3000 is used by another service.');
                        }
                        resolve(null);
                    })
                    .catch(reject);
            }
        });
    });
}

async function assertStaleEmployeeIsRedirected(
    browser,
    employee,
    protectedPage = 'overview.html'
) {
    const page = await browser.newPage();
    try {
        await page.goto(`${BASE_URL}/pages/login.html`, {
            waitUntil: 'domcontentloaded'
        });
        await page.evaluate(value => {
            localStorage.setItem('pos_user', JSON.stringify(value));
        }, employee);

        const reportRequests = [];
        page.on('request', request => {
            if (request.url().includes('/rest/v1/')) {
                reportRequests.push(request.url());
            }
        });

        await page.goto(`${BASE_URL}/pages/${protectedPage}`, {
            waitUntil: 'domcontentloaded'
        });
        await page.waitForFunction(
            () => location.pathname.endsWith('/login.html'),
            { timeout: 5000 }
        );

        assert.equal(new URL(page.url()).pathname, '/pages/login.html');
        assert.deepEqual(reportRequests, []);
    } finally {
        await page.close();
    }
}

const server = await startServer();
const browser = await puppeteer.launch({ headless: true });

try {
    await assertStaleEmployeeIsRedirected(browser, {
        id: 'legacy-admin',
        role: 'admin',
        permissions: ['access_overview']
    });
    await assertStaleEmployeeIsRedirected(browser, {
        id: 'expired-admin',
        role: 'admin',
        permissions: ['access_overview'],
        authenticatedSession: true
    });
    await assertStaleEmployeeIsRedirected(browser, {
        id: 'expired-pos-admin',
        role: 'admin',
        permissions: ['access_pos'],
        authenticatedSession: true
    }, 'pos.html');
    for (const protectedPage of [
        'customers.html',
        'employees.html',
        'inventory.html',
        'invoices.html',
        'logs.html',
        'products.html',
        'purchase.html',
        'receive.html',
        'settings.html',
        'stocktake.html'
    ]) {
        await assertStaleEmployeeIsRedirected(browser, {
            id: `expired-${protectedPage}`,
            role: 'admin',
            authenticatedSession: true
        }, protectedPage);
    }
    console.log('Overview auth guard E2E passed.');
} finally {
    await browser.close();
    server?.kill();
}
