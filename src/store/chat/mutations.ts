import { IApplication, IChatConversation, IChatModel } from '@/operators';
import { IChatState } from './models';
import { Status } from '../common/models';

export const setModel = (state: IChatState, payload: IChatModel): void => {
  state.model = payload;
};

export const setApplications = (state: IChatState, payload: IApplication[]): void => {
  state.applications = payload;
};

export const setGetApplicationsStatus = (state: IChatState, payload: Status): void => {
  state.getApplicationsStatus = payload;
};

export const setConversations = (state: IChatState, payload: IChatConversation[]): void => {
  state.conversations = payload;
};

export const setGetConversationsStatus = (state: IChatState, payload: Status): void => {
  state.getConversationsStatus = payload;
};

export default {
  setModel,
  setApplications,
  setGetApplicationsStatus,
  setConversations,
  setGetConversationsStatus
};
