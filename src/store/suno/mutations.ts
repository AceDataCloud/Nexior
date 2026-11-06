import { IApplication, ICredential, ISunoConfig, ISunoPersona, ISunoCustomModel, ISunoTask, IService } from '@/models';
import { ISunoState } from './models';
import { filterRemovedAudios } from './history';

export const resetAll = (state: ISunoState): void => {
  state.service = undefined;
  state.application = undefined;
  state.applications = undefined;
  state.config = undefined;
  state.credential = undefined;
  state.tasks = undefined;
  state.removedAudioIds = {};
  state.personas = undefined;
  state.customModels = undefined;
};

export const setApplications = (state: ISunoState, payload: IApplication[]): void => {
  state.applications = payload;
};

export const setService = (state: ISunoState, payload: IService): void => {
  state.service = payload;
};

export const setCredential = (state: ISunoState, payload: ICredential): void => {
  state.credential = payload;
};

export const setApplication = (state: ISunoState, payload: IApplication): void => {
  state.application = payload;
};

export const setConfig = (state: ISunoState, payload: ISunoConfig): void => {
  state.config = payload;
};

export const setTasksItems = (state: ISunoState, payload: ISunoTask[]): void => {
  const newPayload = {
    ...state.tasks,
    items: filterRemovedAudios(payload, state.removedAudioIds)
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksTotal = (state: ISunoState, payload: number): void => {
  const newPayload = {
    ...state.tasks,
    total: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksActive = (state: ISunoState, payload: ISunoTask): void => {
  const newPayload = {
    ...state.tasks,
    active: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setAudio = (state: ISunoState, payload: any): void => {
  state.audio = payload;
};

export const setTasks = (state: ISunoState, payload: any): void => {
  state.tasks = payload
    ? { ...payload, items: filterRemovedAudios(payload.items || [], state.removedAudioIds) }
    : payload;
};

export const removeAudio = (state: ISunoState, { taskId, audioId }: { taskId: string; audioId: string }): void => {
  const removed = state.removedAudioIds || {};
  state.removedAudioIds = { ...removed, [taskId]: [...new Set([...(removed[taskId] || []), audioId])] };
  const before = state.tasks?.items || [];
  const after = filterRemovedAudios(before, state.removedAudioIds);
  setTasksItems(state, after);
  if (state.tasks?.total !== undefined)
    state.tasks.total = Math.max(0, state.tasks.total - (before.length - after.length));
  if (state.audio?.id === audioId) state.audio = undefined;
};

export const setCustomModels = (state: ISunoState, payload: ISunoCustomModel[]): void => {
  state.customModels = payload;
};

export const setPersonas = (state: ISunoState, payload: ISunoPersona[]): void => {
  state.personas = payload;
};

export const togglePersonaFavorite = (state: ISunoState, personaId: string): void => {
  if (!personaId) return;
  if (!Array.isArray(state.favoritePersonaIds)) {
    state.favoritePersonaIds = [];
  }
  const idx = state.favoritePersonaIds.indexOf(personaId);
  if (idx >= 0) {
    state.favoritePersonaIds.splice(idx, 1);
  } else {
    state.favoritePersonaIds.push(personaId);
  }
};

export default {
  removeAudio,
  setTasks,
  setApplication,
  setApplications,
  setConfig,
  setCredential,
  setService,
  setTasksActive,
  setTasksItems,
  setTasksTotal,
  setAudio,
  setPersonas,
  setCustomModels,
  togglePersonaFavorite,
  resetAll
};
