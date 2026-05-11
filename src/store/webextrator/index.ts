import { Module } from 'vuex';
import { IWebextratorState } from './models';
import actions from './actions';
import mutations from './mutations';
import state from './state';

export const webextrator: Module<IWebextratorState, any> = {
  namespaced: true,
  state,
  mutations,
  actions
};

export default webextrator;
