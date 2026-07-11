// User-chosen login presentation on the **web** surface: the embedded
// iframe popup vs. the full-page redirect to AuthFrontend. Persisted in a
// host-only cookie (survives reloads, shared with the rest of the app's
// cookie-based prefs) and read by `isIframeLoginEnabled`.
//
// This is the ONLY switch between iframe and redirect login — there is no
// URL/cookie/server feature flag anymore. When unset, login defaults to
// the full-page redirect.
//
// Native / desktop always use the iframe regardless of this preference
// (a redirect can't return to an app://bundle window) — the callers short
// -circuit on `isNative() || isDesktop()` before consulting this value.

import { getCookie, setCookie } from 'typescript-cookie';

const COOKIE_NAME = 'LOGIN_METHOD';
const EXPIRY_DAYS = 365;

export type LoginMethod = 'iframe' | 'redirect';

export function getLoginMethodPreference(): LoginMethod | undefined {
  const value = getCookie(COOKIE_NAME);
  return value === 'iframe' || value === 'redirect' ? value : undefined;
}

export function setLoginMethodPreference(method: LoginMethod): void {
  // Host-only (no `domain=`) so it does not collide with sibling
  // PlatformFrontend / AuthFrontend cookies of the same name.
  setCookie(COOKIE_NAME, method, { path: '/', expires: EXPIRY_DAYS });
}

// Whether login should open the embedded AuthFrontend iframe instead of a
// full-page redirect. Enabled only when the user explicitly picked
// `iframe` in Settings; unset → redirect (the default).
export function isIframeLoginEnabled(): boolean {
  return getLoginMethodPreference() === 'iframe';
}
