import { IApplication } from '@/operators';

export const setApplications = async ({ commit }: any, payload: IApplication[]) => {
  commit('setApplications', payload);
};

export default {
  setApplications
};
