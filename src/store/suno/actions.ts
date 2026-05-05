import { applicationOperator, sunoOperator, serviceOperator, credentialOperator } from '@/operators';
import { ISunoState } from './models';
import { ActionContext } from 'vuex';
import { IRootState } from '../common/models';
import { IApplication, ICredential, ISunoConfig, ISunoPersona, ISunoTask, IService } from '@/models';
import { Status } from '@/models/common';
import { SUNO_SERVICE_ID } from '@/constants';
import { mergeAndSortLists } from '@/utils/merge';

export const resetAll = ({ commit }: ActionContext<ISunoState, IRootState>): void => {
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
}: ActionContext<ISunoState, IRootState>): Promise<IService | undefined> => {
  state.status.getService = Status.Request;
  try {
    const { data: service } = await serviceOperator.get(SUNO_SERVICE_ID);
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
}: ActionContext<ISunoState, IRootState>): Promise<IApplication[] | undefined> => {
  state.status.getApplications = Status.Request;
  try {
    const { data: applications } = await applicationOperator.getAll({
      user_id: rootState?.user?.id,
      service_id: SUNO_SERVICE_ID
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

export const setConfig = ({ commit }: any, payload: ISunoConfig) => {
  commit('setConfig', payload);
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

export const getTasks = async (
  { commit, state, rootState }: ActionContext<ISunoState, IRootState>,
  {
    createdAtMin,
    createdAtMax
  }: { offset?: number; limit?: number; createdAtMin?: number; createdAtMax?: number }
): Promise<ISunoTask[]> => {
  return new Promise((resolve, reject) => {
    const credential = state.credential;
    const token = credential?.token;
    if (!token) {
      return reject('no token');
    }
    sunoOperator
      .tasks(
        {
          userId: rootState?.user?.id,
          createdAtMin,
          createdAtMax,
          type: 'audios'
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

export const getPersonas = async ({
  commit,
  state,
  rootState
}: ActionContext<ISunoState, IRootState>): Promise<ISunoPersona[]> => {
  const credential = state.credential;
  const token = credential?.token;
  if (!token) {
    return [];
  }
  const userId = rootState?.user?.id;
  if (!userId) {
    return [];
  }
  try {
    const { data } = await sunoOperator.personasList({ user_id: userId }, { token });
    commit('setPersonas', data.items || []);
    return data.items || [];
  } catch (error) {
    console.error('get personas failed', error);
    return [];
  }
};

export const deletePersona = async (
  { state, dispatch, rootState }: ActionContext<ISunoState, IRootState>,
  personaId: string
): Promise<boolean> => {
  const credential = state.credential;
  const token = credential?.token;
  if (!token) {
    return false;
  }
  try {
    await sunoOperator.personasDelete({ persona_id: personaId, user_id: rootState?.user?.id }, { token });
    await dispatch('getPersonas');
    return true;
  } catch (error) {
    console.error('delete persona failed', error);
    return false;
  }
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
  setAudio,
  getPersonas,
  deletePersona,
  createCredential
};
