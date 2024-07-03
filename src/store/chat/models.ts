import { IApplication, IChatConversation, IChatModel, ICredential, IService, Status } from '@/models';

export interface IChatState {
  model: IChatModel;
  application: IApplication | undefined;
  service: IService | undefined;
  conversations: IChatConversation[] | undefined;
  credential: ICredential | undefined;
  status: {
    getService: Status;
    getApplication: Status;
    getConversations: Status;
  };
}
