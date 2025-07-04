const CACHE_NAME = '3cadlite-static-v5'; // Cambiato il nome della cache a v5
const urlsToCache = [
  // '/' è gestito con Network First, quindi non lo mettiamo qui per il pre-caching
  '/manifest.json?v=3', // Assicurati che anche il manifest con il nuovo parametro sia in cache
  // Aggiungi qui altri asset statici che vuoi pre-caching con Cache First
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing v5...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell v5 (excluding index.html for network-first)');
        // Cache solo gli asset non-index.html inizialmente
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Forza l'attivazione del nuovo Service Worker
      .catch(err => console.error('[Service Worker] Failed to cache during install:', err))
  );
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Strategia per index.html e manifest.json: Network First, poi Cache
  if (requestUrl.pathname === '/' || requestUrl.pathname === '/index.html' || requestUrl.pathname.includes('/manifest.json')) {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          // Se la richiesta di rete ha successo, la cache e la restituisce
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, response.clone());
          console.log(`[Service Worker] Network first: ${requestUrl.pathname} fetched and cached.`);
          return response;
        })
        .catch(async () => {
          // Se la rete fallisce (es. offline), prova a servire dalla cache
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            console.log(`[Service Worker] Network failed, serving ${requestUrl.pathname} from cache.`);
            return cachedResponse;
          }
          // Se non è in cache e offline, restituisci un fallback o un errore
          console.error(`[Service Worker] Network and cache failed for ${requestUrl.pathname}.`);
          // Opzionalmente, restituisci una pagina offline qui
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        })
    );
    return; // Ferma l'elaborazione per questa richiesta
  }

  // Strategia per altri asset: Cache First, poi Network
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          console.log('[Service Worker] Cache first: Serving from cache:', event.request.url);
          return response;
        }
        console.log('[Service Worker] Cache miss, fetching from network:', event.request.url);
        return fetch(event.request)
          .then(async (networkResponse) => {
            // Cache la nuova risposta
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          })
          .catch(err => {
            console.error('[Service Worker] Network fetch failed for other assets:', err);
            // Opzionalmente, restituisci un fallback per tipi di asset specifici
            return new Response('Network Error', { status: 503, statusText: 'Service Unavailable' });
          });
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating v5...');
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
    }).then(() => self.clients.claim())
  );
});