// Název cache úložiště pro aplikaci
const CACHE_NAME = 'villa-pos-v1';

// Soubory, které chceme cachovat pro offline použití
const filesToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/inventory.js',
  '/manifest.json',
  '/images/placeholder.jpg',
  '/images/search-icon.svg',
  '/images/cola.png',
  '/images/sprite.png',
  '/images/fanta.png',
  '/images/redbull.png',
  '/images/malibu.png',
  '/images/jack.png',
  '/images/moscow.png',
  '/images/gin.png',
  '/images/mojito.png',
  '/images/prosecco.png',
  '/images/budvar.png',
  '/images/keg.png',
  '/images/pivo50.png',
  '/images/wellness.png',
  '/images/grill.png',
  '/images/Plyn.png',
  '/images/icon-72x72.png',
  '/images/icon-96x96.png',
  '/images/icon-128x128.png',
  '/images/icon-144x144.png',
  '/images/icon-152x152.png',
  '/images/icon-192x192.png',
  '/images/icon-384x384.png',
  '/images/icon-512x512.png',
  '/images/maskable-icon.png',
  '/images/favicon-16x16.png',
  '/images/favicon-32x32.png'
];

// Instalace Service Workeru
self.addEventListener('install', event => {
  console.log('Service Worker: Instalace');
  
  // Přednostní aktivace tohoto service workeru
  self.skipWaiting();
  
  // Cachování souborů
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Otevření cache');
        return cache.addAll(filesToCache);
      })
      .catch(error => {
        console.error('Service Worker: Chyba při cachování souborů', error);
      })
  );
});

// Aktivace Service Workeru
self.addEventListener('activate', event => {
  console.log('Service Worker: Aktivace');
  
  // Odstranění starých cache
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Odstraňuji starou cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Převzetí kontroly nad všemi klienty
  return self.clients.claim();
});

// Zachycení požadavků fetch
self.addEventListener('fetch', event => {
  console.log('Service Worker: Fetch', event.request.url);
  
  // Strategie Cache-First: nejprve zkusíme z cache, pak teprve ze sítě
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Vrácení souboru z cache, pokud existuje
        if (response) {
          console.log('Service Worker: Nalezeno v cache', event.request.url);
          return response;
        }
        
        console.log('Service Worker: Stahuji ze sítě', event.request.url);
        
        // Pokud není v cache, stáhneme ze sítě
        return fetch(event.request)
          .then(response => {
            // Vrátíme originální odpověď, pokud není platná
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Zkopírujeme odpověď - odpověď lze použít jen jednou
            const responseToCache = response.clone();
            
            // Pokusíme se přidat odpověď do cache pro příští použití
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
                console.log('Service Worker: Přidáno do cache', event.request.url);
              });
            
            return response;
          })
          .catch(error => {
            console.error('Service Worker: Chyba při fetchování', error);
            
            // Pokud je požadavek na HTML stránku a selhal, vrátíme offline stránku
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Zpracování zpráv od klientů (např. pro aktualizaci cache)
self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});