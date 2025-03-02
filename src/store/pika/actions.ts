import { applicationOperator, credentialOperator, pikaOperator, serviceOperator } from '@/operators';
import { IPikaState } from './models';
import { ActionContext } from 'vuex';
import { IRootState } from '../common/models';
import { IApplication, ICredential, IPikaConfig, IPikaTask, IService } from '@/models';
import { Status } from '@/models/common';
import { PIKA_SERVICE_ID } from '@/constants';
import { mergeAndSortLists } from '@/utils/merge';
import { getFinalApplication } from '@/utils';

export const resetAll = ({ commit }: ActionContext<IPikaState, IRootState>): void => {
  commit('resetAll');
};

export const setApplication = async ({ commit, dispatch }: any, payload: IApplication): Promise<void> => {
  console.debug('set application', payload);
  commit('setApplication', payload);
  if (!payload) {
    console.debug('application is null, return');
    return;
  }
  const credential = payload?.credentials?.find((credential) => credential?.host === window.location.origin);
  if (credential) {
    console.debug('credential exists, set credential', credential);
    commit('setCredential', credential);
  } else {
    console.debug('credential not exists, start to create credential for application', payload);
    await dispatch('createCredential');
  }
};

export const setApplications = async ({ commit }: any, payload: IApplication[]): Promise<void> => {
  console.debug('set applications', payload);
  commit('setApplications', payload);
};

export const setService = async ({ commit }: any, payload: IService): Promise<void> => {
  console.debug('set service', payload);
  commit('setService', payload);
};

export const setCredential = async ({ commit }: any, payload: ICredential): Promise<void> => {
  console.debug('set credential', payload);
  commit('setCredential', payload);
};

export const createCredential = async ({ commit, state }: any): Promise<ICredential | undefined> => {
  const application = state.application;
  console.debug('prepare to create credential for application', application);
  if (!application) {
    console.error('Application not found');
    return undefined;
  }
  console.debug('creating create credential for application', application);
  const { data: credential } = await credentialOperator.create({
    application_id: application?.id,
    host: window.location.origin
  });
  console.debug('created credential success', credential);
  commit('setCredential', credential);
  console.debug('end createCredential');
  return credential;
};

export const getService = async ({
  commit,
  state
}: ActionContext<IPikaState, IRootState>): Promise<IService | undefined> => {
  state.status.getService = Status.Request;
  try {
    const { data: service } = await serviceOperator.get(PIKA_SERVICE_ID);
    state.status.getService = Status.Success;
    commit('setService', service);
    return service;
  } catch (error) {
    state.status.getService = Status.Error;
    commit('setService', undefined);
  }
};

export const getApplications = async ({
  commit,
  state,
  rootState
}: ActionContext<IPikaState, IRootState>): Promise<IApplication[] | undefined> => {
  console.debug('start to get applications for chat');
  state.status.getApplications = Status.Request;
  const currentApplication = state.application;
  console.debug('current application', currentApplication);
  try {
    const { data: applications } = await applicationOperator.getAll({
      user_id: rootState?.user?.id,
      service_id: PIKA_SERVICE_ID
    });
    state.status.getApplications = Status.Success;
    commit('setApplications', applications.items);
    const finalApplication = getFinalApplication(applications.items, currentApplication);
    if (finalApplication) {
      console.debug('set final application', finalApplication, finalApplication?.type);
      commit('setApplication', finalApplication);
    } else {
      console.debug('set application undefined', undefined);
      commit('setApplication', undefined);
    }
    return applications.items;
  } catch (error) {
    console.error('get applications failed', error);
    state.status.getApplications = Status.Error;
    commit('setApplications', undefined);
    commit('setApplication', undefined);
  }
};

export const setConfig = ({ commit }: any, payload: IPikaConfig) => {
  commit('setConfig', payload);
};

export const setTasks = ({ commit }: any, payload: any) => {
  commit('setTasks', payload);
};

export const setTasksItems = ({ commit }: any, payload: IPikaTask[]) => {
  commit('setTasksItems', payload);
};

export const setTasksTotal = ({ commit }: any, payload: number) => {
  commit('setTasksTotal', payload);
};

export const setTasksActive = ({ commit }: any, payload: IPikaTask) => {
  commit('setTasksActive', payload);
};

export const getTasks = async (
  { commit, state, rootState }: ActionContext<IPikaState, IRootState>,
  {
    offset,
    limit,
    createdAtMin,
    createdAtMax
  }: { offset?: number; limit?: number; createdAtMin?: number; createdAtMax?: number }
): Promise<IPikaTask[]> => {
  return new Promise((resolve, reject) => {
    console.debug('start to get tasks', offset, limit);
    const credential = state.credential;
    const token = credential?.token;
    if (!token) {
      return reject('no token');
    }
    pikaOperator
      .tasks(
        {
          userId: rootState?.user?.id,
          createdAtMin,
          createdAtMax,
          type: 'videos'
        },
        {
          token
        }
      )
      .then((response) => {
        console.debug('get videos tasks success', response.data.items);
        // merge with existing tasks
        const existingItems = state?.tasks?.items || [];
        console.debug('existing items', existingItems);
        const newItems = response.data.items || [];
        console.debug('new items', newItems);
        // sort and de-duplicate using created_at
        const mergedItems = mergeAndSortLists(existingItems, newItems);
        commit('setTasksItems', mergedItems);
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
  setApplications,
  getApplications,
  setTasks,
  setTasksItems,
  setTasksTotal,
  setTasksActive,
  getTasks,
  createCredential
};
