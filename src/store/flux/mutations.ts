import { IApplication, ICredential, IFluxConfig, IFluxTask, IService } from '@/models';
import { IFluxState } from './models';

export const resetAll = (state: IFluxState): void => {
  state.service = undefined;
  state.application = undefined;
  state.config = undefined;
  state.credential = undefined;
  state.tasks = undefined;
};

export const setService = (state: IFluxState, payload: IService): void => {
  state.service = payload;
};

export const setCredential = (state: IFluxState, payload: ICredential): void => {
  state.credential = payload;
};

export const setApplication = (state: IFluxState, payload: IApplication): void => {
  state.application = payload;
};

export const setApplications = (state: IFluxState, payload: IApplication[]): void => {
  state.applications = payload;
};

export const setConfig = (state: IFluxState, payload: IFluxConfig): void => {
  state.config = payload;
};

export const setTasksItems = (state: IFluxState, payload: IFluxTask[]): void => {
  const newPayload = {
    ...state.tasks,
    items: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksTotal = (state: IFluxState, payload: number): void => {
  const newPayload = {
    ...state.tasks,
    total: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksActive = (state: IFluxState, payload: IFluxTask): void => {
  const newPayload = {
    ...state.tasks,
    active: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasks = (state: IFluxState, payload: any): void => {
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
