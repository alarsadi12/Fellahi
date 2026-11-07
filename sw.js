
const CACHE = 'fellahi-v4';

const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg'
];

// تثبيت النسخة الجديدة
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

// تفعيل النسخة الجديدة وحذف التخزين القديم
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// جلب آخر نسخة من الموقع
self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // لا نتدخل في طلبات Supabase أو المواقع الخارجية
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone();

          caches.open(CACHE).then(cache => {
            cache.put(request, copy);
          });
        }

        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);

        if (cached) return cached;

        if (request.mode === 'navigate') {
          const home = await caches.match('./index.html');
          if (home) return home;
        }

        return new Response('تعذر الاتصال بالإنترنت', {
          status: 503,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8'
          }
        });
      })
  );
});
