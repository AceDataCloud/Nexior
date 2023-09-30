import { IUser, IBot } from '../user';

export interface IContent {
  value: string;
  type?: string;
}

export interface IError {
  code: string;
  detail?: string;
}

export enum IMessageState {
  PENDING = 'pending',
  ANSWERING = 'answering',
  FINISHED = 'finished',
  FAILED = 'failed'
}

export const ROLE_SYSTEM = 'system';
export const ROLE_ASSISTANT = 'assistant';
export const ROLE_USER = 'user';

export interface IMessage {
  state?: IMessageState;
  content: string;
  author?: IUser | IBot;
  role?: typeof ROLE_SYSTEM | typeof ROLE_ASSISTANT | typeof ROLE_USER;
  error?: IError;
}
