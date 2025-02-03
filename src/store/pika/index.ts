import { Module } from 'vuex';
import { IPikaState } from './models';
import actions from './actions';
import mutations from './mutations';
import state from './state';

export const pika: Module<IPikaState, any> = {
  namespaced: true,
  state,
  mutations,
  actions
};

export default pika;
