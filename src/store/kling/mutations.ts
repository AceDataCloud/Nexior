import { IApplication, ICredential, IKlingConfig, IKlingTask, IService } from '@/models';
import { IKlingState } from './models';

export const resetAll = (state: IKlingState): void => {
  state.service = undefined;
  state.application = undefined;
  state.config = undefined;
  state.credential = undefined;
  state.tasks = undefined;
};

export const setService = (state: IKlingState, payload: IService): void => {
  state.service = payload;
};

export const setCredential = (state: IKlingState, payload: ICredential): void => {
  state.credential = payload;
};

export const setApplication = (state: IKlingState, payload: IApplication): void => {
  state.application = payload;
};

export const setApplications = (state: IKlingState, payload: IApplication[]): void => {
  state.applications = payload;
};

export const setConfig = (state: IKlingState, payload: IKlingConfig): void => {
  state.config = payload;
};

export const setTasksItems = (state: IKlingState, payload: IKlingTask[]): void => {
  const newPayload = {
    ...state.tasks,
    items: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksTotal = (state: IKlingState, payload: number): void => {
  const newPayload = {
    ...state.tasks,
    total: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksActive = (state: IKlingState, payload: IKlingTask): void => {
  const newPayload = {
    ...state.tasks,
    active: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasks = (state: IKlingState, payload: any): void => {
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
