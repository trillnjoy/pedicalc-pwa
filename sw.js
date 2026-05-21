const CACHE_NAME = 'pedicalc-v22'; // v21 → v22: GrowthCalc integrated — portrait 8:11 chart, sidebar percentile/Z panel, clinical age display logic, collapsible curve options, MM/DD/YYYY spinners, palette unified to COLORS
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
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate service worker and clean up all prior cache versions
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
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
        // Network failed, serve from cache
        return caches.match(event.request);
      })
  );
});
