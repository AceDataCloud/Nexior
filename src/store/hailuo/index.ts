import { Module } from 'vuex';
import { IHailuoState } from './models';
import actions from './actions';
import mutations from './mutations';
import state from './state';

export const hailuo: Module<IHailuoState, any> = {
  namespaced: true,
  state,
  mutations,
  actions
};

export default hailuo;
