import router from '@/router';
import store from '@/store';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

const httpClient: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: {
    'Content-type': 'application/json'
  }
});

httpClient.interceptors.request.use((config) => {
  const accessToken = store.getters.accessToken;
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
    console.log('error', error);
    if (error.response.status === 401) {
      store.dispatch('resetAuth');
      router.push('/');
    }
    return error;
  }
);

// const httpClient = (options: AxiosRequestConfig): Promise<AxiosResponse> => instance.request(options);

export default httpClient;
