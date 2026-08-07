import { IApplication, ICredential, IMinimaxConfig, IMinimaxVideoTask, IService } from '@/models';
import initialState from './state';
import { IMinimaxState } from './models';

export const resetAll = (state: IMinimaxState): void => {
  Object.assign(state, initialState());
};

export const setService = (state: IMinimaxState, payload: IService): void => {
  state.service = payload;
};

export const setCredential = (state: IMinimaxState, payload: ICredential): void => {
  state.credential = payload;
};

export const setApplication = (state: IMinimaxState, payload: IApplication): void => {
  state.application = payload;
};

export const setApplications = (state: IMinimaxState, payload: IApplication[]): void => {
  state.applications = payload;
};

export const setConfig = (state: IMinimaxState, payload: IMinimaxConfig): void => {
  state.config = payload;
};

export const setTasksItems = (state: IMinimaxState, payload: IMinimaxVideoTask[]): void => {
  const newPayload = {
    ...state.tasks,
    items: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksTotal = (state: IMinimaxState, payload: number): void => {
  const newPayload = {
    ...state.tasks,
    total: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksActive = (state: IMinimaxState, payload: IMinimaxVideoTask): void => {
  const newPayload = {
    ...state.tasks,
    active: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasks = (state: IMinimaxState, payload: any): void => {
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
