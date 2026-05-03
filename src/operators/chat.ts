import axios, { AxiosResponse } from 'axios';
import {
  ApiError,
  BaseError,
  IChatConversation,
  IChatConversationAction,
  IChatConversationOptions,
  IChatConversationRequest,
  IChatConversationResponse,
  IChatConversationResponseV2,
  IChatConversationsResponse,
  IChatSSEEvent,
  IChatToolCall
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
                if (json.type === 'error') {
                  const errorMessage =
                    typeof json.message === 'string' && json.message.trim() ? json.message.trim() : 'An error occurred';
                  await reader.cancel().catch(() => undefined);
                  reject(new BaseError(500, ERROR_CODE_API_ERROR, errorMessage));
                  return;
                }
                if (options?.stream) {
                  options.stream({
                    answer: finalAnswer,
                    delta_answer: json.delta_answer || '',
                    id,
                    // Forward aichat2 event types for tool-calling UI
                    type: json.type,
                    message: json.message,
                    tool_id: json.tool_id,
                    tool_name: json.tool_name,
                    tool_display_name: json.tool_display_name,
                    input: json.input,
                    output: json.output,
                    is_error: json.is_error,
                    duration_ms: json.duration_ms,
                    content: json.content,
                    artifact: json.artifact,
                    card: json.card
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
      /**
       * Provider bucket to scope the side-panel list (`chatgpt`, `claude`,
       * `gemini`, `grok`, `kimi`, `glm`, `deepseek`). Strongly recommended
       * — without it the worker returns every conversation across every
       * scenario, which can be hundreds of rows.
       */
      modelGroup?: string;
      /** Filter by exact model name (rarely needed; modelGroup is usually enough). */
      model?: string;
      offset?: number;
      limit?: number;
    },
    options: IChatConversationOptions
  ): Promise<AxiosResponse<IChatConversationsResponse>> {
    return await axios.post(
      `/aichat2/conversations`,
      {
        action: IChatConversationAction.RETRIEVE_BATCH,
        ...(filter.ids ? { ids: filter.ids } : {}),
        ...(filter.applicationId ? { application_id: filter.applicationId } : {}),
        ...(filter.userId ? { user_id: filter.userId } : {}),
        ...(filter.modelGroup ? { model_group: filter.modelGroup } : {}),
        ...(filter.model ? { model: filter.model } : {}),
        ...(filter.offset !== undefined ? { offset: filter.offset } : {}),
        ...(filter.limit !== undefined ? { limit: filter.limit } : {})
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

  /**
   * Lazy-load full message history for a single conversation.
   * Side panel deliberately fetches summaries only (no `messages`); call
   * this when the user clicks a row to actually open it.
   */
  async getConversation(id: string, options: IChatConversationOptions): Promise<AxiosResponse<IChatConversation>> {
    return await axios.post(
      `/aichat2/conversations`,
      {
        action: IChatConversationAction.RETRIEVE,
        id
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

  /**
   * aichat2 orchestrator — handles tool calling SSE events.
   * Falls back to aichat format if the response uses legacy format.
   */
  async chatConversationV2(
    data: IChatConversationRequest,
    options: IChatConversationOptions & {
      onToolCall?: (toolCall: IChatToolCall) => void;
      onThinking?: (content: string) => void;
      onEvent?: (event: IChatSSEEvent) => void;
    }
  ): Promise<IChatConversationResponseV2> {
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

        if (!response.ok) {
          const errorText = await response.text();
          const status = response.status;
          const errorJson = errorText ? JSON.parse(errorText) : {};
          const errorMessage = errorJson?.error?.message || errorJson?.message || 'An error occurred';
          const errorCode = errorJson?.error?.code || errorJson?.code || ERROR_CODE_API_ERROR;
          reject(new BaseError(status, errorCode, errorMessage));
          return;
        }

        if (!response.body) throw new ApiError('ReadableStream not supported.');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let finalAnswer = '';
        let conversationId: string | undefined;
        let thinkingContent = '';
        const toolCalls = new Map<string, IChatToolCall>();
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
                resolve({
                  answer: finalAnswer,
                  delta_answer: '',
                  id: conversationId,
                  toolCalls: Array.from(toolCalls.values()),
                  thinking: thinkingContent
                });
                return;
              }

              try {
                const event: IChatSSEEvent = JSON.parse(subValue);

                // Legacy aichat format compatibility
                if ('delta_answer' in (event as unknown as Record<string, unknown>)) {
                  const legacy = event as unknown as { delta_answer?: string; id?: string };
                  if (legacy.delta_answer) {
                    finalAnswer += legacy.delta_answer;
                  }
                  if (legacy.id) conversationId = legacy.id;
                  if (options?.stream) {
                    options.stream({
                      answer: finalAnswer,
                      delta_answer: legacy.delta_answer || '',
                      id: conversationId
                    });
                  }
                  continue;
                }

                // aichat2 event format
                options.onEvent?.(event);

                if (event.type === 'text_delta') {
                  finalAnswer += event.content || '';
                  if (event.id) conversationId = event.id;
                  if (options?.stream) {
                    options.stream({
                      answer: finalAnswer,
                      delta_answer: event.content || '',
                      id: conversationId
                    });
                  }
                } else if (event.type === 'thinking') {
                  thinkingContent += event.content || '';
                  options.onThinking?.(thinkingContent);
                } else if (event.type === 'tool_use_start') {
                  const tc: IChatToolCall = {
                    id: event.tool_id!,
                    name: event.tool_name!,
                    displayName: event.tool_display_name,
                    input: event.input || {},
                    state: 'running'
                  };
                  toolCalls.set(tc.id, tc);
                  options.onToolCall?.(tc);
                } else if (event.type === 'tool_result') {
                  const existing = toolCalls.get(event.tool_id!);
                  if (existing) {
                    existing.output = event.output;
                    existing.state = event.is_error ? 'failed' : 'completed';
                    existing.durationMs = event.duration_ms;
                    options.onToolCall?.(existing);
                  }
                } else if (event.type === 'done') {
                  conversationId = event.conversation_id;
                } else if (event.type === 'error') {
                  reject(new ApiError(event.message || 'Unknown error'));
                  return;
                }
              } catch (err) {
                console.error('JSON parse error:', err);
              }
            }
          }
        }

        resolve({
          answer: finalAnswer,
          delta_answer: '',
          id: conversationId,
          toolCalls: Array.from(toolCalls.values()),
          thinking: thinkingContent
        });
      } catch (error) {
        console.error('Error:', error);
        reject(error);
      }
    });
  }
}

export const chatOperator = new ChatOperator();
