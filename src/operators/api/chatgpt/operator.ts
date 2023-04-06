import { AxiosResponse } from 'axios';
import { httpClient } from '../../instance';
import { IRequest, IResponse } from './models';

export interface IQuery {
  token: string;
}

const baseUrl = 'https://api.zhishuyun.com';

class ChatGPTOperator {
  async post(data: IRequest, query: IQuery): Promise<AxiosResponse<IResponse>> {
    return await httpClient.post(`/chatgpt`, data, {
      params: query,
      baseURL: baseUrl
    });
  }
}

export const chatgptOperator = new ChatGPTOperator();
