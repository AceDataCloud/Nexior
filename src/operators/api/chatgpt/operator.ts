import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import { IRequest, IResponse } from './models';

export interface IQuery {
  token: string;
}

class ChatGPTOperator {
  async post(data: IRequest, query: IQuery, config?: AxiosRequestConfig): Promise<AxiosResponse<IResponse>> {
    return await axios.post(`/chatgpt`, data, {
      ...config,
      params: query
    });
  }
}

export const chatgptOperator = new ChatGPTOperator();

class ChatGPT4Operator {
  async post(data: IRequest, query: IQuery, config?: AxiosRequestConfig): Promise<AxiosResponse<IResponse>> {
    return await axios.post(`/chatgpt4`, data, {
      ...config,
      params: query
    });
  }
}

export const chatgpt4Operator = new ChatGPT4Operator();
