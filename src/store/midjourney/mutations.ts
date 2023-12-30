import { IApplication } from '@/operators';
import { IMidjourneyState } from './models';

export const setApplications = (state: IMidjourneyState, payload: IApplication[]): void => {
  state.applications = payload;
};

export const setPreset = (state: IMidjourneyState, payload: any): void => {
  state.preset = payload;
};

export default {
  setApplications,
  setPreset
};
