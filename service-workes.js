const CACHE_NAME = 'villa-pos-cache-v1';
const urlsToCache = [
    '/index.html',
    '/styles.css',
    '/app.js',
    '/inventory.js',
    '/images/cola.png',
    '/images/sprite.png',
    '/images/fanta.png',
    '/images/malibu.png',
    '/images/jack.png',
    '/images/moscow.png',
    '/images/gin.png',
    '/images/mojito.png',
    '/images/redbull.png',
    '/images/budvar.png',
    '/images/prosecco.png',
    '/images/keg.png',
    '/images/pivo50.png',
    '/images/Plyn.png',
    '/images/grill.png',
    '/images/wellness.png',
    '/images/icon-192.png',
    '/images/icon-512.png'
];

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