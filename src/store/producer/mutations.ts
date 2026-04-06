import { IApplication, ICredential, IProducerConfig, IProducerTask, IService } from '@/models';
import { IProducerState } from './models';

export const resetAll = (state: IProducerState): void => {
  state.service = undefined;
  state.application = undefined;
  state.applications = undefined;
  state.config = undefined;
  state.credential = undefined;
  state.tasks = undefined;
};

export const setApplications = (state: IProducerState, payload: IApplication[]): void => {
  state.applications = payload;
};

export const setService = (state: IProducerState, payload: IService): void => {
  state.service = payload;
};

export const setCredential = (state: IProducerState, payload: ICredential): void => {
  state.credential = payload;
};

export const setApplication = (state: IProducerState, payload: IApplication): void => {
  state.application = payload;
};

export const setConfig = (state: IProducerState, payload: IProducerConfig): void => {
  state.config = payload;
};

export const setTasksItems = (state: IProducerState, payload: IProducerTask[]): void => {
  const newPayload = {
    ...state.tasks,
    items: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksTotal = (state: IProducerState, payload: number): void => {
  const newPayload = {
    ...state.tasks,
    total: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksActive = (state: IProducerState, payload: IProducerTask): void => {
  const newPayload = {
    ...state.tasks,
    active: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setAudio = (state: IProducerState, payload: any): void => {
  state.audio = payload;
};

export const setTasks = (state: IProducerState, payload: any): void => {
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
  setAudio,
  resetAll
};
