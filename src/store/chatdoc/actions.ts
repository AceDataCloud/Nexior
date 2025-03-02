import { IRootState } from '../common/models';
import { ActionContext } from 'vuex';
import { IChatdocState } from './models';
import {
  IApplication,
  IChatdocConversation,
  IChatdocDocument,
  IChatdocMessage,
  IChatdocRepository,
  ICredential,
  IService,
  Status
} from '@/models';
import { chatdocOperator, applicationOperator, serviceOperator, credentialOperator } from '@/operators';
import { CHATDOC_SERVICE_ID } from '@/constants';
import { getFinalApplication } from '@/utils';

export const resetAll = ({ commit }: ActionContext<IChatdocState, IRootState>): void => {
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
}: ActionContext<IChatdocState, IRootState>): Promise<IService | undefined> => {
  state.status.getService = Status.Request;
  try {
    const { data: service } = await serviceOperator.get(CHATDOC_SERVICE_ID);
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
}: ActionContext<IChatdocState, IRootState>): Promise<IApplication[] | undefined> => {
  console.debug('start to get applications for chat');
  state.status.getApplications = Status.Request;
  const currentApplication = state.application;
  console.debug('current application', currentApplication);
  try {
    const { data: applications } = await applicationOperator.getAll({
      user_id: rootState?.user?.id,
      service_id: CHATDOC_SERVICE_ID
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

export const getRepositories = async ({
  commit,
  state
}: ActionContext<IChatdocState, IRootState>): Promise<IChatdocRepository[]> => {
  console.debug('start to get repositories');
  const credential = state.credential;
  console.log('credential', credential);
  const token = credential?.token;
  if (!token) {
    commit('setRepositories', undefined);
    return Promise.reject('no token');
  }
  const repositories = (
    await chatdocOperator.getAllRepositories({
      token
    })
  ).data.items;
  console.debug('get repositories success', repositories);
  commit('setRepositories', repositories);
  return repositories;
};

export const deleteRepository = async (
  { state }: ActionContext<IChatdocState, IRootState>,
  payload: {
    id: string;
  }
): Promise<IChatdocRepository> => {
  console.debug('start to delete repository');
  const credential = state.credential;
  console.log('credential', credential);
  const token = credential?.token;
  if (!token) {
    return Promise.reject('no token');
  }
  const repository = (
    await chatdocOperator.deleteRepository(payload.id, {
      token
    })
  ).data;
  console.debug('delete repository success', repository);
  return repository;
};

export const deleteDocument = async (
  { state }: ActionContext<IChatdocState, IRootState>,
  payload: {
    id: string;
  }
): Promise<IChatdocDocument> => {
  console.debug('start to delete document');
  const credential = state.credential;
  console.log('credential', credential);
  const token = credential?.token;
  if (!token) {
    return Promise.reject('no token');
  }
  const document = (
    await chatdocOperator.deleteDocument(payload.id, {
      token
    })
  ).data;
  console.debug('delete document success', document);
  return document;
};

export const createRepository = async (
  { state }: ActionContext<IChatdocState, IRootState>,
  payload: {
    name: string;
    description?: string;
  }
): Promise<IChatdocRepository> => {
  console.debug('start to create repository');
  const credential = state.credential;
  console.log('credential', credential);
  const token = credential?.token;
  if (!token) {
    return Promise.reject('no token');
  }
  const repository = (
    await chatdocOperator.createRepository(payload, {
      token
    })
  ).data;
  console.debug('create repository success', repository);
  return repository;
};

export const createDocument = async (
  { state }: ActionContext<IChatdocState, IRootState>,
  payload: {
    repositoryId: string;
    fileUrl: string;
    fileName: string;
  }
): Promise<IChatdocDocument> => {
  console.debug('start to create document');
  const credential = state.credential;
  console.log('credential', credential);
  const token = credential?.token;
  if (!token) {
    return Promise.reject('no token');
  }
  const document = (
    await chatdocOperator.createDocument(payload, {
      token
    })
  ).data;
  console.debug('create document success', document);
  return document;
};

export const setConversation = async (
  { commit, state }: any,
  payload: {
    id: string;
    messages: IChatdocMessage[];
    repositoryId: string;
  }
): Promise<void> => {
  console.debug('set conversation', payload);
  const repository: IChatdocRepository | undefined = state.repositories.find(
    (repository: IChatdocRepository) => repository.id === payload.repositoryId
  );
  const conversations = repository?.conversations;
  if (!conversations) {
    return Promise.reject('no conversations');
  }
  const index = conversations?.findIndex((conversation: IChatdocConversation) => conversation.id === payload.id);
  if (index > -1) {
    conversations[index].messages = payload.messages;
  }
  console.debug('set conversation success', conversations);
};

export const getDocuments = async (
  { commit, state }: ActionContext<IChatdocState, IRootState>,
  payload: { repositoryId: string }
): Promise<IChatdocDocument[]> => {
  console.debug('start to get documents');
  const credential = state.credential;
  console.log('credential for getDocuments', credential);
  const token = credential?.token;
  if (!token) {
    commit('setRepository', {
      id: payload.repositoryId,
      documents: []
    });
    return [];
  }
  const documents = (
    await chatdocOperator.getAllDocuments(payload.repositoryId, {
      token
    })
  ).data.items;
  console.debug('get documents success', documents);
  commit('setRepository', {
    id: payload.repositoryId,
    documents: documents
  });
  return documents;
};

export const getConversations = async (
  { commit, state }: ActionContext<IChatdocState, IRootState>,
  payload: { repositoryId: string }
): Promise<IChatdocConversation[]> => {
  console.debug('start to get conversations');
  const credential = state.credential;
  console.log('credential for getConversations', credential);
  const token = credential?.token;
  if (!token) {
    commit('setRepository', {
      id: payload.repositoryId,
      conversations: []
    });
    return [];
  }
  const conversations = (
    await chatdocOperator.getAllConversations(payload.repositoryId, {
      token
    })
  ).data.items;
  console.debug('get conversations success', conversations);
  commit('setRepository', {
    id: payload.repositoryId,
    conversations: conversations
  });
  return conversations;
};

export const getRepository = async (
  { commit, state }: ActionContext<IChatdocState, IRootState>,
  payload: { id: string }
): Promise<IChatdocRepository> => {
  console.debug('start to get repository');
  const credential = state.credential;
  const token = credential?.token;
  if (!token) {
    commit('setRepository', { id: payload.id });
    return Promise.reject('no token');
  }
  const repository = (
    await chatdocOperator.getRepository(payload.id, {
      token
    })
  ).data;
  console.debug('get repository success', repository);
  commit('setRepository', repository);
  return repository;
};

export const setRepository = async ({ commit }: any, payload: { repository: IChatdocRepository }): Promise<void> => {
  commit('setRepository', payload);
};

export default {
  createCredential,
  setService,
  setConversation,
  getService,
  createRepository,
  setApplication,
  getApplications,
  getRepositories,
  setCredential,
  deleteRepository,
  getRepository,
  setRepository,
  getConversations,
  getDocuments,
  resetAll,
  createDocument,
  deleteDocument
};
