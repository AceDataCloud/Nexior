import { IApplication, ICredential, ISoraConfig, ISoraTask, IService } from '@/models';
import { ISoraState } from './models';

export const resetAll = (state: ISoraState): void => {
  state.service = undefined;
  state.application = undefined;
  state.config = undefined;
  state.credential = undefined;
  state.tasks = undefined;
};

export const setService = (state: ISoraState, payload: IService): void => {
  state.service = payload;
};

export const setCredential = (state: ISoraState, payload: ICredential): void => {
  state.credential = payload;
};

export const setApplication = (state: ISoraState, payload: IApplication): void => {
  state.application = payload;
};

export const setApplications = (state: ISoraState, payload: IApplication[]): void => {
  state.applications = payload;
};

export const setConfig = (state: ISoraState, payload: ISoraConfig): void => {
  state.config = payload;
};

export const setTasksItems = (state: ISoraState, payload: ISoraTask[]): void => {
  const newPayload = {
    ...state.tasks,
    items: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksTotal = (state: ISoraState, payload: number): void => {
  const newPayload = {
    ...state.tasks,
    total: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksActive = (state: ISoraState, payload: ISoraTask): void => {
  const newPayload = {
    ...state.tasks,
    active: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasks = (state: ISoraState, payload: any): void => {
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
