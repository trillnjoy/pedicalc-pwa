const CACHE_NAME = 'pedicalc-v13'; // v13 — Hyperbilirubinemia: full AAP 2022 rewrite, exact Supp Tables 1-4, escalation zone, effectiveRisk, graph+interp merged; calculator list reordered
const urlsToCache = [
  './',
  './index.html',
  './PediatricCalc.jsx',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

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

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => cache.put(event.request, responseToCache));
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});