// NextGen C# Designer Service Worker - Cache-Bypass to prevent sticky 404/blank pages on subpaths
const CACHE_NAME = 'nextgen-csharp-designer-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          console.log('Clearing old service worker cache:', name);
          return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Gracefully let all requests pass to the network directly
  // This avoids accidental caching of 404 pages or blank pages in subfolders on GitHub Pages
});
