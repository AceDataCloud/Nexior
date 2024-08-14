import { Module } from 'vuex';
import { ILumaState } from './models';
import actions from './actions';
import mutations from './mutations';
import state from './state';

export const luma: Module<ILumaState, any> = {
  namespaced: true,
  state,
  mutations,
  actions
};

export default luma;
