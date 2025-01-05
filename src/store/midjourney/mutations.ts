import { IApplication, ICredential, IMidjourneyConfig, IService } from '@/models';
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
  setCredential,
  setService,
  setTasks,
  resetAll
};
