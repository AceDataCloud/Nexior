import {
  ROLE_ASSISTANT,
  ROLE_SYSTEM,
  ROLE_USER,
  CHAT_MODEL_NAME_GPT_4_ALL,
  CHAT_MODEL_NAME_GPT_4O,
  CHAT_MODEL_NAME_O1,
  CHAT_MODEL_NAME_O1_MINI,
  CHAT_MODEL_NAME_O3,
  CHAT_MODEL_NAME_O4_MINI,
  CHAT_MODEL_NAME_GPT_4O_IMAGE,
  CHAT_MODEL_NAME_GPT_4O_MINI,
  CHAT_MODEL_NAME_DEEPSEEK_CHAT,
  CHAT_MODEL_NAME_DEEPSEEK_REASONER,
  CHAT_MODEL_NAME_GROK_3,
  CHAT_MODEL_NAME_GROK_3_REASONER,
  CHAT_MODEL_NAME_GROK_3_DEEPSEARCH,
  CHAT_MODEL_NAME_GPT_5,
  CHAT_MODEL_NAME_GPT_5_MINI,
  CHAT_MODEL_NAME_GPT_5_ALL,
  CHAT_MODEL_NAME_GPT_4O_ALL,
  CHAT_MODEL_NAME_GROK_4
} from '@/constants';

export type IChatModelName =
  | typeof CHAT_MODEL_NAME_GPT_5
  | typeof CHAT_MODEL_NAME_GPT_5_ALL
  | typeof CHAT_MODEL_NAME_GPT_5_MINI
  | typeof CHAT_MODEL_NAME_GPT_4O_ALL
  | typeof CHAT_MODEL_NAME_GPT_4_ALL
  | typeof CHAT_MODEL_NAME_GPT_4O
  | typeof CHAT_MODEL_NAME_GPT_4O_MINI
  | typeof CHAT_MODEL_NAME_DEEPSEEK_CHAT
  | typeof CHAT_MODEL_NAME_DEEPSEEK_REASONER
  | typeof CHAT_MODEL_NAME_GROK_4
  | typeof CHAT_MODEL_NAME_GROK_3
  | typeof CHAT_MODEL_NAME_GROK_3_REASONER
  | typeof CHAT_MODEL_NAME_GROK_3_DEEPSEARCH
  | typeof CHAT_MODEL_NAME_O1
  | typeof CHAT_MODEL_NAME_O1_MINI
  | typeof CHAT_MODEL_NAME_O3
  | typeof CHAT_MODEL_NAME_O4_MINI
  | typeof CHAT_MODEL_NAME_GPT_4O_IMAGE
  | typeof CHAT_MODEL_NAME_O3;

export interface IChatModel {
  enabled?: boolean;
  name: IChatModelName;
  icon: string;
  modelGroup?: 'chatgpt' | 'deepseek' | 'grok';
  getDisplayName: () => string;
  getDescription: () => string;
  isSearchSupported?: boolean;
  isImageSupported?: boolean;
  isFileSupported?: boolean;
  isReasoningSupported?: boolean;
  isDeepSearchSupported?: boolean;
}

export interface IChatModelGroup {
  name: 'chatgpt' | 'deepseek' | 'grok';
  icon: string;
  getDisplayName: () => string;
  getDescription: () => string;
  models: IChatModel[];
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
  model?: string;
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
