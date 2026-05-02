const CACHE_VERSION = 'v3';
const CACHE_NAME = `pedicalc-${CACHE_VERSION}`;
const READABLE_VERSION = 'v3.0 - May 2026'; // Human-readable version for display

const urlsToCache = [
  './',
  './index.html',
  './PediatricCalc.jsx',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install service worker and cache resources
self.addEventListener('install', event => {
  console.log(`[SW] Installing ${CACHE_NAME}`);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log(`[SW] ${CACHE_NAME} installed successfully`);
        return self.skipWaiting();
      })
  );
});

// Activate service worker and clean up old caches
self.addEventListener('activate', event => {
  console.log(`[SW] Activating ${CACHE_NAME}`);
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log(`[SW] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log(`[SW] ${CACHE_NAME} activated`);
      return self.clients.claim();
    })
  );
});

// Fetch strategy: Network first, fall back to cache
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone the response before caching
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => cache.put(event.request, responseToCache));
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If not in cache and offline, return offline page or error
            return new Response('Offline - content not available', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Message handler for version queries
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: CACHE_VERSION,
      readableVersion: READABLE_VERSION,
      cacheName: CACHE_NAME
    });
  }
});
