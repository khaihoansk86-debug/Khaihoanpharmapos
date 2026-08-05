const CACHE_NAME = 'khai-hoan-pos-v30';

const CORE_ASSETS_TO_CACHE = [
    '/',
    '/pages/pos.html',
    '/pages/products.html',
    '/pages/invoices.html',
    '/pages/inventory.html',
    '/pages/employees.html',
    '/pages/overview.html',
    '/js/components/layout.js',
    '/js/core/supabase.js',
    '/js/features/auth/employeeAuthenticationService.js',
    '/js/features/pos/posController.js',
    '/js/features/pos/posModePresentationRules.js',
    '/js/features/pos/posKeyboardRules.js',
    '/js/features/pos/checkoutResilienceRules.js',
    '/js/features/pos/shiftSelection.js',
    '/js/features/pos/posUI.js',
    '/js/features/pos/orderService.js',
    '/js/features/pos/aiRules.js',
    '/js/features/products/productService.js',
    '/js/features/products/productUI.js',
    '/js/features/products/productController.js',
    '/js/features/reports/reportController.js',
    '/js/features/reports/reportService.js'
];

const OPTIONAL_REMOTE_ASSETS = [
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.108.2',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap'
];

self.addEventListener('install', event => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(CORE_ASSETS_TO_CACHE);
        await Promise.allSettled(OPTIONAL_REMOTE_ASSETS.map(asset => cache.add(asset)));
    })());
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => Promise.all(
            cacheNames.map(cache => cache === CACHE_NAME ? null : caches.delete(cache))
        )).then(() => self.clients.claim())
    );
});

async function networkFirst(request, event, fallbackPath = null) {
    try {
        const response = await fetch(request);
        if (request.url.startsWith(self.location.origin)) {
            const cacheWrite = caches.open(CACHE_NAME)
                .then(cache => cache.put(request, response.clone()));
            event.waitUntil(cacheWrite);
        }
        return response;
    } catch {
        const cached = await caches.match(request, { ignoreSearch: true });
        if (cached) return cached;
        return fallbackPath ? caches.match(fallbackPath) : null;
    }
}

self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);
    if (
        event.request.method !== 'GET'
        || requestUrl.pathname.startsWith('/api/')
        || event.request.url.includes('supabase.co')
    ) {
        return;
    }

    if (event.request.mode === 'navigate') {
        event.respondWith(networkFirst(event.request, event, '/pages/pos.html'));
        return;
    }

    const isSameOriginAppCode = event.request.url.startsWith(self.location.origin)
        && (requestUrl.pathname.startsWith('/js/')
            || requestUrl.pathname.endsWith('.css')
            || event.request.destination === 'script'
            || event.request.destination === 'style');

    if (isSameOriginAppCode) {
        event.respondWith(networkFirst(event.request, event));
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
            if (!event.request.url.startsWith(self.location.origin)) return response;
            event.waitUntil(
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()))
            );
            return response;
        }))
    );
});
