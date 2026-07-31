/**
 * Popup-based connector authorization.
 *
 * `auth.acedata.cloud` stays the OAuth broker and credential vault — this
 * only changes *how the result gets back to Studio*. Instead of navigating
 * the whole tab (which drops chat drafts and in-memory state), we open the
 * provider consent flow in a popup and wait for it to close.
 *
 * We watch `popup.closed` rather than listening for a message, because that
 * is the one signal every outcome produces — consent granted, consent
 * denied, token exchange failed, user gave up — and observing it needs no
 * cooperation from the popup and no cross-origin trust. AuthFrontend's
 * `/connections/popup-return` is the single exit every terminal state lands
 * on, and it closes itself. The server is the authority on what connected,
 * so callers refetch instead of reading a posted payload.
 *
 * Degradations, in order:
 *  - popup blocked (`window.open` → null) → fall back to a full-page
 *    navigation with the original `return_url`, i.e. today's behaviour;
 *  - the lander can't `close()` (some browsers refuse it after a
 *    cross-origin navigation) → the user closes it and the poll fires.
 */

import { getBaseUrlAuth } from '../baseUrl';

/** Where AuthBackend should 302 once the OAuth round-trip finishes. */
export function popupReturnUrl(): string {
  return new URL('/connections/popup-return', getBaseUrlAuth()).toString();
}

const POPUP_FEATURES = 'popup=yes,width=600,height=760,noopener=no,noreferrer=no';

/**
 * Open `authorizationUrl` in a popup and resolve once it closes.
 *
 * Returns `null` when the popup was blocked, so the caller can fall back to
 * a full-page redirect. Otherwise the promise resolves when the flow ends,
 * whatever the outcome — callers refetch rather than branch on it.
 */
export function openAuthorizePopup(authorizationUrl: string): Promise<void> | null {
  const popup = window.open(authorizationUrl, 'acedata-connect', POPUP_FEATURES);
  if (!popup) return null;

  return new Promise<void>((resolve) => {
    const timer = window.setInterval(() => {
      if (!popup.closed) return;
      window.clearInterval(timer);
      resolve();
    }, 500);
  });
}
