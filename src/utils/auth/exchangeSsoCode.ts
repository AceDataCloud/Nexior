import type { Store } from 'vuex';
import type { Router } from 'vue-router';
import { ssoOperator } from '@/operators';
import { track } from '@/plugins/telemetry';

/**
 * Shared SSO `code → token` exchange used by BOTH the native (Capacitor
 * `appUrlOpen`) and desktop (Electron custom-scheme) deep-link callbacks.
 *
 * Extracted verbatim from the original inline handler in `App.vue` so the two
 * surfaces share one implementation. On desktop the Electron main process has
 * ALREADY validated the OAuth `state` nonce before this runs, so `state` never
 * reaches the renderer — we only ever receive `code`.
 *
 * RUM event names are kept identical to the original (`apple_login_deeplink` /
 * `apple_login_success` / `apple_login_failed`) so existing dashboards/alerts
 * keep firing; a `source` field distinguishes native vs desktop.
 */
let lastHandledCode = '';

interface ExchangeContext {
  // `Store`/`Router` are passed in (rather than imported) so this stays a pure
  // util usable from both the component and tests.
  store: Store<unknown>;
  router: Router;
  source: 'native' | 'desktop';
}

export async function exchangeSsoCode(code: string, { store, router, source }: ExchangeContext): Promise<void> {
  if (!code) return;
  // Dedup: an SSO code is single-use; the same code can arrive twice (Capacitor
  // re-delivers appUrlOpen; a desktop double protocol activation). Replaying a
  // consumed code 4xxs and would kick the user back to login.
  if (code === lastHandledCode) return;
  lastHandledCode = code;
  track('apple_login_deeplink', { action: 'sso_exchange', source });
  try {
    const { data } = await ssoOperator.token({ code });
    const token = {
      access: data.access_token,
      refresh: data.refresh_token,
      expiration: data.expires_in
    };
    await store.dispatch('setToken', token);
    await store.dispatch('getUser');
    track('apple_login_success', { action: 'sso_exchange', source });
    store.commit('setAuth', { visible: false });
    await router.push('/');
  } catch (e) {
    // Reset dedup ONLY if we still own this code, so a concurrent attempt's
    // newer code (set into lastHandledCode while we awaited) isn't wiped —
    // that would let its single-use code be re-exchanged and 4xx-bounce.
    if (lastHandledCode === code) lastHandledCode = '';
    track('apple_login_failed', { action: 'sso_exchange', source, error: String(e) });
    store.commit('setAuth', { visible: false });
    await store.dispatch('login');
  }
}
