import {
  CHAT_MODEL_NAME_CHATGPT,
  CHAT_MODEL_NAME_CHATGPT4,
  CHAT_MODEL_NAME_CHATGPT4_BROWSING,
  CHAT_MODEL_NAME_CHATGPT_16K,
  CHAT_MODEL_NAME_CHATGPT_BROWSING,
  ROLE_ASSISTANT,
  ROLE_SYSTEM,
  ROLE_USER
} from './constants';

export type IChatModelName =
  | typeof CHAT_MODEL_NAME_CHATGPT
  | typeof CHAT_MODEL_NAME_CHATGPT4
  | typeof CHAT_MODEL_NAME_CHATGPT_16K
  | typeof CHAT_MODEL_NAME_CHATGPT_BROWSING
  | typeof CHAT_MODEL_NAME_CHATGPT4_BROWSING;

export interface IChatModel {
  apiId: string;
  name: IChatModelName;
  displayName: string;
}

export interface IError {
  code: string;
  detail?: string;
}

export enum IChatMessageState {
  PENDING = 'pending',
  ANSWERING = 'answering',
  FINISHED = 'finished',
  FAILED = 'failed'
}

export interface IChatMessage {
  state?: IChatMessageState;
  content: string;
  role?: typeof ROLE_SYSTEM | typeof ROLE_ASSISTANT | typeof ROLE_USER;
  error?: IError;
}

export interface IChatOptions {
  stream?: (response: IChatResponse) => void;
  token: string;
  endpoint?: string;
}

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
