import { IRootState } from '../common/models';
import { ActionContext } from 'vuex';
import { log } from '@/utils/log';
import { IChatdocState } from './models';
import { IApplication, IChatdocConversation, IChatdocDocument, IChatdocRepository, IService, Status } from '@/models';
import { chatdocOperator, applicationOperator, serviceOperator } from '@/operators';
import { CHATDOC_SERVICE_ID } from '@/constants';

export const setApplication = async ({ commit }: any, payload: IApplication): Promise<void> => {
  commit('setApplication', payload);
};

export const setService = async ({ commit }: any, payload: IService): Promise<void> => {
  log(setService, 'set service', payload);
  commit('setService', payload);
};

export const setRepository = async ({ commit }: any, payload: { repository: IChatdocRepository }): Promise<void> => {
  commit('setRepository', payload);
};

export const getApplication = async ({
  commit,
  rootState
}: ActionContext<IChatdocState, IRootState>): Promise<IApplication> => {
  log(getApplication, 'start to get application for chat');
  const { data: applications } = await applicationOperator.getAll({
    user_id: rootState.user.id,
    service_id: CHATDOC_SERVICE_ID
  });
  log(getApplication, 'get application for chat success', applications);
  commit('setApplication', applications?.items?.[0]);
  return applications.items?.[0];
};

export const resetAll = ({ commit }: ActionContext<IChatdocState, IRootState>): void => {
  commit('resetAll');
};

export const getRepositories = async ({
  commit,
  state
}: ActionContext<IChatdocState, IRootState>): Promise<IChatdocRepository[]> => {
  log(getRepositories, 'start to get repositories');
  const application = state.application;
  console.log('application', application);
  const token = application?.credentials?.[0]?.token;
  if (!token) {
    commit('setRepositories', undefined);
    return Promise.reject('no token');
  }
  const repositories = (
    await chatdocOperator.getAllRepositories({
      token
    })
  ).data.items;
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
  const application = state.application;
  console.log('application', application);
  const token = application?.credentials?.[0]?.token;
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
  const application = state.application;
  console.log('application', application);
  const token = application?.credentials?.[0]?.token;
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

export const getService = async ({ commit, state }: ActionContext<IChatdocState, IRootState>): Promise<IService> => {
  return new Promise(async (resolve, reject) => {
    log(getService, 'start to get service for chatdoc');
    state.status.getService = Status.Request;
    serviceOperator
      .get(CHATDOC_SERVICE_ID)
      .then((response) => {
        state.status.getService = Status.Success;
        commit('setService', response.data);
        resolve(response.data);
      })
      .catch((error) => {
        state.status.getService = Status.Error;
        reject(error);
      });
  });
};

export const createRepository = async (
  { state }: ActionContext<IChatdocState, IRootState>,
  payload: {
    name: string;
    description?: string;
  }
): Promise<IChatdocRepository> => {
  log(createRepository, 'start to create repository');
  const application = state.application;
  console.log('application', application);
  const token = application?.credentials?.[0]?.token;
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
  const application = state.application;
  console.log('application', application);
  const token = application?.credentials?.[0]?.token;
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
  const application = state.application;
  console.log('application for getDocuments', application);
  const token = application?.credentials?.[0]?.token;
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
  const application = state.application;
  console.log('application for getConversations', application);
  const token = application?.credentials?.[0]?.token;
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
  const application = state.application;
  const token = application?.credentials?.[0]?.token;
  if (!token) {
    commit('setRepository', { id: payload.id });
    return Promise.reject('no token');
  }
  const repository = (
    await chatdocOperator.getRepository(payload.id, {
      token
    })
  ).data;
  log(getRepository, 'get repository success', repository);
  commit('setRepository', repository);
  return repository;
};

export default {
  setService,
  getService,
  createRepository,
  setApplication,
  getApplication,
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
