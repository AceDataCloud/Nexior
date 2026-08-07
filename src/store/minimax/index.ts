import { Module } from 'vuex';
import { IMinimaxState } from './models';
import actions from './actions';
import mutations from './mutations';
import state from './state';

export const minimax: Module<IMinimaxState, any> = {
  namespaced: true,
  state,
  mutations,
  actions
};

export default minimax;
