import { applicationOperator, midjourneyOperator, serviceOperator } from '@/operators';
import { IMidjourneyState } from './models';
import { ActionContext } from 'vuex';
import { IRootState } from '../common/models';
import {
  IApplication,
  ICredential,
  IMidjourneyPreset,
  IMidjourneyTask,
  IMidjourneyTasksResponse,
  IService
} from '@/models';
import { Status } from '@/models/common';
import { MIDJOURNEY_SERVICE_ID } from '@/constants';

export const resetAll = ({ commit }: ActionContext<IMidjourneyState, IRootState>): void => {
  commit('resetAll');
};

export const setCredential = async ({ commit }: any, payload: ICredential): Promise<void> => {
  console.debug(setCredential, 'set credential', payload);
  commit('setCredential', payload);
};

export const setPreset = ({ commit }: any, payload: IMidjourneyPreset) => {
  commit('setPreset', payload);
};

export const setMode = ({ commit }: any, payload: string) => {
  commit('setMode', payload);
};

export const setService = async ({ commit }: any, payload: IService): Promise<void> => {
  console.debug('set service', payload);
  commit('setService', payload);
};

export const setApplication = ({ commit }: any, payload: IApplication[]) => {
  commit('setApplication', payload);
};

export const getApplication = async ({
  commit,
  state,
  rootState
}: ActionContext<IMidjourneyState, IRootState>): Promise<IApplication> => {
  console.debug('start to get application for midjourney');
  return new Promise((resolve, reject) => {
    state.status.getApplication = Status.Request;
    applicationOperator
      .getAll({
        user_id: rootState?.user?.id,
        service_id: MIDJOURNEY_SERVICE_ID
      })
      .then((response) => {
        console.debug('get application success', response?.data);
        state.status.getApplication = Status.Success;
        commit('setApplication', response.data.items[0]);
        const credential = response.data.items?.[0]?.credentials?.find(
          (credential) => credential?.host === window.location.origin
        );
        commit('setCredential', credential);
        resolve(response.data.items[0]);
        console.debug('save application success', response.data.items[0]);
      })
      .catch((error) => {
        state.status.getApplication = Status.Error;
        reject(error);
      });
  });
};

export const setTasks = ({ commit }: any, payload: IMidjourneyTask[]) => {
  commit('setTasks', payload);
};

export const getService = async ({ commit, state }: ActionContext<IMidjourneyState, IRootState>): Promise<IService> => {
  return new Promise((resolve, reject) => {
    console.debug('start to get service for midjourney');
    state.status.getService = Status.Request;
    serviceOperator
      .get(MIDJOURNEY_SERVICE_ID)
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

export const getTasks = async (
  { commit, state }: ActionContext<IMidjourneyState, IRootState>,
  { offset, limit }: { offset?: number; limit?: number }
): Promise<IMidjourneyTasksResponse> => {
  return new Promise((resolve, reject) => {
    console.debug('start to get tasks', offset, limit);
    const credential = state.credential;
    const token = credential?.token;
    if (!token) {
      return reject('no token');
    }
    midjourneyOperator
      .tasks(
        {
          applicationId: state.application?.id,
          offset,
          limit
        },
        {
          token
        }
      )
      .then((response) => {
        console.debug('get tasks success', response.data);
        commit('setTasks', response.data);
        resolve(response.data);
      })
      .catch((error) => {
        return reject(error);
      });
  });
};

export default {
  setService,
  getService,
  resetAll,
  setCredential,
  setPreset,
  setMode,
  setApplication,
  getApplication,
  setTasks,
  getTasks
};
