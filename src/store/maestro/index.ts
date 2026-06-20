import { Module } from 'vuex';
import { IMaestroState } from './models';
import actions from './actions';
import mutations from './mutations';
import state from './state';

export const maestro: Module<IMaestroState, any> = {
  namespaced: true,
  state,
  mutations,
  actions
};

export default maestro;
