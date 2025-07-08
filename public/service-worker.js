const CACHE_NAME = '3cadlite-static-v7'; // Incrementato il nome della cache per forzare l'aggiornamento
const urlsToCache = [
  // Pre-cache essential static assets.
  // '/' e '/index.html' sono gestiti dalla strategia Network First.
  '/manifest.json?v=4', // Aggiornato il parametro di versione del manifest
  // Aggiungi qui altri asset statici critici se necessario
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing v7...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Pre-caching app shell v7...');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Forza l'attivazione immediata del nuovo Service Worker
      .catch(err => console.error('[Service Worker] Failed to cache during install:', err))
  );
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // 1. Strategia per le chiamate API Supabase: Network Only (non mettere in cache)
  // Questo assicura che i dati dinamici siano sempre freschi.
  if (requestUrl.hostname.includes('supabase.co') && 
      (requestUrl.pathname.startsWith('/rest/v1/') || requestUrl.pathname.startsWith('/functions/v1/'))) {
    console.log('[Service Worker] Network Only: Supabase API call:', event.request.url);
    event.respondWith(fetch(event.request));
    return;
  }

  // 2. Strategia per le pagine HTML (es. index.html, percorso radice): Network First, poi Cache
  // Questo assicura che venga caricata l'ultima versione della shell dell'app.
  if (event.request.mode === 'navigate' || requestUrl.pathname === '/' || requestUrl.pathname === '/index.html') {
    console.log('[Service Worker] Network First: Navigation request or index.html:', event.request.url);
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          // Se il fetch di rete ha successo, lo mette in cache e restituisce la risposta.
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, response.clone());
          return response;
        })
        .catch(async () => {
          // Se la rete fallisce (es. offline), prova a servire dalla cache.
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            console.log('[Service Worker] Network failed, serving from cache:', event.request.url);
            return cachedResponse;
          }
          // Se non è in cache e offline, restituisci un fallback o un errore.
          console.error('[Service Worker] Network and cache failed for navigation:', event.request.url);
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        })
    );
    return;
  }

  // 3. Strategia per altri asset statici (JS, CSS, immagini, ecc.): Cache First, poi Network (Stale-While-Revalidate-like)
  // Questo serve gli asset rapidamente dalla cache, ma li aggiorna in background.
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          console.log('[Service Worker] Cache First: Serving from cache:', event.request.url);
          // Fetch dalla rete in background per aggiornare la cache per la prossima volta
          fetch(event.request).then(async (networkResponse) => {
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, networkResponse.clone());
            console.log('[Service Worker] Cache updated in background for:', event.request.url);
          }).catch(err => console.error('[Service Worker] Background fetch failed for:', event.request.url, err));
          return response;
        }
        console.log('[Service Worker] Cache miss, fetching from network:', event.request.url);
        return fetch(event.request)
          .then(async (networkResponse) => {
            // Metti in cache la nuova risposta
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          })
          .catch(err => {
            console.error('[Service Worker] Network fetch failed for static asset:', event.request.url, err);
            return new Response('Network Error', { status: 503, statusText: 'Service Unavailable' });
          });
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating v7...');
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
    }).then(() => self.clients.claim()) // Prende il controllo di tutti i client (schede)
  );
});