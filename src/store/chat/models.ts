import { IApplication, IChatConversation, IChatModel } from '@/operators';

export interface IChatState {
  model: IChatModel;
  application: IApplication | undefined;
  conversations: IChatConversation[] | undefined;
}
