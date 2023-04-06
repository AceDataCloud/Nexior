import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import { IRequest, IResponse } from './models';

export interface IQuery {
  token: string;
}

const baseUrl = 'https://api.zhishuyun.com';

class ChatGPTOperator {
  async post(data: IRequest, query: IQuery, config?: AxiosRequestConfig): Promise<AxiosResponse<IResponse>> {
    return await axios.post(`/chatgpt`, data, {
      ...config,
      params: query,
      baseURL: baseUrl
    });
  }
}

export const chatgptOperator = new ChatGPTOperator();
