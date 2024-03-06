import { IApplication, IChatConversation, IChatModel, IService } from '@/models';
import { IChatState } from './models';

export const resetAll = (state: IChatState): void => {
  state.application = undefined;
  state.conversations = undefined;
};

export const setModel = (state: IChatState, payload: IChatModel): void => {
  state.model = payload;
};

export const setApplication = (state: IChatState, payload: IApplication): void => {
  state.application = payload;
};

export const setService = (state: IChatState, payload: IService): void => {
  state.service = payload;
};

export const setConversations = (state: IChatState, payload: IChatConversation[]): void => {
  state.conversations = payload;
};

export default {
  setModel,
  setService,
  setConversations,
  setApplication,
  resetAll
};
