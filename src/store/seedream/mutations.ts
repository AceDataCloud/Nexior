import { IApplication, ICredential, ISeedreamConfig, ISeedreamTask, IService } from '@/models';
import initialState from './state';
import { ISeedreamState } from './models';

const defaultTasks = {
  items: undefined,
  total: undefined,
  active: undefined
};

export const resetAll = (state: ISeedreamState): void => {
  Object.assign(state, initialState());
};

export const setService = (state: ISeedreamState, payload: IService): void => {
  state.service = payload;
};

export const setCredential = (state: ISeedreamState, payload: ICredential): void => {
  state.credential = payload;
};

export const setApplication = (state: ISeedreamState, payload: IApplication): void => {
  state.application = payload;
};

export const setApplications = (state: ISeedreamState, payload: IApplication[]): void => {
  state.applications = payload;
};

export const setConfig = (state: ISeedreamState, payload: ISeedreamConfig): void => {
  state.config = payload;
};

export const setTasksItems = (state: ISeedreamState, payload: ISeedreamTask[]): void => {
  const newPayload = {
    ...(state.tasks || defaultTasks),
    items: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksTotal = (state: ISeedreamState, payload: number): void => {
  const newPayload = {
    ...(state.tasks || defaultTasks),
    total: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksActive = (state: ISeedreamState, payload: ISeedreamTask): void => {
  const newPayload = {
    ...(state.tasks || defaultTasks),
    active: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasks = (state: ISeedreamState, payload: any): void => {
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
