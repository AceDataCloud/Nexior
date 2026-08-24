import { Module } from 'vuex';
import { IQwenImageState } from './models';
import actions from './actions';
import mutations from './mutations';
import state from './state';

export const qwenimage: Module<IQwenImageState, any> = {
  namespaced: true,
  state,
  mutations,
  actions
};

export default qwenimage;
