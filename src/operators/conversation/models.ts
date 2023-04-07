import { IMessage } from '../message/models';

export interface IConversation {
  messages: IMessage[];
  title: string;
  id: string;
}
