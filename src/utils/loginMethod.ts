// How login is presented on the **web** surface: the embedded iframe
// popup vs. the full-page redirect to AuthFrontend. This is driven by
// *site* configuration (`site.auth.login_mode`) set by the site admin in
// Settings → Auth — NOT a per-browser preference. The client reads the
// site config and decides how to launch login. When unset, login
// defaults to the full-page redirect.
//
// Native / desktop always use the iframe regardless of this value (a
// redirect can't return to an app://bundle window) — the callers short
// -circuit on `isNative() || isDesktop()` before consulting it.

import store from '@/store';

export type LoginMode = 'iframe' | 'redirect';

// The effective login mode for the current site. Unset / unknown value
// falls back to the full-page redirect (the platform default).
export function getSiteLoginMode(): LoginMode {
  return store.getters?.site?.auth?.login_mode === 'iframe' ? 'iframe' : 'redirect';
}

// Whether login should open the embedded AuthFrontend iframe instead of a
// full-page redirect. Driven by the site's `login_mode`; unset → redirect
// (the default).
export function isIframeLoginEnabled(): boolean {
  return getSiteLoginMode() === 'iframe';
}
