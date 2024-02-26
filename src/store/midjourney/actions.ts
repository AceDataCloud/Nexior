import {
  IApplication,
  IMidjourneyMode,
  IMidjourneyImagineTask,
  IMidjourneyPreset,
  applicationOperator,
  midjourneyOperator,
  MIDJOURNEY_SERVICE_ID
} from '@/operators';
import { IMidjourneyState } from './models';
import { ActionContext } from 'vuex';
import { log } from '@/utils/log';
import { IRootState, Status } from '../common/models';

export const resetAll = ({ commit }: ActionContext<IMidjourneyState, IRootState>): void => {
  commit('resetAll');
};

export const setPreset = ({ commit }: any, payload: IMidjourneyPreset) => {
  commit('setPreset', payload);
};

export const setMode = ({ commit }: any, payload: IMidjourneyMode) => {
  commit('setMode', payload);
};

export const setApplications = ({ commit }: any, payload: IApplication[]) => {
  commit('setApplications', payload);
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
  resetAll,
  setPreset,
  setMode,
  setApplications,
  setImagineTasks,
  getImagineTasks
};
