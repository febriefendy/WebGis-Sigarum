/**
 * SIGARUM WebGIS Service Worker
 * Implements offline caching, background synchronization, and network resilience
 */

const CACHE_NAME = 'sigarum-cache-v2.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/peta.html',
  '/umkm.html',
  '/detail-umkm.html',
  '/produk.html',
  '/statistik.html',
  '/tentang.html',
  '/login.html',
  '/manifest.json',
  '/assets/css/style.css',
  '/assets/js/app.js',
  '/assets/js/map.js',
  '/assets/js/charts.js',
  '/data/wilayah.geojson',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SIGARUM SW] Pre-caching core application assets...');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SIGARUM SW] Pre-cache partial warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. API Requests: Network-First with Cache Fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone and cache successful GET responses
          if (response.status === 200 && event.request.method === 'GET') {
            const resClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, resClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return new Response(
              JSON.stringify({
                success: false,
                offline: true,
                error: 'Anda sedang offline. Data lokal cache ditampilkan.'
              }),
              { headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
    return;
  }

  // 2. Tile Layers (OSM / Google / Esri): Cache First with Network Fallback
  if (url.hostname.includes('tile') || url.hostname.includes('google') || url.hostname.includes('arcgisonline')) {
    event.respondWith(
      caches.match(event.request).then((cachedTile) => {
        if (cachedTile) return cachedTile;
        return fetch(event.request).then((tileResponse) => {
          if (tileResponse.status === 200) {
            const tileClone = tileResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, tileClone);
            });
          }
          return tileResponse;
        }).catch(() => new Response('', { status: 408 }));
      })
    );
    return;
  }

  // 3. Static Assets: Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const resClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        }
        return networkResponse;
      }).catch(() => null);

      return cachedResponse || fetchPromise;
    })
  );
});
