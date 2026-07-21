import type { ActionContext } from 'vuex';
import {
  Status,
  IApplicationScope,
  IApplicationType,
  type ICredential,
  type IPoivelleCommercialTVCBlueprintRequest,
  type IPoivelleGraphCommandRequest,
  type IPoivelleActionDryRun,
  type IPoivelleProject,
  type IPoivelleRun,
  type IPoivelleStepRun,
  type IPoivelleTimeline,
  type PoivelleProjection
} from '@/models';
import { applicationOperator, credentialOperator, poivelleOperator } from '@/operators';
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
    if (typeof detail?.message === 'string') return detail.message;
  }
  return error instanceof Error ? error.message : 'Poivelle request failed';
};
const uid = (): string =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;

const createExecutionCredential = async (
  rootState: IRootState,
  dryRun: IPoivelleActionDryRun
): Promise<ICredential | undefined> => {
  if (!dryRun.requires_credential) return undefined;
  const userId = rootState.user?.id;
  if (!userId) throw new Error('Poivelle provider execution requires an authenticated user');
  let applications = rootState.applications ?? [];
  let globalApplication = applications
    .filter((application) => application.scope === IApplicationScope.GLOBAL && application.role === 'owner')
    .sort((left, right) => (right.remaining_amount ?? 0) - (left.remaining_amount ?? 0))[0];
  if (!globalApplication) {
    const response = await applicationOperator.getAll({
      limit: 100,
      offset: 0,
      user_id: 'me',
      ordering: '-created_at',
      type: IApplicationType.USAGE,
      scope: IApplicationScope.GLOBAL,
      affiliation: 'owner'
    });
    applications = response.data.items;
    globalApplication = [...applications].sort(
      (left, right) => (right.remaining_amount ?? 0) - (left.remaining_amount ?? 0)
    )[0];
  }
  if (!globalApplication?.id) throw new Error('A Global usage application is required for provider execution');
  const usable = (credential: ICredential): boolean =>
    credential.metadata?.purpose === 'poivelle_execution' &&
    credential.metadata?.dry_run_id === dryRun.id &&
    !!credential.token &&
    (!credential.expired_at || Date.parse(credential.expired_at) > Date.now());
  let credential = globalApplication.credentials?.find(usable);
  if (!credential) {
    const response = await credentialOperator.getAll({
      application_id: globalApplication.id,
      limit: 100,
      ordering: '-created_at'
    });
    credential = response.data.items.find(usable);
  }
  if (credential) return credential;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const limitedAmount = dryRun.max_cost_microcredits > 0 ? dryRun.max_cost_microcredits / 1_000_000 : undefined;
  const { data: createdCredential } = await credentialOperator.create({
    application_id: globalApplication.id,
    host: typeof window === 'undefined' ? 'https://studio.acedata.cloud' : window.location.origin,
    expired_at: expiresAt,
    limited_amount: limitedAmount,
    metadata: {
      purpose: 'poivelle_execution',
      project_id: dryRun.project_id,
      dry_run_id: dryRun.id
    }
  });
  if (!createdCredential.token) throw new Error('The temporary execution credential has no token');
  return createdCredential;
};

const loadMembership = async (
  { commit, rootState }: Pick<Context, 'commit' | 'rootState'>,
  workspaceId: string
): Promise<void> => {
  const { data } = await poivelleOperator.getMembers(workspaceId, { token: token(rootState) });
  const membership = data.find((item) => item.user_id === rootState.user?.id && item.state === 'active');
  if (!membership) throw new Error('Active Poivelle workspace membership was not found');
  commit('setCurrentMembership', membership);
};

export const bootstrap = async (
  { commit, rootState, state, dispatch }: Context,
  options: { loadProject?: boolean } = {}
): Promise<void> => {
  if (state.status.bootstrap === Status.Request) return;
  commit('setStatus', { key: 'bootstrap', value: Status.Request });
  commit('setError');
  let finalStatus = Status.Success;
  try {
    const requestOptions = { token: token(rootState) };
    const [{ data: workspaces }, { data: discoveryWorks }] = await Promise.all([
      poivelleOperator.getWorkspaces(requestOptions),
      poivelleOperator.getDiscovery(requestOptions)
    ]);
    commit('setWorkspaces', workspaces);
    commit('setDiscoveryWorks', discoveryWorks);
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
    if (projectId && options.loadProject !== false) await dispatch('loadProject', projectId);
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
): Promise<string> => {
  const { data } = await poivelleOperator.createWorkspace(payload, { token: token(rootState) });
  commit('addWorkspace', data);
  await loadMembership({ commit, rootState }, data.id);
  commit('setProjects', []);
  commit('setCurrentProject');
  return data.id;
};

const ensureWorkspace = async ({ state, commit, rootState }: Context): Promise<string> => {
  if (state.currentWorkspaceId) return state.currentWorkspaceId;
  const existing = state.workspaces[0];
  if (existing) {
    commit('setCurrentWorkspace', existing.id);
    await loadMembership({ commit, rootState }, existing.id);
    return existing.id;
  }
  const { data } = await poivelleOperator.createWorkspace({ name: 'My Studio' }, { token: token(rootState) });
  commit('addWorkspace', data);
  await loadMembership({ commit, rootState }, data.id);
  return data.id;
};

export const copyDiscoveryWork = async (
  context: Context,
  payload: {
    work_id: string;
    prompt: string;
    title?: string;
    aspect_ratio?: '16:9' | '9:16' | '1:1';
  }
): Promise<IPoivelleProject> => {
  const { commit, rootState, dispatch } = context;
  const workspaceId = await ensureWorkspace(context);
  const { data } = await poivelleOperator.copyDiscoveryWork(
    payload.work_id,
    {
      workspace_id: workspaceId,
      prompt: payload.prompt.trim(),
      title: payload.title?.trim(),
      aspect_ratio: payload.aspect_ratio ?? '16:9'
    },
    { token: token(rootState) }
  );
  commit('addProject', data.project);
  await dispatch('loadProject', data.project.id);
  return data.project;
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
    if (state.currentProjectId !== projectId) return;
    const currentRevisionId = revisions.data[0]?.id;
    const [selections, storyboard] = await Promise.all([
      currentRevisionId
        ? poivelleOperator.getSelections(projectId, currentRevisionId, options)
        : Promise.resolve({ data: [] }),
      project?.blueprint_ref === 'commercial.tvc.action-imaging@1'
        ? poivelleOperator.getStoryboard(projectId, options)
        : Promise.resolve(undefined)
    ]);
    if (state.currentProjectId !== projectId) return;
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
    if (state.currentProjectId !== projectId) return;
    finalStatus = Status.Error;
    commit('setError', message(error));
  } finally {
    if (state.currentProjectId === projectId) {
      commit('setStatus', { key: 'graph', value: finalStatus });
    }
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
  const project = state.projects.find((item) => item.id === state.currentProjectId);
  const credential = project?.managed_execution ? undefined : await createExecutionCredential(rootState, state.dryRun);
  let data;
  try {
    const response = await poivelleOperator.confirmAction(
      state.currentProjectId,
      {
        dry_run_id: state.dryRun.id,
        revision_id: state.dryRun.revision_id,
        confirmation_nonce: state.dryRun.confirmation_nonce,
        idempotency_key: `confirm-${state.dryRun.id}`,
        execution_credential: credential?.token
      },
      { token: token(rootState) }
    );
    data = response.data;
  } catch (error: any) {
    const status = error?.response?.status;
    if (credential?.id && [400, 401, 403, 404, 422].includes(status)) {
      await credentialOperator.delete(credential.id).catch(() => undefined);
    }
    throw new Error(message(error));
  }
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
  copyDiscoveryWork,
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
