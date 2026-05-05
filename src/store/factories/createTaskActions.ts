import { ActionContext, ActionTree } from 'vuex';
import { IApplication, ICredential, IService } from '@/models';
import { Status } from '@/models/common';
import { applicationOperator, credentialOperator, serviceOperator } from '@/operators';
import { mergeAndSortLists } from '@/utils/merge';
import { IRootState } from '../common/models';

/**
 * Generic state shape every per-service Vuex module conforms to.
 *
 * `TConfig` and `TTask` let each concrete module narrow `config` and
 * `tasks.items` to its own service-specific type while sharing all
 * other field shapes.
 */
export interface ITaskServiceState<TConfig, TTask> {
  service: IService | undefined;
  application: IApplication | undefined;
  applications: IApplication[] | undefined;
  credential: ICredential | undefined;
  config: TConfig | undefined;
  tasks:
    | {
        items: TTask[] | undefined;
        total: number | undefined;
        active: TTask | undefined;
      }
    | undefined;
  status: {
    getService: Status;
    getApplications: Status;
    getTasks: Status;
  };
}

/** Minimal contract every per-service operator must satisfy. */
export interface ITaskOperator<TFilter, TTask> {
  tasks(filter: TFilter, options: { token: string }): Promise<{ data: { items: TTask[]; count?: number } }>;
}

/** Optional argument bag the page-level `dispatch('xxx/getTasks', ...)` passes. */
export interface IGetTasksArgs {
  offset?: number;
  limit?: number;
  createdAtMin?: number;
  createdAtMax?: number;
}

/**
 * Build the `actions` bundle every per-service Vuex module re-exports.
 *
 * The hand-rolled actions across the 18 service modules differ only in:
 *  • the per-service operator passed to `getTasks`
 *  • the per-service `<SERVICE>_ID` constant passed to
 *    `serviceOperator.get(...)` and `applicationOperator.getAll(...)`
 *  • (optionally) a static upstream `type` discriminator
 *    (`'images'` / `'videos'`) and/or pagination opt-in
 *
 * Everything else (`setApplication` credential-creation logic,
 * `createCredential`, the trivial setters) is byte-identical.
 *
 * Services that need a fully custom filter (e.g. kling reads `type`
 * from `rootState.kling.taskType`) can pass `opts.buildFilter` to take
 * over completely.
 */
export function createTaskActions<TConfig, TTask, TFilter>(opts: {
  serviceId: string;
  operator: ITaskOperator<TFilter, TTask>;
  /** Pass through `offset` / `limit` from the dispatch arg. */
  paginated?: boolean;
  /** Static upstream `type` discriminator, e.g. `'images'` / `'videos'`. */
  type?: string;
  /** Fully custom filter — when provided, `paginated` and `type` are ignored. */
  buildFilter?: (rootState: IRootState, args: IGetTasksArgs) => TFilter;
}): ActionTree<ITaskServiceState<TConfig, TTask>, IRootState> {
  type S = ITaskServiceState<TConfig, TTask>;
  const buildFilter =
    opts.buildFilter ??
    ((rootState: IRootState, args: IGetTasksArgs): TFilter =>
      ({
        userId: rootState?.user?.id,
        ...(opts.paginated ? { offset: args.offset, limit: args.limit } : {}),
        createdAtMin: args.createdAtMin,
        createdAtMax: args.createdAtMax,
        ...(opts.type ? { type: opts.type } : {})
      }) as unknown as TFilter);

  const setApplication = async (
    { commit, dispatch }: ActionContext<S, IRootState>,
    payload: IApplication
  ): Promise<void> => {
    commit('setApplication', payload);
    if (!payload) return;
    const credential = payload?.credentials?.find((c) => c?.host === window.location.origin);
    if (credential) {
      commit('setCredential', credential);
    } else {
      await dispatch('createCredential');
    }
  };

  const createCredential = async ({
    commit,
    state
  }: ActionContext<S, IRootState>): Promise<ICredential | undefined> => {
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

  const getService = async ({ commit, state }: ActionContext<S, IRootState>): Promise<IService | undefined> => {
    state.status.getService = Status.Request;
    try {
      const { data: service } = await serviceOperator.get(opts.serviceId);
      state.status.getService = Status.Success;
      commit('setService', service);
      return service;
    } catch (_e) {
      state.status.getService = Status.Error;
      commit('setService', undefined);
      return undefined;
    }
  };

  const getApplications = async ({
    commit,
    state,
    rootState
  }: ActionContext<S, IRootState>): Promise<IApplication[] | undefined> => {
    state.status.getApplications = Status.Request;
    try {
      const { data: applications } = await applicationOperator.getAll({
        user_id: rootState?.user?.id,
        service_id: opts.serviceId
      });
      state.status.getApplications = Status.Success;
      commit('setApplications', applications.items);
      return applications.items;
    } catch (error) {
      console.error('get applications failed', error);
      state.status.getApplications = Status.Error;
      commit('setApplications', undefined);
      commit('setApplication', undefined);
      return undefined;
    }
  };

  const getTasks = async (
    { commit, state, rootState }: ActionContext<S, IRootState>,
    args: IGetTasksArgs = {}
  ): Promise<TTask[]> => {
    const credential = state.credential;
    const token = credential?.token;
    if (!token) {
      throw new Error('no token');
    }
    const response = await opts.operator.tasks(buildFilter(rootState, args), { token });
    const existingItems = state?.tasks?.items || [];
    const newItems = response.data.items || [];
    const mergedItems = mergeAndSortLists(existingItems, newItems);
    commit('setTasksItems', mergedItems);
    if (response.data.count !== undefined) {
      commit('setTasksTotal', response.data.count);
    }
    return response.data.items;
  };

  // Trivial setters — match the per-service spelling exactly.
  const resetAll = ({ commit }: ActionContext<S, IRootState>): void => commit('resetAll');
  const setApplications = ({ commit }: ActionContext<S, IRootState>, payload: IApplication[]): void =>
    commit('setApplications', payload);
  const setService = ({ commit }: ActionContext<S, IRootState>, payload: IService): void =>
    commit('setService', payload);
  const setCredential = ({ commit }: ActionContext<S, IRootState>, payload: ICredential): void =>
    commit('setCredential', payload);
  const setConfig = ({ commit }: ActionContext<S, IRootState>, payload: TConfig): void => commit('setConfig', payload);
  const setTasks = ({ commit }: ActionContext<S, IRootState>, payload: S['tasks']): void => commit('setTasks', payload);
  const setTasksItems = ({ commit }: ActionContext<S, IRootState>, payload: TTask[]): void =>
    commit('setTasksItems', payload);
  const setTasksTotal = ({ commit }: ActionContext<S, IRootState>, payload: number): void =>
    commit('setTasksTotal', payload);
  const setTasksActive = ({ commit }: ActionContext<S, IRootState>, payload: TTask): void =>
    commit('setTasksActive', payload);

  return {
    resetAll,
    setApplication,
    setApplications,
    setService,
    setCredential,
    createCredential,
    getService,
    getApplications,
    setConfig,
    setTasks,
    setTasksItems,
    setTasksTotal,
    setTasksActive,
    getTasks
  };
}
