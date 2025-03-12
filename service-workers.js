/**
 * Service Worker pro Villa POS Systém
 * 
 * Poskytuje offline podporu pomocí cachování souborů
 */

// Verze cache, zvýšit při aktualizaci
const CACHE_VERSION = 'villa-pos-v1';

// Soubory k cachování
const CACHE_FILES = [
    '/',
    '/index.html',
    '/css/main.css',
    '/css/components.css',
    '/css/animations.css',
    '/js/app.js',
    '/js/cart.js',
    '/js/inventory.js',
    '/js/statistics.js',
    '/js/storage.js',
    '/js/ui.js',
    '/images/placeholder.png',
    // Přidejte sem všechny obrázky produktů
    '/images/cocacola.png',
    '/images/fanta.png',
    '/images/sprite.png',
    '/images/redbull.png',
    '/images/malibu.png',
    '/images/jackcola.png',
    '/images/moscowmule.png',
    '/images/gintonic.png',
    '/images/mojito.png',
    '/images/prosecco.png',
    '/images/budvar.png',
    '/images/sud30.png',
    '/images/sud50.png',
    '/images/wellness.png',
    '/images/plyny.png',
    '/images/citytax.png',
    // Externí závislosti
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.7.0/chart.min.js'
];

// Nainstalování Service Workeru
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then(cache => {
                console.log('Cache otevřena');
                return cache.addAll(CACHE_FILES);
            })
            .then(() => {
                // Aktivujeme ihned bez čekání na uzavření stávajících stránek
                return self.skipWaiting();
            })
    );
});

// Aktivace Service Workeru
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Odstraníme staré cache
                    if (cacheName !== CACHE_VERSION) {
                        console.log('Odstraňování staré cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Zajistíme, že Service Worker přebere kontrolu ihned
            return self.clients.claim();
        })
    );
});

// Obsluha požadavků
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Pokud máme odpověď v cache, vrátíme ji
                if (response) {
                    return response;
                }
                
                // Jinak stáhneme ze sítě
                return fetch(event.request).then(response => {
                    // Kontrola, zda je odpověď validní
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // Pokud je to obrázek nebo jiný statický soubor, můžeme ho cachovat
                    const contentType = response.headers.get('content-type');
                    if (contentType && (
                        contentType.includes('image') || 
                        contentType.includes('text/css') || 
                        contentType.includes('javascript')
                    )) {
                        // Cachujeme kopii odpovědi
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_VERSION)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                    }
                    
                    return response;
                });
            })
            .catch(error => {
                // Pokud je požadavek na obrázek a selže, můžeme vrátit placeholder
                if (event.request.url.match(/\.(jpg|jpeg|png|gif|svg)$/)) {
                    return caches.match('/images/placeholder.png');
                }
                
                console.error('Chyba při načítání:', error);
            })
    );
});
