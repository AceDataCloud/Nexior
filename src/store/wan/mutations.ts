import { IApplication, ICredential, IWanConfig, IWanTask, IService } from '@/models';
import initialState from './state';
import { IWanState } from './models';

export const resetAll = (state: IWanState): void => {
  Object.assign(state, initialState());
};

export const setService = (state: IWanState, payload: IService): void => {
  state.service = payload;
};

export const setCredential = (state: IWanState, payload: ICredential): void => {
  state.credential = payload;
};

export const setApplication = (state: IWanState, payload: IApplication): void => {
  state.application = payload;
};

export const setApplications = (state: IWanState, payload: IApplication[]): void => {
  state.applications = payload;
};

export const setConfig = (state: IWanState, payload: IWanConfig): void => {
  state.config = payload;
};

export const setTasksItems = (state: IWanState, payload: IWanTask[]): void => {
  const newPayload = {
    ...state.tasks,
    items: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksTotal = (state: IWanState, payload: number): void => {
  const newPayload = {
    ...state.tasks,
    total: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksActive = (state: IWanState, payload: IWanTask): void => {
  const newPayload = {
    ...state.tasks,
    active: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasks = (state: IWanState, payload: any): void => {
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
  resetAll
};
