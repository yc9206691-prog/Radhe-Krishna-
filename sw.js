/* ═══════════════════════════════════════════════
   I.R.I.S ATLAS AI — Service Worker (sw.js)
   PWA Offline Support + Asset Caching
   by Yash Chaudhary
═══════════════════════════════════════════════ */

const CACHE_NAME = 'iris-atlas-v4';

// Files to cache for offline use
const PRECACHE_URLS = [
  './index.html',
  './manifest.json'
];

// ── INSTALL: Cache core files ──
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => {
      console.log('[SW] Install complete ✓');
      return self.skipWaiting(); // Activate immediately
    })
  );
});

// ── ACTIVATE: Clean old caches ──
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      );
    }).then(() => {
      console.log('[SW] Activate complete ✓');
      return self.clients.claim(); // Take control of all pages
    })
  );
});

// ── FETCH: Serve from cache, fallback to network ──
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Don't cache API calls or external CDN resources
  if (
    url.includes('generativelanguage.googleapis.com') ||
    url.includes('pollinations.ai') ||
    url.includes('googleapis.com/css') ||
    url.includes('fonts.gstatic.com') ||
    url.includes('cdn.jsdelivr.net') ||
    url.includes('cdnjs.cloudflare.com') ||
    url.includes('duckduckgo.com') ||
    url.includes('wikipedia.org')
  ) {
    return; // Let network handle it
  }

  // Cache-first strategy for local files (index.html, manifest.json)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      // Not in cache — fetch from network and cache it
      return fetch(event.request).then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === 'basic'
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Offline + not cached — return index.html as fallback
        return caches.match('./index.html');
      });
    })
  );
});

console.log('[IRIS SW] Service Worker loaded ✓');
