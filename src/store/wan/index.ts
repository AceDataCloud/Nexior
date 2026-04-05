import { Module } from 'vuex';
import { IWanState } from './models';
import actions from './actions';
import mutations from './mutations';
import state from './state';

export const wan: Module<IWanState, any> = {
  namespaced: true,
  state,
  mutations,
  actions
};

export default wan;
