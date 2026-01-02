import { IApplication, ICredential, ISeedanceConfig, ISeedanceTask, IService } from '@/models';
import initialState from './state';
import { ISeedanceState } from './models';

const defaultTasks = {
  items: undefined,
  total: undefined,
  active: undefined
};

export const resetAll = (state: ISeedanceState): void => {
  Object.assign(state, initialState());
};

export const setService = (state: ISeedanceState, payload: IService): void => {
  state.service = payload;
};

export const setCredential = (state: ISeedanceState, payload: ICredential): void => {
  state.credential = payload;
};

export const setApplication = (state: ISeedanceState, payload: IApplication): void => {
  state.application = payload;
};

export const setApplications = (state: ISeedanceState, payload: IApplication[]): void => {
  state.applications = payload;
};

export const setConfig = (state: ISeedanceState, payload: ISeedanceConfig): void => {
  state.config = payload;
};

export const setTasksItems = (state: ISeedanceState, payload: ISeedanceTask[]): void => {
  const newPayload = {
    ...(state.tasks || defaultTasks),
    items: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksTotal = (state: ISeedanceState, payload: number): void => {
  const newPayload = {
    ...(state.tasks || defaultTasks),
    total: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksActive = (state: ISeedanceState, payload: ISeedanceTask): void => {
  const newPayload = {
    ...(state.tasks || defaultTasks),
    active: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasks = (state: ISeedanceState, payload: any): void => {
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

