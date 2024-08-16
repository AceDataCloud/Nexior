import { IApplication, ICredential, ISunoConfig, ISunoTask, IService } from '@/models';
import { ISunoState } from './models';

export const resetAll = (state: ISunoState): void => {
  state.service = undefined;
  state.application = undefined;
  state.applications = undefined;
  state.config = undefined;
  state.credential = undefined;
  state.tasks = undefined;
};

export const setApplications = (state: ISunoState, payload: IApplication[]): void => {
  state.applications = payload;
};

export const setService = (state: ISunoState, payload: IService): void => {
  state.service = payload;
};

export const setCredential = (state: ISunoState, payload: ICredential): void => {
  state.credential = payload;
};

export const setApplication = (state: ISunoState, payload: IApplication): void => {
  state.application = payload;
};

export const setConfig = (state: ISunoState, payload: ISunoConfig): void => {
  state.config = payload;
};

export const setTasksItems = (state: ISunoState, payload: ISunoTask[]): void => {
  const newPayload = {
    ...state.tasks,
    items: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksTotal = (state: ISunoState, payload: number): void => {
  const newPayload = {
    ...state.tasks,
    total: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksActive = (state: ISunoState, payload: ISunoTask): void => {
  const newPayload = {
    ...state.tasks,
    active: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setAudio = (state: ISunoState, payload: any): void => {
  state.audio = payload;
};

export const setTasks = (state: ISunoState, payload: any): void => {
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
  setAudio,
  resetAll
};
