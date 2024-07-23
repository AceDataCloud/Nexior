import { Module } from 'vuex';
import { ISunoState } from './models';
import actions from './actions';
import mutations from './mutations';
import state from './state';

export const suno: Module<ISunoState, any> = {
  namespaced: true,
  state,
  mutations,
  actions
};

export default suno;
