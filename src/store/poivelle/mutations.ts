import { Status, type IPoivelleGraphNode } from '@/models';
import initialState from './state';
import type { IPoivelleState } from './models';

export const reset = (state: IPoivelleState): void => {
  Object.assign(state, initialState());
};
export const setStatus = (
  state: IPoivelleState,
  payload: { key: keyof IPoivelleState['status']; value: Status }
): void => {
  state.status[payload.key] = payload.value;
};
export const setError = (state: IPoivelleState, value?: string): void => {
  state.error = value;
};
export const setWorkspaces = (state: IPoivelleState, value: IPoivelleState['workspaces']): void => {
  state.workspaces = value;
};
export const addWorkspace = (state: IPoivelleState, value: IPoivelleState['workspaces'][number]): void => {
  state.workspaces.unshift(value);
  state.currentWorkspaceId = value.id;
};
export const setProjects = (state: IPoivelleState, value: IPoivelleState['projects']): void => {
  state.projects = value;
};
const clearProjectData = (state: IPoivelleState): void => {
  state.graph = undefined;
  state.assets = [];
  state.artifacts = [];
  state.takes = [];
  state.selections = [];
  state.storyboard = undefined;
  state.revisions = [];
  state.proposals = [];
  state.runs = [];
  state.activeRun = undefined;
  state.evaluations = [];
  state.forensicValidations = [];
  state.costs = undefined;
  state.timeline = undefined;
  state.selectedNodeId = undefined;
  state.dryRun = undefined;
};
export const addProject = (state: IPoivelleState, value: IPoivelleState['projects'][number]): void => {
  state.projects.unshift(value);
  if (state.currentProjectId !== value.id) clearProjectData(state);
  state.currentProjectId = value.id;
};
export const setCurrentWorkspace = (state: IPoivelleState, value?: string): void => {
  state.currentWorkspaceId = value;
  state.currentMembership = undefined;
};
export const setCurrentMembership = (state: IPoivelleState, value?: IPoivelleState['currentMembership']): void => {
  state.currentMembership = value;
};
export const setCurrentProject = (state: IPoivelleState, value?: string): void => {
  if (state.currentProjectId !== value) clearProjectData(state);
  state.currentProjectId = value;
};
export const setProjection = (state: IPoivelleState, value: IPoivelleState['projection']): void => {
  state.projection = value;
};
export const setGraph = (state: IPoivelleState, value: IPoivelleState['graph']): void => {
  state.graph = value;
  if (state.selectedNodeId && !value?.nodes.some((node) => node.id === state.selectedNodeId)) {
    state.selectedNodeId = undefined;
  }
};
export const updateNode = (state: IPoivelleState, value: IPoivelleGraphNode): void => {
  const index = state.graph?.nodes.findIndex((node) => node.id === value.id) ?? -1;
  if (state.graph && index >= 0) state.graph.nodes[index] = value;
};
export const setSelectedNode = (state: IPoivelleState, value?: string): void => {
  state.selectedNodeId = value;
};
export const setAssets = (state: IPoivelleState, value: IPoivelleState['assets']): void => {
  state.assets = value;
};
export const setArtifacts = (state: IPoivelleState, value: IPoivelleState['artifacts']): void => {
  state.artifacts = value;
};
export const setTakes = (state: IPoivelleState, value: IPoivelleState['takes']): void => {
  state.takes = value;
};
export const setSelections = (state: IPoivelleState, value: IPoivelleState['selections']): void => {
  state.selections = value;
};
export const setStoryboard = (state: IPoivelleState, value: IPoivelleState['storyboard']): void => {
  state.storyboard = value;
};
export const setRevisions = (state: IPoivelleState, value: IPoivelleState['revisions']): void => {
  state.revisions = value;
};
export const setProposals = (state: IPoivelleState, value: IPoivelleState['proposals']): void => {
  state.proposals = value;
};
export const setRuns = (state: IPoivelleState, value: IPoivelleState['runs']): void => {
  state.runs = value;
};
export const setActiveRun = (state: IPoivelleState, value: IPoivelleState['activeRun']): void => {
  state.activeRun = value;
};
export const setEvaluations = (state: IPoivelleState, value: IPoivelleState['evaluations']): void => {
  state.evaluations = value;
};
export const setForensicValidations = (state: IPoivelleState, value: IPoivelleState['forensicValidations']): void => {
  state.forensicValidations = value;
};
export const setCosts = (state: IPoivelleState, value: IPoivelleState['costs']): void => {
  state.costs = value;
};
export const setTimeline = (state: IPoivelleState, value: IPoivelleState['timeline']): void => {
  state.timeline = value;
};
export const setDryRun = (state: IPoivelleState, value: IPoivelleState['dryRun']): void => {
  state.dryRun = value;
};
