import { applicationOperator, lumaOperator, serviceOperator } from '@/operators';
import { ILumaState } from './models';
import { ActionContext } from 'vuex';
import { IRootState } from '../common/models';
import { IApplication, ICredential, ILumaConfig, ILumaTask, IService, IApplicationType } from '@/models';
import { Status } from '@/models/common';
import { LUMA_SERVICE_ID } from '@/constants';

export const resetAll = ({ commit }: ActionContext<ILumaState, IRootState>): void => {
  commit('resetAll');
};

export const setCredential = async ({ commit }: any, payload: ICredential): Promise<void> => {
  console.debug('set credential', payload);
  commit('setCredential', payload);
};

export const setConfig = ({ commit }: any, payload: ILumaConfig) => {
  commit('setConfig', payload);
};

export const setService = async ({ commit }: any, payload: IService): Promise<void> => {
  console.debug('set service', payload);
  commit('setService', payload);
};

export const setApplication = ({ commit }: any, payload: IApplication[]) => {
  commit('setApplication', payload);
};

export const getApplications = async ({
  commit,
  state,
  rootState
}: ActionContext<ILumaState, IRootState>): Promise<IApplication[]> => {
  console.debug('start to get applications for luma');
  return new Promise((resolve, reject) => {
    state.status.getApplications = Status.Request;
    applicationOperator
      .getAll({
        user_id: rootState?.user?.id,
        service_id: LUMA_SERVICE_ID
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

export const setTasks = ({ commit }: any, payload: any) => {
  commit('setTasks', payload);
};

export const setTasksItems = ({ commit }: any, payload: ILumaTask[]) => {
  commit('setTasksItems', payload);
};

export const setTasksTotal = ({ commit }: any, payload: number) => {
  commit('setTasksTotal', payload);
};

export const setTasksActive = ({ commit }: any, payload: ILumaTask) => {
  commit('setTasksActive', payload);
};

export const getService = async ({ commit, state }: ActionContext<ILumaState, IRootState>): Promise<IService> => {
  return new Promise((resolve, reject) => {
    console.debug('start to get service for luma');
    state.status.getService = Status.Request;
    serviceOperator
      .get(LUMA_SERVICE_ID)
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
  { commit, state, rootState }: ActionContext<ILumaState, IRootState>,
  { offset, limit }: { offset?: number; limit?: number }
): Promise<ILumaTask[]> => {
  return new Promise((resolve, reject) => {
    console.debug('start to get tasks', offset, limit);
    const credential = state.credential;
    const token = credential?.token;
    if (!token) {
      return reject('no token');
    }
    lumaOperator
      .tasks(
        {
          userId: rootState?.user?.id
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
  getApplications,
  setTasks,
  setTasksItems,
  setTasksTotal,
  setTasksActive,
  getTasks
};
