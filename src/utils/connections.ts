/**
 * Where "manage my connections" goes.
 *
 * Studio now has its own connector page at `/console/connectors`, but the
 * rollout is gated: until `connections-in-studio` is on, connections are
 * still managed at auth.acedata.cloud (which stays the OAuth broker and
 * credential vault either way — only the UI moved).
 */

import type { Router } from 'vue-router';
import { withCurrentUserIdAndSite } from './crossSiteUser';
import { isFeatureEnabled } from './featureFlag';

const CONNECTIONS_MANAGER_URL = 'https://auth.acedata.cloud/user/connections';

/** True when the in-Studio connector page should be used. */
export function useStudioConnections(): boolean {
  return isFeatureEnabled('connections-in-studio');
}

/**
 * Open connection management.
 *
 * Flag on → push Studio's own `/console/connectors` route (no tab switch,
 * no page reload, chat state preserved). Flag off → the historical
 * behaviour: open auth.acedata.cloud in a new tab, annotated with
 * `return_url` (so it can offer a way back), `user_id` (so AuthFrontend
 * catches a cross-site identity mismatch and re-auths) and `site` (so it
 * renders the calling subsite's white-label logo).
 *
 * `router` is optional so existing callers keep working; without it the
 * flag-on path falls back to a same-origin navigation.
 */
export function openConnectionsManager(provider?: string, router?: Router): void {
  if (useStudioConnections()) {
    const query = provider ? { connect: provider } : undefined;
    if (router) {
      void router.push({ path: '/console/connectors', query });
      return;
    }
    const target = new URL('/console/connectors', window.location.origin);
    if (provider) target.searchParams.set('connect', provider);
    window.location.href = target.toString();
    return;
  }

  const url = new URL(CONNECTIONS_MANAGER_URL);
  url.searchParams.set('return_url', window.location.href);
  if (provider) {
    url.searchParams.set('provider', provider);
  }
  window.open(withCurrentUserIdAndSite(url.toString()), '_blank', 'noopener,noreferrer');
}
