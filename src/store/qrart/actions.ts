import { applicationOperator, qrartOperator, serviceOperator } from '@/operators';
import { IQrartState } from './models';
import { ActionContext } from 'vuex';
import { IRootState } from '../common/models';
import { IApplication, ICredential, IQrartConfig, IQrartTask, IService } from '@/models';
import { Status } from '@/models/common';
import { QRART_SERVICE_ID } from '@/constants';

export const resetAll = ({ commit }: ActionContext<IQrartState, IRootState>): void => {
  commit('resetAll');
};

export const setCredential = async ({ commit }: any, payload: ICredential): Promise<void> => {
  console.debug('set credential', payload);
  commit('setCredential', payload);
};

export const setConfig = ({ commit }: any, payload: IQrartConfig) => {
  commit('setConfig', payload);
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
}: ActionContext<IQrartState, IRootState>): Promise<IApplication> => {
  console.debug('start to get application for qrart');
  return new Promise((resolve, reject) => {
    state.status.getApplication = Status.Request;
    applicationOperator
      .getAll({
        user_id: rootState?.user?.id,
        service_id: QRART_SERVICE_ID
      })
      .then((response) => {
        console.debug('get application success', response?.data);
        state.status.getApplication = Status.Success;
        commit('setApplication', response.data.items[0]);
        const credential = response.data.items?.[0]?.credentials?.find(
          (credential) => credential?.host === window.location.origin
        );
        console.debug('get credential success', credential);
        commit('setCredential', credential);
        resolve(response.data.items[0]);
        console.debug('save application success', response.data.items[0]);
      })
      .catch((error) => {
        console.error('get application error', error);
        state.status.getApplication = Status.Error;
        reject(error);
      });
  });
};

export const setTasks = ({ commit }: any, payload: any) => {
  commit('setTasks', payload);
};

export const setTasksItems = ({ commit }: any, payload: IQrartTask[]) => {
  commit('setTasksItems', payload);
};

export const setTasksTotal = ({ commit }: any, payload: number) => {
  commit('setTasksTotal', payload);
};

export const setTasksActive = ({ commit }: any, payload: IQrartTask) => {
  commit('setTasksActive', payload);
};

export const getService = async ({ commit, state }: ActionContext<IQrartState, IRootState>): Promise<IService> => {
  return new Promise((resolve, reject) => {
    console.debug('start to get service for qrart');
    state.status.getService = Status.Request;
    serviceOperator
      .get(QRART_SERVICE_ID)
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
  { commit, state }: ActionContext<IQrartState, IRootState>,
  { offset, limit }: { offset?: number; limit?: number }
): Promise<IQrartTask[]> => {
  return new Promise((resolve, reject) => {
    console.debug('start to get tasks', offset, limit);
    const credential = state.credential;
    const token = credential?.token;
    if (!token) {
      return reject('no token');
    }
    qrartOperator
      .tasks(
        {
          applicationId: state.application?.id
        },
        {
          token
        }
      )
      .then((response) => {
        console.debug('get imagine tasks success', response.data.items);
        commit('setTasksItems', response.data.items);
        commit('setTasksTotal', response.data.count);
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
  setConfig,
  setApplication,
  getApplication,
  setTasks,
  setTasksItems,
  setTasksTotal,
  setTasksActive,
  getTasks
};
