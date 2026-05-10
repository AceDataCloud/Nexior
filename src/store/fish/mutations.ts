import { IApplication, ICredential, IFishTtsConfig, IFishTask, IFishVoiceModel, IService } from '@/models';
import initialState from './state';
import { IFishState } from './models';

export const resetAll = (state: IFishState): void => {
  Object.assign(state, initialState());
};

export const setService = (state: IFishState, payload: IService): void => {
  state.service = payload;
};

export const setCredential = (state: IFishState, payload: ICredential): void => {
  state.credential = payload;
};

export const setApplication = (state: IFishState, payload: IApplication): void => {
  state.application = payload;
};

export const setApplications = (state: IFishState, payload: IApplication[]): void => {
  state.applications = payload;
};

export const setConfig = (state: IFishState, payload: IFishTtsConfig): void => {
  state.config = payload;
};

export const setVoices = (state: IFishState, payload: IFishVoiceModel[] | undefined): void => {
  state.voices = payload;
};

export const setTasksItems = (state: IFishState, payload: IFishTask[]): void => {
  const newPayload = {
    ...state.tasks,
    items: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksTotal = (state: IFishState, payload: number): void => {
  const newPayload = {
    ...state.tasks,
    total: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksActive = (state: IFishState, payload: IFishTask): void => {
  const newPayload = {
    ...state.tasks,
    active: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasks = (state: IFishState, payload: IFishState['tasks']): void => {
  state.tasks = payload;
};

export default {
  setTasks,
  setApplication,
  setApplications,
  setConfig,
  setCredential,
  setService,
  setTasksActive,
  setTasksItems,
  setTasksTotal,
  setVoices,
  resetAll
};
