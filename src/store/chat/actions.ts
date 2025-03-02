import { applicationOperator, chatOperator, credentialOperator, serviceOperator } from '@/operators';
import { IRootState } from '../common/models';
import { ActionContext } from 'vuex';
import { IChatState } from './models';
import { IApplication, IChatConversation, IChatModel, IChatModelGroup, ICredential, IService, Status } from '@/models';
import { CHAT_SERVICE_ID } from '@/constants';
import { getFinalApplication } from '@/utils';

export const resetAll = ({ commit }: ActionContext<IChatState, IRootState>): void => {
  commit('resetAll');
};

export const setApplication = async ({ commit, dispatch }: any, payload: IApplication): Promise<void> => {
  console.debug('set application', payload);
  commit('setApplication', payload);
  if (!payload) {
    console.debug('application is null, return');
    return;
  }
  const credential = payload?.credentials?.find((credential) => credential?.host === window.location.origin);
  if (credential) {
    console.debug('credential exists, set credential', credential);
    commit('setCredential', credential);
  } else {
    console.debug('credential not exists, start to create credential for application', payload);
    await dispatch('createCredential');
  }
};

export const setApplications = async ({ commit }: any, payload: IApplication[]): Promise<void> => {
  console.debug('set applications', payload);
  commit('setApplications', payload);
};

export const setService = async ({ commit }: any, payload: IService): Promise<void> => {
  console.debug('set service', payload);
  commit('setService', payload);
};

export const setCredential = async ({ commit }: any, payload: ICredential): Promise<void> => {
  console.debug('set credential', payload);
  commit('setCredential', payload);
};

export const createCredential = async ({ commit, state }: any): Promise<ICredential | undefined> => {
  const application = state.application;
  console.debug('prepare to create credential for application', application);
  if (!application) {
    console.error('Application not found');
    return undefined;
  }
  console.debug('creating create credential for application', application);
  const { data: credential } = await credentialOperator.create({
    application_id: application?.id,
    host: window.location.origin
  });
  console.debug('created credential success', credential);
  commit('setCredential', credential);
  console.debug('end createCredential');
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
  console.debug('start to get applications for chat');
  state.status.getApplications = Status.Request;
  const currentApplication = state.application;
  console.debug('current application', currentApplication);
  try {
    const { data: applications } = await applicationOperator.getAll({
      user_id: rootState?.user?.id,
      service_id: CHAT_SERVICE_ID
    });
    state.status.getApplications = Status.Success;
    commit('setApplications', applications.items);
    const finalApplication = getFinalApplication(applications.items, currentApplication);
    if (finalApplication) {
      console.debug('set final application', finalApplication, finalApplication?.type);
      commit('setApplication', finalApplication);
    } else {
      console.debug('set application undefined', undefined);
      commit('setApplication', undefined);
    }
    return applications.items;
  } catch (error) {
    console.error('get applications failed', error);
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
  console.debug('set conversation', payload);
  const conversations = state.conversations || [];
  const index = conversations?.findIndex((conversation: IChatConversation) => conversation.id === payload.id);
  if (index > -1) {
    conversations[index] = payload;
  } else {
    conversations?.unshift(payload);
  }
  commit('setConversations', conversations);
  console.debug('set conversation success', conversations);
};

export const setConversations = async ({ commit }: any, payload: IChatConversation[]): Promise<void> => {
  console.debug('set conversations', payload);
  commit('setConversations', payload);
};

export const getConversations = async ({
  commit,
  state,
  rootState
}: ActionContext<IChatState, IRootState>): Promise<IChatConversation[]> => {
  state.status.getConversations = Status.Request;
  const credential = state.credential;
  console.debug('credential', credential);
  const token = credential?.token;
  if (!token) {
    state.status.getConversations = Status.Error;
    return [];
  }
  try {
    const { data } = await chatOperator.getConversations(
      {
        userId: rootState.user?.id
      },
      {
        token
      }
    );
    console.debug('get conversations success', data?.items?.length);
    commit('setConversations', data.items);
    return data.items;
  } catch (error) {
    state.status.getConversations = Status.Error;
    commit('setConversations', []);
    return [];
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
  getConversations
};
