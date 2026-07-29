/**
 * Popup-based connector authorization.
 *
 * `auth.acedata.cloud` stays the OAuth broker and credential vault — this
 * only changes *how the result gets back to Studio*. Instead of navigating
 * the whole tab (which drops chat drafts and in-memory state), we open the
 * provider consent flow in a popup and wait for AuthFrontend's
 * `/connections/popup-return` landing page to postMessage the outcome back.
 *
 * Degradations, in order:
 *  - popup blocked (`window.open` → null) → fall back to a full-page
 *    navigation with the original `return_url`, i.e. today's behaviour;
 *  - user closes the popup manually → the `closed` poll resolves so callers
 *    can refresh rather than hang;
 *  - message never arrives → callers still refresh on resolve, and the
 *    connection landed server-side regardless.
 */

import { getBaseUrlAuth } from '../baseUrl';

export interface IConnectionPopupResult {
  status: string;
  provider?: string;
  connection_id?: string;
  connector?: string;
  consent?: string;
}

/** Where AuthBackend should 302 once the OAuth round-trip finishes. */
export function popupReturnUrl(): string {
  const url = new URL('/connections/popup-return', getBaseUrlAuth());
  url.searchParams.set('opener_origin', window.location.origin);
  return url.toString();
}

const POPUP_FEATURES = 'popup=yes,width=600,height=760,noopener=no,noreferrer=no';

/**
 * Open `authorizationUrl` in a popup and resolve once the flow ends.
 *
 * Resolves with the posted result, or `null` when the popup was blocked
 * (caller should fall back to a full-page redirect) or closed without a
 * message (caller should just refetch — the connect may still have
 * succeeded).
 */
export function openAuthorizePopup(authorizationUrl: string): Promise<IConnectionPopupResult | null> | null {
  const popup = window.open(authorizationUrl, 'acedata-connect', POPUP_FEATURES);
  if (!popup) return null;

  const authOrigin = new URL(getBaseUrlAuth()).origin;

  return new Promise<IConnectionPopupResult | null>((resolve) => {
    let settled = false;

    const finish = (result: IConnectionPopupResult | null) => {
      if (settled) return;
      settled = true;
      window.removeEventListener('message', onMessage);
      window.clearInterval(timer);
      resolve(result);
    };

    // Validate BOTH the origin and the sending window — origin alone would
    // let any other frame from auth.acedata.cloud speak for the popup.
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== authOrigin) return;
      if (event.source !== popup) return;
      const payload = event.data as { name?: string; data?: IConnectionPopupResult };
      if (!payload || payload.name !== 'connection-result') return;
      finish(payload.data ?? { status: 'success' });
      try {
        popup.close();
      } catch {
        // already gone / cross-origin — the landing page closes itself
      }
    };

    window.addEventListener('message', onMessage);

    // The popup can be dismissed by the user at any point; without this the
    // promise would never settle and the caller's spinner would stick.
    const timer = window.setInterval(() => {
      if (popup.closed) finish(null);
    }, 500);
  });
}
