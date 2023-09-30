import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import { IChatOptions, IChatRequest, IChatResponse } from './models';
import store from '@/store';
import { IApplication } from '@/store/models';
class ChatOperator {
  async request(data: IChatRequest, config?: IChatOptions): Promise<AxiosResponse<IChatResponse>> {
    const applications: IApplication[] = store.getters.applications;
    // find related application
    const application = applications?.filter((application: IApplication) => {
      return (application.api_id = config?.api_id);
    })?.[0];
    if (!application) {
      return Promise.reject('no application');
    }
    const token = application?.credential?.token;
    if (!token) {
      return Promise.reject('no token');
    }
    return await axios.post(`/chatgpt`, data, {
      headers: {
        authorization: `Bearer ${token}`,
        accept: 'application/x-ndjson',
        'content-type': 'application/json'
      },
      onDownloadProgress: (event) => {
        const response = event.target.response;
        const lines = response.split('\r\n').filter((line: string) => !!line);
        const lastLine = lines[lines.length - 1];
        if (lastLine) {
          const jsonData = JSON.parse(lastLine);
          if (config?.stream) {
            config?.stream(jsonData as IChatResponse);
          }
        }
      }
    });
  }
}

export const chatOperator = new ChatOperator();
