import { IApplication, ICredential, INanobananaConfig, INanobananaTask, IService } from '@/models';
import { INanobananaState } from './models';

export const resetAll = (state: INanobananaState): void => {
  state.service = undefined;
  state.application = undefined;
  state.config = undefined;
  state.credential = undefined;
  state.tasks = undefined;
};

export const setService = (state: INanobananaState, payload: IService): void => {
  state.service = payload;
};

export const setCredential = (state: INanobananaState, payload: ICredential): void => {
  state.credential = payload;
};

export const setApplication = (state: INanobananaState, payload: IApplication): void => {
  state.application = payload;
};

export const setApplications = (state: INanobananaState, payload: IApplication[]): void => {
  state.applications = payload;
};

export const setConfig = (state: INanobananaState, payload: INanobananaConfig): void => {
  state.config = payload;
};

export const setTasksItems = (state: INanobananaState, payload: INanobananaTask[]): void => {
  const newPayload = {
    ...state.tasks,
    items: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksTotal = (state: INanobananaState, payload: number): void => {
  const newPayload = {
    ...state.tasks,
    total: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksActive = (state: INanobananaState, payload: INanobananaTask): void => {
  const newPayload = {
    ...state.tasks,
    active: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasks = (state: INanobananaState, payload: any): void => {
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
