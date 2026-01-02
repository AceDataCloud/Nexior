import { Module } from 'vuex';
import { ISeedreamState } from './models';
import actions from './actions';
import mutations from './mutations';
import state from './state';

export const seedream: Module<ISeedreamState, any> = {
  namespaced: true,
  state,
  mutations,
  actions
};

export default seedream;
