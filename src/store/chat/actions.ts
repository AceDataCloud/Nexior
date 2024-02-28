import {
  CHAT_SERVICE_ID,
  IApplication,
  IChatConversation,
  IChatModel,
  applicationOperator,
  chatOperator
} from '@/operators';
import { IRootState } from '../common/models';
import { ActionContext } from 'vuex';
import { log } from '@/utils/log';
import { IChatState } from './models';

export const resetAll = ({ commit }: ActionContext<IChatState, IRootState>): void => {
  commit('resetAll');
};

export const setModel = async ({ commit }: any, payload: IChatModel): Promise<void> => {
  commit('setModel', payload);
};

export const setApplication = async ({ commit }: any, payload: IApplication): Promise<void> => {
  commit('setApplication', payload);
};

export const setConversations = async ({ commit }: any, payload: IChatConversation[]): Promise<void> => {
  log(setConversations, 'set conversations', payload);
  commit('setConversations', payload);
};

export const setConversation = async ({ commit, state }: any, payload: IChatConversation): Promise<void> => {
  log(setConversation, 'set conversation', payload);
  const conversations = state.conversations;
  const index = conversations.findIndex((conversation: IChatConversation) => conversation.id === payload.id);
  if (index > -1) {
    conversations[index] = payload;
  } else {
    conversations.unshift(payload);
  }
  commit('setConversations', conversations);
  log(setConversation, 'set conversation success', conversations);
};

export const getApplication = async ({
  commit,
  rootState
}: ActionContext<IChatState, IRootState>): Promise<IApplication> => {
  log(getApplication, 'start to get application for chat');
  const { data: applications } = await applicationOperator.getAll({
    user_id: rootState.user.id,
    service_id: CHAT_SERVICE_ID
  });
  log(getApplication, 'get application for chat success', applications);
  commit('setApplication', applications?.items?.[0]);
  return applications?.items?.[0];
};

export const getConversations = async ({
  commit,
  state,
  rootState
}: ActionContext<IChatState, IRootState>): Promise<IChatConversation[]> => {
  log(getConversations, 'start to get conversations');
  const { data: conversations } = await chatOperator.getConversations({
    applicationId: state.application?.id
  });
  log(getConversations, 'get conversations success', conversations);
  commit('setConversations', conversations);
  return conversations;
};

export default {
  resetAll,
  setModel,
  setApplication,
  getApplication,
  setConversation,
  setConversations,
  getConversations
};
