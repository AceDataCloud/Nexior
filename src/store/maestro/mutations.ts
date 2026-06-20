import { IApplication, ICredential, IMaestroConfig, IMaestroTask, IService } from '@/models';
import initialState from './state';
import { IMaestroState } from './models';

export const resetAll = (state: IMaestroState): void => {
  Object.assign(state, initialState());
};

export const setService = (state: IMaestroState, payload: IService): void => {
  state.service = payload;
};

export const setCredential = (state: IMaestroState, payload: ICredential): void => {
  state.credential = payload;
};

export const setApplication = (state: IMaestroState, payload: IApplication): void => {
  state.application = payload;
};

export const setApplications = (state: IMaestroState, payload: IApplication[]): void => {
  state.applications = payload;
};

export const setConfig = (state: IMaestroState, payload: IMaestroConfig): void => {
  state.config = payload;
};

export const setTasksItems = (state: IMaestroState, payload: IMaestroTask[]): void => {
  const newPayload = {
    ...state.tasks,
    items: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksTotal = (state: IMaestroState, payload: number): void => {
  const newPayload = {
    ...state.tasks,
    total: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksActive = (state: IMaestroState, payload: IMaestroTask): void => {
  const newPayload = {
    ...state.tasks,
    active: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasks = (state: IMaestroState, payload: any): void => {
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
