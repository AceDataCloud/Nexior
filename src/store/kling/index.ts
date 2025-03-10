import { Module } from 'vuex';
import { IKlingState } from './models';
import actions from './actions';
import mutations from './mutations';
import state from './state';

export const kling: Module<IKlingState, any> = {
  namespaced: true,
  state,
  mutations,
  actions
};

export default kling;
