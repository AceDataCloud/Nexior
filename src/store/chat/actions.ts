import {
  CHAT_MODEL_CHATGPT,
  CHAT_MODEL_CHATGPT4,
  CHAT_MODEL_CHATGPT4_BROWSING,
  CHAT_MODEL_CHATGPT_16K,
  CHAT_MODEL_CHATGPT_BROWSING,
  IApplication,
  IChatConversation,
  apiUsageOperator,
  applicationOperator,
  chatOperator
} from '@/operators';
import { IRootState, Status } from '../common/models';
import { ActionContext } from 'vuex';
import { log } from '@/utils/log';
import { IChatState } from './models';

export const setApplications = async ({ commit }: any, payload: IApplication[]): Promise<void> => {
  commit('setApplications', payload);
};

export const getApplications = async ({
  commit,
  rootState
}: ActionContext<IChatState, IRootState>): Promise<IApplication[]> => {
  log(getApplications, 'start to get application for chat');
  commit('getApplicationsStatus', Status.Request);
  const { data: applications } = await applicationOperator.getAll({
    user_id: rootState.user.id,
    api_id: [
      CHAT_MODEL_CHATGPT.apiId,
      CHAT_MODEL_CHATGPT_16K.apiId,
      CHAT_MODEL_CHATGPT_BROWSING.apiId,
      CHAT_MODEL_CHATGPT4.apiId,
      CHAT_MODEL_CHATGPT4_BROWSING.apiId
    ]
  });
  log(getApplications, 'get application for chat success', applications);
  commit('getApplicationsStatus', Status.Success);
  commit('setApplications', applications?.items);
  return applications.items;
};

export const getConversations = async ({
  commit,
  state,
  rootState
}: ActionContext<IChatState, IRootState>): Promise<IChatConversation[]> => {
  log(getConversations, 'start to get conversations');
  commit('setGetConversationStatus', Status.Success);
  const {
    data: { items: apiUsages }
  } = await apiUsageOperator.getAll({
    user_id: rootState.user.id,
    // @ts-ignore
    application_id: state.applications?.map((application) => application.id),
    offset: 0,
    limit: 30,
    ordering: '-created_at'
  });
  log(getConversations, 'get api usages success', apiUsages);
  commit('setGetConversationStatus', Status.Success);
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
  setApplications,
  getApplications,
  getConversations
};
