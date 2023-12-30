import { IApplication, IChatConversation } from '@/operators';
import { Status } from '../common/models';

export interface IChatState {
  applications: IApplication[] | undefined;
  getApplicationsStatus: Status | undefined;
  conversations: IChatConversation[] | undefined;
  getConversationsStatus: Status | undefined;
}
