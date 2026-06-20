import { Module } from 'vuex';
import { IRealtimeState } from './models';
import state from './state';
import actions from './actions';
import mutations from './mutations';

export const realtime: Module<IRealtimeState, any> = {
  namespaced: true,
  state,
  mutations,
  actions
};

export default realtime;
