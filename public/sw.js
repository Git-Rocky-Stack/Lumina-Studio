// Lumina Studio Service Worker
const CACHE_NAME = 'lumina-studio-v7';
const RUNTIME_CACHE = 'lumina-runtime-v7';

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

  // CRITICAL FIX: Skip JavaScript modules (dynamic imports from Vite)
  // These are ES modules that need to load directly for code splitting to work
  if (url.pathname.includes('/assets/') && url.pathname.endsWith('.js')) {
    // Let Vite's dynamic imports pass through without SW interference
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cached) => {
        if (cached) return cached;

        // Network-first strategy with error handling
        return fetch(event.request)
          .then((response) => {
            // Only cache valid responses
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Clone and cache for future use
            const toCache = response.clone();
            caches.open(RUNTIME_CACHE)
              .then((cache) => cache.put(event.request, toCache))
              .catch((err) => console.warn('[SW] Cache put failed:', err));

            return response;
          })
          .catch((error) => {
            // If network fetch fails, log and let it pass through
            // This is critical for dynamic imports - don't intercept failures
            console.warn('[SW] Fetch failed for:', event.request.url, error);
            throw error;
          });
      })
      .catch((error) => {
        // Final catch - if everything fails, log and rethrow
        console.error('[SW] Request failed:', event.request.url, error);
        throw error;
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
