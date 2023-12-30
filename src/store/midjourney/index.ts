import { Module } from 'vuex';
import { IMidjourneyState } from './models';
import actions from './actions';
import mutations from './mutations';

export const midjourney: Module<IMidjourneyState, any> = {
  namespaced: true,
  state(): IMidjourneyState {
    return {
      applications: undefined,
      preset: {}
    };
  },
  mutations,
  actions
};

export default midjourney;
