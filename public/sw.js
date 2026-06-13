/* Coding Bridge service worker — Web Push receiver.
 *
 * Shows a consent-prompt notification pushed by the coding-bridge relay when no
 * tab is open, and opens (or focuses) the deep-linked page when it is tapped.
 * Deliberately minimal: this SW does NOT cache or intercept fetches — Nexior is
 * not a PWA shell, it only needs push delivery.
 */

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = { title: 'Approval needed', body: 'Open Coding Bridge to review.' };
  }
  const title = payload.title || 'Approval needed';
  const data = payload.data || {};
  const options = {
    body: payload.body || 'A coding session needs your approval.',
    tag: payload.tag || data.request_id || 'coding-bridge-permission',
    renotify: true,
    requireInteraction: true,
    data
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const target = data.deep_link || '/coding-bridge';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus an existing tab if one is already open, else open a new one.
      for (const client of clients) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client && target) {
            try {
              client.navigate(target);
            } catch (e) {
              /* cross-origin or unsupported — ignore */
            }
          }
          return undefined;
        }
      }
      return self.clients.openWindow ? self.clients.openWindow(target) : undefined;
    })
  );
});
