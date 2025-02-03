import { IApplication, ICredential, IHailuoConfig, IHailuoTask, IService } from '@/models';
import { IHailuoState } from './models';

export const resetAll = (state: IHailuoState): void => {
  state.service = undefined;
  state.application = undefined;
  state.config = undefined;
  state.credential = undefined;
  state.tasks = undefined;
};

export const setService = (state: IHailuoState, payload: IService): void => {
  state.service = payload;
};

export const setCredential = (state: IHailuoState, payload: ICredential): void => {
  state.credential = payload;
};

export const setApplication = (state: IHailuoState, payload: IApplication): void => {
  state.application = payload;
};

export const setApplications = (state: IHailuoState, payload: IApplication[]): void => {
  state.applications = payload;
};

export const setConfig = (state: IHailuoState, payload: IHailuoConfig): void => {
  state.config = payload;
};

export const setTasksItems = (state: IHailuoState, payload: IHailuoTask[]): void => {
  const newPayload = {
    ...state.tasks,
    items: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksTotal = (state: IHailuoState, payload: number): void => {
  const newPayload = {
    ...state.tasks,
    total: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksActive = (state: IHailuoState, payload: IHailuoTask): void => {
  const newPayload = {
    ...state.tasks,
    active: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasks = (state: IHailuoState, payload: any): void => {
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
