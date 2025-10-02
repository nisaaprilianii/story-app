const CACHE_NAME = 'berbagi-cerita-v1';
const DATA_CACHE_NAME = 'berbagi-cerita-data-v1';

const urlsToCache = [
  '/', 
  '/index.html',
  '/styles/styles.css',
  '/scripts/index.js',
  '/scripts/libs/leaflet.js',
  '/styles/libs/leaflet.css',
  '/images/logo.png',
  '/images/logo-192.png',
  '/images/logo-512.png',
  '/images/screenshots/screenshot-desktop.png',
  '/favicon.png',
  '/app.webmanifest',
];

// ✅ Install: cache seluruh app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// ✅ Activate: hapus cache lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME && key !== DATA_CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      ),
      self.clients.claim(),
    ])
  );
});

self.addEventListener('fetch', (event) => {
  // ❌ Lewati semua request non-GET (POST, PUT, DELETE)
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);

  // 🔹 1. API Story Dicoding (Network First)
  if (requestUrl.origin === 'https://story-api.dicoding.dev') {
  event.respondWith(
    caches.open(DATA_CACHE_NAME).then(async (cache) => {
      try {
        const response = await fetch(event.request);
        cache.put(event.request, response.clone());
        return response;
      } catch (error) {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        // 🧩 Fallback Response jika tidak ada cache
        return new Response(
          JSON.stringify({
            error: true,
            message: 'Offline: Data tidak tersedia di cache',
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    })
  );
  return;
}

  // 🔹 2. CDN (Leaflet dari unpkg)
  if (requestUrl.origin === 'https://unpkg.com') {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then((cache) =>
        fetch(event.request)
          .then((response) => {
            cache.put(event.request, response.clone());
            return response;
          })
          .catch(() => cache.match(event.request))
      )
    );
    return;
  }

  // 🔹 3. App Shell & Asset Lokal (Cache First)
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});

// ✅ Push Notification
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {
    title: 'Cerita Baru!',
    body: 'Ada cerita baru yang bisa kamu baca di aplikasi Berbagi Cerita.',
    icon: '/images/logo.png',
    url: '/',
  };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      data: { url: data.url },
      actions: [{ action: 'open', title: 'Buka Cerita' }],
    })
  );
});

// ✅ Klik notifikasi → buka URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((list) => {
      for (const client of list) if (client.url === url && 'focus' in client) return client.focus();
      return clients.openWindow(url);
    })
  );
});

// ✅ Test push dari index.js
self.addEventListener('message', (event) => {
  if (event.data?.type === 'PUSH_TEST') {
    const data = event.data.data || {
      title: 'Cerita Baru!',
      body: 'Ada cerita baru yang bisa kamu baca di aplikasi Berbagi Cerita.',
      icon: '/images/logo.png',
      url: '/',
    };
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      data: { url: data.url },
      actions: [{ action: 'open', title: 'Buka Cerita' }],
    });
  }
});
