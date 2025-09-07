import { Module } from 'vuex';
import { INanobananaState } from './models';
import actions from './actions';
import mutations from './mutations';
import state from './state';

export const nanobanana: Module<INanobananaState, any> = {
  namespaced: true,
  state,
  mutations,
  actions
};

export default nanobanana;

