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
    return new Promise((resolve, reject) => {
      let finalAnswer = '';
      let id: string | undefined = undefined;
      fetch(`${BASE_URL_API}/aichat/conversations`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${options.token}`,
          'Content-Type': 'application/json',
          Accept: 'text/event-stream'
        },
        signal: options.signal,
        body: JSON.stringify(data)
      })
        .then((response) => {
          if (!response?.body) {
            throw new Error('ReadableStream not yet supported in this browser.');
          }
          const reader = response?.body?.getReader();
          const decoder = new TextDecoder();

          return new ReadableStream({
            start(controller) {
              const push = () => {
                reader.read().then(({ done, value }) => {
                  if (done) {
                    controller.close();
                    return;
                  }
                  controller.enqueue(decoder.decode(value, { stream: true }));
                  push();
                });
              };
              push();
            }
          });
        })
        .then((stream) => {
          const linesStream = stream.pipeThrough(
            new TransformStream({
              transform(chunk, controller) {
                chunk.split('\n').forEach((line: string) => {
                  if (line.trim()) {
                    controller.enqueue(line);
                  }
                });
              }
            })
          );

          const reader = linesStream.getReader();
          let accumulatedData = '';
          let updateTimeout: number | null = null;

          reader.read().then(function processText({ done, value }) {
            if (done) {
              console.log('Stream complete');
              if (options?.stream) {
                options?.stream({
                  answer: finalAnswer,
                  delta_answer: '',
                  id
                });
              }
              resolve({
                answer: finalAnswer as string,
                delta_answer: ''
              });
              return;
            }

            if (value.startsWith('data: ')) {
              const subValue = value.substring(6);
              if (subValue === '[DONE]') {
                console.log('finalAnswer', finalAnswer);
                console.log('Stream complete');
                if (options?.stream) {
                  options?.stream({
                    answer: finalAnswer,
                    delta_answer: '',
                    id
                  });
                }
                resolve({
                  answer: finalAnswer as string,
                  delta_answer: ''
                });
              } else {
                const json = JSON.parse(subValue);
                if (json.delta_answer) {
                  finalAnswer += json.delta_answer;
                }
                if (json.id) {
                  id = json.id;
                }

                accumulatedData += json.delta_answer || '';

                if (!updateTimeout) {
                  updateTimeout = window.setTimeout(() => {
                    if (options?.stream) {
                      options?.stream({
                        answer: finalAnswer,
                        delta_answer: accumulatedData,
                        id
                      });
                    }
                    accumulatedData = '';
                    updateTimeout = null;
                  }, 0);
                }
              }
            }

            reader.read().then(processText);
          });
        })
        .catch((error) => {
          console.error('Error:', error);
          reject(error);
        });
    });
  }

  async getConversation(
    id: string | undefined,
    options: IChatConversationOptions
  ): Promise<AxiosResponse<IChatConversation>> {
    return await axios.post(
      `/aichat/conversations`,
      {
        action: IChatConversationAction.RETRIEVE,
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
