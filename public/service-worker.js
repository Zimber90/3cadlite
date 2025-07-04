const CACHE_NAME = '3cadlite-static-v4'; // Cambiato il nome della cache a v4
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json?v=2', // Assicurati che anche il manifest con il nuovo parametro sia in cache
  // Per una PWA completa con caching di tutti gli asset (inclusi JS/CSS generati da Vite),
  // sarebbe ideale usare un plugin di build che generi automaticamente questa lista.
  // Per ora, ci concentriamo sulla shell dell'app.
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing v4...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell v4');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Forza l'attivazione del nuovo Service Worker
      .catch(err => console.error('[Service Worker] Failed to cache:', err))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          console.log('[Service Worker] Serving from cache:', event.request.url);
          return response;
        }
        console.log('[Service Worker] Fetching from network:', event.request.url);
        return fetch(event.request);
      })
      .catch(err => console.error('[Service Worker] Fetch failed:', err))
  );
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating v4...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Prende il controllo di tutte le pagine aperte
  );
});