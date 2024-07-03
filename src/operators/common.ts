import store from '@/store';
import { getBaseUrlPlatform } from '@/utils';
import axios, { AxiosInstance } from 'axios';
import qs from 'qs';

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
  if (accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`;
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
