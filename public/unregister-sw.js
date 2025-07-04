self.addEventListener('install', function(e) {
  self.skipWaiting(); // Forza l'attivazione immediata del nuovo SW
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          console.log('[Unregister SW] Deleting cache:', cacheName);
          return caches.delete(cacheName); // Elimina tutte le cache
        })
      );
    }).then(function() {
      console.log('[Unregister SW] All caches cleared. Unregistering myself...');
      return self.registration.unregister(); // Disattiva questo SW stesso
    }).then(function() {
      console.log('[Unregister SW] Service Worker unregistered. Claiming clients...');
      return self.clients.claim(); // Prende il controllo di tutte le pagine aperte
    })
  );
});