import { IApplication } from '@/operators';
import { Module } from 'vuex';
import { IChatState, Status } from './models';

export const chat: Module<IChatState, any> = {
  namespaced: true,
  state(): IChatState {
    return {
      applications: undefined,
      applicationsStatus: undefined
    };
  },
  mutations: {
    setApplications(state: IChatState, payload: IApplication[]): void {
      state.applications = payload;
    },
    setApplicationsStatus(state: IChatState, payload: Status): void {
      state.applicationsStatus = payload;
    }
  },
  actions: {
    async setApplications({ commit }: any, payload: IApplication[]) {
      commit('setApplications', payload);
    }
  }
};
