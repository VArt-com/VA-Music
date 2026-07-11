// Minimal service worker. Its only job is to satisfy Chrome/Edge's PWA
// installability requirement (a registered service worker with a fetch
// handler) so the "Install app" prompt (beforeinstallprompt) actually fires.
// It does not cache anything — every request just passes straight through
// to the network as normal.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
