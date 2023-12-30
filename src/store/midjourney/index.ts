import { Module } from 'vuex';
import { IMidjourneyState } from './models';
import actions from './actions';
import mutations from './mutations';
import state from './state';

export const midjourney: Module<IMidjourneyState, any> = {
  namespaced: true,
  state,
  mutations,
  actions
};

export default midjourney;
