import axios, { AxiosResponse } from 'axios';
import {
  IChatConversation,
  IChatConversationAction,
  IChatConversationOptions,
  IChatConversationRequest,
  IChatConversationResponse,
  IChatConversationsResponse
} from '@/models';
import { BASE_URL_API } from '@/constants';

class ChatOperator {
  async chatConversation(
    data: IChatConversationRequest,
    options: IChatConversationOptions
  ): Promise<IChatConversationResponse> {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(`${BASE_URL_API}/aichat/conversations`, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${options.token}`,
            'Content-Type': 'application/json',
            Accept: 'text/event-stream'
          },
          signal: options.signal,
          body: JSON.stringify(data)
        });

        if (!response.body) throw new Error('ReadableStream not supported.');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let finalAnswer = '';
        let id: string | undefined;
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            if (trimmedLine.startsWith('data: ')) {
              const subValue = trimmedLine.substring(6).trim();
              if (subValue === '[DONE]') {
                resolve({ answer: finalAnswer, delta_answer: '' });
                return;
              }
              try {
                const json = JSON.parse(subValue);
                if (json.delta_answer) {
                  finalAnswer += json.delta_answer;
                }
                if (json.id) {
                  id = json.id;
                }
                if (options?.stream) {
                  options.stream({
                    answer: finalAnswer,
                    delta_answer: json.delta_answer || '',
                    id
                  });
                }
              } catch (err) {
                console.error('JSON parse error:', err);
              }
            }
          }
        }
        resolve({ answer: finalAnswer, delta_answer: '' });
      } catch (error) {
        console.error('Error:', error);
        reject(error);
      }
    });
  }

  async getConversations(
    filter: {
      ids?: string[];
      applicationId?: string;
      userId?: string;
    },
    options: IChatConversationOptions
  ): Promise<AxiosResponse<IChatConversationsResponse>> {
    return await axios.post(
      `/aichat/conversations`,
      {
        action: IChatConversationAction.RETRIEVE_BATCH,
        ...(filter.ids
          ? {
              ids: filter.ids
            }
          : {}),
        ...(filter.applicationId
          ? {
              application_id: filter.applicationId
            }
          : {}),
        ...(filter.userId
          ? {
              user_id: filter.userId
            }
          : {})
      },
      {
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${options.token}`,
          'x-record-exempt': 'true'
        },
        baseURL: BASE_URL_API
      }
    );
  }

  async deleteConversation(id: string, options: IChatConversationOptions): Promise<AxiosResponse<IChatConversation>> {
    return await axios.post(
      `/aichat/conversations`,
      {
        action: IChatConversationAction.DELETE,
        id: id
      },
      {
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${options.token}`,
          'x-record-exempt': 'true'
        },
        baseURL: BASE_URL_API
      }
    );
  }

  async updateConversation(
    payload: IChatConversation,
    options: IChatConversationOptions
  ): Promise<AxiosResponse<IChatConversation>> {
    return await axios.post(
      `/aichat/conversations`,
      {
        action: IChatConversationAction.UPDATE,
        ...payload
      },
      {
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${options.token}`,
          'x-record-exempt': 'true'
        },
        baseURL: BASE_URL_API,
        signal: options.signal
      }
    );
  }
}

export const chatOperator = new ChatOperator();
