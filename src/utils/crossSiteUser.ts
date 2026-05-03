import store from '@/store';
import { RouteLocationNormalized, RouteLocationRaw } from 'vue-router';
import { loginRedirect } from './login';

/**
 * Cross-site user-identity guard.
 *
 * Each AceDataCloud sub-site (auth.acedata.cloud, platform.acedata.cloud,
 * hub.acedata.cloud) keeps its own independent session in vuex-persistedstate /
 * localStorage — they don't share state. So it's possible for the user to be
 * logged in as user A on one site and user B (or nobody) on another.
 *
 * To avoid the confusion, every outbound cross-site link should append the
 * source site's currently-logged-in user id as `?user_id=<id>`. The destination
 * site checks that param in a router guard:
 *
 *   - no `user_id` in URL                       → do nothing
 *   - logged in & matches user_id               → strip the param, continue
 *   - logged in but different OR not logged in  → clear local session and
 *     redirect through the normal SSO login flow so the user re-authenticates
 *     with the correct account
 *
 * The redirect URL passed to login always has `user_id` removed to avoid an
 * infinite loop on the next round-trip.
 */
export const USER_ID_QUERY_PARAM = 'user_id';

/**
 * Append `?user_id=<currentUserId>` to a URL when there is a logged-in user.
 *
 * @param url Absolute URL to decorate.
 * @returns The URL, possibly with `user_id` added to its query string. If
 *   no user is logged in, the URL is returned unchanged.
 */
export const withCurrentUserId = (url: string): string => {
  const userId = store.getters?.user?.id;
  if (!userId) return url;
  try {
    const u = new URL(url);
    if (!u.searchParams.has(USER_ID_QUERY_PARAM)) {
      u.searchParams.set(USER_ID_QUERY_PARAM, String(userId));
    }
    return u.toString();
  } catch {
    // Not a parseable absolute URL — fall back to manual concat.
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}${USER_ID_QUERY_PARAM}=${encodeURIComponent(String(userId))}`;
  }
};

/** Build a path+query string for `to`, omitting `user_id`. */
const buildRedirectWithoutUserId = (to: RouteLocationNormalized): string => {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(to.query)) {
    if (k === USER_ID_QUERY_PARAM) continue;
    if (v == null) continue;
    if (Array.isArray(v)) {
      v.forEach((entry) => entry != null && params.append(k, String(entry)));
    } else {
      params.set(k, String(v));
    }
  }
  const search = params.toString();
  return to.path + (search ? `?${search}` : '');
};

/**
 * Process `?user_id=<id>` on the incoming route and decide what to do.
 *
 * Side effects:
 *   - On a "mismatch" decision, clears local user/token state and triggers
 *     `window.location.href = <auth.acedata.cloud SSO login>` via
 *     `loginRedirect`. The current navigation should be aborted by the caller
 *     (`next(false)`).
 *
 * Returns:
 *   - `passthrough` — caller should `next()`.
 *   - `strip(redirect)` — caller should `next(redirect)` to remove the
 *     `user_id` query param from the URL bar.
 *   - `mismatch` — caller should `next(false)` because the helper has
 *     initiated a full-page SSO redirect.
 */
export type UserIdGuardDecision =
  | { kind: 'passthrough' }
  | { kind: 'strip'; redirect: RouteLocationRaw }
  | { kind: 'mismatch' };

export const evaluateUserIdGuard = (to: RouteLocationNormalized): UserIdGuardDecision => {
  const expectedRaw = to.query[USER_ID_QUERY_PARAM];
  const expected = Array.isArray(expectedRaw) ? expectedRaw[0] : expectedRaw;
  if (!expected) return { kind: 'passthrough' };

  const currentId = store.getters?.user?.id;
  if (currentId && String(currentId) === String(expected)) {
    const { [USER_ID_QUERY_PARAM]: _omit, ...rest } = to.query;
    return {
      kind: 'strip',
      redirect: { path: to.path, query: rest, replace: true } as RouteLocationRaw
    };
  }

  // Mismatch (or not logged in). Clear local session so the next render does
  // not flash the wrong identity, then bounce through the normal SSO flow.
  store.dispatch('resetToken');
  store.dispatch('resetUser');
  loginRedirect({ redirect: buildRedirectWithoutUserId(to) });
  return { kind: 'mismatch' };
};
