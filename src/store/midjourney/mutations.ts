import { IApplication, IMidjourneyChannel, IMidjourneyPreset } from '@/operators';
import { IMidjourneyState } from './models';
import { Status } from '../common/models';

export const resetAll = (state: IMidjourneyState): void => {
  state.applications = [];
  state.preset = {};
  state.getApplicationsStatus = Status.None;
  state.imagineTasks = [];
};

export const setApplications = (state: IMidjourneyState, payload: IApplication[]): void => {
  state.applications = payload;
};

export const setPreset = (state: IMidjourneyState, payload: IMidjourneyPreset): void => {
  state.preset = payload;
};

export const setChannel = (state: IMidjourneyState, payload: IMidjourneyChannel): void => {
  state.channel = payload;
};

export const setGetApplicationsStatus = (state: IMidjourneyState, payload: Status): void => {
  state.getApplicationsStatus = payload;
};

export const setImagineTasks = (state: IMidjourneyState, payload: any): void => {
  state.imagineTasks = payload;
};

export const setGetImagineTasksStatus = (state: IMidjourneyState, payload: Status): void => {
  state.getImagineTasksStatus = payload;
};

export const setImagineTasksTotal = (state: IMidjourneyState, payload: number): void => {
  state.imagineTasksTotal = payload;
};

export default {
  setApplications,
  setPreset,
  setChannel,
  setGetApplicationsStatus,
  setImagineTasks,
  setGetImagineTasksStatus,
  setImagineTasksTotal,
  resetAll
};
