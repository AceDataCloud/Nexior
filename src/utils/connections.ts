/**
 * Where "manage my connections" goes.
 *
 * Studio owns the connector UI at `/console/connectors`. auth.acedata.cloud
 * stays the OAuth broker and credential vault — only the UI lives here.
 */

import type { Router } from 'vue-router';

/**
 * Open connection management.
 *
 * `router` is optional so existing callers keep working; without it this
 * falls back to a same-origin navigation.
 */
export function openConnectionsManager(provider?: string, router?: Router): void {
  const query = provider ? { connect: provider } : undefined;
  if (router) {
    void router.push({ path: '/console/connectors', query });
    return;
  }
  const target = new URL('/console/connectors', window.location.origin);
  if (provider) target.searchParams.set('connect', provider);
  window.location.href = target.toString();
}
