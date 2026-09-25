const CACHE = 'yallasport-shell-v2';
const PRECACHE = [
  '/offline.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-192.png',
  '/icons/maskable-512.png',
  '/icons/apple-touch-icon.png',
  '/icon.png',
  '/apple-touch-icon.png',
  '/images/logo.png',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isIcon =
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/icon.png' ||
    url.pathname === '/apple-touch-icon.png' ||
    url.pathname === '/images/logo.png' ||
    url.pathname === '/manifest.json';

  if (isIcon) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/offline.html'))
    );
  }
});

self.addEventListener('push', (event) => {
  let data = {
    title: 'يلا سبورت - تنبيه مباشر',
    body: 'تحديث جديد في مباراة اليوم!',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    url: '/ar/matches',
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icons/icon-192.png',
      badge: data.badge || '/icons/icon-192.png',
      data: { url: data.url || '/ar/matches' },
      tag: 'yallasport-live-alert',
      renotify: true,
      actions: [
        { action: 'open', title: 'مشاهدة المباراة' },
        { action: 'close', title: 'إغلاق' },
      ],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;

  const targetUrl = event.notification.data?.url || '/ar/matches';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
