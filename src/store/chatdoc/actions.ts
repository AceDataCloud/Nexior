import { IApplication, apiUsageOperator, applicationOperator } from '@/operators';
import { IRootState, Status } from '../common/models';
import { ActionContext } from 'vuex';
import { log } from '@/utils/log';
import { IChatdocState } from './models';
import { IChatdocConversation, IChatdocDocument, IChatdocRepository } from '@/operators/chatdoc/models';
import { chatdocOperator } from '@/operators/chatdoc/operator';
import {
  API_ID_CHATDOC_CHAT,
  API_ID_CHATDOC_DOCUMENTS,
  API_ID_CHATDOC_REPOSITORIES
} from '@/operators/chatdoc/constants';

export const setApplications = async ({ commit }: any, payload: IApplication[]): Promise<void> => {
  commit('setApplications', payload);
};

export const setRepository = async ({ commit }: any, payload: { repository: IChatdocRepository }): Promise<void> => {
  commit('setRepository', payload);
};

export const getApplications = async ({
  commit,
  rootState
}: ActionContext<IChatdocState, IRootState>): Promise<IApplication[]> => {
  log(getApplications, 'start to get application for chat');
  commit('setGetApplicationsStatus', Status.Request);
  const { data: applications } = await applicationOperator.getAll({
    user_id: rootState.user.id,
    api_id: [API_ID_CHATDOC_REPOSITORIES, API_ID_CHATDOC_CHAT, API_ID_CHATDOC_DOCUMENTS]
  });
  log(getApplications, 'get application for chat success', applications);
  commit('setGetApplicationsStatus', Status.Success);
  commit('setApplications', applications?.items);
  return applications.items;
};

export const resetAll = ({ commit }: ActionContext<IChatdocState, IRootState>): void => {
  commit('resetAll');
};

export const getRepositories = async ({
  commit,
  state
}: ActionContext<IChatdocState, IRootState>): Promise<IChatdocRepository[]> => {
  log(getRepositories, 'start to get repositories');
  commit('setGetRepositoriesStatus', Status.Request);
  const applications = state.applications;
  console.log('applications', applications);
  const application = applications?.find(
    (application: IApplication) => application.api?.id === API_ID_CHATDOC_REPOSITORIES
  );
  console.log('application', application);
  const token = application?.credential?.token;
  if (!token) {
    commit('setRepositories', undefined);
    return [];
  }
  const repositories = (
    await chatdocOperator.getAllRepositories({
      token
    })
  ).data;
  commit('setGetRepositoriesStatus', Status.Success);
  log(getRepositories, 'get repositories success', repositories);
  commit('setRepositories', repositories);
  return repositories;
};

export const deleteRepository = async (
  { state }: ActionContext<IChatdocState, IRootState>,
  payload: {
    id: string;
  }
): Promise<IChatdocRepository> => {
  log(deleteRepository, 'start to delete repository');
  const applications = state.applications;
  console.log('applications', applications);
  const application = applications?.find(
    (application: IApplication) => application.api?.id === API_ID_CHATDOC_REPOSITORIES
  );
  console.log('application', application);
  const token = application?.credential?.token;
  if (!token) {
    return Promise.reject('no token');
  }
  const repository = (
    await chatdocOperator.deleteRepository(payload.id, {
      token
    })
  ).data;
  log(deleteRepository, 'delete repository success', repository);
  return repository;
};

export const deleteDocument = async (
  { state }: ActionContext<IChatdocState, IRootState>,
  payload: {
    id: string;
  }
): Promise<IChatdocDocument> => {
  log(deleteDocument, 'start to delete document');
  const applications = state.applications;
  console.log('applications', applications);
  const application = applications?.find(
    (application: IApplication) => application.api?.id === API_ID_CHATDOC_DOCUMENTS
  );
  console.log('application', application);
  const token = application?.credential?.token;
  if (!token) {
    return Promise.reject('no token');
  }
  const document = (
    await chatdocOperator.deleteDocument(payload.id, {
      token
    })
  ).data;
  log(deleteRepository, 'delete document success', document);
  return document;
};

export const createRepository = async (
  { state }: ActionContext<IChatdocState, IRootState>,
  payload: {
    name: string;
    description?: string;
  }
): Promise<IChatdocRepository> => {
  log(createRepository, 'start to create repository');
  const applications = state.applications;
  console.log('applications', applications);
  const application = applications?.find(
    (application: IApplication) => application.api?.id === API_ID_CHATDOC_REPOSITORIES
  );
  console.log('application', application);
  const token = application?.credential?.token;
  if (!token) {
    return Promise.reject('no token');
  }
  const repository = (
    await chatdocOperator.createRepository(payload, {
      token
    })
  ).data;
  log(createRepository, 'create repository success', repository);
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
  log(createDocument, 'start to create document');
  const applications = state.applications;
  console.log('applications', applications);
  const application = applications?.find(
    (application: IApplication) => application.api?.id === API_ID_CHATDOC_DOCUMENTS
  );
  console.log('application', application);
  const token = application?.credential?.token;
  if (!token) {
    return Promise.reject('no token');
  }
  const document = (
    await chatdocOperator.createDocument(payload, {
      token
    })
  ).data;
  log(createDocument, 'create document success', document);
  return document;
};

export const getDocuments = async (
  { commit, state }: ActionContext<IChatdocState, IRootState>,
  payload: { repositoryId: string }
): Promise<IChatdocDocument[]> => {
  log(getRepositories, 'start to get documents');
  const applications = state.applications;
  console.log('applications', applications);
  const application = applications?.find(
    (application: IApplication) => application.api?.id === API_ID_CHATDOC_DOCUMENTS
  );
  console.log('application for getDocuments', application);
  const token = application?.credential?.token;
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
  ).data;
  log(getRepositories, 'get documents success', documents);
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
  log(getConversations, 'start to get conversations');
  const applications = state.applications;
  console.log('applications', applications);
  const application = applications?.find((application: IApplication) => application.api?.id === API_ID_CHATDOC_CHAT);
  console.log('application for getConversations', application);
  const token = application?.credential?.token;
  if (!token) {
    commit('setRepository', {
      id: payload.repositoryId,
      conversations: []
    });
    return [];
  }
  const conversations = (await chatdocOperator.getAllConversations(payload.repositoryId)).data;
  log(getConversations, 'get conversations success', conversations);
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
  log(getRepository, 'start to get repository');
  // commit('setGetRepositoryStatus', Status.Request);
  const applications = state.applications;
  const application = applications?.find(
    (application: IApplication) => application.api?.id === API_ID_CHATDOC_REPOSITORIES
  );
  const token = application?.credential?.token;
  if (!token) {
    commit('setRepository', { id: payload.id });
    return Promise.reject('no token');
  }
  const repository = (
    await chatdocOperator.getRepository(payload.id, {
      token
    })
  ).data;
  // commit('setGetRepositoryStatus', Status.Success);
  log(getRepository, 'get repository success', repository);
  commit('setRepository', repository);
  return repository;
};

export default {
  createRepository,
  setApplications,
  getApplications,
  getRepositories,
  deleteRepository,
  getRepository,
  setRepository,
  getConversations,
  getDocuments,
  resetAll,
  createDocument,
  deleteDocument
};
