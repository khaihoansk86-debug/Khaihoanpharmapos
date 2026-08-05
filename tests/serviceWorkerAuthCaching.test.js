const fs = require('fs');
const path = require('path');
const vm = require('vm');

describe('service worker authentication caching', () => {
    const source = fs.readFileSync(
        path.join(process.cwd(), 'sw.js'),
        'utf8'
    );

    test('pre-caches the employee authentication module for offline legacy login', () => {
        expect(source).toContain("'/js/features/auth/employeeAuthenticationService.js'");
    });

    test('never intercepts mutation or API requests', () => {
        expect(source).toContain("event.request.method !== 'GET'");
        expect(source).toContain("requestUrl.pathname.startsWith('/api/')");
    });

    test('uses a new cache generation and network-first delivery for application code', async () => {
        expect(source).toContain("const CACHE_NAME = 'khai-hoan-pos-v30'");

        const listeners = {};
        const cachedResponse = { source: 'cache' };
        const freshResponse = { source: 'network', clone() { return this; } };
        const putCalls = [];
        const context = {
            URL,
            Promise,
            fetch: jest.fn().mockResolvedValue(freshResponse),
            caches: {
                match: jest.fn().mockResolvedValue(cachedResponse),
                open: jest.fn().mockResolvedValue({
                    addAll: jest.fn().mockResolvedValue(undefined),
                    add: jest.fn().mockResolvedValue(undefined),
                    put: jest.fn((...args) => { putCalls.push(args); })
                }),
                keys: jest.fn().mockResolvedValue([]),
                delete: jest.fn().mockResolvedValue(true)
            },
            self: {
                location: { origin: 'https://pos.test' },
                skipWaiting: jest.fn(),
                clients: { claim: jest.fn() },
                addEventListener: (name, listener) => { listeners[name] = listener; }
            }
        };
        vm.runInNewContext(source, context);

        let responsePromise;
        const request = {
            method: 'GET',
            mode: 'cors',
            destination: 'script',
            url: 'https://pos.test/js/features/pos/posController.js?v=next'
        };
        listeners.fetch({
            request,
            respondWith: promise => { responsePromise = promise; },
            waitUntil: () => {}
        });

        expect(await responsePromise).toBe(freshResponse);
        expect(context.fetch).toHaveBeenCalledWith(request);
        expect(putCalls).toHaveLength(1);
    });

    test('precache contains only local files that exist', () => {
        const coreBlock = source.match(/const CORE_ASSETS_TO_CACHE = \[([\s\S]*?)\];/);
        expect(coreBlock).not.toBeNull();
        const localAssets = [...coreBlock[1].matchAll(/'([^']+)'/g)]
            .map(match => match[1])
            .filter(asset => asset !== '/');
        const missingAssets = localAssets.filter(asset => (
            !fs.existsSync(path.join(process.cwd(), asset.replace(/^\//, '')))
        ));
        expect(missingAssets).toEqual([]);
    });
});
