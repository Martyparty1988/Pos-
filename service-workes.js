const CACHE_NAME = 'villa-pos-cache-v1';
const urlsToCache = [
    '/villa-pos/index.html',
    '/villa-pos/styles.css',
    '/villa-pos/app.js',
    '/villa-pos/inventory.js',
    '/villa-pos/images/cola.png',
    '/villa-pos/images/sprite.png',
    '/villa-pos/images/fanta.png',
    '/villa-pos/images/malibu.png',
    '/villa-pos/images/jack.png',
    '/villa-pos/images/moscow.png',
    '/villa-pos/images/gin.png',
    '/villa-pos/images/mojito.png',
    '/villa-pos/images/redbull.png',
    '/villa-pos/images/budvar.png',
    '/villa-pos/images/prosecco.png',
    '/villa-pos/images/keg.png',
    '/villa-pos/images/pivo50.png',
    '/villa-pos/images/Plyn.png',
    '/villa-pos/images/grill.png',
    '/villa-pos/images/wellness.png',
    '/villa-pos/images/icon-192.png',
    '/villa-pos/images/icon-512.png'
];

// Zbytek kódu zůstává stejný
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        })
    );
});