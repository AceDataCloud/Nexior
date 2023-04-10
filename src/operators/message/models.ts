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

export interface IMessage {
  state?: IMessageState;
  content: IContent;
  author: IUser | IBot;
  error?: IError;
}
