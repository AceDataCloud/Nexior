import { IApplication, IChatConversation, IChatModel, IChatModelGroup, ICredential, IService } from '@/models';
import initialState from './state';
import { IChatState } from './models';

export const resetAll = (state: IChatState): void => {
  Object.assign(state, initialState());
};

export const setModel = (state: IChatState, payload: IChatModel): void => {
  state.model = payload;
};

export const setModelGroup = (state: IChatState, payload: IChatModelGroup): void => {
  state.modelGroup = payload;
};

export const setCredential = (state: IChatState, payload: ICredential): void => {
  state.credential = payload;
};

export const setApplication = (state: IChatState, payload: IApplication): void => {
  state.application = payload;
};

export const setApplications = (state: IChatState, payload: IApplication[]): void => {
  state.applications = payload;
};

export const setService = (state: IChatState, payload: IService): void => {
  state.service = payload;
};

export const setConversations = (state: IChatState, payload: IChatConversation[]): void => {
  state.conversations = payload;
};

export default {
  setModel,
  setModelGroup,
  setService,
  setCredential,
  setConversations,
  setApplication,
  setApplications,
  resetAll
};
