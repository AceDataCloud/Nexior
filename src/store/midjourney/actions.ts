import { applicationOperator, midjourneyOperator, serviceOperator } from '@/operators';
import { IMidjourneyState } from './models';
import { ActionContext } from 'vuex';
import { log } from '@/utils/log';
import { IRootState } from '../common/models';
import {
  IApplication,
  ICredential,
  IMidjourneyImagineTask,
  IMidjourneyMode,
  IMidjourneyPreset,
  IService
} from '@/models';
import { Status } from '@/models/common';
import { MIDJOURNEY_SERVICE_ID } from '@/constants';

export const resetAll = ({ commit }: ActionContext<IMidjourneyState, IRootState>): void => {
  commit('resetAll');
};

export const setCredential = async ({ commit }: any, payload: ICredential): Promise<void> => {
  log(setCredential, 'set credential', payload);
  commit('setCredential', payload);
};

export const setPreset = ({ commit }: any, payload: IMidjourneyPreset) => {
  commit('setPreset', payload);
};

export const setMode = ({ commit }: any, payload: IMidjourneyMode) => {
  commit('setMode', payload);
};

export const setService = async ({ commit }: any, payload: IService): Promise<void> => {
  log(setService, 'set service', payload);
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
  log(getApplication, 'start to get application for midjourney');
  return new Promise(async (resolve, reject) => {
    state.status.getApplication = Status.Request;
    applicationOperator
      .getAll({
        user_id: rootState?.user?.id,
        service_id: MIDJOURNEY_SERVICE_ID
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

export const setImagineTasks = ({ commit }: any, payload: IMidjourneyImagineTask[]) => {
  commit('setImagineTasks', payload);
};

export const getService = async ({ commit, state }: ActionContext<IMidjourneyState, IRootState>): Promise<IService> => {
  return new Promise(async (resolve, reject) => {
    log(getService, 'start to get service for midjourney');
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

export const getImagineTasks = async (
  { commit, state }: ActionContext<IMidjourneyState, IRootState>,
  { offset, limit }: { offset?: number; limit?: number }
): Promise<IMidjourneyImagineTask[]> => {
  return new Promise(async (resolve, reject) => {
    log(getImagineTasks, 'start to get imagine tasks', offset, limit);
    const credential = state.credential;
    const token = credential?.token;
    if (!token) {
      return reject('no token');
    }
    midjourneyOperator
      .tasks(
        {
          applicationId: state.application?.id
        },
        {
          token
        }
      )
      .then((response) => {
        log(getImagineTasks, 'get imagine tasks success', response.data.items);
        commit('setImagineTasks', response.data.items);
        commit('setImagineTasksTotal', response.data.count);
        resolve(response.data.items);
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
  setImagineTasks,
  getImagineTasks
};
