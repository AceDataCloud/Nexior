import { Module } from 'vuex';
import { ISerpState } from './models';
import actions from './actions';
import mutations from './mutations';
import state from './state';

export const serp: Module<ISerpState, any> = {
  namespaced: true,
  state,
  mutations,
  actions
};

export default serp;
