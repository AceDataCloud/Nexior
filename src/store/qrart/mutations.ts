import { IApplication, ICredential, IQrartConfig, IQrartTask, IService } from '@/models';
import { IQrartState } from './models';

export const resetAll = (state: IQrartState): void => {
  state.service = undefined;
  state.application = undefined;
  state.config = undefined;
  state.credential = undefined;
  state.tasks = undefined;
};

export const setService = (state: IQrartState, payload: IService): void => {
  state.service = payload;
};

export const setApplications = (state: IQrartState, payload: IApplication[]): void => {
  state.applications = payload;
};

export const setCredential = (state: IQrartState, payload: ICredential): void => {
  state.credential = payload;
};

export const setApplication = (state: IQrartState, payload: IApplication): void => {
  state.application = payload;
};

export const setConfig = (state: IQrartState, payload: IQrartConfig): void => {
  state.config = payload;
};

export const setTasksItems = (state: IQrartState, payload: IQrartTask[]): void => {
  const newPayload = {
    ...state.tasks,
    items: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksTotal = (state: IQrartState, payload: number): void => {
  const newPayload = {
    ...state.tasks,
    total: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksActive = (state: IQrartState, payload: IQrartTask): void => {
  const newPayload = {
    ...state.tasks,
    active: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasks = (state: IQrartState, payload: any): void => {
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
