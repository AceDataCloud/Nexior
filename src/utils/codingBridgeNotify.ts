/**
 * Coding Bridge notifications — getting a consent prompt in front of the user
 * when they are not looking at the page.
 *
 * Three tiers, by how far away the user is:
 *
 *  1. **In-page / background tab** (this module, web): the live socket is still
 *     open, so when a `permission.request` arrives while the tab is hidden we
 *     raise an OS `Notification` directly. Instant, no server round-trip, no
 *     VAPID needed. A focused tab shows the inline dialog instead — no notice.
 *  2. **Tab closed** (Web Push): the relay pushes to a VAPID subscription and
 *     `public/sw.js` shows it. Subscription is managed here.
 *  3. **Native app backgrounded/killed**: the relay pushes to the device token
 *     registered here via `@capacitor/push-notifications` — an FCM token on
 *     Android (delivered via FCM) or a raw APNs token on iOS (delivered via
 *     APNs). The store tags the subscription `kind` by platform so the relay
 *     picks the right transport.
 *
 * Everything degrades quietly: missing API, denied permission or an unconfigured
 * relay simply means no notification, never a thrown error to the caller.
 */
import { isNative } from '@/utils/surface';

export interface ICodingBridgeNotifyData {
  deep_link?: string;
  session_id?: string;
  request_id?: string;
  node_id?: string;
  tool?: string;
}

const SW_URL = '/sw.js';

/** Browser push permission, normalised. 'unsupported' when the API is absent. */
export type NotifyPermission = 'granted' | 'denied' | 'default' | 'unsupported';

export const webNotificationsSupported = (): boolean => typeof window !== 'undefined' && 'Notification' in window;

export const serviceWorkerSupported = (): boolean => typeof navigator !== 'undefined' && 'serviceWorker' in navigator;

export const webPushSupported = (): boolean => serviceWorkerSupported() && 'PushManager' in window;

export const notifyPermission = (): NotifyPermission =>
  webNotificationsSupported() ? (Notification.permission as NotifyPermission) : 'unsupported';

/** VAPID public keys are base64url; the Push API wants a Uint8Array. */
const urlBase64ToUint8Array = (base64: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalised = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(normalised);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
};

/** Register the service worker once; returns its registration or null. */
export const ensureServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!serviceWorkerSupported()) {
    return null;
  }
  try {
    return (await navigator.serviceWorker.getRegistration(SW_URL)) ?? (await navigator.serviceWorker.register(SW_URL));
  } catch (error) {
    console.warn('[codingBridge] service worker registration failed', error);
    return null;
  }
};

/** Ask the browser for notification permission (no-op if already decided). */
export const requestWebPermission = async (): Promise<NotifyPermission> => {
  if (!webNotificationsSupported()) {
    return 'unsupported';
  }
  if (Notification.permission !== 'default') {
    return Notification.permission as NotifyPermission;
  }
  try {
    return (await Notification.requestPermission()) as NotifyPermission;
  } catch {
    return 'denied';
  }
};

/**
 * Tier 1 — raise a local OS notification for a consent prompt when the tab is
 * hidden. A visible tab shows the inline dialog, so we stay silent there.
 * `onClick` re-focuses and routes to the pending prompt.
 */
export const notifyPermissionLocally = (
  opts: { title: string; body: string; data: ICodingBridgeNotifyData },
  onClick?: (data: ICodingBridgeNotifyData) => void
): void => {
  // Only when the user isn't already looking at the page.
  if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
    return;
  }
  if (isNative()) {
    void notifyNativeLocal(opts);
    return;
  }
  if (!webNotificationsSupported() || Notification.permission !== 'granted') {
    return;
  }
  try {
    const notification = new Notification(opts.title, {
      body: opts.body,
      tag: opts.data.request_id || 'coding-bridge-permission',
      data: opts.data
    });
    notification.onclick = () => {
      try {
        window.focus();
      } catch {
        // ignore — some browsers disallow focus() from a notification
      }
      onClick?.(opts.data);
      notification.close();
    };
  } catch (error) {
    console.warn('[codingBridge] failed to raise local notification', error);
  }
};

/** Native (Capacitor) local notification, used when the app is backgrounded. */
const notifyNativeLocal = async (opts: {
  title: string;
  body: string;
  data: ICodingBridgeNotifyData;
}): Promise<void> => {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') {
      const req = await LocalNotifications.requestPermissions();
      if (req.display !== 'granted') {
        return;
      }
    }
    await LocalNotifications.schedule({
      notifications: [
        {
          // A stable small int derived from the request id keeps re-issues from stacking.
          id: hashToInt(opts.data.request_id || 'permission'),
          title: opts.title,
          body: opts.body,
          extra: opts.data
        }
      ]
    });
  } catch (error) {
    console.warn('[codingBridge] native local notification failed', error);
  }
};

const hashToInt = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 2147483000;
};

/**
 * Tier 2 — subscribe this browser to Web Push with the relay's VAPID key.
 * Returns the subscription JSON to register with the relay, or null on failure.
 */
export const subscribeWebPush = async (vapidPublicKey: string): Promise<PushSubscriptionJSON | null> => {
  if (!webPushSupported() || !vapidPublicKey) {
    return null;
  }
  const permission = await requestWebPermission();
  if (permission !== 'granted') {
    return null;
  }
  const registration = await ensureServiceWorker();
  if (!registration) {
    return null;
  }
  try {
    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      }));
    return subscription.toJSON();
  } catch (error) {
    console.warn('[codingBridge] web push subscribe failed', error);
    return null;
  }
};

/** Current web-push endpoint (the relay's subscription key), or null. */
export const currentWebPushEndpoint = async (): Promise<string | null> => {
  if (!webPushSupported()) {
    return null;
  }
  const registration = await ensureServiceWorker();
  const subscription = await registration?.pushManager.getSubscription();
  return subscription?.endpoint ?? null;
};

/** Tier 2 teardown — unsubscribe locally and return the endpoint to deregister. */
export const unsubscribeWebPush = async (): Promise<string | null> => {
  if (!webPushSupported()) {
    return null;
  }
  const registration = await ensureServiceWorker();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) {
    return null;
  }
  const endpoint = subscription.endpoint;
  try {
    await subscription.unsubscribe();
  } catch {
    // Still return the endpoint so the caller can deregister it server-side.
  }
  return endpoint;
};

/**
 * Tier 3 — register the native device for FCM. Resolves to the device token
 * (to register with the relay) or null. Wires a tap handler that routes via
 * `onOpen` with the notification's `extra` data.
 */
export const registerNativePush = async (onOpen?: (data: ICodingBridgeNotifyData) => void): Promise<string | null> => {
  if (!isNative()) {
    return null;
  }
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== 'granted') {
      return null;
    }
    const token = await new Promise<string | null>((resolve) => {
      const timer = setTimeout(() => resolve(null), 10000);
      void PushNotifications.addListener('registration', (t: { value: string }) => {
        clearTimeout(timer);
        resolve(t.value);
      });
      void PushNotifications.addListener('registrationError', () => {
        clearTimeout(timer);
        resolve(null);
      });
      void PushNotifications.register();
    });
    if (onOpen) {
      void PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (action: { notification: { data?: Record<string, string> } }) => {
          onOpen((action.notification?.data ?? {}) as ICodingBridgeNotifyData);
        }
      );
    }
    return token;
  } catch (error) {
    console.warn('[codingBridge] native push registration failed', error);
    return null;
  }
};
