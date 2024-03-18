import { applicationOperator, chatOperator, serviceOperator } from '@/operators';
import { IRootState } from '../common/models';
import { ActionContext } from 'vuex';
import { log } from '@/utils/log';
import { IChatState } from './models';
import { IApplication, IChatConversation, IChatModel, IService, Status } from '@/models';
import { CHAT_SERVICE_ID } from '@/constants';

export const resetAll = ({ commit }: ActionContext<IChatState, IRootState>): void => {
  commit('resetAll');
};

export const setModel = async ({ commit }: any, payload: IChatModel): Promise<void> => {
  commit('setModel', payload);
};

export const setApplication = async ({ commit }: any, payload: IApplication): Promise<void> => {
  log(setApplication, 'set application', payload);
  commit('setApplication', payload);
};

export const setService = async ({ commit }: any, payload: IService): Promise<void> => {
  log(setService, 'set service', payload);
  commit('setService', payload);
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

export const getService = async ({ commit, state }: ActionContext<IChatState, IRootState>): Promise<IService> => {
  return new Promise(async (resolve, reject) => {
    log(getService, 'start to get service for chat');
    state.status.getService = Status.Request;
    serviceOperator
      .get(CHAT_SERVICE_ID)
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

export const getApplication = async ({
  commit,
  state,
  rootState
}: ActionContext<IChatState, IRootState>): Promise<IApplication> => {
  return new Promise(async (resolve, reject) => {
    log(getApplication, 'start to get application for chat');
    state.status.getApplication = Status.Request;
    applicationOperator
      .getAll({
        user_id: rootState.user.id,
        service_id: CHAT_SERVICE_ID
      })
      .then((response) => {
        state.status.getApplication = Status.Success;
        commit('setApplication', response.data.items[0]);
        resolve(response.data.items[0]);
      })
      .catch((error) => {
        state.status.getApplication = Status.Error;
        reject(error);
      });
  });
};

export const getConversations = async ({
  commit,
  state
}: ActionContext<IChatState, IRootState>): Promise<IChatConversation[]> => {
  return new Promise(async (resolve, reject) => {
    state.status.getConversations = Status.Request;
    const application = state.application;
    log(getConversations, 'application', application);
    const token = application?.credentials?.[0].token;
    if (!token) {
      state.status.getConversations = Status.Error;
      return reject(new Error('Token not found'));
    }
    chatOperator
      .getConversations(
        {
          applicationId: state.application?.id
        },
        {
          token
        }
      )
      .then((response) => {
        log(getConversations, 'get conversations success', response.data?.items);
        commit('setConversations', response.data.items);
        const conversations = response.data.items;
        // reverse the order of conversations
        conversations.reverse();
        resolve(conversations);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

export default {
  resetAll,
  setModel,
  getService,
  setService,
  setApplication,
  getApplication,
  setConversation,
  setConversations,
  getConversations
};
