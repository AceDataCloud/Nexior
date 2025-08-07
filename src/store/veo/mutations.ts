import { IApplication, ICredential, IVeoConfig, IVeoTask, IService } from '@/models';
import { IVeoState } from './models';

export const resetAll = (state: IVeoState): void => {
  state.service = undefined;
  state.application = undefined;
  state.config = undefined;
  state.credential = undefined;
  state.tasks = undefined;
};

export const setService = (state: IVeoState, payload: IService): void => {
  state.service = payload;
};

export const setCredential = (state: IVeoState, payload: ICredential): void => {
  state.credential = payload;
};

export const setApplication = (state: IVeoState, payload: IApplication): void => {
  state.application = payload;
};

export const setApplications = (state: IVeoState, payload: IApplication[]): void => {
  state.applications = payload;
};

export const setConfig = (state: IVeoState, payload: IVeoConfig): void => {
  state.config = payload;
};

export const setTasksItems = (state: IVeoState, payload: IVeoTask[]): void => {
  const newPayload = {
    ...state.tasks,
    items: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksTotal = (state: IVeoState, payload: number): void => {
  const newPayload = {
    ...state.tasks,
    total: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksActive = (state: IVeoState, payload: IVeoTask): void => {
  const newPayload = {
    ...state.tasks,
    active: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasks = (state: IVeoState, payload: any): void => {
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
