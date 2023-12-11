import axios, { AxiosResponse } from 'axios';
import {
  IChatAskOptions,
  IChatAskRequest,
  IChatAskResponse,
  IChatConversation,
  IChatConversationAction
} from './models';
import { ENDPOINT_API } from '../common/contants';

class ChatOperator {
  async askQuestion(data: IChatAskRequest, options: IChatAskOptions): Promise<AxiosResponse<IChatAskResponse>> {
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

  async getConversation(id: string | undefined): Promise<AxiosResponse<IChatConversation>> {
    return await axios.post(
      `/chatgpt/conversations`,
      {
        action: IChatConversationAction.RETRIEVE,
        id: id
      },
      {
        headers: {
          'content-type': 'application/json'
        },
        baseURL: ENDPOINT_API
      }
    );
  }

  async getConversations(ids: string[]): Promise<AxiosResponse<IChatConversation[]>> {
    return await axios.post(
      `/chatgpt/conversations`,
      {
        action: IChatConversationAction.RETRIEVE_BATCH,
        ids: ids
      },
      {
        headers: {
          'content-type': 'application/json'
        },
        baseURL: ENDPOINT_API
      }
    );
  }

  async deleteConversation(id: string): Promise<AxiosResponse<IChatConversation>> {
    return await axios.post(
      `/chatgpt/conversations`,
      {
        action: IChatConversationAction.DELETE,
        id: id
      },
      {
        headers: {
          'content-type': 'application/json'
        },
        baseURL: ENDPOINT_API
      }
    );
  }

  async updateConversation(payload: IChatConversation): Promise<AxiosResponse<IChatConversation>> {
    return await axios.post(
      `/chatgpt/conversations`,
      {
        action: IChatConversationAction.UPDATE,
        ...payload
      },
      {
        headers: {
          'content-type': 'application/json'
        },
        baseURL: ENDPOINT_API
      }
    );
  }
}

export const chatOperator = new ChatOperator();
