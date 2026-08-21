// Minimal service worker: no offline caching yet (see project-notes.md),
// just enough for browsers to consider the app installable as a PWA.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
