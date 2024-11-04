import { Module } from 'vuex';
import { IHeadshotsState } from './models';
import actions from './actions';
import mutations from './mutations';
import state from './state';

export const headshots: Module<IHeadshotsState, any> = {
  namespaced: true,
  state,
  mutations,
  actions
};

export default headshots;
