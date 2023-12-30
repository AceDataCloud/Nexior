import {
  IApplication,
  IMidjourneyChannel,
  IMidjourneyImagineTask,
  IMidjourneyPreset,
  MIDJOURNEY_CHANNEL_FAST,
  MIDJOURNEY_CHANNEL_RELAX,
  MIDJOURNEY_CHANNEL_TURBO,
  apiUsageOperator,
  applicationOperator,
  midjourneyOperator
} from '@/operators';
import { IMidjourneyState } from './models';
import { ActionContext } from 'vuex';
import { log } from '@/utils/log';
import { IRootState, Status } from '../common/models';

export const setPreset = ({ commit }: any, payload: IMidjourneyPreset) => {
  commit('setPreset', payload);
};

export const setChannel = ({ commit }: any, payload: IMidjourneyChannel) => {
  commit('setChannel', payload);
};

export const setApplications = ({ commit }: any, payload: IApplication[]) => {
  commit('setApplications', payload);
};

export const getApplications = async ({
  commit,
  rootState
}: ActionContext<IMidjourneyState, IRootState>): Promise<IApplication[]> => {
  log(getApplications, 'start to get application for midjourney');
  commit('setGetApplicationsStatus', Status.Request);
  const { data: applications } = await applicationOperator.getAll({
    user_id: rootState.user.id,
    api_id: [MIDJOURNEY_CHANNEL_FAST.apiId, MIDJOURNEY_CHANNEL_RELAX.apiId, MIDJOURNEY_CHANNEL_TURBO.apiId]
  });
  log(getApplications, 'get application for midjourney success', applications);
  commit('setGetApplicationsStatus', Status.Success);
  commit('setApplications', applications?.items);
  return applications.items;
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
  const {
    data: { items: apiUsages, count }
  } = await apiUsageOperator.getAll({
    user_id: rootState.user.id,
    // @ts-ignore
    application_id: state.applications?.map((application: IApplication) => application.id),
    offset,
    limit,
    ordering: '-created_at'
  });
  log(getImagineTasks, 'get imagine api usage success', apiUsages);
  let tasks = (await midjourneyOperator.tasks(apiUsages.map((apiUsage) => apiUsage.metadata?.task_id as string))).data;
  tasks = tasks.map((task: IMidjourneyImagineTask) => {
    const apiUsage = apiUsages.filter((apiUsage) => apiUsage.metadata?.task_id === task?.id)[0];
    return {
      ...task,
      created_at: apiUsage.created_at
    };
  });
  commit('setImagineTasksTotal', count);
  commit('setGetImagineTasksStatus', Status.Success);
  commit('setImagineTasks', tasks);
  return tasks;
};

export default {
  setPreset,
  setChannel,
  setApplications,
  getApplications,
  setImagineTasks,
  getImagineTasks
};
