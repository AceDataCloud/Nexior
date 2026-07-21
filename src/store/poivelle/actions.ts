import type { ActionContext } from 'vuex';
import {
  Status,
  type IPoivelleCommercialTVCBlueprintRequest,
  type IPoivelleGraphCommandRequest,
  type IPoivelleActionDryRun,
  type IPoivelleRun,
  type IPoivelleStepRun,
  type IPoivelleTimeline,
  type PoivelleProjection
} from '@/models';
import { poivelleOperator } from '@/operators';
import type { IRootState } from '../common/models';
import type { IPoivelleState } from './models';

type Context = ActionContext<IPoivelleState, IRootState>;

const token = (rootState: IRootState): string => {
  const access = rootState.token?.access;
  if (!access) throw new Error('Poivelle requires an authenticated Ace Data Cloud session');
  return access;
};
const message = (error: unknown): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const detail = (error as any).response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (detail?.message) return detail.message;
  }
  return error instanceof Error ? error.message : 'Poivelle request failed';
};
const uid = (): string =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;

const loadMembership = async (
  { commit, rootState }: Pick<Context, 'commit' | 'rootState'>,
  workspaceId: string
): Promise<void> => {
  const { data } = await poivelleOperator.getMembers(workspaceId, { token: token(rootState) });
  const membership = data.find((item) => item.user_id === rootState.user?.id && item.state === 'active');
  if (!membership) throw new Error('Active Poivelle workspace membership was not found');
  commit('setCurrentMembership', membership);
};

export const bootstrap = async ({ commit, rootState, state, dispatch }: Context): Promise<void> => {
  commit('setStatus', { key: 'bootstrap', value: Status.Request });
  commit('setError');
  let finalStatus = Status.Success;
  try {
    const { data: workspaces } = await poivelleOperator.getWorkspaces({ token: token(rootState) });
    commit('setWorkspaces', workspaces);
    const workspaceId = state.currentWorkspaceId ?? workspaces[0]?.id;
    commit('setCurrentWorkspace', workspaceId);
    if (!workspaceId) {
      commit('setProjects', []);
      return;
    }
    await loadMembership({ commit, rootState }, workspaceId);
    const { data: projects } = await poivelleOperator.getWorkspaceProjects(workspaceId, {
      token: token(rootState)
    });
    commit('setProjects', projects);
    const projectId = state.currentProjectId ?? projects[0]?.id;
    commit('setCurrentProject', projectId);
    if (projectId) await dispatch('loadProject', projectId);
  } catch (error) {
    finalStatus = Status.Error;
    commit('setError', message(error));
  } finally {
    commit('setStatus', { key: 'bootstrap', value: finalStatus });
  }
};

export const createWorkspace = async (
  { commit, rootState }: Context,
  payload: { name: string; monthly_limit_microcredits?: number }
): Promise<void> => {
  const { data } = await poivelleOperator.createWorkspace(payload, { token: token(rootState) });
  commit('addWorkspace', data);
  await loadMembership({ commit, rootState }, data.id);
  commit('setProjects', []);
  commit('setCurrentProject');
};

export const selectWorkspace = async ({ commit, rootState, dispatch }: Context, workspaceId: string): Promise<void> => {
  commit('setCurrentWorkspace', workspaceId);
  await loadMembership({ commit, rootState }, workspaceId);
  const { data } = await poivelleOperator.getWorkspaceProjects(workspaceId, { token: token(rootState) });
  commit('setProjects', data);
  const projectId = data[0]?.id;
  commit('setCurrentProject', projectId);
  if (projectId) await dispatch('loadProject', projectId);
};

export const createProject = async (
  { commit, rootState, dispatch }: Context,
  payload: { workspace_id: string; title: string; domain?: string; skill?: string }
): Promise<void> => {
  const { data } = await poivelleOperator.createProject(payload, { token: token(rootState) });
  commit('addProject', data);
  await dispatch('loadProject', data.id);
};

export const createCommercialTVCProject = async (
  { commit, rootState }: Context,
  payload: { workspace_id: string } & IPoivelleCommercialTVCBlueprintRequest
): Promise<void> => {
  const { workspace_id: workspaceId, ...blueprint } = payload;
  const { data } = await poivelleOperator.createCommercialTVCProject(workspaceId, blueprint, {
    token: token(rootState)
  });
  commit('addProject', data.project);
  commit('setGraph', data.graph);
  commit('setRevisions', [data.revision]);
  commit('setStoryboard', data.storyboard);
  commit('setArtifacts', []);
  commit('setTakes', []);
  commit('setSelections', []);
};

export const loadProject = async ({ commit, rootState, state }: Context, projectId: string): Promise<void> => {
  commit('setCurrentProject', projectId);
  commit('setStatus', { key: 'graph', value: Status.Request });
  commit('setError');
  let finalStatus = Status.Success;
  try {
    const options = { token: token(rootState) };
    const project = state.projects.find((item) => item.id === projectId);
    const [graph, assets, revisions, proposals, runs, timeline, artifacts, takes, evaluations, forensics, costs] =
      await Promise.all([
        poivelleOperator.getGraph(projectId, options),
        poivelleOperator.getAssets(projectId, options),
        poivelleOperator.getRevisions(projectId, options),
        poivelleOperator.getProposals(projectId, options),
        poivelleOperator.getRuns(projectId, options),
        poivelleOperator.getTimeline(projectId, options),
        poivelleOperator.getArtifacts(projectId, options),
        poivelleOperator.getTakes(projectId, options),
        poivelleOperator.getEvaluations(projectId, options),
        poivelleOperator.getForensicValidations(projectId, options),
        poivelleOperator.getCosts(projectId, options)
      ]);
    const currentRevisionId = revisions.data[0]?.id;
    const [selections, storyboard] = await Promise.all([
      currentRevisionId
        ? poivelleOperator.getSelections(projectId, currentRevisionId, options)
        : Promise.resolve({ data: [] }),
      project?.blueprint_ref === 'commercial.tvc.action-imaging@1'
        ? poivelleOperator.getStoryboard(projectId, options)
        : Promise.resolve(undefined)
    ]);
    commit('setGraph', graph.data);
    commit('setAssets', assets.data);
    commit('setRevisions', revisions.data);
    commit('setProposals', proposals.data);
    commit('setRuns', runs.data);
    commit('setTimeline', timeline.data);
    commit('setArtifacts', artifacts.data);
    commit('setTakes', takes.data);
    commit('setEvaluations', evaluations.data);
    commit('setForensicValidations', forensics.data);
    commit('setCosts', costs.data);
    commit('setSelections', selections.data);
    commit('setStoryboard', storyboard?.data);
  } catch (error) {
    finalStatus = Status.Error;
    commit('setError', message(error));
  } finally {
    commit('setStatus', { key: 'graph', value: finalStatus });
  }
};

export const applyCommand = async (
  { commit, rootState, state, dispatch }: Context,
  operations: IPoivelleGraphCommandRequest['operations']
): Promise<void> => {
  if (!state.currentProjectId || !state.graph) return;
  if (!state.currentMembership) throw new Error('Active Poivelle workspace membership was not loaded');
  commit('setStatus', { key: 'command', value: Status.Request });
  let finalStatus = Status.Success;
  try {
    await poivelleOperator.applyGraphCommand(
      state.currentProjectId,
      {
        idempotency_key: `web-${uid()}`,
        base_graph_version: state.graph.graph_version,
        read_set: {
          nodes: state.graph.nodes.map(({ id, version }) => ({ id, version })),
          edges: state.graph.edges.map(({ id, version }) => ({ id, version })),
          groups: state.graph.groups.map(({ id, version }) => ({ id, version })),
          membership_generation: state.currentMembership.generation
        },
        operations
      },
      { token: token(rootState) }
    );
    await dispatch('loadProject', state.currentProjectId);
  } catch (error) {
    finalStatus = Status.Error;
    commit('setError', message(error));
    throw error;
  } finally {
    commit('setStatus', { key: 'command', value: finalStatus });
  }
};

export const createNode = async (
  { dispatch }: Context,
  payload: { node_type: string; title: string; payload?: Record<string, unknown> }
): Promise<void> => {
  await dispatch('applyCommand', [
    {
      op: 'create_node',
      node: {
        id: `node_${uid().replace(/-/g, '')}`,
        node_type: payload.node_type,
        title: payload.title,
        payload: payload.payload ?? {}
      }
    }
  ]);
};

export const importAsset = async (
  { state, commit, rootState }: Context,
  payload: {
    project_id?: string;
    title: string;
    kind: string;
    source_url: string;
    content_hash: string;
  }
): Promise<void> => {
  if (!state.currentWorkspaceId) return;
  const { data } = await poivelleOperator.importAsset(
    state.currentWorkspaceId,
    { ...payload, rights: {} },
    { token: token(rootState) }
  );
  commit('setAssets', [data.asset, ...state.assets]);
};

export const updateSelectedNode = async (
  { state, dispatch }: Context,
  payload: { path: string; value: unknown }
): Promise<void> => {
  if (!state.selectedNodeId) return;
  await dispatch('applyCommand', [
    { op: 'update_node', node_id: state.selectedNodeId, path: payload.path, value: payload.value }
  ]);
};

export const deleteSelectedNode = async ({ state, dispatch }: Context): Promise<void> => {
  if (!state.selectedNodeId) return;
  await dispatch('applyCommand', [{ op: 'delete_node', node_id: state.selectedNodeId }]);
};

export const setProjection = ({ commit }: Context, projection: PoivelleProjection): void => {
  commit('setProjection', projection);
};

export const commitRevision = async ({ state, commit, rootState }: Context, messageText?: string): Promise<void> => {
  if (!state.currentProjectId || !state.graph) return;
  const { data } = await poivelleOperator.createRevision(
    state.currentProjectId,
    { graph_version: state.graph.graph_version, message: messageText },
    { token: token(rootState) }
  );
  commit('setRevisions', [data, ...state.revisions]);
};

export const dryRun = async (
  { state, commit, rootState }: Context,
  actionType: 'generate' | 'evaluate' | 'compose' | 'export' | 'publish'
): Promise<void> => {
  if (!state.currentProjectId || !state.graph || !state.selectedNodeId) return;
  let revision = state.revisions[0];
  if (!revision || revision.graph_version !== state.graph.graph_version) {
    const response = await poivelleOperator.createRevision(
      state.currentProjectId,
      { graph_version: state.graph.graph_version, message: `${actionType} from studio` },
      { token: token(rootState) }
    );
    revision = response.data;
    commit('setRevisions', [revision, ...state.revisions]);
  }
  const { data } = await poivelleOperator.dryRunAction(
    state.currentProjectId,
    {
      action_type: actionType,
      target_ids: [state.selectedNodeId],
      graph_version: state.graph.graph_version,
      revision_id: revision.id
    },
    { token: token(rootState) }
  );
  commit('setDryRun', data);
};

export const confirmDryRun = async ({ state, commit, rootState }: Context): Promise<IPoivelleRun | undefined> => {
  if (!state.currentProjectId || !state.dryRun) return;
  const { data } = await poivelleOperator.confirmAction(
    state.currentProjectId,
    {
      dry_run_id: state.dryRun.id,
      revision_id: state.dryRun.revision_id,
      confirmation_nonce: state.dryRun.confirmation_nonce,
      idempotency_key: `confirm-${uid()}`
    },
    { token: token(rootState) }
  );
  commit('setRuns', [data.run, ...state.runs.filter((run) => run.id !== data.run.id)]);
  commit('setDryRun');
  return data.run;
};

export const loadRun = async ({ state, commit, rootState }: Context, runId: string): Promise<void> => {
  if (!state.currentProjectId) return;
  const { data } = await poivelleOperator.getRun(state.currentProjectId, runId, { token: token(rootState) });
  commit('setActiveRun', data);
};

export const retryStep = async (
  { state, commit, rootState }: Context,
  step: Pick<IPoivelleStepRun, 'node_id' | 'operation'>
): Promise<IPoivelleActionDryRun | undefined> => {
  if (!state.currentProjectId || !state.graph) return;
  if (!state.graph.nodes.some((node) => node.id === step.node_id)) {
    throw new Error('The failed production node no longer exists in the current graph');
  }
  let revision = state.revisions[0];
  if (!revision || revision.graph_version !== state.graph.graph_version) {
    const response = await poivelleOperator.createRevision(
      state.currentProjectId,
      { graph_version: state.graph.graph_version, message: 'Retry failed production step' },
      { token: token(rootState) }
    );
    revision = response.data;
    commit('setRevisions', [revision, ...state.revisions]);
  }
  const { data } = await poivelleOperator.dryRunAction(
    state.currentProjectId,
    {
      action_type: step.operation === 'compose.timeline@1' ? 'compose' : 'generate',
      target_ids: [step.node_id],
      graph_version: state.graph.graph_version,
      revision_id: revision.id,
      options: { recovery_of_run_id: state.activeRun?.run.id }
    },
    { token: token(rootState) }
  );
  commit('setSelectedNode', step.node_id);
  commit('setDryRun', data);
  return data;
};

export const saveTimeline = async (
  { state, commit, rootState }: Context,
  timeline: IPoivelleTimeline
): Promise<void> => {
  if (!state.currentProjectId) return;
  const { data } = await poivelleOperator.saveTimeline(state.currentProjectId, timeline, {
    token: token(rootState)
  });
  commit('setTimeline', data);
};

export const rejectProposal = async ({ state, commit, rootState }: Context, proposalId: string): Promise<void> => {
  if (!state.currentProjectId) return;
  commit('setStatus', { key: 'action', value: Status.Request });
  try {
    const { data } = await poivelleOperator.rejectProposal(state.currentProjectId, proposalId, {
      token: token(rootState)
    });
    commit(
      'setProposals',
      state.proposals.map((proposal) => (proposal.id === data.id ? data : proposal))
    );
    commit('setStatus', { key: 'action', value: Status.Success });
  } catch (error) {
    commit('setError', message(error));
    commit('setStatus', { key: 'action', value: Status.Error });
    throw error;
  }
};

export const cancelRun = async ({ state, commit, rootState }: Context, runId: string): Promise<void> => {
  if (!state.currentProjectId) return;
  commit('setStatus', { key: 'action', value: Status.Request });
  try {
    const { data } = await poivelleOperator.cancelRun(state.currentProjectId, runId, {
      token: token(rootState)
    });
    commit(
      'setRuns',
      state.runs.map((run) => (run.id === data.id ? data : run))
    );
    commit('setStatus', { key: 'action', value: Status.Success });
  } catch (error) {
    commit('setError', message(error));
    commit('setStatus', { key: 'action', value: Status.Error });
    throw error;
  }
};

export const selectTake = async (
  { state, commit, rootState }: Context,
  payload: { target_node_id: string; take_id: string }
): Promise<void> => {
  if (!state.currentProjectId) return;
  const revision = state.revisions[0];
  if (!revision) throw new Error('Commit a project revision before selecting a take');
  const previous = state.selections.find((item) => item.target_node_id === payload.target_node_id);
  let data;
  try {
    const response = await poivelleOperator.selectTake(
      state.currentProjectId,
      {
        revision_id: revision.id,
        target_node_id: payload.target_node_id,
        take_id: payload.take_id,
        expected_previous_event_id: previous?.id
      },
      { token: token(rootState) }
    );
    data = response.data;
  } catch (error: any) {
    if (error?.response?.status === 409) {
      const latest = await poivelleOperator.getSelections(state.currentProjectId, revision.id, {
        token: token(rootState)
      });
      commit('setSelections', latest.data);
    }
    throw error;
  }
  commit('setSelections', [...state.selections.filter((item) => item.target_node_id !== payload.target_node_id), data]);
};

export const selectNode = ({ commit }: Context, nodeId?: string): void => commit('setSelectedNode', nodeId);

export default {
  bootstrap,
  createWorkspace,
  selectWorkspace,
  createProject,
  createCommercialTVCProject,
  loadProject,
  applyCommand,
  createNode,
  importAsset,
  updateSelectedNode,
  deleteSelectedNode,
  setProjection,
  commitRevision,
  dryRun,
  confirmDryRun,
  loadRun,
  retryStep,
  saveTimeline,
  rejectProposal,
  cancelRun,
  selectTake,
  selectNode
};
