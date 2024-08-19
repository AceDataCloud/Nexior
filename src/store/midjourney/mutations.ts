import { IApplication, ICredential, IMidjourneyPreset, IService } from '@/models';
import { IMidjourneyState } from './models';

export const resetAll = (state: IMidjourneyState): void => {
  state.application = undefined;
  state.applications = undefined;
  state.preset = {};
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

export const setPreset = (state: IMidjourneyState, payload: IMidjourneyPreset): void => {
  state.preset = payload;
};

export const setTasks = (state: IMidjourneyState, payload: any): void => {
  state.tasks = payload;
};

export default {
  setApplication,
  setApplications,
  setPreset,
  setCredential,
  setService,
  setTasks,
  resetAll
};
