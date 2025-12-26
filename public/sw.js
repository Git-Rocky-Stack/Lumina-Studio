// Lumina Studio Service Worker
const CACHE_NAME = 'lumina-studio-v6';
const RUNTIME_CACHE = 'lumina-runtime-v6';

const PRECACHE_ASSETS = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(
      names.filter((n) => n !== CACHE_NAME && n !== RUNTIME_CACHE)
        .map((n) => caches.delete(n))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests - let them go through normally
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Skip API requests
  if (url.pathname.startsWith('/api')) return;

  // Skip large media files (videos) - let browser handle directly
  const mediaExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.ogg', '.ogv'];
  if (mediaExtensions.some(ext => url.pathname.toLowerCase().endsWith(ext))) return;

  // Skip range requests (used for video seeking)
  if (event.request.headers.get('range')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) return response;
        const toCache = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => cache.put(event.request, toCache));
        return response;
      });
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
