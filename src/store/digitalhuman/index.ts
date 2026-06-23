import { Module } from 'vuex';
import { IDigitalHumanState } from './models';
import actions from './actions';
import mutations from './mutations';
import state from './state';

export const digitalhuman: Module<IDigitalHumanState, any> = {
  namespaced: true,
  state,
  mutations,
  actions
};

export default digitalhuman;
