// VÉRSE — Progressive Web App Service Worker (v1.0.0)
const CACHE_NAME = 'verse-cache-v1';
const OFFLINE_URL = '/';

const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ignora requisições de API, SSE ou métodos não-GET
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Se for resposta válida, salva uma cópia no cache
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Se offline, tenta recuperar do cache
        const cached = await caches.match(event.request);
        if (cached) return cached;

        // Se for navegação de página e não houver cache da rota, serve a home
        if (event.request.mode === 'navigate') {
          const fallback = await caches.match(OFFLINE_URL);
          if (fallback) return fallback;
        }

        return new Response('VÉRSE Offline — Sem conexão de rede no momento.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      })
  );
});
