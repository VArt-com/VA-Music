// Service worker for Music World.
//
// Two jobs:
// 1. Satisfy the PWA installability requirement (a registered SW with a
//    fetch handler) so "Add to Home Screen" / the install prompt works.
// 2. Actually cache the app shell (pages + JS/CSS/image assets from this
//    same origin) as they're visited, so the app can still OPEN with no
//    internet connection after at least one successful visit.
//
// This deliberately does NOT cache audio files or anything cross-origin
// (e.g. Supabase storage). Tracks the user explicitly downloads for offline
// listening are handled separately, in IndexedDB, by src/lib/offline/db.ts
// — that approach works reliably on iOS Safari, where service-worker-
// intercepted <audio> range requests historically have not.

const CACHE_NAME = 'music-world-shell-v2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only ever cache same-origin GET requests. Everything else (audio files,
  // Supabase API calls, POST requests, etc.) goes straight to the network,
  // exactly like before.
  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    event.respondWith(fetch(request));
    return;
  }

  if (request.mode === 'navigate') {
    // Page loads: prefer a fresh page from the network, but fall back to
    // whatever we have cached (this exact page, or failing that the home
    // page shell) when there's no connection at all.
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, fresh.clone());
          return fresh;
        } catch {
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match(request);
          if (cached) return cached;
          const home = await cache.match('/');
          if (home) return home;
          return Response.error();
        }
      })()
    );
    return;
  }

  // Static assets (JS/CSS/images/fonts from this site): serve from cache
  // instantly if we have it, and refresh the cache in the background so the
  // next visit gets the latest build. If it isn't cached yet, fetch it and
  // store a copy for next time.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => null);

      if (cached) {
        networkFetch.catch(() => {});
        return cached;
      }
      const fresh = await networkFetch;
      if (fresh) return fresh;
      return Response.error();
    })()
  );
});
