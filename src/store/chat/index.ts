import { Module } from 'vuex';
import { IChatState } from './models';
import state from './state';
import actions from './actions';
import mutations from './mutations';

export const chat: Module<IChatState, any> = {
  namespaced: true,
  state,
  mutations,
  actions
};

export default chat;
