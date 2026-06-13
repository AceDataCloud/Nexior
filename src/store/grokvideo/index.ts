import { Module } from 'vuex';
import { IGrokVideoState } from './models';
import actions from './actions';
import mutations from './mutations';
import state from './state';

export const grokvideo: Module<IGrokVideoState, any> = {
  namespaced: true,
  state,
  mutations,
  actions
};

export default grokvideo;
