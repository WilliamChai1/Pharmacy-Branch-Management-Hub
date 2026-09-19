// sw.js — PMG Hub Service Worker (offline shell caching)
'use strict';

const CACHE_NAME = 'pmg-hub-v1';

// Resources to pre-cache on install
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './css/custom.css',
  './js/data.js',
  './js/auth.js',
  './js/inventory.js',
  './js/roster.js',
  './js/audit.js',
];

// ─── INSTALL: cache shell ──────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// ─── ACTIVATE: clean old caches ───────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ─── FETCH: network-first for CDN, cache-first for local shell ────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // For CDN resources (Tailwind, SheetJS, etc.) use network-first, fall back to cache
  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(event.request)
        .then(resp => {
          if (resp && resp.status === 200) {
            const cloned = resp.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, cloned));
          }
          return resp;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // For local files: cache-first, then network
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(resp => {
        if (resp && resp.status === 200) {
          const cloned = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, cloned));
        }
        return resp;
      });
    })
  );
});
