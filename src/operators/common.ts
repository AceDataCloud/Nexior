import store from '@/store';
import { getBaseUrlPlatform } from '@/utils/baseUrl';
import { ensureLoggedIn } from '@/utils/login';
import { requireAccountToken } from '@/utils/requestAuth';
import { trackApiFailure } from '@/plugins/telemetry';
import { createHttpClient } from '@acedatacloud/core/http';
import type { AxiosInstance } from 'axios';
import qs from 'qs';
import { getCookie } from 'typescript-cookie';
import { v4 as uuidv4 } from 'uuid';

type AuthMode = 'required' | 'optional' | 'none';

const createClient = (mode: AuthMode): AxiosInstance => {
  const client = createHttpClient({
    baseURL: `${getBaseUrlPlatform()}/api/v1`,
    timeout: 20000,
    getToken: () => (mode === 'none' ? undefined : store.getters.token?.access),
    getUserId: () => (mode === 'none' ? undefined : store.getters.user?.id),
    getFingerprint: () => store.getters.fingerprint,
    getLocale: () => getCookie('LOCALE'),
    paramsSerializer: (params) => qs.stringify(params, { arrayFormat: 'repeat' }),
    generateRequestId: () => uuidv4(),
    onUnauthorized: () => {
      if (mode !== 'required') return;
      if (store.getters.authenticated) store.dispatch('logout');
      else ensureLoggedIn();
    },
    onApiFailure: trackApiFailure
  });
  if (mode === 'required') {
    client.interceptors.request.use((config) => {
      requireAccountToken();
      return config;
    });
  }
  return client;
};

export const httpClient = createClient('required');
export const optionalHttpClient = createClient('optional');
export const anonymousHttpClient = createClient('none');
