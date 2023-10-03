import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import {
  IChatHistoryRequest,
  IChatHistoryResponse,
  IChatAskOptions,
  IChatAskRequest,
  IChatAskResponse,
  IChatHistoryOptions
} from './models';

class ChatOperator {
  async ask(data: IChatAskRequest, options: IChatAskOptions): Promise<AxiosResponse<IChatAskResponse>> {
    return await axios.post(options.path, data, {
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
            options?.stream(jsonData as IChatAskResponse);
          }
        }
      }
    });
  }

  async history(data: IChatHistoryRequest, options: IChatHistoryOptions): Promise<AxiosResponse<IChatHistoryResponse>> {
    return await axios.post(options.path, data, {
      headers: {
        'content-type': 'application/json'
      },
      baseURL: options.endpoint
    });
  }
}

export const chatOperator = new ChatOperator();
