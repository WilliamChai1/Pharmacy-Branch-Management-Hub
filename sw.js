// sw.js — Service Worker for PMG Branch Operations & Management Hub
'use strict';

const CACHE_NAME = 'pmg-hub-cache-v2';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/custom.css',
  './js/data.js',
  './js/auth.js',
  './js/db.js',
  './js/inventory.js',
  './js/roster.js',
  './js/audit.js',
  './js/scheduler.js',
  './js/patient.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Install: Cache local shell assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up older caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Stale-while-revalidate for static local assets, Network-first for HTML, bypass for external AI APIs
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Always fetch live for Google Generative AI / Gemini API calls
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('google.com')) {
    return;
  }

  // Network first for navigation / index.html to ensure live updates
  if (event.request.mode === 'navigate' || url.pathname.endsWith('index.html') || url.pathname === '/') {
    event.respondWith(
      fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Stale-while-revalidate for local scripts and styles
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const toCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, toCache));
        }
        return networkResponse;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
