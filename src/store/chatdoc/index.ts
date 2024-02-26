import { Module } from 'vuex';
import actions from './actions';
import mutations from './mutations';
import state from './state';
import { IChatdocState } from './models';

export const chatdoc: Module<IChatdocState, any> = {
  namespaced: true,
  state,
  mutations,
  actions
};

export default chatdoc;
