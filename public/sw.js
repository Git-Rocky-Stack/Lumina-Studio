/**
 * Lumina Studio Service Worker v2
 *
 * Advanced PWA with:
 * - Intelligent caching strategies
 * - Offline-first architecture
 * - Background sync for cloud saves
 * - Push notifications
 * - Asset versioning
 */

const CACHE_VERSION = 'lumina-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/og-image.svg',
];

// API endpoints that should be cached
const CACHEABLE_API_PATTERNS = [
  /\/api\/templates/,
  /\/api\/assets/,
  /\/api\/user\/preferences/,
];

// Assets that should never be cached
const NO_CACHE_PATTERNS = [
  /\/api\/auth/,
  /\/api\/billing/,
  /clerk\.com/,
  /analytics/,
];

// ============================================================================
// INSTALL EVENT
// ============================================================================

self.addEventListener('install', (event) => {
  console.log('[SW] Installing Lumina Studio Service Worker v2');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// ============================================================================
// ACTIVATE EVENT
// ============================================================================

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating new service worker');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('lumina-') && !name.startsWith(CACHE_VERSION))
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// ============================================================================
// FETCH EVENT - Intelligent Caching Strategies
// ============================================================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip non-http requests
  if (!url.protocol.startsWith('http')) return;

  // Skip requests that should never be cached
  if (NO_CACHE_PATTERNS.some((pattern) => pattern.test(url.href))) return;

  // Handle different request types with appropriate strategies
  if (isImageRequest(request)) {
    event.respondWith(cacheFirstWithRefresh(request, IMAGE_CACHE));
  } else if (isAPIRequest(request)) {
    event.respondWith(networkFirstWithCache(request, API_CACHE));
  } else if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
  }
});

// ============================================================================
// CACHING STRATEGIES
// ============================================================================

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) return cachedResponse;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return getOfflineFallback(request);
  }
}

async function cacheFirstWithRefresh(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => null);

  return cachedResponse || fetchPromise || getOfflineFallback(request);
}

async function networkFirstWithCache(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    return cachedResponse || getOfflineFallback(request);
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => cachedResponse);

  return cachedResponse || fetchPromise || getOfflineFallback(request);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function isImageRequest(request) {
  const url = new URL(request.url);
  return (
    request.destination === 'image' ||
    /\.(jpg|jpeg|png|gif|webp|avif|svg|ico)$/i.test(url.pathname) ||
    url.hostname.includes('unsplash') ||
    url.hostname.includes('images')
  );
}

function isAPIRequest(request) {
  const url = new URL(request.url);
  return (
    url.pathname.startsWith('/api/') ||
    CACHEABLE_API_PATTERNS.some((pattern) => pattern.test(url.href))
  );
}

function isStaticAsset(pathname) {
  return /\.(js|css|woff2?|ttf|eot|png|jpg|jpeg|gif|webp|svg|ico)$/i.test(pathname);
}

async function getOfflineFallback(request) {
  if (request.mode === 'navigate') {
    const cache = await caches.open(STATIC_CACHE);
    return cache.match('/') || new Response('Offline', { status: 503 });
  }

  if (isImageRequest(request)) {
    return new Response(
      `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f1f5f9"/>
        <text x="50%" y="50%" text-anchor="middle" fill="#94a3b8" font-family="system-ui" font-size="14">Offline</text>
      </svg>`,
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }

  if (isAPIRequest(request)) {
    return new Response(JSON.stringify({ offline: true, data: null }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response('Offline', { status: 503 });
}

// ============================================================================
// BACKGROUND SYNC
// ============================================================================

self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-canvas') {
    event.waitUntil(syncCanvasData());
  } else if (event.tag === 'sync-projects') {
    event.waitUntil(syncProjects());
  }
});

async function syncCanvasData() {
  try {
    const db = await openDatabase();
    const pendingSaves = await getPendingSaves(db);

    for (const save of pendingSaves) {
      try {
        const response = await fetch('/api/canvas/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(save.data),
        });

        if (response.ok) {
          await removePendingSave(db, save.id);
          notifyClients({ type: 'SYNC_COMPLETE', payload: { id: save.id } });
        }
      } catch (error) {
        console.error('[SW] Sync failed for save:', save.id);
      }
    }
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

async function syncProjects() {
  console.log('[SW] Syncing projects...');
}

function notifyClients(message) {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => client.postMessage(message));
  });
}

// ============================================================================
// PUSH NOTIFICATIONS
// ============================================================================

self.addEventListener('push', (event) => {
  const data = event.data?.json() || {
    title: 'Lumina Studio',
    body: 'You have a new notification',
  };

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      vibrate: [100, 50, 100],
      data: data.data,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/studio';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'CACHE_URLS':
      event.waitUntil(cacheUrls(payload.urls, payload.cacheName || DYNAMIC_CACHE));
      break;
    case 'CLEAR_CACHE':
      event.waitUntil(clearCache(payload?.cacheName));
      break;
  }
});

async function cacheUrls(urls, cacheName) {
  const cache = await caches.open(cacheName);
  return cache.addAll(urls);
}

async function clearCache(cacheName) {
  if (cacheName) return caches.delete(cacheName);
  const names = await caches.keys();
  return Promise.all(names.map((name) => caches.delete(name)));
}

// ============================================================================
// INDEXEDDB HELPERS
// ============================================================================

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('lumina-offline', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-saves')) {
        db.createObjectStore('pending-saves', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getPendingSaves(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['pending-saves'], 'readonly');
    const store = tx.objectStore('pending-saves');
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function removePendingSave(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['pending-saves'], 'readwrite');
    const store = tx.objectStore('pending-saves');
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

console.log('[SW] Lumina Studio Service Worker v2 loaded');
