import { IApplication, ICredential, IPikaConfig, IPikaTask, IService } from '@/models';
import { IPikaState } from './models';

export const resetAll = (state: IPikaState): void => {
  state.service = undefined;
  state.application = undefined;
  state.config = undefined;
  state.credential = undefined;
  state.tasks = undefined;
};

export const setService = (state: IPikaState, payload: IService): void => {
  state.service = payload;
};

export const setCredential = (state: IPikaState, payload: ICredential): void => {
  state.credential = payload;
};

export const setApplication = (state: IPikaState, payload: IApplication): void => {
  state.application = payload;
};

export const setApplications = (state: IPikaState, payload: IApplication[]): void => {
  state.applications = payload;
};

export const setConfig = (state: IPikaState, payload: IPikaConfig): void => {
  state.config = payload;
};

export const setTasksItems = (state: IPikaState, payload: IPikaTask[]): void => {
  const newPayload = {
    ...state.tasks,
    items: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksTotal = (state: IPikaState, payload: number): void => {
  const newPayload = {
    ...state.tasks,
    total: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksActive = (state: IPikaState, payload: IPikaTask): void => {
  const newPayload = {
    ...state.tasks,
    active: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasks = (state: IPikaState, payload: any): void => {
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
