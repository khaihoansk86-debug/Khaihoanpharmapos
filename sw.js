const CACHE_NAME = 'khai-hoan-pos-v13';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/pages/pos.html',
    '/pages/products.html',
    '/pages/invoices.html',
    '/pages/inventory.html',
    '/pages/employees.html',
    '/pages/overview.html',
    '/js/components/layout.js',
    '/js/core/supabase.js',
    '/js/features/pos/posController.js',
    '/js/features/pos/posUI.js',
    '/js/features/pos/orderService.js',
    '/js/features/pos/aiRules.js',
    '/js/features/products/productService.js',
    '/js/features/products/productUI.js',
    '/js/features/products/productController.js',
    '/js/features/reports/reportController.js',
    '/js/features/reports/reportService.js',
    // External CDNs
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap'
];

// Install Event: Cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('SW: Đang caching các file tĩnh...');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Activate Event: Cleanup old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('SW: Xóa cache cũ:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event: Cache First, then Network
self.addEventListener('fetch', (event) => {
    // Không cache các yêu cầu API của Supabase (PostgREST)
    if (event.request.url.includes('supabase.co')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).then((fetchResponse) => {
                // Tùy chọn: Cache các file mới được fetch nếu là file cùng domain
                if (event.request.url.startsWith(self.location.origin)) {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, fetchResponse.clone());
                        return fetchResponse;
                    });
                }
                return fetchResponse;
            });
        }).catch(() => {
            // Nếu mất mạng hoàn toàn và không có trong cache, trả về trang Offline (nếu có)
            if (event.request.mode === 'navigate') {
                return caches.match('/pages/pos.html');
            }
        })
    );
});
