// Mi Vida - Service Worker
// Versión del caché — cambiar este número fuerza actualización
const CACHE_NAME = 'mi-vida-v1';

// Archivos a cachear para funcionar offline
const ASSETS = [
  './mi-vida.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=DM+Sans:wght@300;400;500&display=swap'
];

// Instalar: guarda los archivos en caché
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(() => {
        // Si falla algún asset externo (ej: fuentes sin conexión), igual instala
        return cache.add('./mi-vida.html');
      });
    })
  );
  self.skipWaiting();
});

// Activar: limpia cachés viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: sirve desde caché si hay, si no va a la red
self.addEventListener('fetch', event => {
  // Solo intercepta requests del mismo origen + Google Fonts
  const url = new URL(event.request.url);
  const isLocal = url.origin === self.location.origin;
  const isFonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

  if (!isLocal && !isFonts) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Cachea respuestas válidas
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback: devuelve el HTML principal
        if (event.request.destination === 'document') {
          return caches.match('./mi-vida.html');
        }
      });
    })
  );
});

// Mensaje para forzar actualización desde la app
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
