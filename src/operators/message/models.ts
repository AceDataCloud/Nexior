import { IUser, IBot } from '../user';

export interface IContent {
  value: string;
  type?: string;
}

export interface IError {
  code: string;
  detail: string;
}

export interface IMessage {
  content: IContent;
  author: IUser | IBot;
  error?: IError;
}
