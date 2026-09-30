/**
 * Cross-surface connector authorization.
 *
 * One entry point, three transports. What every surface must produce is the
 * same single bit — *the flow ended, go refetch* — because the server is the
 * authority on what actually connected. What differs is how we learn it:
 *
 *  - **web**: a popup watched via `popup.closed`; mobile web uses same-tab
 *    navigation and returns to the manager to refetch.
 *  - **native**: the Capacitor in-app browser, watched via `browserFinished`.
 *  - **desktop**: the system browser with a nonce-bound callback over IPC.
 *
 * Native/web close events trigger a refetch, never prove authorization success.
 * Desktop additionally verifies its callback and the resulting connection.
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
import { isNative, isDesktop, isMobile } from '../surface';
import { desktopBridge } from '../desktop';
import { isAuthFrontendUrl, prepareConnectorAuthorizationUrl } from '../authHandoff';
import { openAuthorizePopup } from './authorizePopup';

export interface DesktopConnectorCallback {
  requestId: string;
  status: 'success' | 'cancelled' | 'error';
  connectionId?: string;
  errorCode?: string;
}

export interface PreparedAuthorizeFlow {
  returnUrl: string;
  requestId?: string;
}

export async function prepareAuthorizeFlow(fallbackReturnUrl: string): Promise<PreparedAuthorizeFlow> {
  if (!isNative() && !isDesktop() && isMobile()) {
    // Mobile browsers commonly block popups opened after the install request.
    // Return to the manager without carrying a `connect` query and reinstalling.
    return { returnUrl: new URL('/console/connectors', window.location.origin).toString() };
  }
  if (!isDesktop()) return { returnUrl: fallbackReturnUrl };
  const bridge = desktopBridge();
  if (!bridge?.createConnectorCallback) throw new Error('desktop-authorize-unsupported');
  const prepared = await bridge.createConnectorCallback();
  return { returnUrl: prepared.returnUrl, requestId: prepared.requestId };
}

/**
 * Run the consent flow on whatever surface we are, and resolve once it ends.
 *
 * Native/web callers refetch when the browser closes. Opening failures reject
 * so the caller can show an error and clear its loading state.
 */
export async function openAuthorizeFlow(
  authorizationUrl: string,
  handoffToken?: string,
  requestId?: string
): Promise<DesktopConnectorCallback | undefined> {
  if (isDesktop()) return openOnDesktop(authorizationUrl, handoffToken, requestId);
  if (isNative()) {
    await openOnNative(authorizationUrl, handoffToken);
    return undefined;
  }
  await openOnWeb(authorizationUrl, handoffToken);
  return undefined;
}

/** Web: mobile uses the current tab; desktop browsers prefer a popup. */
async function openOnWeb(authorizationUrl: string, handoffToken?: string): Promise<void> {
  const needsHandoff = !!handoffToken || isAuthFrontendUrl(authorizationUrl);
  const target = needsHandoff ? prepareConnectorAuthorizationUrl(authorizationUrl, handoffToken) : authorizationUrl;
  if (isMobile()) {
    window.location.href = await target;
    return;
  }
  const pending = openAuthorizePopup(target);
  if (!pending) {
    // Navigating away — this page is about to be replaced, so there is
    // nothing left to refresh.
    window.location.href = await target;
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
async function openOnNative(authorizationUrl: string, handoffToken?: string): Promise<void> {
  let handle: { remove: () => Promise<void> } | undefined;
  try {
    let finish!: () => void;
    const finished = new Promise<void>((resolve) => {
      finish = resolve;
    });
    // Register before opening so failure cannot hang the flow and a quickly
    // dismissed browser cannot finish before the listener exists.
    handle = await Browser.addListener('browserFinished', finish);
    const target = await prepareConnectorAuthorizationUrl(authorizationUrl, handoffToken);
    await Browser.open({ url: target });
    await finished;
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
async function openOnDesktop(
  authorizationUrl: string,
  handoffToken?: string,
  requestId?: string
): Promise<DesktopConnectorCallback | undefined> {
  const bridge = desktopBridge();
  if (!bridge?.openAuthorizeConnector || !bridge.onConnectorCallback || !requestId) {
    throw new Error('desktop-authorize-unsupported');
  }
  const target = await prepareConnectorAuthorizationUrl(authorizationUrl, handoffToken);
  let timer: number | undefined;
  let off: (() => void) | undefined;
  const callback = new Promise<DesktopConnectorCallback>((resolve, reject) => {
    off = bridge.onConnectorCallback((result) => {
      if (result.requestId === requestId) resolve(result);
    });
    timer = window.setTimeout(() => reject(new Error('desktop-authorize-expired')), 10 * 60 * 1000);
  });
  try {
    await bridge.openAuthorizeConnector(target);
    return await callback;
  } finally {
    off?.();
    if (timer !== undefined) window.clearTimeout(timer);
  }
}
