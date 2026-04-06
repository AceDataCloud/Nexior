import { Module } from 'vuex';
import { IProducerState } from './models';
import actions from './actions';
import mutations from './mutations';
import state from './state';

export const producer: Module<IProducerState, any> = {
  namespaced: true,
  state,
  mutations,
  actions
};

export default producer;
