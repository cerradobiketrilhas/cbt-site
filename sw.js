/**
 * Service Worker para CBT - Offline Support & Cache Strategy
 * Versão 1.0
 */

const CACHE_VERSION = 'cbt-v8';
const CACHE_ASSETS = [
  '/',
  '/index.html',
  '/sobre.html',
  '/localizacao.html',
  '/doacoes.html',
  '/ajudar.html',
  '/transparencia.html',
  '/contato.html',
  '/inscricao.html',
  '/confirmacao.html',
  '/style.css',
  '/script-optimized.js',
  '/script-inscription.js',
  '/script-inscricao-lista.js',
  '/script-confirmation.js',
  '/config.js',
  '/config.json',
  '/img/logo-cbt.webp',
  '/img/logo-cbt.jpeg',
  '/img/bg-lines.svg'
];

// Install event - Cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(CACHE_ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => console.error('[SW] Install error:', err))
  );
});

// Activate event - Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_VERSION) {
              return caches.delete(cache);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - Cache-first strategy for assets, network-first for API
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Never intercept API routes (avoid caching serverless responses)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Strategy selection based on file type
  if (request.method === 'GET') {
    if (isAsset(url)) {
      event.respondWith(cacheAsset(request));
    } else {
      event.respondWith(networkFirstStrategy(request));
    }
  }
});

/**
 * Determine if URL is a static asset
 */
function isAsset(url) {
  const assetExtensions = ['.js', '.css', '.jpg', '.jpeg', '.png', '.svg', '.woff', '.woff2'];
  return assetExtensions.some(ext => url.pathname.endsWith(ext)) ||
         url.pathname === '/config.json';
}

/**
 * Cache-first strategy: Try cache first, fallback to network
 */
function cacheAsset(request) {
  return caches.match(request)
    .then((response) => {
      if (response && isNotExpired(response)) {
        return response;
      }

      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_VERSION)
            .then((cache) => cache.put(request, responseToCache))
            .catch(err => console.error('[SW] Cache error:', err));

          return response;
        })
        .catch(() => {
          // Return cached response if network fails
          return caches.match(request)
            .then(cachedResponse => cachedResponse || createOfflineResponse());
        });
    });
}

/**
 * Network-first strategy: Try network first, fallback to cache
 */
function networkFirstStrategy(request) {
  return fetch(request)
    .then((response) => {
      if (response && response.status === 200) {
        const responseToCache = response.clone();
        caches.open(CACHE_VERSION)
          .then((cache) => cache.put(request, responseToCache))
          .catch(err => console.error('[SW] Cache error:', err));
        return response;
      }
      return caches.match(request).then(cached => cached || response);
    })
    .catch(() => {
      return caches.match(request)
        .then(cached => cached || createOfflineResponse());
    });
}

/**
 * Check if cached response is still fresh (24 hours)
 */
function isNotExpired(response) {
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return true;

  const cacheTime = new Date(dateHeader).getTime();
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  return (now - cacheTime) < maxAge;
}

/**
 * Create offline fallback response
 */
function createOfflineResponse() {
  return new Response(
    '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Offline</title></head><body><p>Você está offline. Volte à página anterior.</p></body></html>',
    { headers: { 'Content-Type': 'text/html; charset=UTF-8' } }
  );
}
