/* Placeholder Service Worker (MT-04 Offline scaffold) */
self.addEventListener('install', (e) => {
  // eslint-disable-next-line no-console
  console.log('[sw] install');
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  // eslint-disable-next-line no-console
  console.log('[sw] activate');
  clients.claim();
});
self.addEventListener('fetch', () => {
  // passthrough
});
