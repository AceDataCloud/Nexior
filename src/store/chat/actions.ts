import { applicationOperator, chatOperator, credentialOperator, serviceOperator } from '@/operators';
import { IRootState } from '../common/models';
import { ActionContext } from 'vuex';
import { IChatState } from './models';
import { IApplication, IChatConversation, IChatModel, IChatModelGroup, ICredential, IService, Status } from '@/models';
import { CHAT_SERVICE_ID } from '@/constants';

export const resetAll = ({ commit }: ActionContext<IChatState, IRootState>): void => {
  commit('resetAll');
};

export const setApplication = async ({ commit, dispatch }: any, payload: IApplication): Promise<void> => {
  commit('setApplication', payload);
  if (!payload) {
    return;
  }
  const credential = payload?.credentials?.find((credential) => credential?.host === window.location.origin);
  if (credential) {
    commit('setCredential', credential);
  } else {
    await dispatch('createCredential');
  }
};

export const setApplications = async ({ commit }: any, payload: IApplication[]): Promise<void> => {
  commit('setApplications', payload);
};

export const setService = async ({ commit }: any, payload: IService): Promise<void> => {
  commit('setService', payload);
};

export const setCredential = async ({ commit }: any, payload: ICredential): Promise<void> => {
  commit('setCredential', payload);
};

export const createCredential = async ({ commit, state }: any): Promise<ICredential | undefined> => {
  const application = state.application;
  if (!application) {
    console.error('Application not found');
    return undefined;
  }
  const { data: credential } = await credentialOperator.create({
    application_id: application?.id,
    host: window.location.origin
  });
  commit('setCredential', credential);
  return credential;
};

export const getService = async ({
  commit,
  state
}: ActionContext<IChatState, IRootState>): Promise<IService | undefined> => {
  state.status.getService = Status.Request;
  try {
    const { data: service } = await serviceOperator.get(CHAT_SERVICE_ID);
    state.status.getService = Status.Success;
    commit('setService', service);
    return service;
  } catch (error) {
    state.status.getService = Status.Error;
    commit('setService', undefined);
  }
};

export const getApplications = async ({
  commit,
  state,
  rootState
}: ActionContext<IChatState, IRootState>): Promise<IApplication[] | undefined> => {
  state.status.getApplications = Status.Request;
  try {
    const { data: applications } = await applicationOperator.getAll({
      user_id: rootState?.user?.id,
      service_id: CHAT_SERVICE_ID
    });
    state.status.getApplications = Status.Success;
    commit('setApplications', applications.items);
    return applications.items;
  } catch (error) {
    console.error('get applications failed for chat', error);
    state.status.getApplications = Status.Error;
    commit('setApplications', undefined);
    commit('setApplication', undefined);
  }
};

export const setModel = async ({ commit }: any, payload: IChatModel): Promise<void> => {
  commit('setModel', payload);
};

export const setModelGroup = async ({ commit }: any, payload: IChatModelGroup): Promise<void> => {
  commit('setModelGroup', payload);
};

export const setConversation = async ({ commit, state }: any, payload: IChatConversation): Promise<void> => {
  const conversations = state.conversations || [];
  const index = conversations?.findIndex((conversation: IChatConversation) => conversation.id === payload.id);
  if (index > -1) {
    conversations[index] = payload;
  } else {
    conversations?.unshift(payload);
  }
  commit('setConversations', conversations);
};

export const setConversations = async ({ commit }: any, payload: IChatConversation[]): Promise<void> => {
  commit('setConversations', payload);
};

export const getConversations = async ({
  commit,
  state,
  rootState
}: ActionContext<IChatState, IRootState>): Promise<IChatConversation[]> => {
  state.status.getConversations = Status.Request;
  const credential = state.credential;
  const token = credential?.token;
  const modelGroup = state.modelGroup?.name;
  // Without a token we can't authenticate; without a modelGroup we'd pull
  // every scenario at once (chatgpt + claude + kimi + …) which can be
  // hundreds of rows. Bail in both cases — the page reactively refetches
  // once the modelGroup is selected.
  if (!token || !modelGroup) {
    state.status.getConversations = Status.Error;
    commit('setConversations', []);
    return [];
  }
  try {
    const { data } = await chatOperator.getConversations(
      {
        userId: rootState.user?.id,
        modelGroup
      },
      {
        token
      }
    );
    state.status.getConversations = Status.Success;
    commit('setConversations', data.items);
    return data.items;
  } catch (error) {
    state.status.getConversations = Status.Error;
    commit('setConversations', []);
    return [];
  }
};

/**
 * Lazy-load full message history for a single conversation. Used when the
 * user clicks a row in the side panel — the panel itself only ever holds
 * summaries (no `messages` array). Result is also merged back into
 * `state.conversations` so subsequent reads are instant.
 */
export const getConversation = async (
  { commit, state }: ActionContext<IChatState, IRootState>,
  id: string
): Promise<IChatConversation | undefined> => {
  const token = state.credential?.token;
  if (!token || !id) return undefined;
  try {
    const { data } = await chatOperator.getConversation(id, { token });
    const list = state.conversations || [];
    const idx = list.findIndex((c) => c.id === id);
    const merged = idx > -1 ? { ...list[idx], ...data } : data;
    if (idx > -1) {
      const next = [...list];
      next[idx] = merged;
      commit('setConversations', next);
    }
    return merged;
  } catch (error) {
    console.error('getConversation failed', id, error);
    return undefined;
  }
};

export default {
  resetAll,
  createCredential,
  setModel,
  setModelGroup,
  getService,
  setService,
  setCredential,
  setApplication,
  setApplications,
  getApplications,
  setConversation,
  setConversations,
  getConversations,
  getConversation
};
