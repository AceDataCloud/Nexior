import { IApplication } from '@/operators';
import { Module } from 'vuex';
import { IChatState } from './models';

export const chat: Module<IChatState, any> = {
  namespaced: true,
  state(): IChatState {
    return {
      applications: undefined
    };
  },
  mutations: {
    setApplications(state: IChatState, payload: IApplication[]): void {
      state.applications = payload;
    }
  },
  actions: {
    setApplications({ commit }: any, payload: IApplication[]) {
      commit('setApplications', payload);
    }
  }
};
