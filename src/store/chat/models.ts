import { IApplication, IChatConversation, IChatModel, IChatModelGroup, ICredential, IService, Status } from '@/models';

export interface IChatState {
  model: IChatModel;
  modelGroup: IChatModelGroup;
  applications: IApplication[] | undefined;
  application: IApplication | undefined;
  service: IService | undefined;
  conversations: IChatConversation[] | undefined;
  credential: ICredential | undefined;
  status: {
    getService: Status;
    getApplications: Status;
    getConversations: Status;
  };
}
