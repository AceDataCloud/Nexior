import { IApplication, IChatConversation, IChatModel } from '@/operators';
import { Status } from '../common/models';

export interface IChatState {
  model: IChatModel;
  applications: IApplication[] | undefined;
  getApplicationsStatus: Status | undefined;
  conversations: IChatConversation[] | undefined;
  getConversationsStatus: Status | undefined;
}
