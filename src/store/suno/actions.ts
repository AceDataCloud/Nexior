import { applicationOperator, sunoOperator, serviceOperator } from '@/operators';
import { ISunoState } from './models';
import { ActionContext } from 'vuex';
import { IRootState } from '../common/models';
import { IApplication, ICredential, ISunoConfig, ISunoTask, IService, Song, IApplicationType } from '@/models';
import { Status } from '@/models/common';
import { SUNO_SERVICE_ID } from '@/constants';

export const resetAll = ({ commit }: ActionContext<ISunoState, IRootState>): void => {
  commit('resetAll');
};

export const setCredential = async ({ commit }: any, payload: ICredential): Promise<void> => {
  console.debug('set credential', payload);
  commit('setCredential', payload);
};

export const setConfig = ({ commit }: any, payload: ISunoConfig) => {
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
}: ActionContext<ISunoState, IRootState>): Promise<IApplication[]> => {
  console.debug('start to get applications for suno');
  return new Promise((resolve, reject) => {
    state.status.getApplications = Status.Request;
    applicationOperator
      .getAll({
        user_id: rootState?.user?.id,
        service_id: SUNO_SERVICE_ID
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

export const setTasksItems = ({ commit }: any, payload: ISunoTask[]) => {
  commit('setTasksItems', payload);
};

export const setTasksTotal = ({ commit }: any, payload: number) => {
  commit('setTasksTotal', payload);
};

export const setTasksActive = ({ commit }: any, payload: ISunoTask) => {
  commit('setTasksActive', payload);
};

export const setAudio = ({ commit }: any, payload: any) => {
  commit('setAudio', payload);
};

export const getService = async ({ commit, state }: ActionContext<ISunoState, IRootState>): Promise<IService> => {
  return new Promise((resolve, reject) => {
    console.debug('start to get service for suno');
    state.status.getService = Status.Request;
    serviceOperator
      .get(SUNO_SERVICE_ID)
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
  { commit, state, rootState }: ActionContext<ISunoState, IRootState>,
  { offset, limit }: { offset?: number; limit?: number }
): Promise<ISunoTask[]> => {
  return new Promise((resolve, reject) => {
    console.debug('start to get tasks', offset, limit);
    const credential = state.credential;
    const token = credential?.token;
    if (!token) {
      return reject('no token');
    }
    sunoOperator
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
  getTasks,
  setAudio
};
