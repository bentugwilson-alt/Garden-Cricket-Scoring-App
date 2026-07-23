const CACHE = 'garden-score-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sw.js',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

self.addEventListener('install', ev => {
  ev.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', ev => {
  ev.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', ev => {
  // Navigation requests -> return index.html (SPA) fallback
  if (ev.request.mode === 'navigate') {
    ev.respondWith(
      fetch(ev.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  ev.respondWith(
    caches.match(ev.request).then(cached => {
      if (cached) return cached;
      return fetch(ev.request).then(resp => {
        // cache GET responses
        if (!resp || resp.status !== 200 || resp.type !== 'basic') return resp;
        const copy = resp.clone();
        caches.open(CACHE).then(cache => cache.put(ev.request, copy));
        return resp;
      }).catch(() => {
        // final fallback to index.html for unknown requests
        return caches.match('/index.html');
      });
    })
  );
});
