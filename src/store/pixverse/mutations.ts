import { IApplication, ICredential, IPixverseConfig, IPixverseTask, IService } from '@/models';
import { IPixverseState } from './models';

export const resetAll = (state: IPixverseState): void => {
  state.service = undefined;
  state.application = undefined;
  state.config = undefined;
  state.credential = undefined;
  state.tasks = undefined;
};

export const setService = (state: IPixverseState, payload: IService): void => {
  state.service = payload;
};

export const setCredential = (state: IPixverseState, payload: ICredential): void => {
  state.credential = payload;
};

export const setApplication = (state: IPixverseState, payload: IApplication): void => {
  state.application = payload;
};

export const setApplications = (state: IPixverseState, payload: IApplication[]): void => {
  state.applications = payload;
};

export const setConfig = (state: IPixverseState, payload: IPixverseConfig): void => {
  state.config = payload;
};

export const setTasksItems = (state: IPixverseState, payload: IPixverseTask[]): void => {
  const newPayload = {
    ...state.tasks,
    items: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksTotal = (state: IPixverseState, payload: number): void => {
  const newPayload = {
    ...state.tasks,
    total: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksActive = (state: IPixverseState, payload: IPixverseTask): void => {
  const newPayload = {
    ...state.tasks,
    active: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasks = (state: IPixverseState, payload: any): void => {
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
