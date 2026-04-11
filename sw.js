/* ═══════════════════════════════════════════
   WISHWORK — Service Worker v1
   Caches core files for instant repeat loads
═══════════════════════════════════════════ */

const CACHE_NAME = 'wishwork-v1';

/* Files to cache on install */
const CORE_FILES = [
  '/index.html',
  '/style.css',
  '/script.js',
  '/login.html'
];

/* ── Install: cache core files ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CORE_FILES);
    }).catch(() => {
      /* If any file fails, still install — don't block */
    })
  );
  self.skipWaiting();
});

/* ── Activate: delete old caches ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

/* ── Fetch: serve from cache, fall back to network ── */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  /* Skip Firebase, Google Fonts, and non-GET requests — always go to network */
  if(
    event.request.method !== 'GET' ||
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('fonts.googleapis.com')
  ){
    event.respondWith(fetch(event.request).catch(() => new Response('', {status: 503})));
    return;
  }

  /* For core site files: Cache First (instant load) */
  if(
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname === '/'
  ){
    event.respondWith(
      caches.match(event.request).then(cached => {
        /* Return cached version instantly */
        if(cached){
          /* Update cache in background */
          fetch(event.request).then(fresh => {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, fresh));
          }).catch(() => {});
          return cached;
        }
        /* Not in cache — fetch and cache it */
        return fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        }).catch(() => caches.match('/index.html'));
      })
    );
    return;
  }

  /* For everything else: Network First, fall back to cache */
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
