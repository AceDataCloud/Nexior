import { IApplication, ICredential, IOpenAIImageConfig, IOpenAIImageTask, IService } from '@/models';
import initialState from './state';
import { IOpenAIImageState } from './models';

const defaultTasks = {
  items: undefined,
  total: undefined,
  active: undefined
};

export const resetAll = (state: IOpenAIImageState): void => {
  Object.assign(state, initialState());
};

export const setService = (state: IOpenAIImageState, payload: IService): void => {
  state.service = payload;
};

export const setCredential = (state: IOpenAIImageState, payload: ICredential): void => {
  state.credential = payload;
};

export const setApplication = (state: IOpenAIImageState, payload: IApplication): void => {
  state.application = payload;
};

export const setApplications = (state: IOpenAIImageState, payload: IApplication[]): void => {
  state.applications = payload;
};

export const setConfig = (state: IOpenAIImageState, payload: IOpenAIImageConfig): void => {
  state.config = payload;
};

export const setTasksItems = (state: IOpenAIImageState, payload: IOpenAIImageTask[]): void => {
  const newPayload = {
    ...(state.tasks || defaultTasks),
    items: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksTotal = (state: IOpenAIImageState, payload: number): void => {
  const newPayload = {
    ...(state.tasks || defaultTasks),
    total: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksActive = (state: IOpenAIImageState, payload: IOpenAIImageTask): void => {
  const newPayload = {
    ...(state.tasks || defaultTasks),
    active: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasks = (state: IOpenAIImageState, payload: any): void => {
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
