/* VideoToMP3 V9 cross-origin isolation service worker.
   Adds the headers required for SharedArrayBuffer on GitHub Pages. */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') {
    return;
  }

  event.respondWith((async () => {
    const response = await fetch(request);

    // Opaque cross-origin responses cannot be reconstructed. They are allowed
    // by COEP: credentialless and are returned unchanged.
    if (!response || response.status === 0) {
      return response;
    }

    const headers = new Headers(response.headers);
    headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
    headers.set('Cross-Origin-Resource-Policy', 'cross-origin');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  })());
});
