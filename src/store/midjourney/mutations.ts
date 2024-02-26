import { IApplication, IMidjourneyMode, IMidjourneyPreset } from '@/operators';
import { IMidjourneyState } from './models';

export const resetAll = (state: IMidjourneyState): void => {
  state.application = undefined;
  state.preset = {};
  state.imagineTasks = [];
};

export const setApplication = (state: IMidjourneyState, payload: IApplication): void => {
  state.application = payload;
};

export const setPreset = (state: IMidjourneyState, payload: IMidjourneyPreset): void => {
  state.preset = payload;
};

export const setMode = (state: IMidjourneyState, payload: IMidjourneyMode): void => {
  state.mode = payload;
};

export const setImagineTasks = (state: IMidjourneyState, payload: any): void => {
  state.imagineTasks = payload;
};

export const setImagineTasksTotal = (state: IMidjourneyState, payload: number): void => {
  state.imagineTasksTotal = payload;
};

export default {
  setApplication,
  setPreset,
  setMode,
  setImagineTasks,
  setImagineTasksTotal,
  resetAll
};
