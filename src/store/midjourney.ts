import { IApplication, IMidjourneyPreset } from '@/operators';
import { Module } from 'vuex';
import { IMidjourneyState } from './models';

export const midjourney: Module<IMidjourneyState, any> = {
  namespaced: true,
  state(): IMidjourneyState {
    return {
      applications: undefined,
      preset: {}
    };
  },
  mutations: {
    setApplications(state: IMidjourneyState, payload: IApplication[]): void {
      state.applications = payload;
    },
    setPreset(state: IMidjourneyState, payload: IMidjourneyPreset): void {
      state.preset = payload;
    }
  },
  actions: {
    setPreset({ commit }: any, payload: IMidjourneyPreset) {
      commit('setPreset', payload);
    },
    setApplications({ commit }: any, payload: IApplication[]) {
      commit('setApplications', payload);
    }
  }
};
