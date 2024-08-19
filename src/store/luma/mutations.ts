import { IApplication, ICredential, ILumaConfig, ILumaTask, IService } from '@/models';
import { ILumaState } from './models';

export const resetAll = (state: ILumaState): void => {
  state.service = undefined;
  state.application = undefined;
  state.config = undefined;
  state.credential = undefined;
  state.tasks = undefined;
};

export const setService = (state: ILumaState, payload: IService): void => {
  state.service = payload;
};

export const setCredential = (state: ILumaState, payload: ICredential): void => {
  state.credential = payload;
};

export const setApplication = (state: ILumaState, payload: IApplication): void => {
  state.application = payload;
};

export const setApplications = (state: ILumaState, payload: IApplication[]): void => {
  state.applications = payload;
};

export const setConfig = (state: ILumaState, payload: ILumaConfig): void => {
  state.config = payload;
};

export const setTasksItems = (state: ILumaState, payload: ILumaTask[]): void => {
  const newPayload = {
    ...state.tasks,
    items: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksTotal = (state: ILumaState, payload: number): void => {
  const newPayload = {
    ...state.tasks,
    total: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksActive = (state: ILumaState, payload: ILumaTask): void => {
  const newPayload = {
    ...state.tasks,
    active: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasks = (state: ILumaState, payload: any): void => {
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
