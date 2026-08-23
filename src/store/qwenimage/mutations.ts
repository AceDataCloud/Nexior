import { IApplication, ICredential, IQwenImageConfig, IQwenImageTask, IService } from '@/models';
import initialState from './state';
import { IQwenImageState } from './models';

const defaultTasks = {
  items: undefined,
  total: undefined,
  active: undefined
};

export const resetAll = (state: IQwenImageState): void => {
  Object.assign(state, initialState());
};

export const setService = (state: IQwenImageState, payload: IService): void => {
  state.service = payload;
};

export const setCredential = (state: IQwenImageState, payload: ICredential): void => {
  state.credential = payload;
};

export const setApplication = (state: IQwenImageState, payload: IApplication): void => {
  state.application = payload;
};

export const setApplications = (state: IQwenImageState, payload: IApplication[]): void => {
  state.applications = payload;
};

export const setConfig = (state: IQwenImageState, payload: IQwenImageConfig): void => {
  state.config = payload;
};

export const setTasksItems = (state: IQwenImageState, payload: IQwenImageTask[]): void => {
  const newPayload = {
    ...(state.tasks || defaultTasks),
    items: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksTotal = (state: IQwenImageState, payload: number): void => {
  const newPayload = {
    ...(state.tasks || defaultTasks),
    total: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksActive = (state: IQwenImageState, payload: IQwenImageTask): void => {
  const newPayload = {
    ...(state.tasks || defaultTasks),
    active: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasks = (state: IQwenImageState, payload: any): void => {
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
