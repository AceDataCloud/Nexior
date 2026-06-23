import { IApplication, ICredential, IDigitalHumanConfig, IDigitalHumanTask, IService } from '@/models';
import initialState from './state';
import { IDigitalHumanState } from './models';

export const resetAll = (state: IDigitalHumanState): void => {
  Object.assign(state, initialState());
};

export const setService = (state: IDigitalHumanState, payload: IService): void => {
  state.service = payload;
};

export const setCredential = (state: IDigitalHumanState, payload: ICredential): void => {
  state.credential = payload;
};

export const setApplication = (state: IDigitalHumanState, payload: IApplication): void => {
  state.application = payload;
};

export const setApplications = (state: IDigitalHumanState, payload: IApplication[]): void => {
  state.applications = payload;
};

export const setConfig = (state: IDigitalHumanState, payload: IDigitalHumanConfig): void => {
  state.config = payload;
};

export const setTasksItems = (state: IDigitalHumanState, payload: IDigitalHumanTask[]): void => {
  const newPayload = {
    ...state.tasks,
    items: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksTotal = (state: IDigitalHumanState, payload: number): void => {
  const newPayload = {
    ...state.tasks,
    total: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksActive = (state: IDigitalHumanState, payload: IDigitalHumanTask): void => {
  const newPayload = {
    ...state.tasks,
    active: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasks = (state: IDigitalHumanState, payload: any): void => {
  state.tasks = payload;
};

export default {
  setTasks,
  setApplication,
  setApplications,
  setService,
  setCredential,
  setConfig,
  setTasksItems,
  setTasksTotal,
  setTasksActive,
  resetAll
};
