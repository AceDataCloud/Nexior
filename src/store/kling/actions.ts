import { applicationOperator, credentialOperator, klingOperator, serviceOperator } from '@/operators';
import { IKlingState } from './models';
import { ActionContext } from 'vuex';
import { IRootState } from '../common/models';
import {
  IApplication,
  ICredential,
  IKlingConfig,
  IKlingMotionConfig,
  IKlingTask,
  IKlingTaskType,
  IService
} from '@/models';
import { Status } from '@/models/common';
import { KLING_SERVICE_ID } from '@/constants';
import { mergeAndSortLists } from '@/utils/merge';

export const resetAll = ({ commit }: ActionContext<IKlingState, IRootState>): void => {
  commit('resetAll');
};

export const setApplication = async ({ commit, dispatch }: any, payload: IApplication): Promise<void> => {
  commit('setApplication', payload);
  if (!payload) {
    return;
  }
  const credential = payload?.credentials?.find((credential) => credential?.host === window.location.origin);
  if (credential) {
    commit('setCredential', credential);
  } else {
    await dispatch('createCredential');
  }
};

export const setApplications = async ({ commit }: any, payload: IApplication[]): Promise<void> => {
  commit('setApplications', payload);
};

export const setService = async ({ commit }: any, payload: IService): Promise<void> => {
  commit('setService', payload);
};

export const setCredential = async ({ commit }: any, payload: ICredential): Promise<void> => {
  commit('setCredential', payload);
};

export const createCredential = async ({ commit, state }: any): Promise<ICredential | undefined> => {
  const application = state.application;
  if (!application) {
    console.error('Application not found');
    return undefined;
  }
  const { data: credential } = await credentialOperator.create({
    application_id: application?.id,
    host: window.location.origin
  });
  commit('setCredential', credential);
  return credential;
};

export const getService = async ({
  commit,
  state
}: ActionContext<IKlingState, IRootState>): Promise<IService | undefined> => {
  state.status.getService = Status.Request;
  try {
    const { data: service } = await serviceOperator.get(KLING_SERVICE_ID);
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
}: ActionContext<IKlingState, IRootState>): Promise<IApplication[] | undefined> => {
  state.status.getApplications = Status.Request;
  try {
    const { data: applications } = await applicationOperator.getAll({
      user_id: rootState?.user?.id,
      service_id: KLING_SERVICE_ID
    });
    state.status.getApplications = Status.Success;
    commit('setApplications', applications.items);
    return applications.items;
  } catch (error) {
    console.error('get applications failed', error);
    state.status.getApplications = Status.Error;
    commit('setApplications', undefined);
    commit('setApplication', undefined);
  }
};

export const setConfig = ({ commit }: any, payload: IKlingConfig) => {
  commit('setConfig', payload);
};

export const setMotionConfig = ({ commit }: any, payload: IKlingMotionConfig) => {
  commit('setMotionConfig', payload);
};

export const setTaskType = ({ commit }: any, payload: IKlingTaskType) => {
  commit('setTaskType', payload);
};

export const setTasks = ({ commit }: any, payload: any) => {
  commit('setTasks', payload);
};

export const setTasksItems = ({ commit }: any, payload: IKlingTask[]) => {
  commit('setTasksItems', payload);
};

export const setTasksTotal = ({ commit }: any, payload: number) => {
  commit('setTasksTotal', payload);
};

export const setTasksActive = ({ commit }: any, payload: IKlingTask) => {
  commit('setTasksActive', payload);
};

export const getTasks = async (
  { commit, state, rootState }: ActionContext<IKlingState, IRootState>,
  {
    createdAtMin,
    createdAtMax
  }: { offset?: number; limit?: number; createdAtMin?: number; createdAtMax?: number }
): Promise<IKlingTask[]> => {
  return new Promise((resolve, reject) => {
    const credential = state.credential;
    const token = credential?.token;
    if (!token) {
      return reject('no token');
    }
    klingOperator
      .tasks(
        {
          userId: rootState?.user?.id,
          createdAtMin,
          createdAtMax,
          type: state.taskType
        },
        {
          token
        }
      )
      .then((response) => {
        // merge with existing tasks
        const existingItems = state?.tasks?.items || [];
        const newItems = response.data.items || [];
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
  setMotionConfig,
  setTaskType,
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
