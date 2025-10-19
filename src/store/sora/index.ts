import { Module } from 'vuex';
import { ISoraState } from './models';
import actions from './actions';
import mutations from './mutations';
import state from './state';

export const sora: Module<ISoraState, any> = {
  namespaced: true,
  state,
  mutations,
  actions
};

export default sora;
