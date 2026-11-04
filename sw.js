// sw.js — Service Worker for PMG Branch Operations & Management Hub
'use strict';

const CACHE_NAME = 'pmg-hub-cache-v47';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/custom.css',
  './js/exceljs.min.js',
  './js/data.js',
  './js/auth.js',
  './js/db.js',
  './js/inventory.js',
  './js/roster.js',
  './js/audit.js',
  './js/scheduler.js',
  './js/patient.js',
  './js/onedrive-sync.js',
  './js/returns-cn.js',
  './js/pricing-intelligence.js',
  './js/expiry.js',
  './promo/',
  './promo/index.html',
  './promo/promo.js',
  './patient/',
  './patient/index.html',
  './performance/',
  './performance/index.html',
  './performance/performance.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Install: Cache local shell assets and force immediate activation
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Delete all older caches and take control of all clients immediately
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-First for local HTML, JS, CSS to ensure immediate updates across all devices; fallback to cache offline
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Always fetch live for Google Generative AI / Gemini API calls
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('google.com')) {
    return;
  }

  // Network-First strategy: Always attempt fresh network fetch first; fall back to cache when offline
  event.respondWith(
    fetch(event.request).then(response => {
      if (response && response.status === 200) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => {
      return caches.match(event.request).then(cached => {
        if (cached) return cached;
        if (event.request.mode === 'navigate' || url.pathname.endsWith('index.html') || url.pathname === '/') {
          return caches.match('./index.html');
        }
        return null;
      });
    })
  );
});
