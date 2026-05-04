import store from '@/store';
import { getBaseUrlPlatform } from '@/utils';
import { trackApiFailure } from '@/plugins/telemetry';
import axios, { AxiosInstance } from 'axios';
import qs from 'qs';
import { getCookie } from 'typescript-cookie';
import { v4 as uuidv4 } from 'uuid';

const httpClient: AxiosInstance = axios.create({
  baseURL: `${getBaseUrlPlatform()}/api/v1`,
  headers: {
    'Content-type': 'application/json',
    Accept: 'application/json'
  },
  paramsSerializer(params) {
    return qs.stringify(params, { arrayFormat: 'repeat' });
  }
});

httpClient.interceptors.request.use((config) => {
  const accessToken = store.getters.token?.access;
  const userId = store.getters.user?.id;
  const fingerprint = store.getters.fingerprint;
  const locale = getCookie('LOCALE');
  console.debug('userId', userId);
  console.debug('fingerprint', fingerprint);
  config.headers['x-request-id'] = uuidv4();
  if (accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`;
  }
  if (locale) {
    config.headers['accept-language'] = locale;
  }
  if (fingerprint) {
    config.headers['x-fingerprint'] = fingerprint;
  }
  if (userId) {
    config.headers['x-user-id'] = userId;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error?.response?.status === 401) {
      store.dispatch('logout');
    }
    const traceId = error?.response?.data?.trace_id || error?.response?.headers?.['x-request-id'];
    if (traceId) {
      console.error(`Request failed [trace_id=${traceId}]`, error?.response?.status, error?.response?.data);
    }
    // Forward 4xx/5xx to RUM with the server-side trace_id attached so the
    // entry can be cross-referenced with PlatformGateway CLS logs. Network
    // errors (no `response`) are still captured because Aegis's built-in
    // `reportApiSpeed` covers them.
    if (error?.response) {
      trackApiFailure({
        url: error.config?.url ?? '',
        method: error.config?.method,
        status: error.response.status,
        trace_id: traceId
      });
    }
    return Promise.reject(error);
  }
);

export { httpClient };
