import {
  ROLE_ASSISTANT,
  ROLE_SYSTEM,
  ROLE_USER,
  CHAT_MODEL_NAME_GPT_3_5,
  CHAT_MODEL_NAME_GPT_3_5_BROWSING,
  CHAT_MODEL_NAME_GPT_4,
  CHAT_MODEL_NAME_GPT_4_BROWSING,
  CHAT_MODEL_NAME_GPT_4_VISION,
  CHAT_MODEL_NAME_GPT_4_ALL
} from '@/constants';

export type IChatModelName =
  | typeof CHAT_MODEL_NAME_GPT_3_5
  | typeof CHAT_MODEL_NAME_GPT_3_5_BROWSING
  | typeof CHAT_MODEL_NAME_GPT_4
  | typeof CHAT_MODEL_NAME_GPT_4_BROWSING
  | typeof CHAT_MODEL_NAME_GPT_4_VISION
  | typeof CHAT_MODEL_NAME_GPT_4_ALL;

export interface IChatModel {
  name: IChatModelName;
  getDisplayName: () => string;
  getDescription: () => string;
}

interface IError {
  code: string;
  message?: string;
}

export enum IChatMessageState {
  PENDING = 'pending',
  ANSWERING = 'answering',
  FINISHED = 'finished',
  FAILED = 'failed'
}

export interface IChatMessageContentItem {
  type: string;
  text?: string;
  image_url?: { url: string } | string;
  file_url?: { url: string } | string;
}

export interface IChatMessage {
  state?: IChatMessageState;
  content?: string | IChatMessageContentItem[];
  role?: typeof ROLE_SYSTEM | typeof ROLE_ASSISTANT | typeof ROLE_USER;
  error?: IError;
}

export interface IChatConversation {
  id?: string;
  messages?: IChatMessage[];
  title?: string;
  deleting?: boolean;
  editing?: boolean;
  new?: boolean;
  updated_at?: number;
}

export interface IChatConversationOptions {
  stream?: (response: IChatConversationResponse) => void;
  token: string;
  signal?: AbortController['signal'];
}

export interface IChatConversationRequest {
  id?: string;
  question?: string;
  references?: string[];
  stateful?: boolean;
  messages?: IChatMessage[];
  action?: IChatConversationAction;
  model: IChatModelName;
}

export interface IChatConversationResponse {
  answer: string;
  delta_answer: string;
  id?: string;
}

export interface IChatConversationsResponse {
  items: IChatConversation[];
  count: number;
}

export enum IChatConversationAction {
  CHAT = 'chat',
  RETRIEVE = 'retrieve',
  UPDATE = 'update',
  DELETE = 'delete',
  RETRIEVE_BATCH = 'retrieve_batch'
}
