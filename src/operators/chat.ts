import axios, { AxiosResponse } from 'axios';
import {
  ApiError,
  BaseError,
  IChatConversation,
  IChatConversationAction,
  IChatConversationOptions,
  IChatConversationRequest,
  IChatConversationResponse,
  IChatConversationsResponse
} from '@/models';
import { BASE_URL_API, ERROR_CODE_API_ERROR } from '@/constants';

class ChatOperator {
  async chatConversation(
    data: IChatConversationRequest,
    options: IChatConversationOptions
  ): Promise<IChatConversationResponse> {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(`${BASE_URL_API}/aichat2/conversations`, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${options.token}`,
            'Content-Type': 'application/json',
            Accept: 'text/event-stream'
          },
          signal: options.signal,
          body: JSON.stringify(data)
        });

        // check response status
        if (!response.ok) {
          const errorText = await response.text();
          const status = response.status;
          const errorJson = errorText ? JSON.parse(errorText) : {};
          const errorMessage = errorJson?.error?.message || 'An error occurred';
          const errorCode = errorJson?.error?.code || ERROR_CODE_API_ERROR;
          console.error('Error message:', errorMessage, 'Error code:', errorCode);
          reject(new BaseError(status, errorCode, errorMessage));
          return;
        }

        if (!response.body) throw new ApiError('ReadableStream not supported.');

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
                    id,
                    // Forward aichat2 event types for tool-calling UI
                    type: json.type,
                    tool_id: json.tool_id,
                    tool_name: json.tool_name,
                    tool_display_name: json.tool_display_name,
                    input: json.input,
                    output: json.output,
                    is_error: json.is_error,
                    duration_ms: json.duration_ms,
                    content: json.content,
                    artifact: json.artifact
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
      `/aichat2/conversations`,
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
      `/aichat2/conversations`,
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
      `/aichat2/conversations`,
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
