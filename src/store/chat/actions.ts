import {
  CHAT_MODEL_CHATGPT,
  CHAT_MODEL_CHATGPT4,
  CHAT_MODEL_CHATGPT4_BROWSING,
  CHAT_MODEL_CHATGPT4_VISION,
  CHAT_MODEL_CHATGPT_16K,
  CHAT_MODEL_CHATGPT_BROWSING,
  IApplication,
  IChatConversation,
  IChatModel,
  apiUsageOperator,
  applicationOperator,
  chatOperator
} from '@/operators';
import { IRootState, Status } from '../common/models';
import { ActionContext } from 'vuex';
import { log } from '@/utils/log';
import { IChatState } from './models';

export const resetAll = ({ commit }: ActionContext<IChatState, IRootState>): void => {
  commit('resetAll');
};

export const setModel = async ({ commit }: any, payload: IChatModel): Promise<void> => {
  commit('setModel', payload);
};

export const setApplications = async ({ commit }: any, payload: IApplication[]): Promise<void> => {
  commit('setApplications', payload);
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

export const getApplications = async ({
  commit,
  rootState
}: ActionContext<IChatState, IRootState>): Promise<IApplication[]> => {
  log(getApplications, 'start to get application for chat');
  commit('setGetApplicationsStatus', Status.Request);
  const { data: applications } = await applicationOperator.getAll({
    user_id: rootState.user.id,
    api_id: [
      CHAT_MODEL_CHATGPT.apiId,
      CHAT_MODEL_CHATGPT_16K.apiId,
      CHAT_MODEL_CHATGPT_BROWSING.apiId,
      CHAT_MODEL_CHATGPT4.apiId,
      CHAT_MODEL_CHATGPT4_BROWSING.apiId,
      CHAT_MODEL_CHATGPT4_VISION.apiId
    ]
  });
  log(getApplications, 'get application for chat success', applications);
  commit('setGetApplicationsStatus', Status.Success);
  commit('setApplications', applications?.items);
  return applications.items;
};

export const getConversations = async ({
  commit,
  state,
  rootState
}: ActionContext<IChatState, IRootState>): Promise<IChatConversation[]> => {
  log(getConversations, 'start to get conversations');
  commit('setGetConversationsStatus', Status.Success);
  const {
    data: { items: apiUsages }
  } = await apiUsageOperator.getAll({
    user_id: rootState.user.id,
    // @ts-ignore
    application_id: state.applications?.map((application) => application.id),
    offset: 0,
    limit: 50,
    ordering: '-created_at'
  });
  log(getConversations, 'get api usages success', apiUsages);
  commit('setGetConversationsStatus', Status.Success);
  // de duplicate conversations using id
  const conversationIds: string[] = apiUsages.map((apiUsage) => apiUsage.metadata?.conversation_id).filter((id) => id);
  const uniqueConversationIds = [...new Set(conversationIds)];
  log(getConversations, 'get unique conversation ids', uniqueConversationIds);
  const conversations = (await chatOperator.getConversations(uniqueConversationIds)).data;
  log(getConversations, 'get conversations success', conversations);
  commit('setConversations', conversations);
  return conversations;
};

export default {
  resetAll,
  setModel,
  setApplications,
  setConversation,
  setConversations,
  getApplications,
  getConversations
};
