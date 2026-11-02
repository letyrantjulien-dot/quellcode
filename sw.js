// QUELLCODE service worker v1
const VERSION = 'qc-1.44.0';
const SHELL_CACHE = VERSION + '-shell';
const RUNTIME_CACHE = VERSION + '-runtime';
const TILE_CACHE = VERSION + '-tiles';

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './fonts.css',
  './config.js',
  './vendor/maplibre-gl-4.7.1.js',
  './vendor/maplibre-gl-4.7.1.css',
  './vendor/supabase-js-2.117.3.esm.js',
  './fonts/ibm-plex-mono-cyrillic-400-normal.woff2',
  './fonts/ibm-plex-mono-cyrillic-500-normal.woff2',
  './fonts/ibm-plex-mono-cyrillic-ext-400-normal.woff2',
  './fonts/ibm-plex-mono-cyrillic-ext-500-normal.woff2',
  './fonts/ibm-plex-mono-latin-400-normal.woff2',
  './fonts/ibm-plex-mono-latin-500-normal.woff2',
  './fonts/ibm-plex-mono-latin-ext-400-normal.woff2',
  './fonts/ibm-plex-mono-latin-ext-500-normal.woff2',
  './fonts/space-grotesk-latin-400-normal.woff2',
  './fonts/space-grotesk-latin-500-normal.woff2',
  './fonts/space-grotesk-latin-700-normal.woff2',
  './fonts/space-grotesk-latin-ext-400-normal.woff2',
  './fonts/space-grotesk-latin-ext-500-normal.woff2',
  './fonts/space-grotesk-latin-ext-700-normal.woff2',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(SHELL_CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;

  // Live data: Supabase REST, auth, storage -> always network, never cached
  if (url.hostname.endsWith('.supabase.co')) return;

  // Admin page: always fresh
  if (url.pathname.endsWith('/admin.html')) return;

  // App shell navigations: network first, cached shell as offline fallback
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // TileJSON pointer: network first. It points at a dated tile directory that
  // the provider retires weekly, so a cached copy goes stale and breaks tiles.
  if (url.hostname.endsWith('tiles.openfreemap.org') && !url.pathname.endsWith('.pbf')) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(TILE_CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Map tiles themselves: cache first (offline browsing of visited areas)
  if (url.hostname.endsWith('basemaps.cartocdn.com') || url.hostname.endsWith('tiles.openfreemap.org')) {
    e.respondWith(cacheFirst(e.request, TILE_CACHE));
    return;
  }

  // Same-origin static assets (icons, manifest): cache first
  if (url.origin === self.location.origin) {
    e.respondWith(cacheFirst(e.request, SHELL_CACHE));
  }
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, res.clone());
  }
  return res;
}
