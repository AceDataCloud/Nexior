import { applicationOperator, chatOperator, serviceOperator } from '@/operators';
import { IRootState } from '../common/models';
import { ActionContext } from 'vuex';
import { IChatState } from './models';
import { IApplication, IApplicationType, IChatConversation, IChatModel, ICredential, IService, Status } from '@/models';
import { CHAT_SERVICE_ID } from '@/constants';

export const resetAll = ({ commit }: ActionContext<IChatState, IRootState>): void => {
  commit('resetAll');
};

export const setModel = async ({ commit }: any, payload: IChatModel): Promise<void> => {
  commit('setModel', payload);
};

export const setApplication = async ({ commit }: any, payload: IApplication): Promise<void> => {
  console.debug('set application', payload);
  commit('setApplication', payload);
};

export const setService = async ({ commit }: any, payload: IService): Promise<void> => {
  console.debug('set service', payload);
  commit('setService', payload);
};

export const setConversations = async ({ commit }: any, payload: IChatConversation[]): Promise<void> => {
  console.debug('set conversations', payload);
  commit('setConversations', payload);
};

export const setCredential = async ({ commit }: any, payload: ICredential): Promise<void> => {
  console.debug('set credential', payload);
  commit('setCredential', payload);
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

export const getService = async ({ commit, state }: ActionContext<IChatState, IRootState>): Promise<IService> => {
  return new Promise((resolve, reject) => {
    console.debug('start to get service for chat');
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

export const getApplications = async ({
  commit,
  state,
  rootState
}: ActionContext<IChatState, IRootState>): Promise<IApplication[]> => {
  console.debug('start to get applications for chat');
  return new Promise((resolve, reject) => {
    state.status.getApplications = Status.Request;
    applicationOperator
      .getAll({
        user_id: rootState?.user?.id,
        service_id: CHAT_SERVICE_ID
      })
      .then((response) => {
        console.debug('get applications success', response?.data);
        state.status.getApplications = Status.Success;
        // check if there is any application with 'Period' type
        const application = response.data.items?.find((application) => application?.type === IApplicationType.PERIOD);
        const application2 = response.data.items?.find((application) => application?.type === IApplicationType.USAGE);
        if (application && application?.remaining_amount) {
          console.debug('set application with Period', application);
          commit('setApplication', application);
          const credential = application?.credentials?.find(
            (credential) => credential?.host === window.location.origin
          );
          console.debug('set credential with Period', application);
          commit('setCredential', credential);
        } else if (application2) {
          console.debug('set application with Usage', application2);
          commit('setApplication', application2);
          const credential = application2?.credentials?.find(
            (credential) => credential?.host === window.location.origin
          );
          console.debug('set credential with Usage', application);
          commit('setCredential', credential);
        } else {
          console.debug('set application with null', response.data.items?.[0]);
          commit('setApplication', response.data.items?.[0]);
        }
        resolve(response.data.items);
        console.debug('save application success', response.data.items[0]);
      })
      .catch((error) => {
        state.status.getApplications = Status.Error;
        reject(error);
      });
  });
};

export const getConversations = async ({
  commit,
  state,
  rootState
}: ActionContext<IChatState, IRootState>): Promise<IChatConversation[]> => {
  return new Promise((resolve, reject) => {
    state.status.getConversations = Status.Request;
    const credential = state.credential;
    console.debug('credential', credential);
    const token = credential?.token;
    if (!token) {
      state.status.getConversations = Status.Error;
      return reject(new Error('Token not found'));
    }
    chatOperator
      .getConversations(
        {
          userId: rootState.user?.id
        },
        {
          token
        }
      )
      .then((response) => {
        console.debug('get conversations success', response.data?.items?.length);
        commit('setConversations', response.data.items);
        const conversations = response.data.items;
        resolve(conversations);
      })
      .catch((error) => {
        state.status.getConversations = Status.Error;
        commit('setConversations', []);
        reject(error);
      });
  });
};

export default {
  resetAll,
  setModel,
  getService,
  setService,
  setCredential,
  setApplication,
  getApplications,
  setConversation,
  setConversations,
  getConversations
};
