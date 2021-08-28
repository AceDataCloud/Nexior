import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

const httpClient: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: {
    'Content-type': 'application/json'
  }
});

// const httpClient = (options: AxiosRequestConfig): Promise<AxiosResponse> => instance.request(options);

export default httpClient;
