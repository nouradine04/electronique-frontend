/* Loaded by the generated Workbox service worker. */
self.addEventListener('message', event => {
  if (event.data?.type !== 'PUSH_ACCOUNT') return;
  event.waitUntil((async () => {
    const cache = await caches.open('nstock-push-account');
    const key = new URL('/__push-account', self.location.origin).href;
    if (event.data.userId) await cache.put(key, new Response(String(event.data.userId)));
    else await cache.delete(key);
  })());
});
self.addEventListener('push', event => {
  event.waitUntil((async () => {
    let payload;
    try { payload = event.data?.json(); } catch { return; }
    const account = await (await caches.open('nstock-push-account')).match(new URL('/__push-account', self.location.origin).href);
    if (!account || await account.text() !== payload?.userId) return;
    await self.registration.showNotification('NStock', {
      body: String(payload.body || 'Une alerte nécessite votre attention.'),
      icon: '/icon-192.png', tag: String(payload.tag || 'nstock-alert'), renotify: false,
      data: { url: '/' },
    });
  })());
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = windows.find(client => new URL(client.url).origin === self.location.origin);
    if (existing) return existing.focus();
    return self.clients.openWindow('/');
  })());
});
