import { IApplication, IChatConversation, IChatModel } from '@/models';

export interface IChatState {
  model: IChatModel;
  application: IApplication | undefined;
  conversations: IChatConversation[] | undefined;
}
