import { IApplication, ICredential, IOmniConfig, IOmniTask, IService } from '@/models';
import initialState from './state';
import { IOmniState } from './models';

const defaultTasks = {
  items: undefined,
  total: undefined,
  active: undefined
};

export const resetAll = (state: IOmniState): void => {
  Object.assign(state, initialState());
};

export const setService = (state: IOmniState, payload: IService): void => {
  state.service = payload;
};

export const setCredential = (state: IOmniState, payload: ICredential): void => {
  state.credential = payload;
};

export const setApplication = (state: IOmniState, payload: IApplication): void => {
  state.application = payload;
};

export const setApplications = (state: IOmniState, payload: IApplication[]): void => {
  state.applications = payload;
};

export const setConfig = (state: IOmniState, payload: IOmniConfig): void => {
  state.config = payload;
};

export const setTasksItems = (state: IOmniState, payload: IOmniTask[]): void => {
  const newPayload = {
    ...(state.tasks || defaultTasks),
    items: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksTotal = (state: IOmniState, payload: number): void => {
  const newPayload = {
    ...(state.tasks || defaultTasks),
    total: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksActive = (state: IOmniState, payload: IOmniTask): void => {
  const newPayload = {
    ...(state.tasks || defaultTasks),
    active: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasks = (state: IOmniState, payload: any): void => {
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
