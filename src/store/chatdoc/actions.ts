import { IRootState } from '../common/models';
import { ActionContext } from 'vuex';
import { log } from '@/utils/log';
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
import { chatdocOperator, applicationOperator, serviceOperator } from '@/operators';
import { CHATDOC_SERVICE_ID } from '@/constants';

export const setApplication = async ({ commit }: any, payload: IApplication): Promise<void> => {
  commit('setApplication', payload);
};

export const setCredential = async ({ commit }: any, payload: ICredential): Promise<void> => {
  log(setCredential, 'set credential', payload);
  commit('setCredential', payload);
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
  rootState,
  state
}: ActionContext<IChatdocState, IRootState>): Promise<IApplication> => {
  return new Promise(async (resolve, reject) => {
    state.status.getApplication = Status.Request;
    applicationOperator
      .getAll({
        user_id: rootState?.user?.id,
        service_id: CHATDOC_SERVICE_ID
      })
      .then((response) => {
        state.status.getApplication = Status.Success;
        commit('setApplication', response.data.items[0]);
        const credential = response.data.items?.[0]?.credentials?.find(
          (credential) => credential?.host === window.location.origin
        );
        commit('setCredential', credential);
        resolve(response.data.items[0]);
      })
      .catch((error) => {
        state.status.getApplication = Status.Error;
        reject(error);
      });
  });
};

export const resetAll = ({ commit }: ActionContext<IChatdocState, IRootState>): void => {
  commit('resetAll');
};

export const getRepositories = async ({
  commit,
  state
}: ActionContext<IChatdocState, IRootState>): Promise<IChatdocRepository[]> => {
  log(getRepositories, 'start to get repositories');
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
  log(createDocument, 'create document success', document);
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
  log(setConversation, 'set conversation', payload);
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
  log(setConversation, 'set conversation success', conversations);
};

export const getDocuments = async (
  { commit, state }: ActionContext<IChatdocState, IRootState>,
  payload: { repositoryId: string }
): Promise<IChatdocDocument[]> => {
  log(getRepositories, 'start to get documents');
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
  log(getRepository, 'get repository success', repository);
  commit('setRepository', repository);
  return repository;
};

export default {
  setService,
  setConversation,
  getService,
  createRepository,
  setApplication,
  getApplication,
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
