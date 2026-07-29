/* Coding Bridge service worker — Web Push receiver.
 *
 * Shows a consent-prompt notification pushed by the coding-bridge relay when no
 * tab is open, and opens (or focuses) the deep-linked page when it is tapped.
 * Deliberately minimal: this SW does NOT cache or intercept fetches — Nexior is
 * not a PWA shell, it only needs push delivery.
 *
 * Localization: the server's title/body exist only for APNs/FCM, which the OS
 * renders without running our code. Here we DO run, so we compose from the
 * structured `data` fields and fall back to the server text only for kinds we
 * do not know about.
 */

/* Kept in sync with src/i18n/<locale>/chat.json `scheduledTasks.run.*`. Not
 * imported from there: a service worker has no bundler and must stay standalone. */
var SCHEDULED_COPY = {
  en: {
    success: ['✓ {name} done', 'Scheduled task finished. Tap to see the result.'],
    indeterminate: ['? {name} unconfirmed', 'The run finished but the outcome could not be confirmed.'],
    failed: ['✗ {name} failed', 'Run failed ({code}). Tap for details.']
  },
  zh: {
    success: ['✓ {name} 完成', '定时任务运行完毕，点击查看结果。'],
    indeterminate: ['? {name} 待确认', '运行结束但无法确认结果，点击查看详情。'],
    failed: ['✗ {name} 失败', '运行失败 ({code})，点击查看详情。']
  },
  ru: {
    success: ['✓ {name} готово', 'Задача по расписанию выполнена. Нажмите, чтобы посмотреть результат.'],
    indeterminate: ['? {name} не подтверждено', 'Запуск завершён, но результат не удалось подтвердить.'],
    failed: ['✗ {name} ошибка', 'Запуск не удался ({code}). Нажмите для подробностей.']
  }
};

function localeBase() {
  var lang = (self.navigator && self.navigator.language) || 'en';
  return lang.toLowerCase().split(/[-_]/)[0];
}

/* Returns null when we cannot do better than the server's own text. */
function composeFromData(data) {
  if (data.kind !== 'scheduled_task.completed') return null;
  var outcome = data.outcome;
  var pack = SCHEDULED_COPY[localeBase()] || SCHEDULED_COPY.en;
  var entry = pack[outcome] || SCHEDULED_COPY.en[outcome];
  if (!entry || !data.task_name) return null;
  return {
    title: entry[0].replace('{name}', data.task_name),
    body: entry[1].replace('{code}', data.error_code || 'error')
  };
}

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = {};
  }
  const data = payload.data || {};
  const local = composeFromData(data);
  const title = (local && local.title) || payload.title || 'Approval needed';
  const options = {
    body: (local && local.body) || payload.body || 'A coding session needs your approval.',
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
