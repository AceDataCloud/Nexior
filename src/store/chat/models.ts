import { IApplication, IChatConversation, IChatModel, IService, Status } from '@/models';

export interface IChatState {
  model: IChatModel;
  application: IApplication | undefined;
  service: IService | undefined;
  conversations: IChatConversation[] | undefined;
  status: {
    getService: Status;
    getApplication: Status;
    getConversations: Status;
  };
}
