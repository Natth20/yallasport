const CACHE_NAME = 'yalla-sport-v2';
const ASSETS_TO_CACHE = [
  '/favicon.ico',
  '/manifest.json',
  '/images/logo.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const isLiveData =
    url.pathname.startsWith('/api/sports/') ||
    url.pathname.startsWith('/matches') ||
    url.pathname.startsWith('/match/');

  if (isLiveData) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((response) => {
        // Don't cache API responses or dynamic content for now
        return response;
      }).catch(() => {
        // Fallback or offline page can be added here
      });
    })
  );
});

self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'يلا سبورت', {
      body: data.body || 'لديك تحديث رياضي جديد',
      icon: data.icon || '/images/logo.jpg',
      badge: '/images/logo.jpg',
      tag: data.tag || 'yalla-sport',
      data: { url: data.url || '/matches' },
      dir: 'rtl',
      lang: 'ar',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/matches';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const existing = clientList.find((client) => client.url.includes(targetUrl));
      if (existing) return existing.focus();
      return clients.openWindow(targetUrl);
    })
  );
});
