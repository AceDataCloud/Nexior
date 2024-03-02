import { applicationOperator, midjourneyOperator, serviceOperator } from '@/operators';
import { IMidjourneyState } from './models';
import { ActionContext } from 'vuex';
import { log } from '@/utils/log';
import { IRootState } from '../common/models';
import { IApplication, IMidjourneyImagineTask, IMidjourneyMode, IMidjourneyPreset, IService } from '@/models';
import { Status } from '@/models/common';
import { MIDJOURNEY_SERVICE_ID } from '@/constants';

export const resetAll = ({ commit }: ActionContext<IMidjourneyState, IRootState>): void => {
  commit('resetAll');
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
  rootState
}: ActionContext<IMidjourneyState, IRootState>): Promise<IApplication> => {
  log(getApplication, 'start to get application for midjourney');
  commit('setGetApplicationsStatus', Status.Request);
  const { data: applications } = await applicationOperator.getAll({
    user_id: rootState.user.id,
    service_id: MIDJOURNEY_SERVICE_ID
  });
  log(getApplication, 'get application for midjourney success', applications);
  commit('setApplication', applications?.items?.[0]);
  return applications.items?.[0];
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
  { commit, state, rootState }: ActionContext<IMidjourneyState, IRootState>,
  { offset, limit }: { offset?: number; limit?: number }
): Promise<IMidjourneyImagineTask[]> => {
  log(getImagineTasks, 'start to get imagine tasks', offset, limit);
  commit('setGetImagineTasksStatus', Status.Request);
  const { data: tasks } = (
    await midjourneyOperator.tasks({
      applicationId: state.application?.id
    })
  ).data;
  // commit('setImagineTasksTotal', count);
  commit('setImagineTasks', tasks);
  return tasks;
};

export default {
  setService,
  getService,
  resetAll,
  setPreset,
  setMode,
  setApplication,
  getApplication,
  setImagineTasks,
  getImagineTasks
};
