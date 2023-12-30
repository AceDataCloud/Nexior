import { IApplication, IMidjourneyPreset } from '@/operators';

export const setPreset = ({ commit }: any, payload: IMidjourneyPreset) => {
  commit('setPreset', payload);
};

export const setApplications = ({ commit }: any, payload: IApplication[]) => {
  commit('setApplications', payload);
};

export default {
  setPreset,
  setApplications
};
