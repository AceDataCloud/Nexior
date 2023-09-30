export interface IError {
  code: string;
  detail?: string;
}

export enum ChatMessageState {
  PENDING = 'pending',
  ANSWERING = 'answering',
  FINISHED = 'finished',
  FAILED = 'failed'
}

export const ROLE_SYSTEM = 'system';
export const ROLE_ASSISTANT = 'assistant';
export const ROLE_USER = 'user';

export interface IChatMessage {
  state?: ChatMessageState;
  content: string;
  role?: typeof ROLE_SYSTEM | typeof ROLE_ASSISTANT | typeof ROLE_USER;
  error?: IError;
}

export const CHAT_MODEL_CHATGPT = 'chatgpt';
export const CHAT_MODEL_CHATGPT4 = 'chatgpt4';
export const CHAT_MODEL_CHATGPT_16K = 'chatgpt-16k';
export const CHAT_MODEL_CHATGPT_BROWSING = 'chatgpt-browsing';
export const CHAT_MODEL_CHATGPT4_BROWSING = 'chatgpt4-browsing';

export type IChatModel =
  | typeof CHAT_MODEL_CHATGPT
  | typeof CHAT_MODEL_CHATGPT4
  | typeof CHAT_MODEL_CHATGPT_16K
  | typeof CHAT_MODEL_CHATGPT_BROWSING
  | typeof CHAT_MODEL_CHATGPT4_BROWSING;

export interface IChatRequest {
  question: string;
  stateful?: boolean;
  conversation_id?: string;
}

export interface IChatResponse {
  answer: string;
  delta_answer: string;
  conversation_id?: string;
}

export interface IChatOptions {
  stream?: (response: IChatResponse) => void;
  token: string;
  endpoint?: string;
}
