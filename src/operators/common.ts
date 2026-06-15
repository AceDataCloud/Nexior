import store from '@/store';
import { getBaseUrlPlatform } from '@/utils';
import { trackApiFailure } from '@/plugins/telemetry';
import { createHttpClient } from '@acedatacloud/core/http';
import qs from 'qs';
import { getCookie } from 'typescript-cookie';
import { v4 as uuidv4 } from 'uuid';

// The axios instance + interceptor contract now lives in @acedatacloud/core;
// this configures it with Nexior's token/fingerprint/user sources and 401
// behavior. Header set (x-request-id / Authorization / accept-language /
// x-fingerprint / x-user-id) and 4xx/5xx-to-RUM are handled inside the factory.
const httpClient = createHttpClient({
  baseURL: `${getBaseUrlPlatform()}/api/v1`,
  // Without a timeout a stalled mobile connection leaves the promise pending
  // forever (e.g. SSO code exchange / getUser after Apple login). Fail after
  // 20s so the caller's catch runs and RUM captures it.
  timeout: 20000,
  getToken: () => store.getters.token?.access,
  getUserId: () => store.getters.user?.id,
  getFingerprint: () => store.getters.fingerprint,
  getLocale: () => getCookie('LOCALE'),
  paramsSerializer: (params) => qs.stringify(params, { arrayFormat: 'repeat' }),
  generateRequestId: () => uuidv4(),
  // Fire-and-forget (not awaited) to preserve the original timing: the caller's
  // rejection runs without waiting for logout to complete.
  onUnauthorized: () => {
    store.dispatch('logout');
  },
  onApiFailure: trackApiFailure
});

export { httpClient };
