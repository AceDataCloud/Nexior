import { createTaskActions } from '@/store/factories/createTaskActions';
import { acemusicOperator } from '@/operators/acemusic';
import { applicationOperator } from '@/operators';
import { ACEMUSIC_SERVICE_ID } from '@/constants';
import { Status, type IAcemusicConfig, type IAcemusicTask, type IAcemusicTaskFilter } from '@/models';
import { isAcemusicTaskPending, mergeAcemusicTasks } from '@/utils/acemusic';

const actions = createTaskActions<IAcemusicConfig, IAcemusicTask, IAcemusicTaskFilter>({
  serviceId: ACEMUSIC_SERVICE_ID,
  operator: acemusicOperator,
  paginated: true,
  buildFilter: (_root, args) => ({
    ids: args.ids,
    limit: args.limit,
    offset: args.offset,
    createdAtMin: args.createdAtMin,
    createdAtMax: args.createdAtMax
  }),
  isPending: isAcemusicTaskPending
});
export default {
  ...actions,
  async getApplications({ commit, state, rootState }: any) {
    if (!rootState.token?.access) {
      commit('setApplications', []);
      commit('setApplication', undefined);
      commit('setCredential', undefined);
      state.status.getApplications = Status.Success;
      return [];
    }
    state.status.getApplications = Status.Request;
    try {
      const { data } = await applicationOperator.getAll({
        user_id: 'me',
        service_id: ACEMUSIC_SERVICE_ID,
        affiliation: ['owner', 'granted']
      });
      commit('setApplications', data.items);
      state.status.getApplications = Status.Success;
      return data.items;
    } catch (error) {
      state.status.getApplications = Status.Error;
      throw error;
    }
  },
  async getTasks({ state, commit }: any, args: IAcemusicTaskFilter & { replace?: boolean } = {}) {
    const token = state.credential?.token;
    if (!token) return [];
    state.status.getTasks = Status.Request;
    try {
      const { data } = await acemusicOperator.tasks(args, { token });
      if (token !== state.credential?.token) return [];
      commit('setTasksItems', mergeAcemusicTasks(args.replace ? [] : state.tasks?.items || [], data.items || []));
      commit('setTasksTotal', data.count);
      state.status.getTasks = Status.Success;
      return data.items || [];
    } catch (error) {
      if (token === state.credential?.token) state.status.getTasks = Status.Error;
      throw error;
    }
  },
  async refreshPendingTasks({ state, commit }: any) {
    const token = state.credential?.token;
    const ids = (state.tasks?.items || [])
      .filter(isAcemusicTaskPending)
      .slice(-20)
      .map((t: IAcemusicTask) => t.id);
    if (!token || !ids.length) return [];
    const { data } = await acemusicOperator.tasks({ ids }, { token });
    if (token !== state.credential?.token) return [];
    commit('setTasksItems', mergeAcemusicTasks(state.tasks?.items || [], data.items || []));
    return data.items || [];
  },
  setAudio({ commit }: any, audio: any) {
    commit('setAudio', audio);
  },
  setVolume({ commit, state }: any, volume: number) {
    if (state.audio?.object) state.audio.object.volume = volume / 100;
    commit('setAudio', { ...state.audio, volume });
  }
};
