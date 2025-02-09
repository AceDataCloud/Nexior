import { IApplication, ICredential, IMidjourneyConfig, IService, IMidjourneyTask } from '@/models';
import { IMidjourneyState } from './models';

export const resetAll = (state: IMidjourneyState): void => {
  state.application = undefined;
  state.applications = undefined;
  state.config = {};
  state.tasks = {
    items: undefined,
    total: undefined
  };
};

export const setTasksItems = (state: IMidjourneyState, payload: IMidjourneyTask[]): void => {
  const newPayload = {
    ...state.tasks,
    items: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setTasksTotal = (state: IMidjourneyState, payload: number): void => {
  const newPayload = {
    ...state.tasks,
    total: payload
  } as typeof state.tasks;
  state.tasks = newPayload;
};

export const setService = (state: IMidjourneyState, payload: IService): void => {
  state.service = payload;
};

export const setCredential = (state: IMidjourneyState, payload: ICredential): void => {
  state.credential = payload;
};

export const setApplication = (state: IMidjourneyState, payload: IApplication): void => {
  state.application = payload;
};

export const setApplications = (state: IMidjourneyState, payload: IApplication[]): void => {
  state.applications = payload;
};

export const setConfig = (state: IMidjourneyState, payload: IMidjourneyConfig): void => {
  state.config = payload;
};

export const setTasks = (state: IMidjourneyState, payload: any): void => {
  state.tasks = payload;
};

export default {
  setApplication,
  setApplications,
  setConfig,
  setTasksItems,
  setTasksTotal,
  setCredential,
  setService,
  setTasks,
  resetAll
};
