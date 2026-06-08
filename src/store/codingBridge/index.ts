import { Module } from 'vuex';
import { ICodingBridgeState } from './models';
import actions from './actions';
import mutations from './mutations';
import state from './state';

export const codingBridge: Module<ICodingBridgeState, any> = {
  namespaced: true,
  state,
  mutations,
  actions
};

export default codingBridge;
