import { IApplication, ICredential, IGrokVideoConfig, IGrokVideoTask, IService } from '@/models';
import initialState from './state';
import { IGrokVideoState } from './models';

const defaultTasks = {
  items: undefined,
  total: undefined,
  active: undefined
};

export const resetAll = (state: IGrokVideoState): void => {
  Object.assign(state, initialState());
};

export const setService = (state: IGrokVideoState, payload: IService): void => {
  state.service = payload;
};

export const setCredential = (state: IGrokVideoState, payload: ICredential): void => {
  state.credential = payload;
};

export const setApplication = (state: IGrokVideoState, payload: IApplication): void => {
  state.application = payload;
};

export const setApplications = (state: IGrokVideoState, payload: IApplication[]): void => {
  state.applications = payload;
};

export const setConfig = (state: IGrokVideoState, payload: IGrokVideoConfig): void => {
  state.config = payload;
};

export const setTasksItems = (state: IGrokVideoState, payload: IGrokVideoTask[]): void => {
  const newPayload = {
    ...(state.tasks || defaultTasks),
    items: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksTotal = (state: IGrokVideoState, payload: number): void => {
  const newPayload = {
    ...(state.tasks || defaultTasks),
    total: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksActive = (state: IGrokVideoState, payload: IGrokVideoTask): void => {
  const newPayload = {
    ...(state.tasks || defaultTasks),
    active: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasks = (state: IGrokVideoState, payload: any): void => {
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
