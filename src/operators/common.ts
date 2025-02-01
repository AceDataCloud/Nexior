import store from '@/store';
import { getBaseUrlPlatform } from '@/utils';
import axios, { AxiosInstance } from 'axios';
import qs from 'qs';
import { getCookie } from 'typescript-cookie';

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
      store.dispatch('login');
    }
    return Promise.reject(error);
  }
);

export { httpClient };
