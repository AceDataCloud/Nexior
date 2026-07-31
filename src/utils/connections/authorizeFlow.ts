/**
 * Cross-surface connector authorization.
 *
 * One entry point, three transports. What every surface must produce is the
 * same single bit — *the flow ended, go refetch* — because the server is the
 * authority on what actually connected. What differs is how we learn it:
 *
 *  - **web**: a popup, watched via `popup.closed` (see `authorizePopup.ts`).
 *  - **native**: the Capacitor in-app browser, watched via `browserFinished`.
 *  - **desktop**: the system browser, watched via window `focus` — Electron
 *    opens a real browser, so there is no in-app close event to listen for.
 *
 * None of these is a message channel; each is something the app can observe on
 * its own, which is why none needs cross-origin trust.
 *
 * ## Why native can't just use `window.open`
 *
 * Capacitor hands any off-origin URL to the OS browser and cancels the
 * WebView load — Android via `Bridge.launchIntent` → `Intent.ACTION_VIEW`,
 * iOS via `WebViewDelegationHandler` → `UIApplication.open`. So `window.open`
 * ejects the user out of the app shell, and the `window.location.href`
 * fallback fires the *same* navigation a second time. Electron is worse: its
 * `setWindowOpenHandler` denies unconditionally and only opens hosts on
 * `EXTERNAL_HOSTS` — which lists no OAuth provider — so the click does
 * nothing at all.
 *
 * See `plans/connections-in-nexior/04-native-surface-breakage.md`.
 *
 * ## What this does NOT do yet
 *
 * The user still has to switch back to the app by hand; we refetch when they
 * do. Landing them back automatically needs the custom-scheme deep link from
 * `plans/connections-in-nexior/02-nexior-return-channels.md`.
 */

import { Browser } from '@capacitor/browser';
import { isNative, isDesktop } from '../surface';
import { desktopBridge } from '../desktop';
import { openAuthorizePopup } from './authorizePopup';

/**
 * Run the consent flow on whatever surface we are, and resolve once it ends.
 *
 * Always resolves — callers refetch rather than branching on an outcome. A
 * surface that cannot open the URL at all still resolves, so a spinner never
 * outlives the click.
 */
export async function openAuthorizeFlow(authorizationUrl: string): Promise<void> {
  if (isDesktop()) return openOnDesktop(authorizationUrl);
  if (isNative()) return openOnNative(authorizationUrl);
  return openOnWeb(authorizationUrl);
}

/** Web: popup, falling back to a full-page navigation when it's blocked. */
async function openOnWeb(authorizationUrl: string): Promise<void> {
  const pending = openAuthorizePopup(authorizationUrl);
  if (!pending) {
    // Navigating away — this page is about to be replaced, so there is
    // nothing left to refresh.
    window.location.href = authorizationUrl;
    return;
  }
  await pending;
}

/**
 * Native: the Capacitor in-app browser.
 *
 * `browserFinished` is the native analogue of `popup.closed` — it fires when
 * the user dismisses the sheet, whatever the outcome. Deliberately no
 * `window.location.href` fallback: on Android that is a second top-level
 * navigation, which Capacitor hands to Chrome all over again.
 */
async function openOnNative(authorizationUrl: string): Promise<void> {
  let handle: { remove: () => Promise<void> } | undefined;
  try {
    const finished = new Promise<void>((resolve) => {
      void Browser.addListener('browserFinished', () => resolve()).then((h) => {
        handle = h;
      });
    });
    await Browser.open({ url: authorizationUrl });
    await finished;
  } catch (error) {
    // A browser that never opened has nothing to wait for; resolving lets the
    // caller refetch, which is harmless and clears the spinner.
    console.warn('in-app browser failed for connector authorize', error);
  } finally {
    await handle?.remove();
  }
}

/**
 * Desktop: the system browser via the Electron main process.
 *
 * There is no in-app browser to emit `browserFinished`, so we settle on the
 * next window `focus` — the user coming back is the signal. `visibilitychange`
 * would not do: the Electron window stays visible behind the browser.
 */
async function openOnDesktop(authorizationUrl: string): Promise<void> {
  const bridge = desktopBridge();
  if (!bridge?.openAuthorizeConnector) {
    // Desktop shell older than this IPC. Falling through to window.open would
    // be a silent no-op (setWindowOpenHandler denies non-allowlisted hosts),
    // so say so instead of pretending the click worked.
    throw new Error('desktop-authorize-unsupported');
  }
  const returned = new Promise<void>((resolve) => {
    window.addEventListener('focus', () => resolve(), { once: true });
  });
  await bridge.openAuthorizeConnector(authorizationUrl);
  await returned;
}
