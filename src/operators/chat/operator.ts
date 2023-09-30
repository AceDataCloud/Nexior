import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import { IChatOptions, IChatRequest, IChatResponse } from './models';
import store from '@/store';

class ChatOperator {
  async request(data: IChatRequest, options: IChatOptions): Promise<AxiosResponse<IChatResponse>> {
    return await axios.post(`/chatgpt`, data, {
      headers: {
        authorization: `Bearer ${options.token}`,
        accept: 'application/x-ndjson',
        'content-type': 'application/json'
      },
      baseURL: options.endpoint,
      responseType: 'stream',
      onDownloadProgress: (event) => {
        const response = event.target.response;
        const lines = response.split('\r\n').filter((line: string) => !!line);
        const lastLine = lines[lines.length - 1];
        if (lastLine) {
          const jsonData = JSON.parse(lastLine);
          if (options?.stream) {
            options?.stream(jsonData as IChatResponse);
          }
        }
      }
    });
  }
}

export const chatOperator = new ChatOperator();
