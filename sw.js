// sw.js
const CACHE_NAME = 'khai-hoan-pos-purchase-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/pages/pos.html',
    '/pages/products.html',
    '/pages/invoices.html',
    '/pages/inventory.html',
    '/pages/customers.html',
    '/pages/employees.html',
    '/pages/purchase.html',
    '/js/components/layout.js',
    '/js/core/supabase.js',
    '/js/features/pos/posController.js',
    '/js/features/pos/posUI.js',
    '/js/features/pos/orderService.js',
    '/js/features/pos/aiRules.js',
    '/js/features/products/productService.js',
    '/js/features/products/productUI.js',
    '/js/features/products/productController.js',
    '/js/features/purchase/purchaseService.js',
    '/js/features/purchase/purchaseController.js',
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => Promise.all(
            cacheNames.map((cache) => cache !== CACHE_NAME ? caches.delete(cache) : null)
        ))
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('supabase.co')) return;

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).then((fetchResponse) => {
                if (event.request.url.startsWith(self.location.origin)) {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, fetchResponse.clone());
                        return fetchResponse;
                    });
                }
                return fetchResponse;
            });
        }).catch(() => {
            if (event.request.mode === 'navigate') return caches.match('/pages/pos.html');
            return undefined;
        })
    );
});
