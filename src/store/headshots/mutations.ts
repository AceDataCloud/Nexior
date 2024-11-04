import { IApplication, ICredential, IHeadshotsConfig, IHeadshotsTask, IService } from '@/models';
import { IHeadshotsState } from './models';

export const resetAll = (state: IHeadshotsState): void => {
  state.service = undefined;
  state.application = undefined;
  state.config = undefined;
  state.credential = undefined;
  state.tasks = undefined;
};

export const setService = (state: IHeadshotsState, payload: IService): void => {
  state.service = payload;
};

export const setCredential = (state: IHeadshotsState, payload: ICredential): void => {
  state.credential = payload;
};

export const setApplication = (state: IHeadshotsState, payload: IApplication): void => {
  state.application = payload;
};

export const setApplications = (state: IHeadshotsState, payload: IApplication[]): void => {
  state.applications = payload;
};

export const setConfig = (state: IHeadshotsState, payload: IHeadshotsConfig): void => {
  state.config = payload;
};

export const setTasksItems = (state: IHeadshotsState, payload: IHeadshotsTask[]): void => {
  const newPayload = {
    ...state.tasks,
    items: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksTotal = (state: IHeadshotsState, payload: number): void => {
  const newPayload = {
    ...state.tasks,
    total: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksActive = (state: IHeadshotsState, payload: IHeadshotsTask): void => {
  const newPayload = {
    ...state.tasks,
    active: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasks = (state: IHeadshotsState, payload: any): void => {
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
