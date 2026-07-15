import { Module } from 'vuex';
import { IOmniState } from './models';
import actions from './actions';
import mutations from './mutations';
import state from './state';

export const omni: Module<IOmniState, any> = {
  namespaced: true,
  state,
  mutations,
  actions
};

export default omni;
