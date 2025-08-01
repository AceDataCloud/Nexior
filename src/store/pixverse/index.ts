import { Module } from 'vuex';
import { IPixverseState } from './models';
import actions from './actions';
import mutations from './mutations';
import state from './state';

export const pixverse: Module<IPixverseState, any> = {
  namespaced: true,
  state,
  mutations,
  actions
};

export default pixverse;
